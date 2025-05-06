import express from "express";
import { checkPhoneNoExists, getUserFeed } from "../controllers/user.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = express.Router();

// CREATE
router.post("/phone", checkPhoneNoExists);

// READ
router.get("/user/feed", authenticate, getUserFeed);


export default router;