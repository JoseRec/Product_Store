import { useAuth, useUser } from "@clerk/clerk-react";
import { useMutation } from "@tanstack/react-query";
import { useEffect } from "react";
import { syncUser } from "../lib/api";

/**
 * Synchronizes the currently authenticated Clerk user with the backend and exposes whether the sync succeeded.
 *
 * The hook automatically triggers a backend sync when a user is signed in and a sync is not already pending
 * and has not yet succeeded.
 * @returns {{ isSynced: boolean }} An object with `isSynced`: `true` if the most recent sync completed successfully, `false` otherwise.
 */
function useUserSync() {
  // Extract authentication state from Clerk, isSignedIn is a boolean that tells us if the user is logged in.
  const { isSignedIn } = useAuth();

  // Extract the full user object from Clerk.
  const { user } = useUser();

  // useMutation prepares a mutation (a data-changing request).
  // mutationFn tells React Query which function to execute, when we trigger the mutation.
  // The hook returns several state values:
  // - mutate: function used to trigger the mutation
  // - isPending: true while the request is in progress
  // - isSuccess: true when the request completes successfully
  const {
    mutate: syncUserMutation,
    isPending,
    isSuccess,
  } = useMutation({ mutationFn: syncUser });
  // This effect is responsible for automatically syncing the user after login.
  useEffect(() => {
    // we only run the sync if:
    // User is Signed , the user object exists, a sync request is not already running and the sync has not already succeeded
    if (isSignedIn && user && !isPending && !isSuccess) {
      //This calls the syncUser function and sends this object to the backend as the request body.
      syncUserMutation({
        email: user.primaryEmailAddress?.emailAddress,
        name: user.fullName || user.firstName,
        imageUrl: user.imageUrl,
      });
    }
    // The effect re-runs if any of these values change.
  }, [isSignedIn, user, syncUserMutation, isPending, isSuccess]);

  return { isSynced: isSuccess };
}
export default useUserSync;