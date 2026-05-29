import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  rsvpEvent,
  votePollOption
} from '../controllers/eventController';

const router = Router();

// Secure all event routes
router.use(requireAuth);

router.get('/', getEvents);
router.post('/', createEvent);
router.get('/:id', getEventById);
router.put('/:id', updateEvent);
router.delete('/:id', deleteEvent);

// RSVPs and Poll voting
router.post('/:id/rsvp', rsvpEvent);
router.post('/options/:optionId/vote', votePollOption);

export default router;
