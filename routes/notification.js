import express from "express"
import { createNotification, getUserNotifications, subscribeToTopics, unsubscribeFromTopics } from "../controllers/notification.js";

const router = express.Router();

// CREATE
router.post("/subscribe/user/:userId", subscribeToTopics);
router.post("/unsubscribe/user/:userId", unsubscribeFromTopics);

// READ
router.get("/user", getUserNotifications);

export default router;