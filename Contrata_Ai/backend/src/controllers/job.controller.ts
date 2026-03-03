import { Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth.middleware';

export const createJob = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { title, description, budget, budgetType, location, city, state, cep, street, neighborhood, addressNumber, isRemote, deadline, categoryId } = req.body;

        const job = await prisma.job.create({
            data: {
                title, description,
                budget: budget ? parseFloat(budget) : undefined,
                budgetType, location, city, state, cep,
                street, neighborhood, addressNumber,
                isRemote: isRemote || false,
                deadline: deadline ? new Date(deadline) : undefined,
                categoryId,
                contratanteId: req.user!.id,
            },
            include: { category: true, contratante: { select: { id: true, name: true, avatarUrl: true, rating: true } } },
        });

        res.status(201).json({ job });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao criar vaga' });
    }
};

export const listJobs = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { category, city, search, page = '1', limit = '20', budgetMin, budgetMax } = req.query;
        const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

        const where: Prisma.JobWhereInput = { status: 'ATIVO' };
        if (city) where.city = { contains: city as string, mode: 'insensitive' };
        if (search) where.title = { contains: search as string, mode: 'insensitive' };
        if (category) where.categoryId = category as string;
        if (budgetMin || budgetMax) {
            where.budget = {
                gte: budgetMin ? parseFloat(budgetMin as string) : undefined,
                lte: budgetMax ? parseFloat(budgetMax as string) : undefined,
            };
        }

        const [jobs, total] = await Promise.all([
            prisma.job.findMany({
                where,
                skip,
                take: parseInt(limit as string),
                orderBy: { createdAt: 'desc' },
                include: {
                    category: { select: { id: true, name: true, icon: true } },
                    contratante: { select: { id: true, name: true, avatarUrl: true, city: true, rating: true } },
                    _count: { select: { proposals: true } },
                },
            }),
            prisma.job.count({ where }),
        ]);

        res.json({ jobs, total, page: parseInt(page as string), totalPages: Math.ceil(total / parseInt(limit as string)) });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao listar vagas' });
    }
};

export const getJob = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const id = req.params.id as string;
        const job = await prisma.job.findUnique({
            where: { id },
            include: {
                category: true,
                contratante: { select: { id: true, name: true, avatarUrl: true, city: true, rating: true, reviewCount: true, completedJobs: true } },
                _count: { select: { proposals: true } },
            },
        });
        if (!job) {
            res.status(404).json({ message: 'Vaga não encontrada' });
            return;
        }
        res.json({ job });
    } catch {
        res.status(500).json({ message: 'Erro ao buscar vaga' });
    }
};

export const updateJob = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const id = req.params.id as string;
        const job = await prisma.job.findUnique({ where: { id } });
        if (!job || job.contratanteId !== req.user?.id) {
            res.status(403).json({ message: 'Não autorizado' });
            return;
        }
        const updated = await prisma.job.update({
            where: { id },
            data: req.body,
            include: { category: true },
        });
        res.json({ job: updated });
    } catch {
        res.status(500).json({ message: 'Erro ao atualizar vaga' });
    }
};

export const deleteJob = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const id = req.params.id as string;
        const job = await prisma.job.findUnique({ where: { id } });
        if (!job || job.contratanteId !== req.user?.id) {
            res.status(403).json({ message: 'Não autorizado' });
            return;
        }
        await prisma.job.delete({ where: { id } });
        res.json({ message: 'Vaga removida com sucesso' });
    } catch {
        res.status(500).json({ message: 'Erro ao remover vaga' });
    }
};

export const getMyJobs = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const jobs = await prisma.job.findMany({
            where: { contratanteId: req.user!.id },
            orderBy: { createdAt: 'desc' },
            include: {
                category: true,
                _count: { select: { proposals: true } },
            },
        });
        res.json({ jobs });
    } catch {
        res.status(500).json({ message: 'Erro ao buscar suas vagas' });
    }
};
export const getContractorJobs = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.params.userId as string;
        const jobs = await prisma.job.findMany({
            where: {
                contratanteId: userId,
                status: 'ATIVO',
            },
            orderBy: { createdAt: 'desc' },
            include: {
                category: { select: { id: true, name: true, icon: true } },
                _count: { select: { proposals: true } },
            },
        });
        res.json({ jobs });
    } catch {
        res.status(500).json({ message: 'Erro ao buscar vagas do contratante' });
    }
};
