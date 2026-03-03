import { Router } from 'express';
import { createService, getMyServices, updateService, deleteService } from '../controllers/service.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/', authenticate, createService);
router.get('/my', authenticate, getMyServices);
router.put('/:id', authenticate, updateService);
router.delete('/:id', authenticate, deleteService);

export default router;
