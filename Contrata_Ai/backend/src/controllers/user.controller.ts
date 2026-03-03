import { Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth.middleware';

export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const id = req.params.id as string;
        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true, name: true, email: true, phone: true, role: true, avatarUrl: true,
                bio: true, city: true, state: true, rating: true, reviewCount: true,
                completedJobs: true, isPremium: true, isVerified: true, experience: true,
                professionalSummary: true, hourlyRate: true,
                categories: { select: { id: true, name: true, icon: true } },
                services: {
                    where: { isActive: true },
                    select: { id: true, title: true, price: true, priceType: true, description: true, imageUrl: true },
                },
                reviewsReceived: {
                    take: 5,
                    orderBy: { createdAt: 'desc' },
                    select: {
                        id: true, rating: true, comment: true, createdAt: true,
                        reviewer: { select: { id: true, name: true, avatarUrl: true } },
                    },
                },
                createdAt: true,
            },
        });
        if (!user) {
            res.status(404).json({ message: 'Usuário não encontrado' });
            return;
        }
        res.json({ user });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar perfil' });
    }
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const {
            name, phone, bio, city, state, cep, address, experience,
            professionalSummary, hourlyRate, birthDate, gender, categoryIds, role,
        } = req.body;

        const updateData: Record<string, unknown> = {
            ...(name && { name }),
            ...(phone && { phone }),
            ...(bio && { bio }),
            ...(city && { city }),
            ...(state && { state }),
            ...(cep && { cep }),
            ...(address && { address }),
            ...(experience && { experience }),
            ...(professionalSummary && { professionalSummary }),
            ...(hourlyRate && { hourlyRate: parseFloat(hourlyRate) }),
            ...(birthDate && { birthDate: new Date(birthDate) }),
            ...(gender && { gender }),
            ...(role && { role }),
        };

        if (categoryIds && Array.isArray(categoryIds)) {
            (updateData as Record<string, unknown>).categories = {
                set: categoryIds.map((id: string) => ({ id })),
            };
        }

        const user = await prisma.user.update({
            where: { id: req.user!.id },
            data: updateData as Prisma.UserUpdateInput,
            select: {
                id: true, name: true, email: true, phone: true, role: true, avatarUrl: true,
                bio: true, city: true, state: true, rating: true, reviewCount: true,
                completedJobs: true, isPremium: true,
                categories: { select: { id: true, name: true, icon: true } },
            },
        });

        res.json({ user });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao atualizar perfil' });
    }
};

export const updateAvatar = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { avatarUrl } = req.body;
        const user = await prisma.user.update({
            where: { id: req.user?.id },
            data: { avatarUrl },
            select: { id: true, avatarUrl: true },
        });
        res.json({ user });
    } catch {
        res.status(500).json({ message: 'Erro ao atualizar avatar' });
    }
};

export const listProviders = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { category, city, search, page = '1', limit = '20' } = req.query;
        const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

        const where: Prisma.UserWhereInput = { role: 'PRESTADOR' };
        if (city) where.city = { contains: city as string, mode: 'insensitive' };
        if (search) where.name = { contains: search as string, mode: 'insensitive' };
        if (category) {
            where.categories = { some: { name: { contains: category as string, mode: 'insensitive' } } };
        }

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                skip,
                take: parseInt(limit as string),
                orderBy: { rating: 'desc' },
                select: {
                    id: true, name: true, avatarUrl: true, bio: true, city: true,
                    rating: true, reviewCount: true, completedJobs: true, isPremium: true,
                    categories: { select: { id: true, name: true, icon: true } },
                    hourlyRate: true,
                },
            }),
            prisma.user.count({ where }),
        ]);

        res.json({ users, total, page: parseInt(page as string), totalPages: Math.ceil(total / parseInt(limit as string)) });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao listar profissionais' });
    }
};
