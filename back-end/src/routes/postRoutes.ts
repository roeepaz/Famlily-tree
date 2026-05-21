import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireFamilyLinkForPost } from '../middleware/authorization';
import {
  getPosts,
  getPostById,
  createPost,
  deletePost
} from '../controllers/postController';

const router = Router();

// Secure all post routes
router.use(requireAuth);

router.get('/', getPosts);
router.post('/', createPost);
router.get('/:id', requireFamilyLinkForPost, getPostById);
router.delete('/:id', deletePost);

export default router;
