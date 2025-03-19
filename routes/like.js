import express from 'express';
import { addLike, removeLike } from '../controllers/like.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { getUserLikes } from '../controllers/like.js';

const router = express.Router();

// CREATE
router.post('/post', authenticate, addLike);

// READ
router.get("/user/:userId", getUserLikes);

// DELETE
router.delete('/post', authenticate, removeLike);

export default router;