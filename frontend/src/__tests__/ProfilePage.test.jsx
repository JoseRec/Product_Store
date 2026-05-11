import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import React from "react";
import ProfilePage from "../pages/ProfilePage";

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock("react-router", () => ({
  Link: ({ to, children, className }) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
  useNavigate: vi.fn(),
}));

vi.mock("../hooks/useProducts", () => ({
  useMyProducts: vi.fn(),
  useDeleteProduct: vi.fn(),
}));

vi.mock("../components/LoadingSpinner", () => ({
  default: () => <div data-testid="loading-spinner" />,
}));

vi.mock("lucide-react", () => ({
  PlusIcon: () => <span />,
  PackageIcon: () => <span />,
  EyeIcon: () => <span />,
  EditIcon: () => <span />,
  Trash2Icon: () => <span />,
}));

import { useNavigate } from "react-router";
import { useMyProducts, useDeleteProduct } from "../hooks/useProducts";

const mockNavigate = vi.fn();
const mockMutate = vi.fn();

const fakeProducts = [
  {
    id: "p1",
    title: "Widget A",
    description: "First product",
    imageUrl: "a.jpg",
  },
  {
    id: "p2",
    title: "Widget B",
    description: "Second product",
    imageUrl: "b.jpg",
  },
];

beforeEach(() => {
  vi.clearAllMocks();
  useNavigate.mockReturnValue(mockNavigate);
  useMyProducts.mockReturnValue({ data: fakeProducts, isLoading: false });
  useDeleteProduct.mockReturnValue({ mutate: mockMutate, isPending: false });
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("ProfilePage", () => {
  describe("loading state", () => {
    it("shows the loading spinner while products are being fetched", () => {
      useMyProducts.mockReturnValue({ data: undefined, isLoading: true });

      render(<ProfilePage />);

      expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
    });
  });

  describe("empty state", () => {
    it("shows empty state message when user has no products", () => {
      useMyProducts.mockReturnValue({ data: [], isLoading: false });

      render(<ProfilePage />);

      expect(screen.getByText(/no products yet/i)).toBeInTheDocument();
    });

    it("shows a Create Product link in empty state", () => {
      useMyProducts.mockReturnValue({ data: [], isLoading: false });

      render(<ProfilePage />);

      expect(screen.getByText("Create Product")).toBeInTheDocument();
    });

    it("shows 0 in the total products stat when there are no products", () => {
      useMyProducts.mockReturnValue({ data: [], isLoading: false });

      render(<ProfilePage />);

      expect(screen.getByText("0")).toBeInTheDocument();
    });
  });

  describe("product listing", () => {
    it("renders all user products", () => {
      render(<ProfilePage />);
      expect(screen.getByText("Widget A")).toBeInTheDocument();
      expect(screen.getByText("Widget B")).toBeInTheDocument();
    });

    it("shows the correct total products count in the stat", () => {
      render(<ProfilePage />);
      expect(screen.getByText("2")).toBeInTheDocument();
    });

    it("renders product images with correct src", () => {
      render(<ProfilePage />);
      const imgs = screen.getAllByRole("img");
      const srcs = imgs.map((img) => img.getAttribute("src"));
      expect(srcs).toContain("a.jpg");
      expect(srcs).toContain("b.jpg");
    });

    it("shows View, Edit and Delete action buttons for each product", () => {
      render(<ProfilePage />);
      expect(screen.getAllByText(/view/i)).toHaveLength(2);
      expect(screen.getAllByText(/edit/i)).toHaveLength(2);
      expect(screen.getAllByText(/delete/i)).toHaveLength(2);
    });
  });

  describe("navigation", () => {
    it("navigates to the product detail page when View is clicked", () => {
      render(<ProfilePage />);
      const viewButtons = screen.getAllByText(/view/i);
      fireEvent.click(viewButtons[0]);

      expect(mockNavigate).toHaveBeenCalledWith("/product/p1");
    });

    it("navigates to the edit page when Edit is clicked", () => {
      render(<ProfilePage />);
      const editButtons = screen.getAllByText(/edit/i);
      fireEvent.click(editButtons[0]);

      expect(mockNavigate).toHaveBeenCalledWith("/edit/p1");
    });
  });

  describe("delete product", () => {
    it("calls deleteProduct.mutate with product id when user confirms deletion", () => {
      vi.spyOn(window, "confirm").mockReturnValue(true);
      render(<ProfilePage />);

      const deleteButtons = screen.getAllByText(/delete/i);
      fireEvent.click(deleteButtons[0]);

      expect(window.confirm).toHaveBeenCalledWith("Delete this product?");
      expect(mockMutate).toHaveBeenCalledWith("p1");
    });

    it("does not call deleteProduct.mutate when user cancels the confirmation", () => {
      vi.spyOn(window, "confirm").mockReturnValue(false);
      render(<ProfilePage />);

      const deleteButtons = screen.getAllByText(/delete/i);
      fireEvent.click(deleteButtons[0]);

      expect(mockMutate).not.toHaveBeenCalled();
    });

    it("disables delete buttons while deletion is pending", () => {
      useDeleteProduct.mockReturnValue({ mutate: mockMutate, isPending: true });
      render(<ProfilePage />);

      const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
      deleteButtons.forEach((btn) => expect(btn).toBeDisabled());
    });
  });

  describe("header", () => {
    it("renders the 'My Products' heading", () => {
      render(<ProfilePage />);
      expect(screen.getByText("My Products")).toBeInTheDocument();
    });

    it("renders a New product link pointing to /create", () => {
      render(<ProfilePage />);
      const newLink = screen.getByText("New").closest("a");
      expect(newLink).toHaveAttribute("href", "/create");
    });
  });
});