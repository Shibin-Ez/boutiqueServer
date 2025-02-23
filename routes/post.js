import express from "express";
import { getPost, getPostsFromShop } from "../controllers/post.js";

const router = express.Router();

// CREATE
// create post is file with Routs - index.js

// READ
router.get("/post/:id", getPost);
router.get("/shop/:shopId", getPostsFromShop);

export default router;