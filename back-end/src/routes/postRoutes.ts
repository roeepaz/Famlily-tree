import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { verifyGraphAccessAuthorization } from '../middleware/graphGuard';
import {
  getPosts,
  getPostById,
  createPost,
  deletePost,
  createComment,
  deleteComment,
  toggleReaction
} from '../controllers/postController';

const router = Router();

// Secure all post routes
router.use(requireAuth);

router.get('/', getPosts);
router.post('/', createPost);
router.get('/:id', verifyGraphAccessAuthorization, getPostById);
router.delete('/:id', deletePost);

// Comments and Reactions
router.post('/:id/comments', verifyGraphAccessAuthorization, createComment);
router.delete('/:id/comments/:commentId', verifyGraphAccessAuthorization, deleteComment);
router.post('/:id/reactions', verifyGraphAccessAuthorization, toggleReaction);

export default router;
