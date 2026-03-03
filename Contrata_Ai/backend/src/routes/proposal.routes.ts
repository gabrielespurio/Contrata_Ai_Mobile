import { Router } from 'express';
import { createProposal, getJobProposals, getMyProposals, updateProposalStatus, getProposalById } from '../controllers/proposal.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/', authenticate, createProposal);
router.get('/my', authenticate, getMyProposals);
router.get('/job/:jobId', authenticate, getJobProposals);
router.get('/:id', authenticate, getProposalById);
router.patch('/:id/status', authenticate, updateProposalStatus);

export default router;
