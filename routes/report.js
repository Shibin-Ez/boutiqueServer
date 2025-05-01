import express from 'express';
import { createReport, getReportsForPost } from '../controllers/report.js';

const router = express.Router();

// CREATE
router.post("/post/", createReport);

// READ
router.get("/post/:postId", getReportsForPost);

export default router;