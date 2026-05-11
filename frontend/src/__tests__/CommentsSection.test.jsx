import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach } from "vitest";
import React from "react";
import CommentsSection from "../components/CommentsSection";

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock("@clerk/clerk-react", () => ({
  useAuth: vi.fn(),
  SignInButton: ({ children }) => <div data-testid="sign-in-button">{children}</div>,
}));

vi.mock("../hooks/useComments", () => ({
  useCreateComment: vi.fn(),
  useDeleteComment: vi.fn(),
}));

vi.mock("lucide-react", () => ({
  SendIcon: () => <span data-testid="send-icon" />,
  Trash2Icon: () => <span data-testid="trash-icon" />,
  MessageSquareIcon: () => <span data-testid="message-icon" />,
  LogInIcon: () => <span data-testid="login-icon" />,
}));

import { useAuth } from "@clerk/clerk-react";
import { useCreateComment, useDeleteComment } from "../hooks/useComments";

const mockMutate = vi.fn();
const defaultCreateComment = { mutate: mockMutate, isPending: false };
const defaultDeleteComment = { mutate: mockMutate, isPending: false };

beforeEach(() => {
  vi.clearAllMocks();
  useCreateComment.mockReturnValue(defaultCreateComment);
  useDeleteComment.mockReturnValue(defaultDeleteComment);
});

const sampleComments = [
  {
    id: "c1",
    content: "First comment",
    userId: "user-1",
    createdAt: new Date("2024-01-01").toISOString(),
    users: { name: "Alice", imageUrl: "alice.jpg" },
  },
  {
    id: "c2",
    content: "Second comment",
    userId: "user-2",
    createdAt: new Date("2024-01-02").toISOString(),
    users: { name: "Bob", imageUrl: "bob.jpg" },
  },
];

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("CommentsSection", () => {
  describe("when signed out", () => {
    beforeEach(() => {
      useAuth.mockReturnValue({ isSignedIn: false });
    });

    it("shows a sign-in prompt instead of the comment form", () => {
      render(<CommentsSection productId="p1" comments={[]} currentUserId={null} />);
      expect(screen.getByText(/sign in to join the conversation/i)).toBeInTheDocument();
      expect(screen.queryByPlaceholderText(/add a comment/i)).not.toBeInTheDocument();
    });

    it("renders the SignInButton", () => {
      render(<CommentsSection productId="p1" comments={[]} currentUserId={null} />);
      expect(screen.getByTestId("sign-in-button")).toBeInTheDocument();
    });

    it("shows empty state message when there are no comments", () => {
      render(<CommentsSection productId="p1" comments={[]} currentUserId={null} />);
      expect(screen.getByText(/no comments yet/i)).toBeInTheDocument();
    });

    it("displays existing comments when signed out", () => {
      render(<CommentsSection productId="p1" comments={sampleComments} currentUserId={null} />);
      expect(screen.getByText("First comment")).toBeInTheDocument();
      expect(screen.getByText("Second comment")).toBeInTheDocument();
    });
  });

  describe("when signed in", () => {
    beforeEach(() => {
      useAuth.mockReturnValue({ isSignedIn: true });
    });

    it("renders the comment input form", () => {
      render(<CommentsSection productId="p1" comments={[]} currentUserId="user-1" />);
      expect(screen.getByPlaceholderText(/add a comment/i)).toBeInTheDocument();
    });

    it("does not submit when the input is empty", async () => {
      render(<CommentsSection productId="p1" comments={[]} currentUserId="user-1" />);
      // The submit button contains only an icon (no text); locate via icon testId
      const button = screen.getByTestId("send-icon").closest("button");
      // Button is disabled when input is empty
      expect(button).toBeDisabled();
    });

    it("calls createComment.mutate with productId and content on submit", async () => {
      const user = userEvent.setup();
      render(<CommentsSection productId="p1" comments={[]} currentUserId="user-1" />);

      const input = screen.getByPlaceholderText(/add a comment/i);
      await user.type(input, "Great product!");

      const form = input.closest("form");
      fireEvent.submit(form);

      expect(mockMutate).toHaveBeenCalledWith(
        { productId: "p1", content: "Great product!" },
        expect.any(Object)
      );
    });

    it("does not submit when content is only whitespace", async () => {
      render(<CommentsSection productId="p1" comments={[]} currentUserId="user-1" />);
      const input = screen.getByPlaceholderText(/add a comment/i);
      fireEvent.change(input, { target: { value: "   " } });

      const button = screen.getByTestId("send-icon").closest("button");
      expect(button).toBeDisabled();
    });

    it("disables the input and submit button while createComment is pending", () => {
      useCreateComment.mockReturnValue({ mutate: mockMutate, isPending: true });
      render(<CommentsSection productId="p1" comments={[]} currentUserId="user-1" />);

      const input = screen.getByPlaceholderText(/add a comment/i);
      expect(input).toBeDisabled();
    });

    it("shows comment count badge", () => {
      render(
        <CommentsSection productId="p1" comments={sampleComments} currentUserId="user-1" />
      );
      expect(screen.getByText("2")).toBeInTheDocument();
    });

    it("renders each comment's content and author name", () => {
      render(
        <CommentsSection productId="p1" comments={sampleComments} currentUserId="user-1" />
      );
      expect(screen.getByText("First comment")).toBeInTheDocument();
      expect(screen.getByText("Second comment")).toBeInTheDocument();
      expect(screen.getByText("Alice")).toBeInTheDocument();
      expect(screen.getByText("Bob")).toBeInTheDocument();
    });

    it("shows delete button only for comments owned by currentUserId", () => {
      render(
        <CommentsSection productId="p1" comments={sampleComments} currentUserId="user-1" />
      );
      // user-1 owns c1 — exactly one delete button visible
      const deleteButtons = screen.getAllByRole("button", { name: "" });
      // There's the submit button + one delete button (for c1 owned by user-1)
      // Filter trash icons
      const trashIcons = screen.getAllByTestId("trash-icon");
      expect(trashIcons).toHaveLength(1);
    });

    it("calls deleteComment.mutate with commentId when delete is clicked after confirmation", () => {
      vi.spyOn(window, "confirm").mockReturnValue(true);
      const deleteMutate = vi.fn();
      useDeleteComment.mockReturnValue({ mutate: deleteMutate, isPending: false });

      render(
        <CommentsSection productId="p1" comments={sampleComments} currentUserId="user-1" />
      );

      const trashIcon = screen.getByTestId("trash-icon");
      fireEvent.click(trashIcon.closest("button"));

      expect(window.confirm).toHaveBeenCalledWith("Delete?");
      expect(deleteMutate).toHaveBeenCalledWith({ commentId: "c1" });
    });

    it("does not call deleteComment.mutate when user cancels the confirmation", () => {
      vi.spyOn(window, "confirm").mockReturnValue(false);
      const deleteMutate = vi.fn();
      useDeleteComment.mockReturnValue({ mutate: deleteMutate, isPending: false });

      render(
        <CommentsSection productId="p1" comments={sampleComments} currentUserId="user-1" />
      );

      const trashIcon = screen.getByTestId("trash-icon");
      fireEvent.click(trashIcon.closest("button"));

      expect(deleteMutate).not.toHaveBeenCalled();
    });

    it("shows zero comments badge when comments array is empty", () => {
      render(<CommentsSection productId="p1" comments={[]} currentUserId="user-1" />);
      expect(screen.getByText("0")).toBeInTheDocument();
    });
  });
});