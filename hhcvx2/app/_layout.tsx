import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { ClerkProvider } from '../components/auth/ClerkProvider';
import { useAuth } from '@clerk/clerk-expo';
import { useUserRole, UserRole } from '../hooks/auth/useUserRole';
import { useClerkUser } from '../hooks/auth/useClerkUser';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import Constants from 'expo-constants';

// Get the Convex URL from environment variables or Constants
const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL || 
  Constants.expoConfig?.extra?.convexUrl as string;

if (!convexUrl) {
  throw new Error(
    "Missing Convex URL. Please set EXPO_PUBLIC_CONVEX_URL in your .env file"
  );
}

// Initialize the Convex client
const convex = new ConvexReactClient(convexUrl);

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <ConvexProvider client={convex}>
        <ClerkProvider>
          <RootLayoutNav />
        </ClerkProvider>
      </ConvexProvider>
    </ThemeProvider>
  );
}

function RootLayoutNav() {
  const { isLoaded, isSignedIn } = useAuth();
  const { role, isLoaded: isRoleLoaded } = useUserRole();
  const { isSyncing } = useClerkUser();
  const [isNavigationReady, setIsNavigationReady] = useState(false);

  // Ensure stable navigation state before routing
  useEffect(() => {
    if (isLoaded && isRoleLoaded && !isSyncing) {
      setIsNavigationReady(true);
    }
  }, [isLoaded, isRoleLoaded, isSyncing]);

  // Don't render anything until ready
  if (!isNavigationReady) {
    return null;
  }

  // Auth routing logic
  if (!isSignedIn) {
    return (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)/sign-in" options={{ title: 'Sign In' }} />
        <Stack.Screen name="(auth)/sign-up" options={{ title: 'Sign Up' }} />
      </Stack>
    );
  }

  // Role-based routing
  if (role === UserRole.CUSTOMER) {
    return (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(customer)" options={{ title: 'Customer App' }} />
      </Stack>
    );
  } else if (role === UserRole.PROPERTY_MANAGER) {
    return (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(property-manager)" options={{ title: 'Property Manager' }} />
      </Stack>
    );
  } else if (role === UserRole.SERVICE_PROVIDER) {
    return (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(field-service)" options={{ title: 'Field Service' }} />
      </Stack>
    );
  } else if (role === UserRole.COMPANY_ADMIN) {
    return (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(company-dashboard)" options={{ title: 'Dashboard' }} />
      </Stack>
    );
  }

  // Fallback to auth if role not determined
  return <Redirect href="/sign-in" />;
}
