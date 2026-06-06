import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../config/supabase';
import { getFamilyCircle } from '../services/familyGraph';

/**
 * Format DB HeritageVault event for frontend compatibility
 */
function mapHeritageToFrontend(event: any) {
  const creatorName = `${event.creator.firstName} ${event.creator.lastName}`.trim();
  return {
    id: event.id,
    year: event.eventDate ? new Date(event.eventDate).getFullYear() : null,
    title: event.title,
    branch: event.creator.familyBranchName || 'Family Branch',
    content: event.description,
    image: event.mediaUrls && event.mediaUrls.length > 0 ? event.mediaUrls[0] : null,
    mediaUrls: event.mediaUrls || [],
    contributors: [creatorName],
    type: 'event' // Default event type
  };
}

export async function getHeritageEvents(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Get family circle members
    const circle = await getFamilyCircle(user.id);
    const circleIds = circle.map(member => member.id);

    // Fetch heritage events created by anyone in the family circle
    const events = await prisma.heritageVault.findMany({
      where: {
        createdBy: { in: circleIds }
      },
      include: {
        creator: true
      },
      orderBy: {
        eventDate: 'asc'
      }
    });

    res.json(events.map(mapHeritageToFrontend));
  } catch (error) {
    console.error('Error in getHeritageEvents:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

export async function getHeritageEventById(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const event = await prisma.heritageVault.findUnique({
      where: { id },
      include: { creator: true }
    });

    if (!event) {
      res.status(404).json({ error: 'Heritage event not found' });
      return;
    }

    res.json(mapHeritageToFrontend(event));
  } catch (error) {
    console.error('Error in getHeritageEventById:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

export async function createHeritageEvent(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { title, description, event_date, media_urls } = req.body;

    if (!title || !description || !event_date) {
      res.status(400).json({ error: 'Title, description, and event_date are required' });
      return;
    }

    // Resolve or provision user's FamilyTree treeId
    let treeId = user.treeId;
    if (!treeId) {
      const newTree = await prisma.familyTree.create({
        data: { name: `${user.firstName}'s Family` }
      });
      treeId = newTree.id;
      await prisma.profile.update({
        where: { id: user.id },
        data: { treeId }
      });
      user.treeId = treeId;
    }

    const newEvent = await prisma.heritageVault.create({
      data: {
        title,
        description,
        eventDate: new Date(event_date),
        createdBy: user.id,
        treeId: treeId,
        mediaUrls: Array.isArray(media_urls) ? media_urls : []
      },
      include: {
        creator: true
      }
    });

    res.status(201).json(mapHeritageToFrontend(newEvent));
  } catch (error) {
    console.error('Error in createHeritageEvent:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

export async function deleteHeritageEvent(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;

    const event = await prisma.heritageVault.findUnique({
      where: { id }
    });

    if (!event) {
      res.status(404).json({ error: 'Heritage event not found' });
      return;
    }

    // Only allow deletion by event creator
    if (event.createdBy !== user.id) {
      res.status(403).json({ error: 'Forbidden: You can only delete your own heritage events' });
      return;
    }

    await prisma.heritageVault.delete({
      where: { id }
    });

    res.json({ message: 'Heritage event deleted successfully' });
  } catch (error) {
    console.error('Error in deleteHeritageEvent:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
