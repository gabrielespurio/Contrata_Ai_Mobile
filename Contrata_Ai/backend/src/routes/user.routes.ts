import { Router } from 'express';
import { getProfile, updateProfile, updateAvatar, listProviders } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/providers', authenticate, listProviders);
router.get('/:id', authenticate, getProfile);
router.put('/me', authenticate, updateProfile);
router.patch('/me/avatar', authenticate, updateAvatar);

export default router;
