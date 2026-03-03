import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth.middleware';

export const getNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const notifications = await prisma.notification.findMany({
            where: { userId: req.user!.id },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
        res.json({ notifications });
    } catch {
        res.status(500).json({ message: 'Erro ao buscar notificações' });
    }
};

export const markAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        await prisma.notification.updateMany({
            where: { userId: req.user!.id, isRead: false },
            data: { isRead: true },
        });
        res.json({ message: 'Notificações marcadas como lidas' });
    } catch {
        res.status(500).json({ message: 'Erro ao atualizar notificações' });
    }
};

export const getContracts = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user!.id;
        const contracts = await prisma.contract.findMany({
            where: { OR: [{ contratanteId: userId }, { prestadorId: userId }] },
            include: {
                job: { select: { id: true, title: true } },
                contratante: { select: { id: true, name: true, avatarUrl: true } },
                prestador: { select: { id: true, name: true, avatarUrl: true } },
                reviews: true,
                serviceHistory: { orderBy: { createdAt: 'desc' } },
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json({ contracts });
    } catch {
        res.status(500).json({ message: 'Erro ao buscar contratos' });
    }
};
