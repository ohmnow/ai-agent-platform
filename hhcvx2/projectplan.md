# Project Plan: Subscription-Based Handyman Services App

## 1. Introduction

This document outlines the implementation plan for the Subscription-Based Handyman Services App, as detailed in the `prd.md`. The project aims to deliver a platform consisting of a Customer App, Property Manager App, Field Service Team App, and a Company Management Dashboard, built using React Native, Expo, Expo Router, Clerk, Convex, and Polar. Development will use `npm` for package management.

## 2. Development Phases

The project will be implemented in phases, focusing on establishing a solid foundation first, followed by iterative development of core and advanced features.

### Phase 0: Project Initialization & Baseline MVP

**Goal:** Set up the core project structure, install essential dependencies, configure basic routing, implement environment configurations, and establish a baseline MVP on GitHub.

**Tasks:**

-   [ ] Verify React Native project setup using Expo.
-   [ ] Install core dependencies (using `npm`):
    -   [ ] Clerk (`@clerk/clerk-expo`, `expo-secure-store`)
    -   [ ] Convex (`convex`)
    *   [ ] Polar SDK (`@polar-sh/sdk`)
    -   [ ] TypeScript (`typescript`)
    -   [ ] Documentation Tools (`typedoc`, `@storybook/react-native`, etc.)
    -   [ ] Analytics SDK (`@amplitude/analytics-react-native`)
    -   [ ] Error Tracking (`@sentry/react-native`)
    -   [ ] Environment Variables (`react-native-dotenv`, `cross-env`)
-   [ ] Configure TypeScript (`tsconfig.json`).
-   [ ] Define project directory structure (e.g., `src/`, `convex/`, `components/`, etc.).
-   [ ] Configure ESLint and Prettier for code linting and formatting.
-   [ ] Configure basic setup for TypeDoc (`typedoc.json`).
-   [ ] Configure basic setup for Storybook (`.storybook/`, `package.json` scripts, `app.json` extra key).
-   [ ] Initialize and configure basic Amplitude SDK setup (via `@env`).
-   [ ] Initialize and configure basic Sentry SDK setup (via `@env`).
-   [ ] Set up environment configurations (dev/staging/prod):
    -   [ ] Create `.env.development`, `.env.staging`, `.env.production` files
    -   [ ] Configure environment switching in app.config.js
    -   [ ] Document environment variables and their purpose
-   [ ] Initialize Git repository.
-   [ ] Create placeholder screens/components for each app type (implicit in Expo template).
-   [ ] Implement basic root navigation structure using Expo Router (`app/_layout.tsx`, `app/(tabs)`).
-   [ ] Create MVP screens:
    -   [ ] Authentication screen (placeholder)
    -   [ ] Customer home screen (placeholder)
    -   [ ] Property Manager home screen (placeholder)
    -   [ ] Field Service Team home screen (placeholder)
    -   [ ] Admin Dashboard home screen (placeholder)
-   [ ] Test basic navigation flow and environment configurations
-   [ ] Perform initial commit(s).
-   [ ] Create GitHub repository (`gh repo create`) and push the baseline code (`git push`).
-   [ ] Mark GitHub repository as private (`gh repo edit`).

### Phase 1: Core Functionality & User Management

**Goal:** Implement core authentication, user roles, basic data models, and fundamental features for each app component. (Corresponds roughly to PRD Phase 2)

**Tasks:**

-   **Authentication & User Roles (Clerk & Convex):**
    -   [ ] Integrate Clerk: Provider Setup (`ClerkProvider`, `tokenCache`).
    -   [ ] Implement Sign Up, Sign In screens (`app/(auth)/sign-in.tsx`, `app/(auth)/sign-up.tsx`).
    -   [ ] Implement phone number verification flow (Optional/Future).
    -   [ ] Define Convex schema: `User` (`convex/schema.ts`).
    -   [ ] Implement role assignment logic (customer, property\_manager, service\_provider, company\_admin).
    -   [ ] Implement basic user profile management screen.
    -   [ ] Implement protected routing based on authentication status and role (`app/_layout.tsx`).
    -   [ ] Write unit tests for authentication flows and role assignment logic.
-   **Convex Setup:**
    -   [ ] Initialize Convex project (`npx convex dev --once --configure=new`).
    -   [ ] Define initial Convex schemas (referencing PRD Data Models): `Customer`, `PropertyOrganization`, `Property`, `SubscriptionPlan`, `ServiceProvider`, `ServiceRequest`.
    -   [ ] Implement basic Convex queries/mutations for user creation/updates (linking Clerk user to Convex User).
    -   [ ] Write tests for Convex queries and mutations.
-   **Customer App - Core:**
    -   [ ] Implement service request creation form (basic fields).
    -   [ ] Implement service request list view.
    -   [ ] Test service request creation and listing functionality.
-   **Property Manager App - Core:**
    -   [ ] Implement property list view.
    -   [ ] Implement property creation form (basic fields).
    -   [ ] Implement basic organization structure (link user to organization, view properties within org).
    -   [ ] Test property management functionality.
-   **Company Dashboard - Core (Web):**
    -   [ ] Set up basic web project structure (can share components/logic with RN apps).
    -   [ ] Implement dashboard layout.
    -   [ ] Implement view for incoming service requests list.
    -   [ ] Implement view for service providers list.
    -   [ ] Test dashboard views and interactions.
-   **Field Service App - Core:**
    -   [ ] Implement job queue view (list assigned `ServiceRequest`s).
    -   [ ] Implement basic job detail view.
    -   [ ] Test job viewing and management functionality.

### Phase 2: Advanced Features & Payments

**Goal:** Integrate the payment system, enhance core features with real-time updates, messaging, and management tools. (Corresponds roughly to PRD Phase 3)

**Tasks:**

-   **Payments (Polar Integration):**
    -   [ ] Integrate Polar SDK/API for payment processing.
    -   [ ] Implement subscription plan selection and checkout flow.
    -   [ ] Implement billing history view.
    -   [ ] Define Convex schema: `Invoice`.
    -   [ ] Implement basic invoice generation and status tracking via Convex.
    -   [ ] Test payment flows, subscription management, and invoice generation.
-   **Customer App - Enhancements:**
    -   [ ] Implement subscription management (view status, manage).
    -   [ ] Implement real-time service request tracking (status updates via Convex).
    -   [ ] Implement basic in-app messaging (e.g., Customer <-> Company). Define `Message` schema.
    -   [ ] Implement ratings and reviews system. Define `Review` schema.
    -   [ ] Test enhancement features and real-time updates.
-   **Property Manager App - Enhancements:**
    -   [ ] Implement full property portfolio management (add, edit, group, details).
    -   [ ] Implement team member management within organizations.
    -   [ ] Implement budget allocation and tracking features.
    -   [ ] Implement basic approval workflow logic for requests/invoices.
    -   [ ] Test portfolio management and workflow features.
-   **Company Dashboard - Enhancements:**
    -   [ ] Implement full booking management (assignment, scheduling view, status updates).
    -   [ ] Implement provider profile management (details, skills, availability).
    -   [ ] Implement customer profile management view.
    -   [ ] Implement basic analytics/reporting dashboard components.
    -   [ ] Test booking management and dashboard features.
-   **Field Service App - Enhancements:**
    -   [ ] Implement job status updates (start, pause, complete) syncing via Convex.
    -   [ ] Implement photo documentation upload (using Convex file storage).
    -   [ ] Implement basic time tracking related to jobs.
    -   [ ] Implement basic offline data storage and synchronization strategy for job details.
    -   [ ] Test job management and offline functionality.

### Phase 3: Refinement & Deployment Prep

**Goal:** Refine the user experience, incorporate design assets, implement accessibility, internationalization, and prepare for deployment. (Corresponds roughly to PRD Phase 4 & other sections)

**Tasks:**

-   **Design Integration & UX Refinement:**
    -   [ ] Incorporate design assets and mockups into the application.
    -   [ ] Refine UI components based on design specifications.
    -   [ ] Conduct usability reviews and implement UI/UX refinements.
    -   [ ] Enhance user onboarding flows for all user types.
-   **Accessibility & Internationalization:**
    -   [ ] Implement accessibility features (WCAG 2.1 AA compliance).
    -   [ ] Test application with screen readers and assistive technologies.
    -   [ ] Implement internationalization (i18n library setup, string extraction, basic language support e.g., English/Spanish).
    -   [ ] Test application with different locales.
-   **Performance Optimization:**
    -   [ ] Optimize application startup time and screen transitions.
    -   [ ] Implement and test offline functionality comprehensively.
    -   [ ] Optimize bundle size and loading times.
    -   [ ] Measure and improve performance metrics.
-   **DevOps & Deployment:**
    -   [ ] Set up CI/CD pipeline (e.g., GitHub Actions) for automated builds, tests, and linting.
    -   [ ] Integrate EAS Build for development, staging, and production builds.
    -   [ ] Implement detailed Amplitude event tracking for key user flows.
    -   [ ] Implement detailed Sentry context/tagging.
    -   [ ] Finalize production environment configurations (Convex, Clerk, Polar keys, secrets management).
    -   [ ] Prepare app store submission materials (metadata, screenshots).
-   **Documentation:**
    -   [ ] Generate comprehensive code documentation using TypeDoc.
    -   [ ] Write and refine Storybook stories for UI components (if using).
    -   [ ] Create initial user guides or help sections within the apps.

### Phase 4: Launch & Post-Launch Iteration

**Goal:** Deploy the application, monitor its performance, gather user feedback, and plan future iterations.

**Tasks:**

-   [ ] Execute deployment strategy (e.g., phased rollout via TestFlight/Google Play Beta, then production).
-   [ ] Monitor production environment (performance, errors, analytics, logs).
-   [ ] Establish user feedback channels and collect input.
-   [ ] Triage bugs and user feedback, prioritize backlog for future sprints.
-   [ ] Plan and implement A/B tests for optimizations or new features.
-   [ ] Begin work on the next set of features based on the PRD backlog and user feedback (e.g., advanced reporting, inventory management, marketplace features).

## 3. Cross-Cutting Concerns

These items should be addressed throughout the development phases:

-   **Security:** Adhere to best practices outlined in the PRD (Clerk security, data encryption, secure coding, dependency scanning).
-   **Performance:** Continuously monitor and optimize app performance (startup time, screen transitions, API latency, bundle size). Implement offline strategies as defined.
-   **Code Quality:** Maintain high code quality through linting, formatting, code reviews, and adhering to established conventions.
-   **Documentation:** Keep project documentation (`prd.md`, `projectplan.md`, code comments, API docs) up-to-date.
-   **Accessibility:** Integrate accessibility considerations from the start.
-   **Internationalization:** Design components and flows with i18n in mind.
-   **Testing:** Write tests concurrently with feature development throughout all phases. 