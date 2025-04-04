import express from "express"
import { createNotification, getUserNotifications } from "../controllers/notification.js";

const router = express.Router();

// CREATE
// router.post("/topics/:topicName", subsribeTo);


// READ
router.get("/user", getUserNotifications);

export default router;