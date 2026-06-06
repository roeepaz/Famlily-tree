import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../config/supabase';
import { getFamilyCircle, areConnected, calculateRelationships } from '../services/familyGraph';
import { invalidateCircleCache } from '../services/circleCache';
import { KinshipDesignation } from '@prisma/client';
import { sendConnectionRequestEmail, sendInvitationEmail } from '../services/emailService';
import { randomUUID } from 'crypto';

/**
 * Helper to map DB profile to frontend representation
 */
function mapProfileToFrontend(p: any, relationLabel?: string, genLabel?: string) {
  return {
    id: p.id,
    name: `${p.firstName} ${p.lastName}`.trim(),
    avatar: p.avatarUrl || '',
    branch: p.familyBranchName || 'Family Branch',
    location: p.location || '',
    email: p.email || '',
    phone: p.phone || '',
    birthYear: p.birthYear || (p.birthDate ? new Date(p.birthDate).getFullYear() : null),
    isDeceased: p.isDeceased,
    deathYear: p.deathYear || null,
    generation: genLabel || 'siblings',
    relation: relationLabel || 'Relative'
  };
}

async function getParents(profileId: string): Promise<string[]> {
  const rels = await prisma.relationship.findMany({
    where: {
      isPending: false,
      OR: [
        { personId: profileId, kinshipType: KinshipDesignation.PARENT },
        { relativeId: profileId, kinshipType: KinshipDesignation.CHILD }
      ]
    }
  });
  return rels.map(r => r.kinshipType === KinshipDesignation.PARENT ? r.relativeId : r.personId);
}

async function getChildren(profileId: string): Promise<string[]> {
  const rels = await prisma.relationship.findMany({
    where: {
      isPending: false,
      OR: [
        { personId: profileId, kinshipType: KinshipDesignation.CHILD },
        { relativeId: profileId, kinshipType: KinshipDesignation.PARENT }
      ]
    }
  });
  return rels.map(r => r.kinshipType === KinshipDesignation.CHILD ? r.relativeId : r.personId);
}

async function getSpouses(profileId: string): Promise<string[]> {
  const rels = await prisma.relationship.findMany({
    where: {
      isPending: false,
      kinshipType: KinshipDesignation.SPOUSE,
      OR: [
        { personId: profileId },
        { relativeId: profileId }
      ]
    }
  });
  return rels.map(r => r.personId === profileId ? r.relativeId : r.personId);
}

export async function autoLinkRelationships(
  personId: string,
  relativeId: string,
  kinshipType: KinshipDesignation
): Promise<void> {
  if (kinshipType === KinshipDesignation.PARENT) {
    const childId = personId;
    const parentId = relativeId;

    // 1. Link Parent to all siblings of Child
    const parentIds = await getParents(childId);
    const siblingIdsSet = new Set<string>();
    for (const pId of parentIds) {
      if (pId === parentId) continue;
      const childrenOfParent = await getChildren(pId);
      for (const cId of childrenOfParent) {
        if (cId !== childId) {
          siblingIdsSet.add(cId);
        }
      }
    }

    for (const siblingId of siblingIdsSet) {
      await prisma.relationship.upsert({
        where: {
          unique_adjacency_constraint: {
            personId: siblingId,
            relativeId: parentId,
            kinshipType: KinshipDesignation.PARENT
          }
        },
        update: {},
        create: {
          personId: siblingId,
          relativeId: parentId,
          kinshipType: KinshipDesignation.PARENT,
          isPending: false
        }
      });
    }

    // 2. Link Parent as spouse to all other parents of Child
    for (const otherParentId of parentIds) {
      if (otherParentId === parentId) continue;
      await prisma.relationship.upsert({
        where: {
          unique_adjacency_constraint: {
            personId: parentId,
            relativeId: otherParentId,
            kinshipType: KinshipDesignation.SPOUSE
          }
        },
        update: {},
        create: {
          personId: parentId,
          relativeId: otherParentId,
          kinshipType: KinshipDesignation.SPOUSE,
          isPending: false
        }
      });
    }
  }

  else if (kinshipType === KinshipDesignation.CHILD) {
    const parentId = personId;
    const childId = relativeId;

    // 1. Link Child to all spouses of Parent
    const spouseIds = await getSpouses(parentId);
    for (const spouseId of spouseIds) {
      await prisma.relationship.upsert({
        where: {
          unique_adjacency_constraint: {
            personId: childId,
            relativeId: spouseId,
            kinshipType: KinshipDesignation.PARENT
          }
        },
        update: {},
        create: {
          personId: childId,
          relativeId: spouseId,
          kinshipType: KinshipDesignation.PARENT,
          isPending: false
        }
      });
    }
  }

  else if (kinshipType === KinshipDesignation.SPOUSE) {
    const spouse1Id = personId;
    const spouse2Id = relativeId;

    // 1. Link spouse2 to all children of spouse1
    const spouse1Children = await getChildren(spouse1Id);
    for (const childId of spouse1Children) {
      await prisma.relationship.upsert({
        where: {
          unique_adjacency_constraint: {
            personId: childId,
            relativeId: spouse2Id,
            kinshipType: KinshipDesignation.PARENT
          }
        },
        update: {},
        create: {
          personId: childId,
          relativeId: spouse2Id,
          kinshipType: KinshipDesignation.PARENT,
          isPending: false
        }
      });
    }

    // 2. Link spouse1 to all children of spouse2
    const spouse2Children = await getChildren(spouse2Id);
    for (const childId of spouse2Children) {
      await prisma.relationship.upsert({
        where: {
          unique_adjacency_constraint: {
            personId: childId,
            relativeId: spouse1Id,
            kinshipType: KinshipDesignation.PARENT
          }
        },
        update: {},
        create: {
          personId: childId,
          relativeId: spouse1Id,
          kinshipType: KinshipDesignation.PARENT,
          isPending: false
        }
      });
    }
  }
}

export async function getMe(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    res.json(mapProfileToFrontend(user, 'You', 'siblings'));
  } catch (error) {
    console.error('Error in getMe:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

export async function getCircle(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const rawCircle = await getFamilyCircle(user.id);
    
    // Fetch all relationships within this circle to dynamically calculate relations/generations
    const circleIds = rawCircle.map(p => p.id);
    const relationships = await prisma.relationship.findMany({
      where: {
        isPending: false,
        personId: { in: circleIds },
        relativeId: { in: circleIds }
      }
    });

    const relationsMap = calculateRelationships(user.id, rawCircle, relationships);

    const frontendProfiles = rawCircle
      .filter(p => !p.firstName.startsWith("Parent of"))
      .map(p => {
        const relInfo = relationsMap[p.id] || { relation: 'Relative', generation: 'siblings' };
        return mapProfileToFrontend(p, relInfo.relation, relInfo.generation);
      });

    res.json(frontendProfiles);
  } catch (error) {
    console.error('Error in getCircle:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

export async function getProfileById(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    const profile = await prisma.profile.findUnique({
      where: { id },
    });

    if (!profile) {
      res.status(404).json({ error: 'Profile not found' });
      return;
    }

    // Verify requesting user is in the same family circle
    const connected = await areConnected(user.id, profile.id);
    if (!connected) {
      res.status(403).json({ error: 'Forbidden: You do not share a structural family link with this profile' });
      return;
    }

    res.json(mapProfileToFrontend(profile));
  } catch (error) {
    console.error('Error in getProfileById:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

export async function createProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { 
      id,
      first_name, 
      last_name, 
      avatar_url, 
      birth_date, 
      is_deceased, 
      family_branch_name,
      email,
      phone,
      location,
      birth_year,
      death_year,
      treeId
    } = req.body;

    if (!first_name || !last_name) {
      res.status(400).json({ error: 'First name and Last name are required' });
      return;
    }

    let finalTreeId = treeId || req.user?.treeId;
    if (!finalTreeId) {
      const tree = await prisma.familyTree.create({
        data: { name: `${first_name}'s Family` }
      });
      finalTreeId = tree.id;
    }

    const newProfile = await prisma.profile.create({
      data: {
        id: id || randomUUID(),
        firstName: first_name,
        lastName: last_name,
        avatarUrl: avatar_url,
        birthDate: birth_date ? new Date(birth_date) : null,
        isDeceased: !!is_deceased,
        familyBranchName: family_branch_name,
        email,
        phone,
        location,
        birthYear: birth_year ? parseInt(birth_year, 10) : (birth_date ? new Date(birth_date).getFullYear() : null),
        deathYear: death_year ? parseInt(death_year, 10) : null,
        isActive: false,
        treeId: finalTreeId
      }
    });

    res.status(201).json(mapProfileToFrontend(newProfile));
  } catch (error: any) {
    console.error('Error in createProfile:', error);
    if (error.code === 'P2002') {
      res.status(400).json({ error: 'Email already exists' });
      return;
    }
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

export async function updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    
    // Only allow editing profiles in the user's family circle
    const connected = await areConnected(user.id, id);
    if (!connected) {
      res.status(403).json({ error: 'Forbidden: You do not share a structural family link with this profile' });
      return;
    }

    const { 
      first_name, 
      last_name, 
      avatar_url, 
      birth_date, 
      is_deceased, 
      family_branch_name,
      email,
      phone,
      location,
      birth_year,
      death_year
    } = req.body;

    const updatedProfile = await prisma.profile.update({
      where: { id },
      data: {
        firstName: first_name,
        lastName: last_name,
        avatarUrl: avatar_url,
        birthDate: birth_date ? new Date(birth_date) : undefined,
        isDeceased: is_deceased !== undefined ? !!is_deceased : undefined,
        familyBranchName: family_branch_name,
        email,
        phone,
        location,
        birthYear: birth_year !== undefined ? parseInt(birth_year, 10) : (birth_date ? new Date(birth_date).getFullYear() : undefined),
        deathYear: death_year !== undefined ? parseInt(death_year, 10) : undefined
      }
    });

    res.json(mapProfileToFrontend(updatedProfile));
  } catch (error) {
    console.error('Error in updateProfile:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

export async function createRelationship(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { person_id, relative_id, relationship_type } = req.body;

    if (!person_id || !relative_id || !relationship_type) {
      res.status(400).json({ error: 'person_id, relative_id, and relationship_type are required' });
      return;
    }

    // Verify that the relationship type matches the Prisma enum
    if (!Object.values(KinshipDesignation).includes(relationship_type)) {
      res.status(400).json({ error: 'Invalid relationship type. Must be PARENT, CHILD, or SPOUSE' });
      return;
    }

    // Authorization: User must be connected to either person_id or relative_id, OR it's the user's first setup
    const isPersonUserCircle = await areConnected(user.id, person_id);
    const isRelativeUserCircle = await areConnected(user.id, relative_id);

    // If neither is in user's family circle and user is not one of them, forbid
    if (!isPersonUserCircle && !isRelativeUserCircle && person_id !== user.id && relative_id !== user.id) {
      res.status(403).json({ error: 'Forbidden: You can only link members connected to your family circle' });
      return;
    }

    const relation = await prisma.relationship.upsert({
      where: {
        unique_adjacency_constraint: {
          personId: person_id,
          relativeId: relative_id,
          kinshipType: relationship_type as KinshipDesignation
        }
      },
      update: {},
      create: {
        personId: person_id,
        relativeId: relative_id,
        kinshipType: relationship_type as KinshipDesignation
      }
    });

    // Invalidate circle cache for both affected users
    invalidateCircleCache(person_id, relative_id, user.id);

    // Auto-link inferred relationships
    await autoLinkRelationships(person_id, relative_id, relationship_type as KinshipDesignation);

    res.status(201).json(relation);
  } catch (error) {
    console.error('Error in createRelationship:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

export async function deleteRelationship(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;

    const relationship = await prisma.relationship.findUnique({
      where: { id }
    });

    if (!relationship) {
      res.status(404).json({ error: 'Relationship not found' });
      return;
    }

    // Verify user is connected to both ends of the relation
    const connected = await areConnected(user.id, relationship.personId);
    if (!connected) {
      res.status(403).json({ error: 'Forbidden: You do not share a structural family link with these profiles' });
      return;
    }

    await prisma.relationship.delete({
      where: { id }
    });

    // Invalidate cache for both ends of the relationship
    invalidateCircleCache(relationship.personId, relationship.relativeId, user.id);

    res.json({ message: 'Relationship deleted successfully' });
  } catch (error) {
    console.error('Error in deleteRelationship:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

export async function connectExistingByEmail(req: AuthenticatedRequest, res: Promise<any> | any): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { email, relationship_type } = req.body;
    if (!email || !relationship_type) {
      res.status(400).json({ error: 'email and relationship_type are required' });
      return;
    }

    if (!Object.values(KinshipDesignation).includes(relationship_type)) {
      res.status(400).json({ error: 'Invalid relationship type. Must be PARENT, CHILD, or SPOUSE' });
      return;
    }

    const targetEmail = email.trim().toLowerCase();
    
    // Check if target user profile exists
    const targetProfile = await prisma.profile.findUnique({
      where: { email: targetEmail }
    });

    let relation;

    if (targetProfile) {
      if (targetProfile.id === user.id) {
        res.status(400).json({ error: 'You cannot create a connection request to yourself.' });
        return;
      }

      // Check if relationship already exists
      const existingRel = await prisma.relationship.findFirst({
        where: {
          OR: [
            { personId: user.id, relativeId: targetProfile.id },
            { personId: targetProfile.id, relativeId: user.id }
          ]
        }
      });

      if (existingRel) {
        if (existingRel.isPending) {
          res.status(400).json({ error: 'A relationship connection request is already pending with this user.' });
        } else {
          res.status(400).json({ error: 'A relationship connection already exists with this user.' });
        }
        return;
      }

      // Note: We do NOT merge family trees yet. The trees will be merged when the recipient accepts the request.
      relation = await prisma.relationship.create({
        data: {
          personId: user.id,
          relativeId: targetProfile.id,
          kinshipType: relationship_type as KinshipDesignation,
          isPending: true
        }
      });

      // Send connection email asynchronously (don't block the response)
      sendConnectionRequestEmail(
        targetEmail,
        `${user.firstName} ${user.lastName}`.trim(),
        user.email || '',
        relationship_type
      ).catch(err => {
        console.error(`Failed to send connection request email to ${targetEmail}:`, err);
      });

      res.status(201).json({ 
        success: true, 
        pending: true, 
        message: 'Connection request sent successfully. Waiting for confirmation.',
        relation 
      });
    } else {
      // Fallback: If target doesn't exist, create placeholder inactive profile and link immediately (active=false)
      // Since it's a placeholder, no one has to accept it. It starts with isPending = false.
      const placeholder = await prisma.profile.create({
        data: {
          id: randomUUID(),
          firstName: email.split('@')[0],
          lastName: 'Relative',
          email: targetEmail,
          isActive: false,
          familyBranchName: user.familyBranchName,
          treeId: user.treeId
        }
      });

      relation = await prisma.relationship.create({
        data: {
          personId: user.id,
          relativeId: placeholder.id,
          kinshipType: relationship_type as KinshipDesignation,
          isPending: false
        }
      });

      // Auto-link inferred relationships
      await autoLinkRelationships(user.id, placeholder.id, relationship_type as KinshipDesignation);

      // Send invitation email asynchronously (don't block the response)
      sendInvitationEmail(
        targetEmail,
        `${user.firstName} ${user.lastName}`.trim(),
        user.email || '',
        relationship_type,
        placeholder.id
      ).catch(err => {
        console.error(`Failed to send invitation email to ${targetEmail}:`, err);
      });

      res.status(201).json({
        success: true,
        pending: false,
        message: 'Family member is not on Kinship yet. Created a placeholder node in your tree and sent an invitation email.',
        relation
      });
    }
  } catch (error) {
    console.error('Error in connectExistingByEmail:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

export async function getPendingRequests(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Fetch incoming pending requests (where current user is relativeId and isPending is true)
    const requests = await prisma.relationship.findMany({
      where: {
        relativeId: user.id,
        isPending: true
      },
      include: {
        person: true // The sender
      }
    });

    const mappedRequests = requests.map(r => ({
      id: r.id,
      relationship_type: r.kinshipType,
      sender: {
        id: r.person.id,
        name: `${r.person.firstName} ${r.person.lastName}`.trim(),
        avatar: r.person.avatarUrl || ''
      }
    }));

    res.json(mappedRequests);
  } catch (error) {
    console.error('Error in getPendingRequests:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

export async function respondToRequest(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    const { action } = req.body; // 'accept' | 'decline'

    if (!id || !action || (action !== 'accept' && action !== 'decline')) {
      res.status(400).json({ error: 'id and action ("accept" or "decline") are required' });
      return;
    }

    // Find request, make sure it is for this user
    const relationship = await prisma.relationship.findUnique({
      where: { id },
      include: {
        person: true,   // sender
        relative: true  // recipient (current user)
      }
    });

    if (!relationship) {
      res.status(404).json({ error: 'Connection request not found' });
      return;
    }

    if (relationship.relativeId !== user.id) {
      res.status(403).json({ error: 'Forbidden: You cannot confirm a request sent to another user' });
      return;
    }

    if (action === 'accept') {
      // 1. Update relationship isPending to false
      await prisma.relationship.update({
        where: { id },
        data: { isPending: false }
      });

      // Auto-link inferred relationships when accepted
      await autoLinkRelationships(relationship.personId, relationship.relativeId, relationship.kinshipType);

      // 2. Merge their family trees if they are in different ones
      const sender = relationship.person;
      const recipient = relationship.relative;
      if (sender.treeId && recipient.treeId && sender.treeId !== recipient.treeId) {
        const oldTreeId = recipient.treeId;
        const newTreeId = sender.treeId;

        // Update profiles to use sender's tree
        await prisma.profile.updateMany({
          where: { treeId: oldTreeId },
          data: { treeId: newTreeId }
        });

        // Update posts to use sender's tree
        await prisma.post.updateMany({
          where: { treeId: oldTreeId },
          data: { treeId: newTreeId }
        });

        // Update heritage to use sender's tree
        await prisma.heritageVault.updateMany({
          where: { treeId: oldTreeId },
          data: { treeId: newTreeId }
        });

        // Delete recipient's old empty tree
        await prisma.familyTree.delete({
          where: { id: oldTreeId }
        });
      }

      // Invalidate both users' caches — their circles just merged
      invalidateCircleCache(relationship.person.id, relationship.relative.id);
      res.json({ success: true, message: 'Connection request accepted. Family circles fused.' });
    } else {
      // Decline: Delete relationship record
      await prisma.relationship.delete({
        where: { id }
      });
      // Invalidate cache for the sender (their circle didn't change but clean up anyway)
      invalidateCircleCache(relationship.person.id, user.id);
      res.json({ success: true, message: 'Connection request declined.' });
    }
  } catch (error) {
    console.error('Error in respondToRequest:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

export async function getUpcomingBirthdays(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const rawCircle = await getFamilyCircle(user.id);
    
    // Filter active profiles with birthDate
    const activeWithBirthdays = rawCircle.filter(p => p.birthDate && !p.isDeceased);

    if (activeWithBirthdays.length === 0) {
      res.json([]);
      return;
    }

    const circleIds = rawCircle.map(p => p.id);
    const relationships = await prisma.relationship.findMany({
      where: {
        isPending: false,
        personId: { in: circleIds },
        relativeId: { in: circleIds }
      }
    });

    const relationsMap = calculateRelationships(user.id, rawCircle, relationships);

    const today = new Date();
    const todayZero = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const birthdays = activeWithBirthdays.map(p => {
      const birthDateObj = new Date(p.birthDate!);
      const birthMonth = birthDateObj.getMonth();
      const birthDay = birthDateObj.getDate();

      // Birthday in current year
      let nextBirthday = new Date(today.getFullYear(), birthMonth, birthDay);

      // If already passed, set to next year
      if (nextBirthday < todayZero) {
        nextBirthday.setFullYear(today.getFullYear() + 1);
      }

      const diffTime = nextBirthday.getTime() - todayZero.getTime();
      const daysUntil = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const age = nextBirthday.getFullYear() - birthDateObj.getFullYear();

      const relInfo = relationsMap[p.id] || { relation: 'Relative', generation: 'siblings' };

      const baseProfile = mapProfileToFrontend(p, relInfo.relation, relInfo.generation);
      return {
        ...baseProfile,
        birthDate: p.birthDate,
        daysUntil,
        ageTurning: age,
        nextBirthdayDate: nextBirthday.toISOString().split('T')[0]
      };
    });

    // Sort by daysUntil ascending
    birthdays.sort((a, b) => a.daysUntil - b.daysUntil);

    res.json(birthdays);
  } catch (error) {
    console.error('Error in getUpcomingBirthdays:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

export async function getProfileActivity(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;

    // Verify requesting user is in the same family circle
    const connected = await areConnected(user.id, id);
    if (!connected) {
      res.status(403).json({ error: 'Forbidden: You do not share a structural family link with this profile' });
      return;
    }

    // Fetch posts created by target profile
    const posts = await prisma.post.findMany({
      where: { authorId: id },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    // Fetch heritage vault items created by target profile
    const vaultItems = await prisma.heritageVault.findMany({
      where: { createdBy: id },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    // Fetch connections (relationships) involving target profile
    const relationships = await prisma.relationship.findMany({
      where: {
        OR: [
          { personId: id },
          { relativeId: id }
        ],
        isPending: false
      },
      include: {
        person: true,
        relative: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });

    // Fetch target profile details
    const profile = await prisma.profile.findUnique({
      where: { id }
    });

    interface ActivityItem {
      id: string;
      type: string;
      description: string;
      timestamp: string;
    }

    const activities: ActivityItem[] = [];

    // Add posts
    for (const post of posts) {
      let desc = '';
      if (post.narrativeType === 'DAILY_LIFE') {
        desc = `Shared a daily update: "${post.content.substring(0, 60)}${post.content.length > 60 ? '...' : ''}"`;
      } else if (post.narrativeType === 'MILESTONE') {
        desc = `Shared a milestone: "${post.content.substring(0, 60)}${post.content.length > 60 ? '...' : ''}"`;
      } else if (post.narrativeType === 'MEMORY') {
        desc = `Added a family memory: "${post.content.substring(0, 60)}${post.content.length > 60 ? '...' : ''}"`;
      } else {
        desc = `Shared a post: "${post.content.substring(0, 60)}${post.content.length > 60 ? '...' : ''}"`;
      }
      activities.push({
        id: `post-${post.id}`,
        type: 'post',
        description: desc,
        timestamp: post.createdAt.toISOString()
      });
    }

    // Add vault items
    for (const item of vaultItems) {
      activities.push({
        id: `vault-${item.id}`,
        type: 'heritage',
        description: `Added to the Heritage Vault: "${item.title}"`,
        timestamp: item.createdAt.toISOString()
      });
    }

    // Add relationships
    for (const rel of relationships) {
      const other = rel.personId === id ? rel.relative : rel.person;
      const otherName = `${other.firstName} ${other.lastName}`.trim();
      let kinshipLabel = rel.kinshipType.toLowerCase();
      activities.push({
        id: `rel-${rel.id}`,
        type: 'relationship',
        description: `Connected with ${otherName} as ${kinshipLabel}`,
        timestamp: rel.createdAt.toISOString()
      });
    }

    // Add profile joined event
    if (profile) {
      activities.push({
        id: `joined-${profile.id}`,
        type: 'joined',
        description: 'Joined the family circle',
        timestamp: profile.createdAt.toISOString()
      });
    }

    // Sort by timestamp desc
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Limit to top 10 items
    const finalActivities = activities.slice(0, 10);

    res.json(finalActivities);
  } catch (error) {
    console.error('Error in getProfileActivity:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

export async function getInvitePreview(req: Request, res: Response): Promise<void> {
  try {
    const { email, phone, inviteId } = req.query;
    if (
      (!email || typeof email !== 'string' || !email.trim()) && 
      (!phone || typeof phone !== 'string' || !phone.trim()) &&
      (!inviteId || typeof inviteId !== 'string' || !inviteId.trim())
    ) {
      res.status(400).json({ error: 'Email, phone, or inviteId parameter is required' });
      return;
    }

    let placeholder = null;
    if (inviteId && typeof inviteId === 'string' && inviteId.trim()) {
      placeholder = await prisma.profile.findFirst({
        where: {
          id: inviteId.trim(),
          isActive: false
        }
      });
    }

    if (!placeholder && email && typeof email === 'string' && email.trim()) {
      const targetEmail = email.trim().toLowerCase();
      placeholder = await prisma.profile.findFirst({
        where: {
          email: targetEmail,
          isActive: false
        }
      });
    }

    if (!placeholder && phone && typeof phone === 'string' && phone.trim()) {
      const targetPhone = phone.trim();
      const strippedTarget = targetPhone.replace(/\D/g, '');
      const inactiveProfiles = await prisma.profile.findMany({
        where: { isActive: false }
      });
      placeholder = inactiveProfiles.find(p => 
        p.phone && p.phone.replace(/\D/g, '') === strippedTarget
      ) || null;
    }

    if (!placeholder) {
      res.status(404).json({ error: 'No invitation found for this account' });
      return;
    }

    // 2. Fetch all profiles in the same tree
    if (!placeholder.treeId) {
      res.status(400).json({ error: 'Placeholder is not associated with a family tree' });
      return;
    }

    const profilesInTree = await prisma.profile.findMany({
      where: {
        treeId: placeholder.treeId
      }
    });

    // 3. Fetch all relationships in the same tree
    const profileIds = profilesInTree.map(p => p.id);
    const relationships = await prisma.relationship.findMany({
      where: {
        personId: { in: profileIds },
        relativeId: { in: profileIds }
      }
    });

    // 4. Determine the Creator (the active profile who invited the user)
    // Find relationships that connect the placeholder to active profiles
    const placeholderRels = relationships.filter(
      r => r.personId === placeholder.id || r.relativeId === placeholder.id
    );

    let creatorProfile = null;
    for (const rel of placeholderRels) {
      const otherId = rel.personId === placeholder.id ? rel.relativeId : rel.personId;
      const otherProfile = profilesInTree.find(p => p.id === otherId);
      if (otherProfile && otherProfile.isActive) {
        creatorProfile = otherProfile;
        break;
      }
    }

    // If no direct active connection found, fallback to any active profile in the tree
    if (!creatorProfile) {
      creatorProfile = profilesInTree.find(p => p.isActive) || null;
    }

    const treeName = await prisma.familyTree.findUnique({
      where: { id: placeholder.treeId },
      select: { name: true }
    });

    // 5. Build dynamic relationships mapped to the placeholder's perspective
    const relationsMap = calculateRelationships(placeholder.id, profilesInTree, relationships);

    const mappedProfiles = profilesInTree
      .filter(p => !p.firstName.startsWith("Parent of"))
      .map(p => {
        const relInfo = relationsMap[p.id] || { relation: 'Relative', generation: 'siblings' };
        return {
          id: p.id,
          name: `${p.firstName} ${p.lastName}`.trim(),
          avatar: p.avatarUrl || '',
          branch: p.familyBranchName || 'Family Branch',
          isActive: p.isActive,
          relation: p.id === placeholder.id ? 'You' : relInfo.relation,
          generation: relInfo.generation
        };
      });

    res.json({
      inviteeName: placeholder.firstName,
      creatorName: creatorProfile ? `${creatorProfile.firstName} ${creatorProfile.lastName}`.trim() : 'Your Family',
      treeName: treeName?.name || 'Private Family Tree',
      profiles: mappedProfiles
    });
  } catch (error) {
    console.error('Error in getInvitePreview:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

export async function claimInvite(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { inviteId } = req.body;
    if (!inviteId) {
      res.status(400).json({ error: 'inviteId is required' });
      return;
    }

    // Find the placeholder profile
    const placeholder = await prisma.profile.findUnique({
      where: { id: inviteId }
    });

    if (!placeholder) {
      res.status(404).json({ error: 'Invitation placeholder profile not found' });
      return;
    }

    if (placeholder.isActive) {
      res.status(400).json({ error: 'This invitation has already been claimed' });
      return;
    }

    // If the user is already in the same tree as the placeholder, nothing to do
    if (user.treeId === placeholder.treeId) {
      res.json({ success: true, message: 'Already connected to this family tree' });
      return;
    }

    const oldTreeId = user.treeId;
    const newTreeId = placeholder.treeId;

    // We need to fuse the placeholder into the current user's profile:
    // 1. Move relationships from placeholder to current user
    await prisma.$transaction(async (tx) => {
      // Clear placeholder email to prevent unique constraint conflict
      await tx.profile.update({
        where: { id: placeholder.id },
        data: { email: null }
      });

      // Update current user's profile to link to the placeholder's tree
      // and adopt family branch name if needed
      await tx.profile.update({
        where: { id: user.id },
        data: {
          treeId: newTreeId,
          familyBranchName: placeholder.familyBranchName || user.familyBranchName
        }
      });

      // Redirect relationships pointing to placeholder to point to current user
      await tx.relationship.updateMany({
        where: { personId: placeholder.id },
        data: { personId: user.id }
      });

      await tx.relationship.updateMany({
        where: { relativeId: placeholder.id },
        data: { relativeId: user.id }
      });

      // Update posts / heritage items if placeholder had any (unlikely, but safe)
      await tx.post.updateMany({
        where: { authorId: placeholder.id },
        data: { authorId: user.id }
      });

      await tx.heritageVault.updateMany({
        where: { createdBy: placeholder.id },
        data: { createdBy: user.id }
      });

      // Delete the placeholder profile
      await tx.profile.delete({
        where: { id: placeholder.id }
      });

      // Delete the fresh empty tree that was provisioned for this user
      if (oldTreeId) {
        // Double check that no other active profiles are using this old tree before deleting
        const otherProfiles = await tx.profile.findMany({
          where: { treeId: oldTreeId, id: { not: user.id } }
        });
        if (otherProfiles.length === 0) {
          await tx.familyTree.delete({
            where: { id: oldTreeId }
          });
        }
      }
    });

    // Invalidate caches
    invalidateCircleCache(user.id);

    res.json({ success: true, message: 'Successfully claimed invitation and joined family tree' });
  } catch (error) {
    console.error('Error in claimInvite:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}



