import express from "express";
import { createFollow, getFollowers, getFollowings } from "../controllers/follow.js";

const router = express.Router();

// CREATE
router.post("/shop/:shopId", createFollow);

// READ
router.get("/shop/:shopId", getFollowers);
router.get("/user/:userId", getFollowings);

export default router;