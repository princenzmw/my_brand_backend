import express from 'express';
import { createMessage, getMessages, deleteMessage } from '../controllers/messageController.js';
import { auth, admin } from '../middleware/userAuthMiddleware.js';

const router = express.Router();

router.post('/', auth, createMessage);
router.get('/', auth, admin, getMessages);
router.delete('/:id', auth, admin, deleteMessage);

export default router;
