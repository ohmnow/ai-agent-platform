# Handyman Services App

A subscription-based handyman services platform with multiple apps for customers, property managers, field service teams, and company administration.

## Tech Stack

- **Frontend:** React Native with Expo
- **Navigation:** Expo Router
- **Authentication:** Clerk
- **Backend:** Convex
- **Payments:** Polar

## Prerequisites

- Node.js 16+
- npm or Yarn
- Expo CLI
- Convex account
- Clerk account
- Polar account

## Getting Started

1. Clone the repository:

```bash
git clone your-repo-url
cd handyman-services-app
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

Copy the sample environment files and update them with your own credentials:

```bash
cp .env.development.example .env.development
cp .env.staging.example .env.staging
cp .env.production.example .env.production
```

4. Start development server:

```bash
# Development environment
npm run start:development

# Staging environment
npm run start:staging

# Production environment
npm run start:production
```

5. Open the app:

- Use the Expo Go app on your phone to scan the QR code
- Press 'i' for iOS simulator
- Press 'a' for Android emulator

## Project Structure

```
├── app/                # Expo Router app directory
│   ├── (auth)/         # Authentication screens
│   ├── (customer)/     # Customer app screens
│   ├── (property-manager)/ # Property manager app screens
│   ├── (field-service)/ # Field service team app screens
│   └── (company-dashboard)/ # Company admin dashboard screens
├── components/         # Reusable components
├── hooks/              # Custom hooks
├── convex/             # Convex backend
├── assets/             # Static assets
├── constants/          # App constants
└── __tests__/          # Tests
```

## Available Scripts

- `npm start` - Start the development server
- `npm run start:development` - Start with development environment
- `npm run start:staging` - Start with staging environment
- `npm run start:production` - Start with production environment
- `npm run android` - Start for Android
- `npm run ios` - Start for iOS
- `npm run web` - Start for web
- `npm test` - Run tests
- `npm run lint` - Lint the code

## Authentication

The app uses Clerk for authentication with different user roles:

- Customer
- Property Manager
- Service Provider
- Company Admin

Each role has access to different parts of the app based on their permissions.

## Development Notes

- Use `convex dev` in a separate terminal to run the Convex development server
- The app uses environment-specific configurations for development, staging, and production
- Make sure to test with different user roles to verify proper functionality

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
