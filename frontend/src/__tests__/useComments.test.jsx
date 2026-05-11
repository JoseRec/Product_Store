import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi, describe, it, expect, beforeEach } from "vitest";
import React from "react";
import { useCreateComment, useDeleteComment } from "../hooks/useComments";

vi.mock("../lib/api", () => ({
  createComment: vi.fn(),
  deleteComment: vi.fn(),
}));

import { createComment, deleteComment } from "../lib/api";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("useCreateComment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls createComment API with correct arguments on mutate", async () => {
    const mockResult = { id: "c1", content: "hello", productId: "p1" };
    createComment.mockResolvedValue(mockResult);

    const { result } = renderHook(() => useCreateComment(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate({ productId: "p1", content: "hello" });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    // React Query v5 passes additional context as second arg; check first arg only
    expect(createComment.mock.calls[0][0]).toEqual({ productId: "p1", content: "hello" });
  });

  it("is in pending state while the mutation is running", async () => {
    let resolve;
    createComment.mockReturnValue(new Promise((r) => { resolve = r; }));

    const { result } = renderHook(() => useCreateComment(), {
      wrapper: createWrapper(),
    });

    // Start mutation without awaiting so we can check pending state
    result.current.mutate({ productId: "p1", content: "test" });

    await waitFor(() => expect(result.current.isPending).toBe(true));

    await act(async () => {
      resolve({ id: "c1" });
    });
  });

  it("sets isError on API failure", async () => {
    createComment.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useCreateComment(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate({ productId: "p1", content: "hello" });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it("invalidates the product query on success", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    createComment.mockResolvedValue({ id: "c1" });

    const wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useCreateComment(), { wrapper });

    await act(async () => {
      result.current.mutate({ productId: "prod-42", content: "nice" });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["products", "prod-42"] })
    );
  });
});

describe("useDeleteComment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls deleteComment API with commentId on mutate", async () => {
    const mockResult = { id: "c1" };
    deleteComment.mockResolvedValue(mockResult);

    const { result } = renderHook(() => useDeleteComment("p1"), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate({ commentId: "c1" });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    // React Query v5 passes additional context as second arg; check first arg only
    expect(deleteComment.mock.calls[0][0]).toEqual({ commentId: "c1" });
  });

  it("sets isError when the delete API call fails", async () => {
    deleteComment.mockRejectedValue(new Error("Server error"));

    const { result } = renderHook(() => useDeleteComment("p1"), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate({ commentId: "c1" });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it("invalidates the product query for the given productId on success", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    deleteComment.mockResolvedValue({ id: "c1" });

    const wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useDeleteComment("prod-99"), { wrapper });

    await act(async () => {
      result.current.mutate({ commentId: "c1" });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["products", "prod-99"] })
    );
  });

  it("uses the productId passed to useDeleteComment (not the mutate argument)", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    deleteComment.mockResolvedValue({ id: "c1" });

    const wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useDeleteComment("hook-level-product"), { wrapper });

    await act(async () => {
      result.current.mutate({ commentId: "c1" });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["products", "hook-level-product"] })
    );
  });
});