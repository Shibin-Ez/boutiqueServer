import express from "express";
import { checkPhoneNoExists, getUserById, getUserFeed, getUsers } from "../controllers/user.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = express.Router();

// CREATE
router.post("/phone", checkPhoneNoExists);

// READ
router.get("/", getUsers);
router.get("/user/:id", getUserById);
router.get("/user/feed", authenticate, getUserFeed);


export default router;