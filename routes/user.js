import express from "express";
import { getUserFeed } from "../controllers/user.js";

const router = express.Router();

router.get("/user/:id/feed", getUserFeed);

export default router;