import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../config/supabase';
import { getFamilyCircle } from '../services/familyGraph';

/**
 * Format DB Post object for frontend compatibility
 */
function mapPostToFrontend(post: any) {
  return {
    id: post.id,
    authorId: post.author_id,
    authorName: `${post.author.first_name} ${post.author.last_name}`.trim(),
    authorAvatar: post.author.avatar_url || '',
    authorBranch: post.author.family_branch_name || 'Family Branch',
    type: 'daily', // Default post type
    timestamp: post.created_at.toISOString(),
    content: post.content,
    image: post.image_url || null,
    reactions: [],
    comments: []
  };
}

export async function getPosts(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Get family circle members
    const circle = await getFamilyCircle(user.id);
    const circleIds = circle.map(member => member.id);

    // Fetch posts only by authors inside the family circle
    const posts = await prisma.post.findMany({
      where: {
        author_id: { in: circleIds }
      },
      include: {
        author: true
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    res.json(posts.map(mapPostToFrontend));
  } catch (error) {
    console.error('Error in getPosts:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

export async function getPostById(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const post = await prisma.post.findUnique({
      where: { id },
      include: { author: true }
    });

    if (!post) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }

    res.json(mapPostToFrontend(post));
  } catch (error) {
    console.error('Error in getPostById:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

export async function createPost(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { content, image_url } = req.body;

    if (!content) {
      res.status(400).json({ error: 'Content is required' });
      return;
    }

    const newPost = await prisma.post.create({
      data: {
        author_id: user.id,
        content,
        image_url
      },
      include: {
        author: true
      }
    });

    res.status(201).json(mapPostToFrontend(newPost));
  } catch (error) {
    console.error('Error in createPost:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

export async function deletePost(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;

    const post = await prisma.post.findUnique({
      where: { id }
    });

    if (!post) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }

    // Only allow deletion by post author
    if (post.author_id !== user.id) {
      res.status(403).json({ error: 'Forbidden: You can only delete your own posts' });
      return;
    }

    await prisma.post.delete({
      where: { id }
    });

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error in deletePost:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
