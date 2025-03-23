import express from "express";
import { createFollow, deleteFollow, getFollowers, getFollowings } from "../controllers/follow.js";

const router = express.Router();

// CREATE
router.post("/shop/:shopId", createFollow);

// READ
router.get("/shop/:shopId", getFollowers);
router.get("/user/:userId", getFollowings);

// DELETE
router.delete("/shop/:shopId/:userId", deleteFollow);

export default router;