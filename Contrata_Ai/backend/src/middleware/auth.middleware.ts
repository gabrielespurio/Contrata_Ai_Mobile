import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';

export interface AuthRequest extends Request {
    user?: {
        id: string;
        role: string;
        email: string;
    };
}

export const authenticate = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            res.status(401).json({ message: 'Token de autenticação não fornecido' });
            return;
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as {
            id: string;
            role: string;
            email: string;
        };

        const user = await prisma.user.findUnique({ where: { id: decoded.id } });
        if (!user) {
            res.status(401).json({ message: 'Usuário não encontrado' });
            return;
        }

        req.user = { id: user.id, role: user.role, email: user.email };
        next();
    } catch {
        res.status(401).json({ message: 'Token inválido ou expirado' });
    }
};

export const requireRole = (roles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction): void => {
        if (!req.user || !roles.includes(req.user.role)) {
            res.status(403).json({ message: 'Acesso não autorizado' });
            return;
        }
        next();
    };
};
