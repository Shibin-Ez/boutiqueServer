import express from "express"
import { getChatUserList } from "../controllers/chat.js";

const router = express.Router();

// READ
router.get("/users", getChatUserList);

export default router;