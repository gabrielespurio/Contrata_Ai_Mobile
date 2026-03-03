import { Router } from 'express';
import { listCategories } from '../controllers/category.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticate, listCategories);

export default router;
