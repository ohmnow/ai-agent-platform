import React from 'react';
import { render } from '@testing-library/react-native';
// Import your app component or test a specific component instead
import App from '../app/_layout';

// Mock the necessary dependencies
jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: jest.fn(),
    push: jest.fn(),
  }),
  useSegments: () => [''],
  Stack: {
    Screen: ({ children }: { children: React.ReactNode }) => children,
  },
  Redirect: () => null,
}));

jest.mock('@clerk/clerk-expo', () => ({
  useAuth: () => ({
    isLoaded: true,
    isSignedIn: false,
  }),
  useUser: () => ({
    user: null,
    isLoaded: true,
  }),
}));

jest.mock('convex/react', () => ({
  ConvexProvider: ({ children }: { children: React.ReactNode }) => children,
  ConvexReactClient: jest.fn(),
  useQuery: () => null,
  useMutation: () => jest.fn(),
}));

jest.mock('../hooks/auth/useUserRole', () => ({
  useUserRole: () => ({
    role: 'unknown',
    isLoaded: true,
  }),
  UserRole: {
    CUSTOMER: 'customer',
    PROPERTY_MANAGER: 'property_manager',
    SERVICE_PROVIDER: 'service_provider',
    COMPANY_ADMIN: 'company_admin',
    UNKNOWN: 'unknown',
  }
}));

jest.mock('../hooks/auth/useClerkUser', () => ({
  useClerkUser: () => ({
    isSyncing: false,
    error: null,
    isSynced: false,
  }),
}));

jest.mock('../components/auth/ClerkProvider', () => ({
  ClerkProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('expo-constants', () => ({
  expoConfig: {
    extra: {
      clerkPublishableKey: 'test-key',
      convexUrl: 'https://test-url.convex.cloud',
    },
  },
}));

describe('App', () => {
  it('renders without crashing', () => {
    const { toJSON } = render(<App />);
    expect(toJSON()).toBeTruthy();
  });
}); 