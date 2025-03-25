import express from "express"
import { createNotification, getUserNotifications } from "../controllers/notification.js";

const router = express.Router();

// CREATE
router.post("/", createNotification);

// READ
router.get("/user", getUserNotifications);

export default router;