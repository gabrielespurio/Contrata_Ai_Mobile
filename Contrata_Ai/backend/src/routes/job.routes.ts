import { Router } from 'express';
import { createJob, listJobs, getJob, updateJob, deleteJob, getMyJobs, getContractorJobs } from '../controllers/job.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticate, listJobs);
router.get('/my', authenticate, getMyJobs);
router.get('/contractor/:userId', authenticate, getContractorJobs);
router.get('/:id', authenticate, getJob);
router.post('/', authenticate, createJob);
router.put('/:id', authenticate, updateJob);
router.delete('/:id', authenticate, deleteJob);

export default router;
