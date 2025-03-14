import express from 'express';
import { addLike, removeLike } from '../controllers/like.js';

const router = express.Router();

router.post('/post', addLike);
router .delete('/post', removeLike);

export default router;