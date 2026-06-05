import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import {
  getMe,
  getCircle,
  getProfileById,
  createProfile,
  updateProfile,
  createRelationship,
  deleteRelationship,
  connectExistingByEmail,
  getPendingRequests,
  respondToRequest,
  getUpcomingBirthdays,
  getProfileActivity,
  getInvitePreview,
  claimInvite
} from '../controllers/profileController';

const router = Router();

// Public route to fetch pre-populated invite tree previews
router.get('/invite-preview', getInvitePreview);

// Secure all profile routes
router.use(requireAuth);


router.get('/me', getMe);
router.post('/claim-invite', claimInvite);
router.get('/circle', getCircle);
router.get('/upcoming-birthdays', getUpcomingBirthdays);
router.post('/connect-email', connectExistingByEmail);
router.get('/pending-requests', getPendingRequests);
router.post('/pending-requests/:id/respond', respondToRequest);
router.get('/:id/activity', getProfileActivity);
router.get('/:id', getProfileById);
router.post('/', createProfile);
router.put('/:id', updateProfile);
router.post('/relationships', createRelationship);
router.delete('/relationships/:id', deleteRelationship);

export default router;
