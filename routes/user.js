import express from "express";
import { checkPhoneNoExists, deleteUser, getUserById, getUserFeed, getUsers, verifyUser } from "../controllers/user.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = express.Router();

// CREATE
router.post("/phone", checkPhoneNoExists);

// READ
router.get("/", getUsers);
router.get("/user/details/:id", getUserById);
router.get("/user/feed", authenticate, getUserFeed);
router.get("/user/verify", authenticate, verifyUser);

// DELETE
router.delete("/user", authenticate, deleteUser);


export default router;