import { useAuth } from "@clerk/clerk-react";
import { useEffect } from "react";
import api from "../lib/axios";

// This variable ensures that we only register, the interceptor once globally.
let isInterceptorRegistered = false;

/**
 * Registers a global Axios request interceptor that attaches a Clerk-issued Bearer token to outgoing requests when the user is signed in, and exposes the current Clerk auth state.
 *
 * The interceptor is registered once and removed when the component using this hook unmounts.
 *
 * @returns {{isSignedIn: boolean, isClerkLoaded: boolean}} An object containing the user's sign-in status and whether Clerk has finished loading: `isSignedIn` indicates if a user is signed in, `isClerkLoaded` mirrors Clerk's load state.
 */
function useAuthReq() {
  const { isSignedIn, getToken, isLoaded } = useAuth();
  // include the token to the request headers
  // Register an Axios request interceptor.
  // This runs before every HTTP request is sent.
  useEffect(() => {
    if (isInterceptorRegistered) return;
    isInterceptorRegistered = true;
    // Register request interceptor.
    const interceptor = api.interceptors.request.use(async (config) => {
      // Only attach token if user is signed in.
      if (isSignedIn) {
        // Retrieve JWT token from Clerk.
        const token = await getToken();
        if (token) {
          // If token exists, attach it to the Authorization header.
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
      return config;
    });

    // Cleanup function: removes interceptor when component unmounts.
    return () => {
      api.interceptors.request.eject(interceptor);
      isInterceptorRegistered = false;
    };
  }, [isSignedIn, getToken]);

  // Return authentication state for optional usage in components.
  return { isSignedIn, isClerkLoaded: isLoaded };
}

export default useAuthReq;