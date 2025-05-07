import express from "express";
import { authenticate } from "../middlewares/authMiddleware.js";
import { createSalesman, getSalesmen } from "../controllers/salesman.js";

const router = express.Router();

// CREATE
router.post("/", authenticate, createSalesman);

// READ
router.get("/", authenticate, getSalesmen);

export default router;