import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';

const generateToken = (userId: string, role: string, email: string): string => {
    return jwt.sign(
        { id: userId, role, email },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions
    );
};

export const register = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, email, password, role, phone } = req.body;

        if (!name || !email || !password || !role) {
            res.status(400).json({ message: 'Campos obrigatórios: name, email, password, role' });
            return;
        }

        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            res.status(400).json({ message: 'Email já cadastrado' });
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        const user = await prisma.user.create({
            data: { name, email, password: hashedPassword, role, phone },
            select: { id: true, name: true, email: true, role: true, createdAt: true },
        });

        const token = generateToken(user.id, user.role, user.email);
        res.status(201).json({ user, token });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ message: 'Erro ao criar conta' });
    }
};

export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ message: 'Email e senha são obrigatórios' });
            return;
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            res.status(401).json({ message: 'Credenciais inválidas' });
            return;
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            res.status(401).json({ message: 'Credenciais inválidas' });
            return;
        }

        const token = generateToken(user.id, user.role, user.email);
        const { password: _, ...userWithoutPassword } = user;
        res.json({ user: userWithoutPassword, token });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Erro ao fazer login' });
    }
};

export const getMe = async (req: Request & { user?: { id: string } }, res: Response): Promise<void> => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user?.id },
            select: {
                id: true, name: true, email: true, phone: true, role: true,
                avatarUrl: true, bio: true, city: true, state: true, rating: true,
                reviewCount: true, completedJobs: true, isPremium: true, isVerified: true,
                categories: { select: { id: true, name: true, icon: true } },
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
