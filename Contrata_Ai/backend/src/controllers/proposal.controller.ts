import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth.middleware';

export const createProposal = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { jobId, message, value, deadline } = req.body;

        const existing = await prisma.proposal.findFirst({
            where: { jobId, prestadorId: req.user!.id },
        });
        if (existing) {
            res.status(400).json({ message: 'Você já enviou uma proposta para esta vaga' });
            return;
        }

        const proposal = await prisma.proposal.create({
            data: {
                jobId, message,
                value: value ? parseFloat(value) : undefined,
                deadline: deadline ? new Date(deadline) : undefined,
                prestadorId: req.user!.id,
            },
            include: {
                job: { select: { id: true, title: true } },
                prestador: { select: { id: true, name: true, avatarUrl: true, rating: true } },
            },
        });

        res.status(201).json({ proposal });
    } catch {
        res.status(500).json({ message: 'Erro ao enviar proposta' });
    }
};

export const getJobProposals = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const jobId = req.params.jobId as string;
        const job = await prisma.job.findUnique({ where: { id: jobId } });
        if (!job || job.contratanteId !== req.user?.id) {
            res.status(403).json({ message: 'Não autorizado' });
            return;
        }

        const proposals = await prisma.proposal.findMany({
            where: { jobId },
            include: {
                prestador: {
                    select: { id: true, name: true, avatarUrl: true, rating: true, reviewCount: true, completedJobs: true, bio: true, city: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        res.json({ proposals });
    } catch {
        res.status(500).json({ message: 'Erro ao buscar propostas' });
    }
};

export const getMyProposals = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const proposals = await prisma.proposal.findMany({
            where: { prestadorId: req.user!.id },
            include: {
                job: {
                    include: { contratante: { select: { id: true, name: true, avatarUrl: true } }, category: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json({ proposals });
    } catch {
        res.status(500).json({ message: 'Erro ao buscar suas propostas' });
    }
};

export const updateProposalStatus = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const id = req.params.id as string;
        const { status } = req.body;

        const proposal = await prisma.proposal.findUnique({
            where: { id },
            include: { job: true },
        });

        if (!proposal) {
            res.status(404).json({ message: 'Proposta não encontrada' });
            return;
        }
        if (proposal.job.contratanteId !== req.user?.id) {
            res.status(403).json({ message: 'Não autorizado' });
            return;
        }

        const updated = await prisma.proposal.update({
            where: { id },
            data: { status },
        });

        if (status === 'ACEITA') {
            await prisma.contract.create({
                data: {
                    jobId: proposal.jobId,
                    contratanteId: proposal.job.contratanteId,
                    prestadorId: proposal.prestadorId,
                    value: proposal.value,
                    status: 'PENDENTE',
                },
            });
        }

        res.json({ proposal: updated });
    } catch {
        res.status(500).json({ message: 'Erro ao atualizar proposta' });
    }
};
export const getProposalById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const id = req.params.id as string;
        const proposal = await prisma.proposal.findUnique({
            where: { id },
            include: {
                job: {
                    include: {
                        contratante: { select: { id: true, name: true, avatarUrl: true, city: true } },
                    },
                },
                prestador: { select: { id: true, name: true, avatarUrl: true, rating: true } },
            },
        });

        if (!proposal) {
            res.status(404).json({ message: 'Proposta não encontrada' });
            return;
        }

        // Check if user is either the prestador who sent it or the contratante who received it
        if (proposal.prestadorId !== req.user?.id && proposal.job.contratanteId !== req.user?.id) {
            res.status(403).json({ message: 'Não autorizado' });
            return;
        }

        res.json({ proposal });
    } catch {
        res.status(500).json({ message: 'Erro ao buscar detalhe da proposta' });
    }
};
