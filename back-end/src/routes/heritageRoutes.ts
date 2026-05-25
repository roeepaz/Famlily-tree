import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireFamilyLinkForHeritage } from '../middleware/authorization';
import {
  getHeritageEvents,
  getHeritageEventById,
  createHeritageEvent,
  deleteHeritageEvent
} from '../controllers/heritageController';

const router = Router();

// Secure all heritage routes
router.use(requireAuth);

router.get('/', getHeritageEvents);
router.post('/', createHeritageEvent);
router.get('/:id', requireFamilyLinkForHeritage, getHeritageEventById);
router.delete('/:id', deleteHeritageEvent);

export default router;
