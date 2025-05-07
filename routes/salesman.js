import express from "express";
import { authenticate } from "../middlewares/authMiddleware.js";
import { createSalesman, getSalesman, getSalesmen } from "../controllers/salesman.js";

const router = express.Router();

// CREATE
router.post("/", authenticate, createSalesman);

// READ
router.get("/", authenticate, getSalesmen);
router.get("/salesman/:id", authenticate, getSalesman);

export default router;