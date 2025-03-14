import express from 'express';
import { addComment, getComments } from '../controllers/comment';

const router = express.Router();

// CREATE
router.post("/post", addComment);

// READ
router.get("/post/:id", getComments);

export default router;