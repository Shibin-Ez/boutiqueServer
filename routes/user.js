import express from "express";
import { checkPhoneNoExists, getUserFeed } from "../controllers/user.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/user/feed", authenticate, getUserFeed);
router.get("/phone", checkPhoneNoExists);

export default router;