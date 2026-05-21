import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import {
  getMe,
  getCircle,
  getProfileById,
  createProfile,
  updateProfile,
  createRelationship,
  deleteRelationship
} from '../controllers/profileController';

const router = Router();

// Secure all profile routes
router.use(requireAuth);

router.get('/me', getMe);
router.get('/circle', getCircle);
router.get('/:id', getProfileById);
router.post('/', createProfile);
router.put('/:id', updateProfile);
router.post('/relationships', createRelationship);
router.delete('/relationships/:id', deleteRelationship);

export default router;
