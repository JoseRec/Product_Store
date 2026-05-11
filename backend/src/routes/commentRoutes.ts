import { Router } from "express";
import * as commentController from "../controllers/commentController";
import { requireAuth } from "@clerk/express";

const router = Router();
router.post("/:productId", requireAuth(), commentController.createComment);
router.delete("/:id", requireAuth(), commentController.deleteComment);
export default router;
