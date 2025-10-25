import { useUser, useAuth } from "@clerk/clerk-expo";
import { useMutation } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "../../convex/_generated/api";

/**
 * Custom hook to sync Clerk user data with Convex
 * This should be used high in the component tree to ensure the user data is synced on sign-in
 */
export function useClerkUser() {
  const { isLoaded: isAuthLoaded, isSignedIn } = useAuth();
  const { user, isLoaded: isUserLoaded } = useUser();
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Convex mutation to create or update user
  const createOrUpdateUser = useMutation(api.users.createOrUpdateUser);

  useEffect(() => {
    async function syncUser() {
      if (!isAuthLoaded || !isUserLoaded || !isSignedIn || !user || isSyncing) {
        return;
      }

      try {
        setIsSyncing(true);
        setError(null);

        // Get user data from Clerk
        const firstName = user.firstName || "";
        const lastName = user.lastName || "";
        const email = user.primaryEmailAddress?.emailAddress || "";
        const imageUrl = user.imageUrl;

        // Sync with Convex
        await createOrUpdateUser({
          clerkId: user.id,
          firstName,
          lastName,
          email,
          imageUrl,
        });
      } catch (err) {
        console.error("Error syncing user data with Convex:", err);
        setError(err instanceof Error ? err : new Error("Unknown error"));
      } finally {
        setIsSyncing(false);
      }
    }

    syncUser();
  }, [isAuthLoaded, isUserLoaded, isSignedIn, user, createOrUpdateUser]);

  return {
    isSyncing,
    error,
    isSynced: isAuthLoaded && isUserLoaded && isSignedIn && !isSyncing && !error,
  };
} 