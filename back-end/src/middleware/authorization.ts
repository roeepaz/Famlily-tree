import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';
import { prisma } from '../config/supabase';
import { areConnected } from '../services/familyGraph';

/**
 * Middleware to check if the authenticated user shares a structural family link
 * with the author of the post they are attempting to view or modify.
 */
export async function requireFamilyLinkForPost(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'Unauthorized: User profile missing' });
      return;
    }

    const { id: postId } = req.params;
    if (!postId) {
      res.status(400).json({ error: 'Bad Request: Post ID is required' });
      return;
    }

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true }
    });

    if (!post) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }

    const connected = await areConnected(user.id, post.authorId);
    if (!connected) {
      res.status(403).json({ 
        error: 'Forbidden: You do not share a structural family link with the author of this post.' 
      });
      return;
    }

    next();
  } catch (error) {
    console.error('Error in requireFamilyLinkForPost middleware:', error);
    res.status(500).json({ error: 'Internal Server Error during authorization check' });
  }
}

/**
 * Middleware to check if the authenticated user shares a structural family link
 * with the creator of the heritage vault event they are attempting to view or modify.
 */
export async function requireFamilyLinkForHeritage(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'Unauthorized: User profile missing' });
      return;
    }

    const { id: eventId } = req.params;
    if (!eventId) {
      res.status(400).json({ error: 'Bad Request: Event ID is required' });
      return;
    }

    const event = await prisma.heritageVault.findUnique({
      where: { id: eventId },
      select: { createdBy: true }
    });

    if (!event) {
      res.status(404).json({ error: 'Heritage event not found' });
      return;
    }

    const connected = await areConnected(user.id, event.createdBy);
    if (!connected) {
      res.status(403).json({ 
        error: 'Forbidden: You do not share a structural family link with the creator of this event.' 
      });
      return;
    }

    next();
  } catch (error) {
    console.error('Error in requireFamilyLinkForHeritage middleware:', error);
    res.status(500).json({ error: 'Internal Server Error during authorization check' });
  }
}
