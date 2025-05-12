import express from "express"
import { createNotification, getNotifications, getUserNotifications, subscribeToTopics, unsubscribeFromTopics } from "../controllers/notification.js";

const router = express.Router();

// CREATE
router.post("/subscribe/user/:userId", subscribeToTopics);
router.post("/unsubscribe/user/:userId", unsubscribeFromTopics);

// READ
router.get("/user", getNotifications);

export default router;