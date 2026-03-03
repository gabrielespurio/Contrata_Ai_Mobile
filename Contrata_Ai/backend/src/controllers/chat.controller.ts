import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth.middleware';

export const getChatRooms = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user!.id;
        const chatRooms = await prisma.chatRoom.findMany({
            where: { OR: [{ user1Id: userId }, { user2Id: userId }] },
            include: {
                user1: { select: { id: true, name: true, avatarUrl: true } },
                user2: { select: { id: true, name: true, avatarUrl: true } },
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                },
            },
            orderBy: { updatedAt: 'desc' },
        });
        res.json({ chatRooms });
    } catch {
        res.status(500).json({ message: 'Erro ao buscar conversas' });
    }
};

export const getOrCreateChatRoom = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user!.id;
        const { otherUserId } = req.body;

        const [u1, u2] = userId < otherUserId ? [userId, otherUserId] : [otherUserId, userId];

        let chatRoom = await prisma.chatRoom.findFirst({
            where: { user1Id: u1, user2Id: u2 },
            include: {
                user1: { select: { id: true, name: true, avatarUrl: true } },
                user2: { select: { id: true, name: true, avatarUrl: true } },
            },
        });

        if (!chatRoom) {
            chatRoom = await prisma.chatRoom.create({
                data: { user1Id: u1, user2Id: u2 },
                include: {
                    user1: { select: { id: true, name: true, avatarUrl: true } },
                    user2: { select: { id: true, name: true, avatarUrl: true } },
                },
            });
        }

        res.json({ chatRoom });
    } catch {
        res.status(500).json({ message: 'Erro ao iniciar conversa' });
    }
};

export const getMessages = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const chatRoomId = req.params.chatRoomId as string;
        const userId = req.user!.id;

        const chatRoom = await prisma.chatRoom.findUnique({ where: { id: chatRoomId } });
        if (!chatRoom || (chatRoom.user1Id !== userId && chatRoom.user2Id !== userId)) {
            res.status(403).json({ message: 'Não autorizado' });
            return;
        }

        const messages = await prisma.message.findMany({
            where: { chatRoomId },
            orderBy: { createdAt: 'asc' },
            include: {
                sender: { select: { id: true, name: true, avatarUrl: true } },
            },
        });

        // Mark messages as read
        await prisma.message.updateMany({
            where: { chatRoomId, receiverId: userId, isRead: false },
            data: { isRead: true },
        });

        res.json({ messages });
    } catch {
        res.status(500).json({ message: 'Erro ao buscar mensagens' });
    }
};

export const sendMessage = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const chatRoomId = req.params.chatRoomId as string;
        const { content } = req.body;
        const userId = req.user!.id;

        const chatRoom = await prisma.chatRoom.findUnique({ where: { id: chatRoomId } });
        if (!chatRoom || (chatRoom.user1Id !== userId && chatRoom.user2Id !== userId)) {
            res.status(403).json({ message: 'Não autorizado' });
            return;
        }

        const receiverId = chatRoom.user1Id === userId ? chatRoom.user2Id : chatRoom.user1Id;

        const message = await prisma.message.create({
            data: { content, chatRoomId, senderId: userId, receiverId },
            include: { sender: { select: { id: true, name: true, avatarUrl: true } } },
        });

        await prisma.chatRoom.update({ where: { id: chatRoomId }, data: { updatedAt: new Date() } });

        res.status(201).json({ message });
    } catch {
        res.status(500).json({ message: 'Erro ao enviar mensagem' });
    }
};
