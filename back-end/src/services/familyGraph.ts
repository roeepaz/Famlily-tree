import { prisma } from '../config/supabase';
import { Profile } from '@prisma/client';

/**
 * Fetches all profiles in the family circle of a given user ID.
 * This finds the entire connected component of the relationship graph.
 */
export async function getFamilyCircle(userId: string): Promise<Profile[]> {
  try {
    // Try recursive CTE (highly optimized for PostgreSQL)
    const profiles = await prisma.$queryRaw<Profile[]>`
      WITH RECURSIVE family_members AS (
        SELECT ${userId}::uuid AS member_id
        
        UNION
        
        SELECT 
          CASE 
            WHEN r.person_id = fm.member_id THEN r.relative_id
            ELSE r.person_id
          END AS member_id
        FROM "Relationship" r
        JOIN family_members fm ON r.person_id = fm.member_id OR r.relative_id = fm.member_id
      )
      SELECT p.* 
      FROM "Profile" p
      JOIN family_members fm ON p.id = fm.member_id
    `;
    
    // If the CTE returned profiles, return them. If it returned empty but the user exists,
    // we should return at least the user's profile.
    if (profiles.length > 0) {
      return profiles;
    }
    
    const selfProfile = await prisma.profile.findUnique({
      where: { id: userId }
    });
    return selfProfile ? [selfProfile] : [];
  } catch (error) {
    console.warn('PostgreSQL Recursive CTE failed, falling back to application-level BFS:', error);
    return getFamilyCircleBFSFallback(userId);
  }
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

    // Fetch all relationships involving the current user
    const relations = await prisma.relationship.findMany({
      where: {
        OR: [
          { person_id: currentId },
          { relative_id: currentId }
        ]
      }
    });

    for (const rel of relations) {
      const neighborId = rel.person_id === currentId ? rel.relative_id : rel.person_id;
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
  const circle = await getFamilyCircle(user1Id);
  return circle.some(profile => profile.id === user2Id);
}
