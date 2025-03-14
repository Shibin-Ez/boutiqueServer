import express from "express";
import { getUserFeed } from "../controllers/user.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/user/feed", authenticate, getUserFeed);

export default router;