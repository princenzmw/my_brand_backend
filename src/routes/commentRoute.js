import express from 'express';
import { createComment, fetchComments, updateComment, deleteComment } from '../controllers/commentController.js';
import { auth } from '../middleware/userAuthMiddleware.js';

const router = express.Router();

router.post('/create', auth, createComment);
router.get('/:blogId', fetchComments);
router.put('/update/:id', auth, updateComment);
router.delete('/delete/:id', auth, deleteComment);

export default router;
