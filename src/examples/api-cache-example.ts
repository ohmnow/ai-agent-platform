/**
 * API Cache & Rate Limiter Usage Example
 *
 * Demonstrates how to use the caching and rate limiting layer
 * for external API calls.
 */

import { apiCache, rateLimiter } from '../lib/api-cache';

// Example: Fetch data from an external API with caching and rate limiting
async function fetchUserData(userId: string): Promise<any> {
  const cacheKey = `user:${userId}`;

  // 1. Check cache first
  const cached = await apiCache.get(cacheKey);
  if (cached) {
    console.log(`✅ Cache HIT for user ${userId}`);
    return cached;
  }

  console.log(`❌ Cache MISS for user ${userId}`);

  // 2. Check rate limit before making API call
  const rateLimitKey = 'external-api';
  const rateLimitOptions = {
    maxRequests: 10, // Max 10 requests
    windowMs: 60000, // Per 60 seconds (1 minute)
  };

  const allowed = await rateLimiter.checkLimit(rateLimitKey, rateLimitOptions);

  if (!allowed) {
    console.log('⏳ Rate limit reached, waiting for slot...');
    // Wait until a slot becomes available (max 30 seconds)
    await rateLimiter.waitForSlot(rateLimitKey, rateLimitOptions, 30000);
  }

  // 3. Make the actual API call
  console.log(`🌐 Fetching user ${userId} from API...`);
  const userData = await simulateApiCall(userId);

  // 4. Store in cache for 5 minutes
  await apiCache.set(cacheKey, userData, 300);

  return userData;
}

// Simulate an external API call
async function simulateApiCall(userId: string): Promise<any> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 100));

  return {
    id: userId,
    name: `User ${userId}`,
    email: `user${userId}@example.com`,
    lastFetched: new Date().toISOString(),
  };
}

// Example: Bulk fetch with automatic rate limiting
async function fetchMultipleUsers(userIds: string[]): Promise<any[]> {
  console.log(`\n📦 Fetching ${userIds.length} users...\n`);

  const results = [];
  for (const userId of userIds) {
    const userData = await fetchUserData(userId);
    results.push(userData);
  }

  return results;
}

// Example: Using rate limiter without cache
async function rateLimitedApiCall(endpoint: string): Promise<void> {
  const rateLimitKey = `api:${endpoint}`;
  const options = {
    maxRequests: 5,
    windowMs: 10000, // 5 requests per 10 seconds
  };

  const allowed = await rateLimiter.checkLimit(rateLimitKey, options);

  if (!allowed) {
    const currentCount = rateLimiter.getRequestCount(rateLimitKey, options.windowMs);
    throw new Error(
      `Rate limit exceeded for ${endpoint}. Current: ${currentCount}/${options.maxRequests}`
    );
  }

  console.log(`✅ Making request to ${endpoint}`);
  // Make your API call here
}

// Demo
async function demo() {
  console.log('=================================');
  console.log('API Cache & Rate Limiter Demo');
  console.log('=================================\n');

  // Example 1: Fetch with caching
  console.log('Example 1: Caching in action\n');
  await fetchUserData('123'); // Cache miss
  await fetchUserData('123'); // Cache hit
  await fetchUserData('456'); // Cache miss

  // Example 2: Bulk fetch with rate limiting
  console.log('\nExample 2: Bulk fetch with rate limiting\n');
  const users = await fetchMultipleUsers(['001', '002', '003', '004', '005']);
  console.log(`\n✅ Fetched ${users.length} users`);

  // Example 3: Rate limit handling
  console.log('\nExample 3: Rate limiting\n');
  try {
    for (let i = 0; i < 7; i++) {
      await rateLimitedApiCall('/users');
    }
  } catch (error) {
    if (error instanceof Error) {
      console.log(`⚠️  ${error.message}`);
    }
  }

  // Example 4: Check cache stats
  console.log('\nExample 4: Cache statistics\n');
  console.log(`Cache size: ${apiCache.size()} entries`);

  // Cleanup
  console.log('\n=================================');
  console.log('✅ Demo completed!');
  console.log('=================================\n');

  apiCache.stopCleanup();
}

// Run the demo
demo().catch(console.error);
