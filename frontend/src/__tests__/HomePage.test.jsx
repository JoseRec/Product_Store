import { render, screen } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import React from "react";
import HomePage from "../pages/HomePage";

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock("@clerk/clerk-react", () => ({
  SignInButton: ({ children, mode }) => (
    <div data-testid="sign-in-button" data-mode={mode}>
      {children}
    </div>
  ),
}));

vi.mock("../hooks/useProducts", () => ({
  useProducts: vi.fn(),
}));

vi.mock("../components/LoadingSpinner", () => ({
  default: () => <div data-testid="loading-spinner" />,
}));

vi.mock("../components/ProductCard", () => ({
  default: ({ product }) => <div data-testid="product-card">{product.title}</div>,
}));

vi.mock("react-router", () => ({
  Link: ({ to, children, className }) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
}));

vi.mock("lucide-react", () => ({
  PackageIcon: () => <span />,
  SparklesIcon: () => <span />,
}));

import { useProducts } from "../hooks/useProducts";

const fakeProducts = [
  { id: "p1", title: "Widget A" },
  { id: "p2", title: "Widget B" },
];

beforeEach(() => {
  vi.clearAllMocks();
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("HomePage", () => {
  describe("SignInButton (new in this PR)", () => {
    it("renders the SignInButton in the hero section", () => {
      useProducts.mockReturnValue({ data: fakeProducts, isLoading: false, error: null });

      render(<HomePage />);

      expect(screen.getByTestId("sign-in-button")).toBeInTheDocument();
    });

    it("renders SignInButton in modal mode", () => {
      useProducts.mockReturnValue({ data: fakeProducts, isLoading: false, error: null });

      render(<HomePage />);

      expect(screen.getByTestId("sign-in-button")).toHaveAttribute("data-mode", "modal");
    });

    it("renders the 'Start Selling' call-to-action button inside SignInButton", () => {
      useProducts.mockReturnValue({ data: fakeProducts, isLoading: false, error: null });

      render(<HomePage />);

      expect(screen.getByText(/start selling/i)).toBeInTheDocument();
    });

    it("SignInButton is rendered even when the product list is empty", () => {
      useProducts.mockReturnValue({ data: [], isLoading: false, error: null });

      render(<HomePage />);

      expect(screen.getByTestId("sign-in-button")).toBeInTheDocument();
    });

    it("SignInButton is not rendered during the loading state (spinner takes over)", () => {
      useProducts.mockReturnValue({ data: null, isLoading: true, error: null });

      render(<HomePage />);

      // Component returns early with spinner, so hero section (and SignInButton) won't be rendered
      expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
      expect(screen.queryByTestId("sign-in-button")).not.toBeInTheDocument();
    });
  });
});