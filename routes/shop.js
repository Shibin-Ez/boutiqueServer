import express from "express";
import { createShop, getShopDetails, getShops, getShopsNearby } from "../controllers/shop.js";

const router = express.Router();

// CREATE
// router.post("/", createShop);

// READ
router.get("/", getShops);
router.get("/shop/:id", getShopDetails);
router.get("/nearby", getShopsNearby);

export default router;
