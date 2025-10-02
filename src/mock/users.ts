/**
 * Mock User System
 *
 * Simple in-memory mock user data for MVP testing.
 * In production, this would integrate with a real authentication system.
 */

export const mockUser = {
  id: 'user-001',
  name: 'Test User',
  email: 'test@example.com',
  connectedServices: ['notes', 'calendar', 'mock-finance'],
};

export function getCurrentUser() {
  return mockUser;
}
