import { Router } from "express";
import { getAllPost, createPost } from "../controler/post.controler.js";
import { verifyToken } from "../midelware/verify.midelware.js";
const router = Router();
// GET /api/posts - Get all posts
router.get("/", getAllPost);
// POST /api/posts - Create new post (requires authentication)
router.post("/", verifyToken, createPost);
// Additional routes can be added here for:
// - GET /api/posts/:id - Get specific post
// - PUT /api/posts/:id - Update post
// - DELETE /api/posts/:id - Delete post
// - GET /api/posts/ngo/:ngoId - Get posts by NGO
export default router;
//# sourceMappingURL=post.routes.js.map