import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../config/supabase';
import { getFamilyCircle } from '../services/familyGraph';
import { NarrativeType } from '@prisma/client';

/**
 * Format DB Post object for frontend compatibility
 */
function mapPostToFrontend(post: any, currentUserId?: string) {
  const typeMap: Record<string, string> = {
    DAILY_LIFE: 'daily',
    MILESTONE: 'milestone',
    MEMORY: 'memory',
  };

  // Group reactions by emoji and count them
  const reactionCounts: Record<string, number> = {};
  let userReactionEmoji: string | null = null;

  if (post.reactions) {
    post.reactions.forEach((r: any) => {
      reactionCounts[r.emoji] = (reactionCounts[r.emoji] || 0) + 1;
      if (currentUserId && r.profileId === currentUserId) {
        userReactionEmoji = r.emoji;
      }
    });
  }

  const reactionsList = Object.entries(reactionCounts).map(([emoji, count]) => ({
    emoji,
    count
  }));

  const commentsList = post.comments ? post.comments.map((c: any) => ({
    id: c.id,
    text: c.text,
    timestamp: c.createdAt.toISOString(),
    authorId: c.authorId,
    authorName: `${c.author.firstName} ${c.author.lastName}`.trim(),
    authorAvatar: c.author.avatarUrl || ''
  })) : [];

  return {
    id: post.id,
    authorId: post.authorId,
    authorName: `${post.author.firstName} ${post.author.lastName}`.trim(),
    authorAvatar: post.author.avatarUrl || '',
    authorBranch: post.author.familyBranchName || 'Family Branch',
    type: post.eventId ? 'event' : (typeMap[post.narrativeType] || 'daily'),
    timestamp: post.createdAt.toISOString(),
    content: post.content,
    image: post.imageUrl || null,
    reactions: reactionsList,
    userReaction: userReactionEmoji,
    comments: commentsList,
    eventId: post.eventId || null
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
        authorId: { in: circleIds }
      },
      include: {
        author: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true, familyBranchName: true }
        },
        comments: {
          include: {
            author: {
              select: { id: true, firstName: true, lastName: true, avatarUrl: true }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        },
        reactions: {
          select: { id: true, emoji: true, profileId: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50 // Limit feed to most recent 50 posts
    });

    res.json(posts.map(post => mapPostToFrontend(post, user.id)));
  } catch (error) {
    console.error('Error in getPosts:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

export async function getPostById(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    const { id } = req.params;
    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true, familyBranchName: true }
        },
        comments: {
          include: {
            author: {
              select: { id: true, firstName: true, lastName: true, avatarUrl: true }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        },
        reactions: {
          select: { id: true, emoji: true, profileId: true }
        }
      }
    });

    if (!post) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }

    res.json(mapPostToFrontend(post, user?.id));
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

    const { content, image_url, type } = req.body;

    if (!content) {
      res.status(400).json({ error: 'Content is required' });
      return;
    }

    // Map frontend type to backend NarrativeType
    let narrativeType: NarrativeType = NarrativeType.DAILY_LIFE;
    if (type === 'milestone') {
      narrativeType = NarrativeType.MILESTONE;
    } else if (type === 'memory') {
      narrativeType = NarrativeType.MEMORY;
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

    const newPost = await prisma.post.create({
      data: {
        authorId: user.id,
        treeId: treeId,
        content,
        imageUrl: image_url,
        narrativeType
      },
      include: {
        author: true,
        comments: {
          include: {
            author: true
          }
        },
        reactions: true
      }
    });

    // If it is a Family Memory, also create a corresponding entry in the Heritage Vault
    if (narrativeType === NarrativeType.MEMORY) {
      try {
        const firstLine = content.split('\n')[0].trim();
        const title = firstLine.length > 60 
          ? `${firstLine.substring(0, 57)}...` 
          : firstLine || 'Family Memory';

        await prisma.heritageVault.create({
          data: {
            title,
            description: content,
            eventDate: new Date(), // post creation date
            createdBy: user.id,
            treeId: treeId,
            mediaUrls: image_url ? [image_url] : []
          }
        });
      } catch (vaultError) {
        // Log vault error, but do not fail the post creation request
        console.error('Failed to create Heritage Vault mirroring entry:', vaultError);
      }
    }

    res.status(201).json(mapPostToFrontend(newPost, user.id));
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
    if (post.authorId !== user.id) {
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

export async function createComment(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { id: postId } = req.params;
    const { text } = req.body;

    if (!text || text.trim() === '') {
      res.status(400).json({ error: 'Comment text is required' });
      return;
    }

    const comment = await prisma.comment.create({
      data: {
        postId,
        authorId: user.id,
        text: text.trim()
      },
      include: {
        author: true
      }
    });

    res.status(201).json({
      id: comment.id,
      text: comment.text,
      timestamp: comment.createdAt.toISOString(),
      authorId: comment.authorId,
      authorName: `${comment.author.firstName} ${comment.author.lastName}`.trim(),
      authorAvatar: comment.author.avatarUrl || ''
    });
  } catch (error) {
    console.error('Error in createComment:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

export async function deleteComment(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { commentId } = req.params;

    const comment = await prisma.comment.findUnique({
      where: { id: commentId }
    });

    if (!comment) {
      res.status(404).json({ error: 'Comment not found' });
      return;
    }

    // Only allow deletion by comment author or post author
    const post = await prisma.post.findUnique({
      where: { id: comment.postId }
    });

    if (comment.authorId !== user.id && post?.authorId !== user.id) {
      res.status(403).json({ error: 'Forbidden: You can only delete your own comments' });
      return;
    }

    await prisma.comment.delete({
      where: { id: commentId }
    });

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error in deleteComment:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

export async function toggleReaction(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { id: postId } = req.params;
    const { emoji } = req.body;

    if (!emoji) {
      res.status(400).json({ error: 'Emoji is required' });
      return;
    }

    // Find if user already reacted to this post
    const existingReaction = await prisma.reaction.findUnique({
      where: {
        postId_profileId: {
          postId,
          profileId: user.id
        }
      }
    });

    if (existingReaction) {
      if (existingReaction.emoji === emoji) {
        // If the same emoji is clicked, delete the reaction (toggle off)
        await prisma.reaction.delete({
          where: {
            id: existingReaction.id
          }
        });
        res.json({ message: 'Reaction removed', userReaction: null });
      } else {
        // If a different emoji is clicked, update it
        const updatedReaction = await prisma.reaction.update({
          where: {
            id: existingReaction.id
          },
          data: {
            emoji
          }
        });
        res.json({ message: 'Reaction updated', userReaction: updatedReaction.emoji });
      }
    } else {
      // Create new reaction
      const newReaction = await prisma.reaction.create({
        data: {
          postId,
          profileId: user.id,
          emoji
        }
      });
      res.status(201).json({ message: 'Reaction added', userReaction: newReaction.emoji });
    }
  } catch (error) {
    console.error('Error in toggleReaction:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
