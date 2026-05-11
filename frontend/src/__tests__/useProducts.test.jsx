import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi, describe, it, expect, beforeEach } from "vitest";
import React from "react";
import { useProduct, useDeleteProduct, useMyProducts } from "../hooks/useProducts";

vi.mock("../lib/api", () => ({
  getAllProducts: vi.fn(),
  createProduct: vi.fn(),
  getProductById: vi.fn(),
  deleteProduct: vi.fn(),
  getMyProducts: vi.fn(),
}));

import { getProductById, deleteProduct, getMyProducts } from "../lib/api";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

// ─── useProduct ───────────────────────────────────────────────────────────────

describe("useProduct", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches a product by id and returns data on success", async () => {
    const fakeProduct = { id: "p1", title: "Widget", description: "Nice", imageUrl: "img.jpg" };
    getProductById.mockResolvedValue(fakeProduct);

    const { result } = renderHook(() => useProduct("p1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getProductById).toHaveBeenCalledWith("p1");
    expect(result.current.data).toEqual(fakeProduct);
  });

  it("uses queryKey ['products', id]", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    getProductById.mockResolvedValue({ id: "p1" });

    const wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    renderHook(() => useProduct("p1"), { wrapper });

    await waitFor(() =>
      expect(queryClient.getQueryState(["products", "p1"])?.status).toBe("success")
    );
  });

  it("is disabled when id is falsy and does not call getProductById", async () => {
    const { result } = renderHook(() => useProduct(null), {
      wrapper: createWrapper(),
    });

    // fetchStatus should be 'idle' since enabled:false
    expect(result.current.fetchStatus).toBe("idle");
    expect(getProductById).not.toHaveBeenCalled();
  });

  it("is disabled when id is an empty string", async () => {
    const { result } = renderHook(() => useProduct(""), {
      wrapper: createWrapper(),
    });

    expect(result.current.fetchStatus).toBe("idle");
    expect(getProductById).not.toHaveBeenCalled();
  });

  it("sets isError when the API call fails", async () => {
    getProductById.mockRejectedValue(new Error("Not found"));

    const { result } = renderHook(() => useProduct("bad-id"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

// ─── useDeleteProduct ─────────────────────────────────────────────────────────

describe("useDeleteProduct", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls deleteProduct API with the product id", async () => {
    deleteProduct.mockResolvedValue({ id: "p1" });

    const { result } = renderHook(() => useDeleteProduct(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate("p1");
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    // React Query v5 passes additional context as second arg; check first arg only
    expect(deleteProduct.mock.calls[0][0]).toBe("p1");
  });

  it("invalidates my-products query on success", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    deleteProduct.mockResolvedValue({ id: "p1" });

    const wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useDeleteProduct(), { wrapper });

    await act(async () => {
      result.current.mutate("p1");
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["my-products"] })
    );
  });

  it("sets isError when deleteProduct API fails", async () => {
    deleteProduct.mockRejectedValue(new Error("Server error"));

    const { result } = renderHook(() => useDeleteProduct(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate("p1");
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

// ─── useMyProducts ────────────────────────────────────────────────────────────

describe("useMyProducts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls getMyProducts and returns the data on success", async () => {
    const fakeProducts = [
      { id: "p1", title: "Widget" },
      { id: "p2", title: "Gadget" },
    ];
    getMyProducts.mockResolvedValue(fakeProducts);

    const { result } = renderHook(() => useMyProducts(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getMyProducts).toHaveBeenCalledTimes(1);
    expect(result.current.data).toEqual(fakeProducts);
  });

  it("uses queryKey ['my-products']", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    getMyProducts.mockResolvedValue([]);

    const wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    renderHook(() => useMyProducts(), { wrapper });

    await waitFor(() =>
      expect(queryClient.getQueryState(["my-products"])?.status).toBe("success")
    );
  });

  it("sets isError when getMyProducts fails", async () => {
    getMyProducts.mockRejectedValue(new Error("Unauthorized"));

    const { result } = renderHook(() => useMyProducts(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it("returns an empty array when the user has no products", async () => {
    getMyProducts.mockResolvedValue([]);

    const { result } = renderHook(() => useMyProducts(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });
});