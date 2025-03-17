import express from 'express';
import { addLike, removeLike } from '../controllers/like.js';
import { authenticate } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/post', authenticate, addLike);
router.delete('/post', authenticate, removeLike);

export default router;