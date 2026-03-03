import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth.middleware';

export const createService = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { title, description, price, priceType, duration, categoryId, imageUrl } = req.body;
        const service = await prisma.service.create({
            data: { title, description, price: parseFloat(price), priceType, duration, categoryId, imageUrl, providerId: req.user!.id },
            include: { category: true },
        });
        res.status(201).json({ service });
    } catch {
        res.status(500).json({ message: 'Erro ao criar serviço' });
    }
};

export const getMyServices = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const services = await prisma.service.findMany({
            where: { providerId: req.user!.id },
            include: { category: true },
            orderBy: { createdAt: 'desc' },
        });
        res.json({ services });
    } catch {
        res.status(500).json({ message: 'Erro ao listar serviços' });
    }
};

export const updateService = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const id = req.params.id as string;
        const svc = await prisma.service.findUnique({ where: { id } });
        if (!svc || svc.providerId !== req.user?.id) {
            res.status(403).json({ message: 'Não autorizado' });
            return;
        }
        const updated = await prisma.service.update({ where: { id }, data: req.body });
        res.json({ service: updated });
    } catch {
        res.status(500).json({ message: 'Erro ao atualizar serviço' });
    }
};

export const deleteService = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const id = req.params.id as string;
        const svc = await prisma.service.findUnique({ where: { id } });
        if (!svc || svc.providerId !== req.user?.id) {
            res.status(403).json({ message: 'Não autorizado' });
            return;
        }
        await prisma.service.delete({ where: { id } });
        res.json({ message: 'Serviço removido' });
    } catch {
        res.status(500).json({ message: 'Erro ao remover serviço' });
    }
};
