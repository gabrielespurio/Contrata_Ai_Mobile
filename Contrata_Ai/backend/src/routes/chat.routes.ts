import { Router } from 'express';
import { getChatRooms, getOrCreateChatRoom, getMessages, sendMessage } from '../controllers/chat.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/rooms', authenticate, getChatRooms);
router.post('/rooms', authenticate, getOrCreateChatRoom);
router.get('/rooms/:chatRoomId/messages', authenticate, getMessages);
router.post('/rooms/:chatRoomId/messages', authenticate, sendMessage);

export default router;
