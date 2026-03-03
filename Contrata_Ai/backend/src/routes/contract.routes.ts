import { Router } from 'express';
import { getContracts } from '../controllers/notification.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticate, getContracts);

export default router;
