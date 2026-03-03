import { Router } from 'express';
import { createReview, getUserReviews } from '../controllers/review.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/', authenticate, createReview);
router.get('/user/:userId', authenticate, getUserReviews);

export default router;
