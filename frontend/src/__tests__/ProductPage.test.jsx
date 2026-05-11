import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import React from "react";
import ProductPage from "../pages/ProductPage";

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock("react-router", () => ({
  useParams: vi.fn(),
  Link: ({ to, children, className }) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
  useNavigate: vi.fn(),
}));

vi.mock("@clerk/clerk-react", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../hooks/useProducts", () => ({
  useProduct: vi.fn(),
  useDeleteProduct: vi.fn(),
}));

vi.mock("../components/LoadingSpinner", () => ({
  default: () => <div data-testid="loading-spinner" />,
}));

vi.mock("../components/CommentsSection", () => ({
  default: ({ productId, comments, currentUserId }) => (
    <div
      data-testid="comments-section"
      data-product-id={productId}
      data-comment-count={comments?.length}
      data-user-id={currentUserId}
    />
  ),
}));

vi.mock("lucide-react", () => ({
  ArrowLeftIcon: () => <span />,
  EditIcon: () => <span />,
  Trash2Icon: () => <span data-testid="trash-icon" />,
  CalendarIcon: () => <span />,
  UserIcon: () => <span />,
}));

import { useParams, useNavigate } from "react-router";
import { useAuth } from "@clerk/clerk-react";
import { useProduct, useDeleteProduct } from "../hooks/useProducts";

const mockNavigate = vi.fn();
const mockMutate = vi.fn();

const fakeProduct = {
  id: "prod-1",
  title: "My Widget",
  description: "A great widget",
  imageUrl: "widget.jpg",
  userId: "user-1",
  createdAt: new Date("2024-06-01").toISOString(),
  users: { name: "Alice", imageUrl: "alice.jpg" },
  comments: [
    {
      id: "c1",
      content: "Nice!",
      userId: "user-2",
      createdAt: new Date("2024-06-02").toISOString(),
      users: { name: "Bob", imageUrl: "bob.jpg" },
    },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
  useParams.mockReturnValue({ id: "prod-1" });
  useNavigate.mockReturnValue(mockNavigate);
  useAuth.mockReturnValue({ userId: "user-1" });
  useProduct.mockReturnValue({ data: fakeProduct, isLoading: false, error: null });
  useDeleteProduct.mockReturnValue({ mutate: mockMutate, isPending: false });
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("ProductPage", () => {
  describe("loading state", () => {
    it("shows the loading spinner while data is being fetched", () => {
      useProduct.mockReturnValue({ data: null, isLoading: true, error: null });

      render(<ProductPage />);

      expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
    });
  });

  describe("error state", () => {
    it("shows 'Product not found' when there is an error", () => {
      useProduct.mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error("Not found"),
      });

      render(<ProductPage />);

      expect(screen.getByText(/product not found/i)).toBeInTheDocument();
    });

    it("shows 'Product not found' when product is null without an error object", () => {
      useProduct.mockReturnValue({ data: null, isLoading: false, error: null });

      render(<ProductPage />);

      expect(screen.getByText(/product not found/i)).toBeInTheDocument();
    });

    it("provides a Go Home link in error state", () => {
      useProduct.mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error("Not found"),
      });

      render(<ProductPage />);

      expect(screen.getByText(/go home/i)).toBeInTheDocument();
    });
  });

  describe("product display", () => {
    it("renders the product title", () => {
      render(<ProductPage />);
      expect(screen.getByText("My Widget")).toBeInTheDocument();
    });

    it("renders the product description", () => {
      render(<ProductPage />);
      expect(screen.getByText("A great widget")).toBeInTheDocument();
    });

    it("renders the creator's name", () => {
      render(<ProductPage />);
      expect(screen.getAllByText("Alice").length).toBeGreaterThan(0);
    });

    it("renders the product image with correct src and alt", () => {
      render(<ProductPage />);
      const img = screen.getByAltText("My Widget");
      expect(img).toHaveAttribute("src", "widget.jpg");
    });

    it("passes comments to CommentsSection", () => {
      render(<ProductPage />);
      const section = screen.getByTestId("comments-section");
      expect(section).toHaveAttribute("data-comment-count", "1");
    });

    it("passes correct productId to CommentsSection", () => {
      render(<ProductPage />);
      const section = screen.getByTestId("comments-section");
      expect(section).toHaveAttribute("data-product-id", "prod-1");
    });

    it("passes currentUserId to CommentsSection", () => {
      render(<ProductPage />);
      const section = screen.getByTestId("comments-section");
      expect(section).toHaveAttribute("data-user-id", "user-1");
    });
  });

  describe("owner controls", () => {
    it("shows Edit and Delete buttons when the current user owns the product", () => {
      render(<ProductPage />);
      expect(screen.getByText(/edit/i)).toBeInTheDocument();
      expect(screen.getByText(/delete/i)).toBeInTheDocument();
    });

    it("hides Edit and Delete buttons when the current user does not own the product", () => {
      useAuth.mockReturnValue({ userId: "other-user" });
      render(<ProductPage />);
      expect(screen.queryByText(/edit/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/delete/i)).not.toBeInTheDocument();
    });

    it("calls deleteProduct.mutate with product id when user confirms deletion", () => {
      vi.spyOn(window, "confirm").mockReturnValue(true);
      render(<ProductPage />);

      const deleteButton = screen.getByRole("button", { name: /delete/i });
      fireEvent.click(deleteButton);

      expect(window.confirm).toHaveBeenCalledWith("Delete this product permanently?");
      expect(mockMutate).toHaveBeenCalledWith("prod-1", expect.any(Object));
    });

    it("does not call deleteProduct.mutate when user cancels the confirmation dialog", () => {
      vi.spyOn(window, "confirm").mockReturnValue(false);
      render(<ProductPage />);

      const deleteButton = screen.getByRole("button", { name: /delete/i });
      fireEvent.click(deleteButton);

      expect(mockMutate).not.toHaveBeenCalled();
    });

    it("disables the Delete button while deletion is pending", () => {
      useDeleteProduct.mockReturnValue({ mutate: mockMutate, isPending: true });
      render(<ProductPage />);

      const deleteButton = screen.getByRole("button", { name: /delete/i });
      expect(deleteButton).toBeDisabled();
    });

    it("navigates to home after successful deletion", () => {
      vi.spyOn(window, "confirm").mockReturnValue(true);
      // Simulate onSuccess callback being invoked
      useDeleteProduct.mockReturnValue({
        mutate: vi.fn((_id, callbacks) => callbacks?.onSuccess?.()),
        isPending: false,
      });

      render(<ProductPage />);
      const deleteButton = screen.getByRole("button", { name: /delete/i });
      fireEvent.click(deleteButton);

      expect(mockNavigate).toHaveBeenCalledWith("/");
    });
  });
});