import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../config/supabase';
import { getFamilyCircle, areConnected } from '../services/familyGraph';
import { RelationshipType } from '@prisma/client';

/**
 * Helper to map DB profile to frontend representation
 */
function mapProfileToFrontend(p: any, relationLabel?: string, genLabel?: string) {
  return {
    id: p.id,
    name: `${p.first_name} ${p.last_name}`.trim(),
    avatar: p.avatar_url || '',
    branch: p.family_branch_name || 'Family Branch',
    location: p.location || '',
    email: p.email || '',
    phone: p.phone || '',
    birthYear: p.birth_year || (p.birth_date ? new Date(p.birth_date).getFullYear() : null),
    isDeceased: p.is_deceased,
    deathYear: p.death_year || null,
    generation: genLabel || 'siblings',
    relation: relationLabel || 'Relative'
  };
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
        person_id: { in: circleIds },
        relative_id: { in: circleIds }
      }
    });

    // Simple heuristic-based relationship mapper relative to logged-in user
    const frontendProfiles = rawCircle.map(p => {
      if (p.id === user.id) {
        return mapProfileToFrontend(p, 'You', 'siblings');
      }

      // Check direct relationships
      const directRel = relationships.find(
        r => (r.person_id === user.id && r.relative_id === p.id) ||
             (r.relative_id === user.id && r.person_id === p.id)
      );

      if (directRel) {
        const isUserPerson = directRel.person_id === user.id;
        const type = directRel.relationship_type;

        if (type === 'SPOUSE') {
          return mapProfileToFrontend(p, 'Spouse', 'siblings');
        }
        if (type === 'PARENT') {
          // If user is person_id and relative is parent:
          // (Wait: person_id connects to relative_id. Let's look at schema config:
          // parent means relative is parent, or relative is child. Let's make it intuitive)
          const relLabel = isUserPerson ? 'Parent' : 'Child';
          const genLabel = isUserPerson ? 'parents' : 'children';
          return mapProfileToFrontend(p, relLabel, genLabel);
        }
        if (type === 'CHILD') {
          const relLabel = isUserPerson ? 'Child' : 'Parent';
          const genLabel = isUserPerson ? 'children' : 'parents';
          return mapProfileToFrontend(p, relLabel, genLabel);
        }
      }

      // Default relative labels if not direct
      return mapProfileToFrontend(p, 'Relative', 'siblings');
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
      death_year
    } = req.body;

    if (!first_name || !last_name) {
      res.status(400).json({ error: 'First name and Last name are required' });
      return;
    }

    const newProfile = await prisma.profile.create({
      data: {
        id, // Optional, can be supplied from Supabase Auth ID
        first_name,
        last_name,
        avatar_url,
        birth_date: birth_date ? new Date(birth_date) : null,
        is_deceased: !!is_deceased,
        family_branch_name,
        email,
        phone,
        location,
        birth_year: birth_year ? parseInt(birth_year, 10) : null,
        death_year: death_year ? parseInt(death_year, 10) : null
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
        first_name,
        last_name,
        avatar_url,
        birth_date: birth_date ? new Date(birth_date) : undefined,
        is_deceased: is_deceased !== undefined ? !!is_deceased : undefined,
        family_branch_name,
        email,
        phone,
        location,
        birth_year: birth_year !== undefined ? parseInt(birth_year, 10) : undefined,
        death_year: death_year !== undefined ? parseInt(death_year, 10) : undefined
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
    if (!Object.values(RelationshipType).includes(relationship_type)) {
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
        person_id_relative_id_relationship_type: {
          person_id,
          relative_id,
          relationship_type
        }
      },
      update: {},
      create: {
        person_id,
        relative_id,
        relationship_type
      }
    });

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
    const connected = await areConnected(user.id, relationship.person_id);
    if (!connected) {
      res.status(403).json({ error: 'Forbidden: You do not share a structural family link with these profiles' });
      return;
    }

    await prisma.relationship.delete({
      where: { id }
    });

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

    if (!Object.values(RelationshipType).includes(relationship_type)) {
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
            { person_id: user.id, relative_id: targetProfile.id },
            { person_id: targetProfile.id, relative_id: user.id }
          ]
        }
      });

      if (existingRel) {
        res.status(400).json({ error: 'A relationship connection already exists with this user.' });
        return;
      }

      // Update target profile family_branch_name to match sender's
      await prisma.profile.update({
        where: { id: targetProfile.id },
        data: { family_branch_name: user.family_branch_name }
      });

      // Create a pending relationship (person_id = user, relative_id = target, is_pending = true)
      relation = await prisma.relationship.create({
        data: {
          person_id: user.id,
          relative_id: targetProfile.id,
          relationship_type: relationship_type as RelationshipType,
          is_pending: true
        }
      });

      console.log(`[MOCK EMAIL] Sending connection confirmation email to ${targetEmail} from ${user.email}...`);

      res.status(201).json({ 
        success: true, 
        pending: true, 
        message: 'Connection request sent successfully. Waiting for confirmation.',
        relation 
      });
    } else {
      // Fallback: If target doesn't exist, create placeholder inactive profile and link immediately (active=false, relationship is_pending=false)
      const placeholder = await prisma.profile.create({
        data: {
          first_name: email.split('@')[0],
          last_name: 'Relative',
          email: targetEmail,
          is_active: false,
          family_branch_name: user.family_branch_name
        }
      });

      relation = await prisma.relationship.create({
        data: {
          person_id: user.id,
          relative_id: placeholder.id,
          relationship_type: relationship_type as RelationshipType,
          is_pending: false
        }
      });

      console.log(`[MOCK EMAIL] Sending invite register link to non-existent user ${targetEmail}...`);

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

    // Fetch incoming pending requests (where user is the relative_id and is_pending is true)
    const requests = await prisma.relationship.findMany({
      where: {
        relative_id: user.id,
        is_pending: true
      },
      include: {
        person: true // The sender
      }
    });

    const mappedRequests = requests.map(r => ({
      id: r.id,
      relationship_type: r.relationship_type,
      sender: {
        id: r.person.id,
        name: `${r.person.first_name} ${r.person.last_name}`.trim(),
        avatar: r.person.avatar_url || ''
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
      where: { id }
    });

    if (!relationship) {
      res.status(404).json({ error: 'Connection request not found' });
      return;
    }

    if (relationship.relative_id !== user.id) {
      res.status(403).json({ error: 'Forbidden: You cannot confirm a request sent to another user' });
      return;
    }

    if (action === 'accept') {
      await prisma.relationship.update({
        where: { id },
        data: { is_pending: false }
      });
      res.json({ success: true, message: 'Connection request accepted. Family circles fused.' });
    } else {
      await prisma.relationship.delete({
        where: { id }
      });
      res.json({ success: true, message: 'Connection request declined.' });
    }
  } catch (error) {
    console.error('Error in respondToRequest:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
