import express from "express";
import { deletePost, getFile, getPost, getPostsByReports, getPostsFromShop, getThumbnail } from "../controllers/post.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = express.Router();

// CREATE
// create post is file with Routs - index.js

// READ
router.get("/", getPostsByReports);
router.get("/post/:id", getPost);
router.get("/shop/:shopId", getPostsFromShop);
router.get("/file/:filename", getFile);
router.get("/thumbnail/:filename", getThumbnail);

// DELETE
router.delete("/post/:id", authenticate, deletePost);

export default router;