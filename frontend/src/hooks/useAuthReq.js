import { useAuth } from "@clerk/clerk-react";
import { useEffect } from "react";
import api from "../lib/axios";

// This variable ensures that we only register, the interceptor once globally.
let isInterceptorRegistered = false;

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
