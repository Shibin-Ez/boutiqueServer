import express from "express";
import { createShop, deleteShop, getShopDetails, getShops, getShopsNearby } from "../controllers/shop.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = express.Router();

// CREATE
// router.post("/", createShop);

// READ
router.get("/", getShops);
router.get("/shop/:id", getShopDetails);
router.get("/nearby", getShopsNearby);

// DELETE
router.delete("/shop", authenticate, deleteShop);

export default router;
