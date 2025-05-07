import express from "express";
import { getDashboardStats } from "../controllers/admin.js";

const router = express.Router();

// READ
router.get("/stats", getDashboardStats);

export default router;