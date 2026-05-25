import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../config/supabase';
import { getFamilyCircle } from '../services/familyGraph';

/**
 * Format DB HeritageVault event for frontend compatibility
 */
function mapHeritageToFrontend(event: any) {
  const creatorName = `${event.creator.first_name} ${event.creator.last_name}`.trim();
  return {
    id: event.id,
    year: event.event_date ? new Date(event.event_date).getFullYear() : null,
    title: event.title,
    branch: event.creator.family_branch_name || 'Family Branch',
    content: event.description,
    image: event.media_urls && event.media_urls.length > 0 ? event.media_urls[0] : null,
    mediaUrls: event.media_urls || [],
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
        created_by: { in: circleIds }
      },
      include: {
        creator: true
      },
      orderBy: {
        event_date: 'asc'
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

    const newEvent = await prisma.heritageVault.create({
      data: {
        title,
        description,
        event_date: new Date(event_date),
        created_by: user.id,
        media_urls: Array.isArray(media_urls) ? media_urls : []
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
    if (event.created_by !== user.id) {
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
