import { useUser, useAuth } from "@clerk/clerk-expo";
import { useQuery } from "convex/react";
import { useState, useEffect } from "react";
import { api } from "../../convex/_generated/api";

// User roles for the application
export enum UserRole {
  CUSTOMER = "customer",
  PROPERTY_MANAGER = "property_manager",
  SERVICE_PROVIDER = "service_provider",
  COMPANY_ADMIN = "company_admin",
  UNKNOWN = "unknown", // Default before role is determined
}

export function useUserRole() {
  const { isLoaded: isAuthLoaded, isSignedIn } = useAuth();
  const { user, isLoaded: isUserLoaded } = useUser();
  const [role, setRole] = useState<UserRole>(UserRole.UNKNOWN);
  const [isLoadingRole, setIsLoadingRole] = useState(true);

  // Query Convex for the user data
  const userData = useQuery(
    api.users.getUserByClerkId,
    isSignedIn && user ? { clerkId: user.id } : "skip"
  );

  useEffect(() => {
    if (!isAuthLoaded || !isUserLoaded) {
      return;
    }

    if (!isSignedIn || !user) {
      setRole(UserRole.UNKNOWN);
      setIsLoadingRole(false);
      return;
    }

    // If we have user data from Convex, use the role from there
    if (userData) {
      switch (userData.role) {
        case "customer":
          setRole(UserRole.CUSTOMER);
          break;
        case "property_manager":
          setRole(UserRole.PROPERTY_MANAGER);
          break;
        case "service_provider":
          setRole(UserRole.SERVICE_PROVIDER);
          break;
        case "company_admin":
          setRole(UserRole.COMPANY_ADMIN);
          break;
        default:
          setRole(UserRole.UNKNOWN);
      }
      setIsLoadingRole(false);
      return;
    }

    // For demo purposes, if we don't have user data yet, set a default role based on email
    if (userData === undefined && user) {
      // For demo, let's set a role based on the user's email domain or a public metadata field
      const email = user.primaryEmailAddress?.emailAddress || "";

      if (email.includes("admin")) {
        setRole(UserRole.COMPANY_ADMIN);
      } else if (email.includes("provider")) {
        setRole(UserRole.SERVICE_PROVIDER);
      } else if (email.includes("property")) {
        setRole(UserRole.PROPERTY_MANAGER);
      } else {
        // Default to customer
        setRole(UserRole.CUSTOMER);
      }
      setIsLoadingRole(false);
    }
  }, [isAuthLoaded, isUserLoaded, isSignedIn, user, userData]);

  return {
    role,
    isLoaded: isAuthLoaded && isUserLoaded && !isLoadingRole,
    isCustomer: role === UserRole.CUSTOMER,
    isPropertyManager: role === UserRole.PROPERTY_MANAGER,
    isServiceProvider: role === UserRole.SERVICE_PROVIDER,
    isCompanyAdmin: role === UserRole.COMPANY_ADMIN,
  };
} 