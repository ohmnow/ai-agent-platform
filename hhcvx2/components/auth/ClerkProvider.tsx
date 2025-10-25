import { ClerkProvider as BaseClerkProvider } from "@clerk/clerk-expo";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import Constants from 'expo-constants';

// SecureStore implementation for Clerk token caching
const tokenCache = {
  async getToken(key: string) {
    try {
      return SecureStore.getItemAsync(key);
    } catch (err) {
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      return SecureStore.setItemAsync(key, value);
    } catch (err) {
      return;
    }
  },
};

// Get the publishable key from environment variables
const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || 
  Constants.expoConfig?.extra?.clerkPublishableKey;

if (!publishableKey) {
  throw new Error(
    "Missing Clerk publishable key. Please set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in your .env file"
  );
}

export function ClerkProvider({ children }: { children: React.ReactNode }) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Simulate small delay for auth loading
    const timeout = setTimeout(() => {
      setLoaded(true);
    }, 500);

    return () => clearTimeout(timeout);
  }, []);

  if (!loaded) {
    // Show loading indicator while initializing
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 10 }}>Loading auth...</Text>
      </View>
    );
  }

  return (
    <BaseClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      {children}
    </BaseClerkProvider>
  );
} 