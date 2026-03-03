import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth.middleware';

export const createReview = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { contractId, rating, comment, reviewedId } = req.body;

        const existing = await prisma.review.findFirst({
            where: { contractId, reviewerId: req.user!.id },
        });
        if (existing) {
            res.status(400).json({ message: 'Você já avaliou este contrato' });
            return;
        }

        const review = await prisma.review.create({
            data: { contractId, rating: parseInt(rating), comment, reviewerId: req.user!.id, reviewedId },
        });

        // Update user average rating
        const reviews = await prisma.review.findMany({ where: { reviewedId } });
        const avgRating = reviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / reviews.length;
        await prisma.user.update({
            where: { id: reviewedId },
            data: { rating: avgRating, reviewCount: reviews.length },
        });

        res.status(201).json({ review });
    } catch {
        res.status(500).json({ message: 'Erro ao criar avaliação' });
    }
};

export const getUserReviews = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.params.userId as string;
        const reviews = await prisma.review.findMany({
            where: { reviewedId: userId },
            include: {
                reviewer: { select: { id: true, name: true, avatarUrl: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json({ reviews });
    } catch {
        res.status(500).json({ message: 'Erro ao buscar avaliações' });
    }
};
