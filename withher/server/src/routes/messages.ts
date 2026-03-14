import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { messageRateLimit } from '../middleware/rateLimitMiddleware';
import { validateBody, validateParams } from '../middleware/validationMiddleware';
import * as MessageController from '../controllers/messageController';
import { z } from 'zod';

const router = Router();
router.use(authMiddleware);

const MatchIdParam = z.object({ matchId: z.string().min(1) });
const MsgIdParam = z.object({ id: z.string().min(1) });

const SendMessageSchema = z.object({
  messageType: z.enum(['TEXT', 'VOICE', 'IMAGE', 'FILE', 'SYSTEM']).default('TEXT'),
  content: z.string().max(5000).optional(),
  mediaUrl: z.string().url().optional(),
}).refine((d) => d.content || d.mediaUrl, { message: 'Either content or mediaUrl is required' });

router.get('/conversations', MessageController.getConversations);
router.get('/:matchId', validateParams(MatchIdParam), MessageController.getMessages);
router.post('/:matchId', messageRateLimit, validateParams(MatchIdParam), validateBody(SendMessageSchema), MessageController.sendMessage);
router.delete('/:id', validateParams(MsgIdParam), MessageController.deleteMessage);

export default router;
