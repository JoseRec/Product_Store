import { useState } from "react";
import { useAuth, SignInButton } from "@clerk/clerk-react";
import { useCreateComment, useDeleteComment } from "../hooks/useComments";
import { SendIcon, Trash2Icon, MessageSquareIcon, LogInIcon } from "lucide-react";


/**
 * Render a comments UI for a product, including a creation form for signed-in users and per-user deletion controls.
 *
 * Displays a header with the total count, an input form when the user is signed in, or a sign-in prompt otherwise.
 * Shows an empty-state message when there are no comments and maps each comment to a chat-style entry with avatar,
 * author name, creation date, and content. If `currentUserId` matches a comment's `userId`, a delete button is shown
 * that asks for confirmation before invoking the delete action. The creation input is cleared only after a successful create.
 *
 * @param {Object} props
 * @param {string|number} props.productId - Identifier of the product whose comments are shown and to which new comments are attached.
 * @param {Array<Object>} [props.comments=[]] - List of comment objects to render. Each comment is expected to include `id`, `userId`, `content`, `createdAt`, and an optional `users` object with `name` and `imageUrl`.
 * @param {string|number} [props.currentUserId] - Identifier of the current user; used to determine whether the delete control is shown for each comment.
 * @returns {JSX.Element} The comments section UI.
 */
function CommentsSection({ productId, comments = [], currentUserId }) {

  const { isSignedIn } = useAuth();
  const [content, setContent] = useState("");
  const createComment = useCreateComment();
  const deleteComment = useDeleteComment(productId);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    createComment.mutate({ productId, content }, { onSuccess: () => setContent("") });
  };


   return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageSquareIcon className="size-5 text-primary" />
        <h3 className="font-bold">Comments</h3>
        <span className="badge badge-neutral badge-sm">{comments.length}</span>
      </div>

      {isSignedIn ? (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            placeholder="Add a comment..."
            className="input input-bordered input-sm flex-1 bg-base-200"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={createComment.isPending}
          />
          <button
            type="submit"
            className="btn btn-primary btn-sm btn-square"
            disabled={createComment.isPending || !content.trim()}
          >
            {createComment.isPending ? (
              <span className="loading loading-spinner loading-xs" />
            ) : (
              <SendIcon className="size-4" />
            )}
          </button>
        </form>
      ) : (
        <div className="flex items-center justify-between bg-base-200 rounded-lg p-3">
          <span className="text-sm text-base-content/60">Sign in to join the conversation</span>
          <SignInButton mode="modal">
            <button className="btn btn-primary btn-sm gap-1">
              <LogInIcon className="size-4" />
              Sign In
            </button>
          </SignInButton>
        </div>
      )}

      <div className="space-y-2 max-h-80 overflow-y-auto">
        {comments.length === 0 ? (
          <div className="text-center py-8 text-base-content/50">
            <MessageSquareIcon className="size-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No comments yet. Be first!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="chat chat-start">
              <div className="chat-image avatar">
                <div className="w-8 rounded-full">
                  <img src={comment.users?.imageUrl} alt={comment.users?.name} />
                </div>
              </div>

              <div className="chat-header text-xs opacity-70 mb-2">
                {comment.users?.name}
                <time className="ml-2 text-xs opacity-50">
                  {new Date(comment.createdAt).toLocaleDateString()}
                </time>
              </div>

              <div className="chat-bubble chat-bubble-neutral text-sm">{comment.content}</div>

              {currentUserId === comment.userId && (
                <div className="chat-footer">
                  <button
                    onClick={() =>
                      confirm("Delete?") && deleteComment.mutate({ commentId: comment.id })
                    }
                    className="btn btn-ghost btn-xs text-error"
                    disabled={deleteComment.isPending}
                  >
                    {deleteComment.isPending ? (
                      <span className="loading loading-spinner loading-xs" />
                    ) : (
                      <Trash2Icon className="size-3" />
                    )}
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default CommentsSection