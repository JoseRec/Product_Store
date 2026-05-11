import type { Request, Response } from "express";
import { createComment, deleteComment } from "../controllers/commentController";

// Mock the db queries module
jest.mock("../db/queries", () => ({
  getProductById: jest.fn(),
  createComment: jest.fn(),
  getCommentById: jest.fn(),
  deleteComment: jest.fn(),
}));

// Mock Clerk auth
jest.mock("@clerk/express", () => ({
  getAuth: jest.fn(),
}));

import * as queries from "../db/queries";
import { getAuth } from "@clerk/express";

const mockGetAuth = getAuth as jest.MockedFunction<typeof getAuth>;
const mockGetProductById = queries.getProductById as jest.MockedFunction<typeof queries.getProductById>;
const mockCreateComment = queries.createComment as jest.MockedFunction<typeof queries.createComment>;
const mockGetCommentById = queries.getCommentById as jest.MockedFunction<typeof queries.getCommentById>;
const mockDeleteComment = queries.deleteComment as jest.MockedFunction<typeof queries.deleteComment>;

function buildRes(): Partial<Response> {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

function buildReq(overrides: Partial<Request> = {}): Partial<Request> {
  return {
    params: {},
    body: {},
    ...overrides,
  };
}

describe("commentController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── createComment ───────────────────────────────────────────────────────────

  describe("createComment", () => {
    it("returns 401 when user is not authenticated", async () => {
      mockGetAuth.mockReturnValue({ userId: null } as any);
      const req = buildReq({ params: { productId: "prod-1" }, body: { content: "hello" } });
      const res = buildRes();

      await createComment(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: "Unauthorized" });
    });

    it("returns 400 when content is missing", async () => {
      mockGetAuth.mockReturnValue({ userId: "user-1" } as any);
      const req = buildReq({ params: { productId: "prod-1" }, body: {} });
      const res = buildRes();

      await createComment(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Comment content is required" });
    });

    it("returns 400 when content is an empty string", async () => {
      mockGetAuth.mockReturnValue({ userId: "user-1" } as any);
      const req = buildReq({ params: { productId: "prod-1" }, body: { content: "" } });
      const res = buildRes();

      await createComment(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Comment content is required" });
    });

    it("returns 404 when product does not exist", async () => {
      mockGetAuth.mockReturnValue({ userId: "user-1" } as any);
      mockGetProductById.mockResolvedValue(undefined as any);
      const req = buildReq({ params: { productId: "prod-missing" }, body: { content: "hello" } });
      const res = buildRes();

      await createComment(req as Request, res as Response);

      expect(mockGetProductById).toHaveBeenCalledWith("prod-missing");
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "Product not found" });
    });

    it("creates a comment and returns 201 on success", async () => {
      const fakeProduct = { id: "prod-1", title: "Widget" };
      const fakeComment = { id: "comment-1", content: "hello", userId: "user-1", productId: "prod-1" };
      mockGetAuth.mockReturnValue({ userId: "user-1" } as any);
      mockGetProductById.mockResolvedValue(fakeProduct as any);
      mockCreateComment.mockResolvedValue(fakeComment as any);

      const req = buildReq({ params: { productId: "prod-1" }, body: { content: "hello" } });
      const res = buildRes();

      await createComment(req as Request, res as Response);

      expect(mockCreateComment).toHaveBeenCalledWith({
        content: "hello",
        userId: "user-1",
        productId: "prod-1",
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(fakeComment);
    });

    it("returns 400 when an unexpected error is thrown", async () => {
      mockGetAuth.mockReturnValue({ userId: "user-1" } as any);
      mockGetProductById.mockRejectedValue(new Error("db failure"));

      const req = buildReq({ params: { productId: "prod-1" }, body: { content: "hello" } });
      const res = buildRes();

      await createComment(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Failed to create comment" });
    });
  });

  // ─── deleteComment ───────────────────────────────────────────────────────────

  describe("deleteComment", () => {
    it("returns 401 when user is not authenticated", async () => {
      mockGetAuth.mockReturnValue({ userId: null } as any);
      const req = buildReq({ params: { id: "comment-1" } });
      const res = buildRes();

      await deleteComment(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: "Unauthorized" });
    });

    it("returns 404 when comment does not exist", async () => {
      mockGetAuth.mockReturnValue({ userId: "user-1" } as any);
      mockGetCommentById.mockResolvedValue(undefined as any);

      const req = buildReq({ params: { id: "comment-missing" } });
      const res = buildRes();

      await deleteComment(req as Request, res as Response);

      expect(mockGetCommentById).toHaveBeenCalledWith("comment-missing");
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "Comment not found" });
    });

    it("returns 403 when user does not own the comment", async () => {
      mockGetAuth.mockReturnValue({ userId: "user-1" } as any);
      mockGetCommentById.mockResolvedValue({ id: "comment-1", userId: "user-2", content: "hi" } as any);

      const req = buildReq({ params: { id: "comment-1" } });
      const res = buildRes();

      await deleteComment(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: "You can only delete your own comments" });
      expect(mockDeleteComment).not.toHaveBeenCalled();
    });

    it("deletes the comment and returns 200 on success", async () => {
      const fakeComment = { id: "comment-1", userId: "user-1", content: "hi" };
      mockGetAuth.mockReturnValue({ userId: "user-1" } as any);
      mockGetCommentById.mockResolvedValue(fakeComment as any);
      mockDeleteComment.mockResolvedValue(fakeComment as any);

      const req = buildReq({ params: { id: "comment-1" } });
      const res = buildRes();

      await deleteComment(req as Request, res as Response);

      expect(mockGetCommentById).toHaveBeenCalledWith("comment-1");
      expect(mockDeleteComment).toHaveBeenCalledWith("comment-1");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: "Comment deleted successfully" });
    });

    it("uses req.params.id (not commentId) to look up and delete the comment", async () => {
      // Regression: param was renamed from commentId to id in the PR diff
      const fakeComment = { id: "abc-123", userId: "user-1", content: "test" };
      mockGetAuth.mockReturnValue({ userId: "user-1" } as any);
      mockGetCommentById.mockResolvedValue(fakeComment as any);
      mockDeleteComment.mockResolvedValue(fakeComment as any);

      const req = buildReq({ params: { id: "abc-123" } });
      const res = buildRes();

      await deleteComment(req as Request, res as Response);

      expect(mockGetCommentById).toHaveBeenCalledWith("abc-123");
      expect(mockDeleteComment).toHaveBeenCalledWith("abc-123");
    });

    it("returns 500 when an unexpected error is thrown", async () => {
      mockGetAuth.mockReturnValue({ userId: "user-1" } as any);
      mockGetCommentById.mockRejectedValue(new Error("db failure"));

      const req = buildReq({ params: { id: "comment-1" } });
      const res = buildRes();

      await deleteComment(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Failed to delete comment" });
    });
  });
});