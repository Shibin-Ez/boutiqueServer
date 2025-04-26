import express from "express"
import { createNotification, getUserNotifications, subscribeToTopics } from "../controllers/notification.js";

const router = express.Router();

// CREATE
router.post("/user/:userId", subscribeToTopics);


// READ
router.get("/user", getUserNotifications);

export default router;