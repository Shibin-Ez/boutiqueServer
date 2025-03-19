import express from 'express';
import { addComment, getComments } from '../controllers/comment.js';

const router = express.Router();

// CREATE
router.post("/post/:userId", addComment);

// READ
router.get("/post/:postId", getComments);

export default router;