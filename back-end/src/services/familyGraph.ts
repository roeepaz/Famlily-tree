import { prisma } from '../config/supabase';
import { Profile, Relationship, KinshipDesignation } from '@prisma/client';
import { getCachedCircle, setCachedCircle } from './circleCache';

/**
 * Fetches all profiles in the family circle of a given user ID.
 * This finds the connected component using the database graph function.
 */
export async function getFamilyCircle(userId: string): Promise<Profile[]> {
  // Fast path: return cached result if still fresh
  const cached = getCachedCircle(userId);
  if (cached) return cached;

  let profiles: Profile[];
  try {
    const results = await prisma.$queryRaw<{ target_profile_id: string }[]>`
      SELECT target_profile_id FROM public.calculate_inferred_network(${userId}::uuid, 3)
    `;
    
    const profileIds = results.map(r => r.target_profile_id);
    if (!profileIds.includes(userId)) {
      profileIds.push(userId);
    }
    
    profiles = await prisma.profile.findMany({
      where: {
        id: { in: profileIds }
      }
    });
  } catch (error) {
    console.warn('PostgreSQL Recursive CTE failed, falling back to application-level BFS:', error);
    profiles = await getFamilyCircleBFSFallback(userId);
  }

  // Store in cache before returning
  setCachedCircle(userId, profiles);
  return profiles;
}

/**
 * Fallback BFS implementation using standard Prisma client API.
 * Ensures compatibility if running on non-PG database or local mock DB.
 */
async function getFamilyCircleBFSFallback(userId: string): Promise<Profile[]> {
  const visited = new Set<string>([userId]);
  const queue: string[] = [userId];

  while (queue.length > 0) {
    const currentId = queue.shift()!;

    // Fetch all relationships involving the current user (excluding pending ones)
    const relations = await prisma.relationship.findMany({
      where: {
        isPending: false,
        OR: [
          { personId: currentId },
          { relativeId: currentId }
        ]
      }
    });

    for (const rel of relations) {
      const neighborId = rel.personId === currentId ? rel.relativeId : rel.personId;
      if (!visited.has(neighborId)) {
        visited.add(neighborId);
        queue.push(neighborId);
      }
    }
  }

  // Fetch profiles for all visited IDs
  return prisma.profile.findMany({
    where: {
      id: { in: Array.from(visited) }
    }
  });
}

/**
 * Checks if two users share a structural family link.
 */
export async function areConnected(user1Id: string, user2Id: string): Promise<boolean> {
  if (user1Id === user2Id) return true;
  // Reuse the cached circle — avoids a second full traversal on the same request
  const circle = await getFamilyCircle(user1Id);
  return circle.some(profile => profile.id === user2Id);
}

export interface RelationInfo {
  relation: string;
  generation: string;
}

/**
 * Calculates relationships and generation labels for all profiles relative to a target user.
 */
export function calculateRelationships(
  userId: string,
  profiles: Profile[],
  relationships: Relationship[]
): Record<string, RelationInfo> {
  const profileMap = new Map(profiles.map(p => [p.id, p]));
  
  // Build adjacency mappings
  const spouses: Record<string, string[]> = {};
  const parents: Record<string, string[]> = {};
  const children: Record<string, string[]> = {};
  
  // Initialize adjacency lists
  profiles.forEach(p => {
    spouses[p.id] = [];
    parents[p.id] = [];
    children[p.id] = [];
  });
  
  // Populate based on active (non-pending) relationships within the circle
  relationships.forEach(r => {
    if (r.isPending) return;
    
    // Ensure both sides are in our profiles list
    if (!profileMap.has(r.personId) || !profileMap.has(r.relativeId)) return;
    
    if (r.kinshipType === KinshipDesignation.SPOUSE) {
      spouses[r.personId].push(r.relativeId);
      spouses[r.relativeId].push(r.personId);
    } else if (r.kinshipType === KinshipDesignation.PARENT) {
      // personId has relativeId as parent -> relativeId is parent, personId is child
      parents[r.personId].push(r.relativeId);
      children[r.relativeId].push(r.personId);
    } else if (r.kinshipType === KinshipDesignation.CHILD) {
      // personId has relativeId as child -> relativeId is child, personId is parent
      children[r.personId].push(r.relativeId);
      parents[r.relativeId].push(r.personId);
    }
  });
  
  // BFS structure
  const visited = new Set<string>([userId]);
  const queue: { nodeId: string; path: ('spouse' | 'parent' | 'child')[]; offset: number }[] = [
    { nodeId: userId, path: [], offset: 0 }
  ];
  
  const results: Record<string, RelationInfo> = {};
  // Default for user themselves
  results[userId] = { relation: 'You', generation: 'siblings' };
  
  while (queue.length > 0) {
    const { nodeId, path, offset } = queue.shift()!;
    
    if (nodeId !== userId) {
      const pathStr = path.join(',');
      let relation = 'Relative';
      
      switch (pathStr) {
        case 'spouse':
        case 'child,parent':
          relation = 'Spouse';
          break;
        case 'parent':
          relation = 'Parent';
          break;
        case 'child':
          relation = 'Child';
          break;
        case 'parent,parent':
          relation = 'Grandparent';
          break;
        case 'child,child':
          relation = 'Grandchild';
          break;
        case 'parent,child':
          relation = 'Sibling';
          break;
        case 'parent,parent,child':
          relation = 'Aunt/Uncle';
          break;
        case 'parent,child,child':
          relation = 'Nephew/Niece';
          break;
        case 'parent,parent,parent':
          relation = 'Great-Grandparent';
          break;
        case 'child,child,child':
          relation = 'Great-Grandchild';
          break;
        case 'parent,parent,child,child':
          relation = 'Cousin';
          break;
        case 'spouse,parent':
          relation = 'Parent-in-law';
          break;
        case 'child,spouse':
          relation = 'Child-in-law';
          break;
        case 'parent,child,spouse':
        case 'spouse,parent,child':
          relation = 'Sibling-in-law';
          break;
        case 'parent,parent,child,spouse':
        case 'spouse,parent,parent,child':
          relation = 'Aunt/Uncle';
          break;
        case 'parent,spouse':
          relation = 'Step-Parent';
          break;
        case 'spouse,child':
          relation = 'Step-Child';
          break;
        case 'parent,spouse,child':
          relation = 'Step-Sibling';
          break;
      }
      
      // Generation label mapping
      let generation = 'siblings';
      if (offset >= 2) generation = 'grandparents';
      else if (offset === 1) generation = 'parents';
      else if (offset === 0) generation = 'siblings';
      else if (offset === -1) generation = 'children';
      else if (offset <= -2) generation = 'grandchildren';
      
      results[nodeId] = { relation, generation };
    }
    
    // 1. Spouses (offset change = 0)
    for (const spouseId of (spouses[nodeId] || [])) {
      if (!visited.has(spouseId)) {
        visited.add(spouseId);
        queue.push({
          nodeId: spouseId,
          path: [...path, 'spouse'],
          offset
        });
      }
    }
    
    // 2. Parents (offset change = +1)
    for (const parentId of (parents[nodeId] || [])) {
      if (!visited.has(parentId)) {
        visited.add(parentId);
        queue.push({
          nodeId: parentId,
          path: [...path, 'parent'],
          offset: offset + 1
        });
      }
    }
    
    // 3. Children (offset change = -1)
    for (const childId of (children[nodeId] || [])) {
      if (!visited.has(childId)) {
        visited.add(childId);
        queue.push({
          nodeId: childId,
          path: [...path, 'child'],
          offset: offset - 1
        });
      }
    }
  }
  
  // Fill remaining unreached profiles with default relative tag
  profiles.forEach(p => {
    if (!results[p.id]) {
      results[p.id] = { relation: 'Relative', generation: 'siblings' };
    }
  });
  
  return results;
}
