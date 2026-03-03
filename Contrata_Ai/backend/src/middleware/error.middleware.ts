import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
    err: Error,
    _req: Request,
    res: Response,
    _next: NextFunction
): void => {
    console.error(err.stack);
    res.status(500).json({
        message: 'Erro interno do servidor',
        ...(process.env.NODE_ENV === 'development' && { error: err.message }),
    });
};

export class AppError extends Error {
    constructor(public message: string, public statusCode: number = 400) {
        super(message);
        this.name = 'AppError';
    }
}
