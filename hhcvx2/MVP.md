# Minimum Viable Product (MVP) Definition

This document outlines the minimum viable product (MVP) for the Subscription-Based Handyman Services App that should be completed before pushing to GitHub as our baseline.

## Core Infrastructure

- [x] React Native + Expo project initialized
- [x] TypeScript configured
- [ ] ESLint and Prettier configured
- [x] Environment variables setup (development, staging, production)
- [x] Directory structure established (app, components, assets, etc.)
- [x] Convex integration configured
- [x] Clerk authentication integration configured

## Navigation & Routing

- [x] Expo Router configured
- [x] Basic navigation structure implemented
- [x] Auth-protected routes setup
- [x] Role-based navigation established (different flows for different user types)

## Authentication

- [x] Sign in screen
- [x] Sign up screen
- [x] Authentication state management
- [x] Protected routes working

## App Screens (Basic Placeholders)

- [x] Customer app home screen
- [x] Property Manager app home screen
- [x] Field Service Team app home screen
- [x] Company Dashboard home screen

## Data Models

- [x] Basic Convex schema established
- [x] User model defined
- [x] Role assignment implementation

## Testing Infrastructure

- [x] Basic testing utilities set up
- [x] Sample test for navigation
- [x] Sample test for authentication

## Success Criteria

The MVP is considered complete when:

1. A user can sign up and sign in using Clerk
2. A user can be assigned a role (customer, property manager, service provider, company admin)
3. Based on their role, they're directed to the appropriate app interface
4. Basic navigation within each app type works
5. Convex connection is successful and basic data operations work
6. Environment switching works correctly

This MVP represents the foundational architecture upon which we'll build the more advanced features outlined in the project plan. 