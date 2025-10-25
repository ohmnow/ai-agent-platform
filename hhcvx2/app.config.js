import "dotenv/config";

// Load environment-specific configurations
const env = process.env.APP_ENV || process.env.EXPO_PUBLIC_ENV || "development";
console.log(`Loading ${env} configuration...`);

// Load the right env file
let envPath;
if (env === "production") {
  envPath = ".env.production";
} else if (env === "staging") {
  envPath = ".env.staging";
} else {
  envPath = ".env.development";
}

// Load environment variables from the appropriate file
require("dotenv").config({ path: envPath });

// Base configuration that's the same across all environments
const commonConfig = {
  name: "Handyman Services App",
  slug: "handyman-services-app",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  splash: {
    image: "./assets/splash.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff",
  },
  assetBundlePatterns: ["**/*"],
  ios: {
    supportsTablet: true,
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#ffffff",
    },
  },
  web: {
    favicon: "./assets/favicon.png",
  },
  plugins: [
    "expo-router",
    [
      "expo-secure-store",
      {
        faceIDPermission: "Allow Handyman Services App to access your Face ID biometric data.",
      },
    ],
  ],
  scheme: "handyman-services-app",
  experiments: {
    typedRoutes: true,
  },
  extra: {
    env,
    clerkPublishableKey: process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY,
    convexUrl: process.env.EXPO_PUBLIC_CONVEX_URL,
    sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
    amplitudeApiKey: process.env.EXPO_PUBLIC_AMPLITUDE_API_KEY,
  },
};

// Environment-specific overrides
const environmentConfigs = {
  development: {
    name: "Handyman Services Dev",
  },
  staging: {
    name: "Handyman Services Staging",
  },
  production: {
    name: "Handyman Services",
  },
};

// Generate the final config
export default () => {
  return {
    ...commonConfig,
    ...environmentConfigs[env],
  };
}; 