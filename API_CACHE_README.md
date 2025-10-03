# API Cache & Rate Limiter

A robust caching and rate limiting layer for external API calls in the AI Agent Platform.

## Features

### API Cache
- **In-memory caching** with Time-To-Live (TTL) support
- **Automatic expiration** - Entries expire based on TTL
- **Auto-cleanup** - Background process removes expired entries every 5 minutes
- **Type-safe** - Generic type support for cached values
- **Simple API** - Easy to use get/set/delete/clear methods

### Rate Limiter
- **Sliding window algorithm** - More accurate than fixed windows
- **Configurable limits** - Set max requests per time window
- **Automatic waiting** - `waitForSlot()` method automatically waits for rate limit availability
- **Per-key tracking** - Different rate limits for different API endpoints or users
- **Request counting** - Monitor current usage

## Installation

The module is already included in the project at `src/lib/api-cache.ts`.

```typescript
import { apiCache, rateLimiter } from './lib/api-cache';
```

## Usage

### Basic Caching

```typescript
import { apiCache } from './lib/api-cache';

// Set a value with 5 minute TTL
await apiCache.set('user:123', { name: 'John' }, 300);

// Get a value
const user = await apiCache.get<{ name: string }>('user:123');

// Delete a value
await apiCache.delete('user:123');

// Clear all cache
await apiCache.clear();

// Check cache size
console.log(apiCache.size());
```

### Basic Rate Limiting

```typescript
import { rateLimiter } from './lib/api-cache';

const options = {
  maxRequests: 10,    // Max 10 requests
  windowMs: 60000     // Per 60 seconds
};

// Check if request is allowed
const allowed = await rateLimiter.checkLimit('api-endpoint', options);
if (!allowed) {
  console.log('Rate limit exceeded!');
}

// Get current request count
const count = rateLimiter.getRequestCount('api-endpoint', options.windowMs);
```

### Automatic Rate Limit Waiting

```typescript
import { rateLimiter } from './lib/api-cache';

const options = {
  maxRequests: 5,
  windowMs: 10000
};

// Automatically wait for rate limit slot (max 30 seconds)
try {
  await rateLimiter.waitForSlot('api-endpoint', options, 30000);
  // Now make your API call
} catch (error) {
  console.error('Timeout waiting for rate limit slot');
}
```

### Complete Example: Cached API Call with Rate Limiting

```typescript
import { apiCache, rateLimiter } from './lib/api-cache';

async function fetchUserData(userId: string): Promise<any> {
  const cacheKey = `user:${userId}`;

  // 1. Check cache first
  const cached = await apiCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  // 2. Check rate limit
  const rateLimitKey = 'external-api';
  const rateLimitOptions = {
    maxRequests: 10,
    windowMs: 60000
  };

  const allowed = await rateLimiter.checkLimit(rateLimitKey, rateLimitOptions);
  if (!allowed) {
    // Wait for slot to become available
    await rateLimiter.waitForSlot(rateLimitKey, rateLimitOptions);
  }

  // 3. Make API call
  const response = await fetch(`https://api.example.com/users/${userId}`);
  const userData = await response.json();

  // 4. Cache for 5 minutes
  await apiCache.set(cacheKey, userData, 300);

  return userData;
}
```

## API Reference

### ApiCache

#### `get<T>(key: string): Promise<T | null>`
Retrieve a cached value. Returns `null` if not found or expired.

#### `set(key: string, value: any, ttlSeconds: number): Promise<void>`
Store a value in cache with TTL in seconds.

#### `delete(key: string): Promise<void>`
Remove a specific key from cache.

#### `clear(): Promise<void>`
Clear all cached entries.

#### `size(): number`
Get the number of cached entries.

#### `stopCleanup(): void`
Stop the automatic cleanup interval (useful for testing or shutdown).

### RateLimiter

#### `checkLimit(key: string, options: RateLimitOptions): Promise<boolean>`
Check if a request is allowed. Returns `true` if allowed, `false` if rate limit exceeded.

**Parameters:**
- `key` - Identifier for the rate limit (e.g., API endpoint, user ID)
- `options` - Rate limit configuration:
  - `maxRequests` - Maximum number of requests
  - `windowMs` - Time window in milliseconds

#### `waitForSlot(key: string, options: RateLimitOptions, maxWaitMs?: number): Promise<void>`
Wait until a rate limit slot becomes available. Throws error if max wait time exceeded.

**Parameters:**
- `key` - Identifier for the rate limit
- `options` - Rate limit configuration
- `maxWaitMs` - Maximum wait time in milliseconds (default: 60000)

#### `getRequestCount(key: string, windowMs: number): number`
Get the number of requests made in the current window.

#### `clearKey(key: string): void`
Clear rate limit data for a specific key.

#### `clearAll(): void`
Clear all rate limit data.

## Implementation Details

### Cache Algorithm
- Uses a Map for O(1) lookup performance
- Each entry stores value and expiration timestamp
- Expired entries are cleaned up automatically every 5 minutes
- Also cleaned up lazily during `get()` operations

### Rate Limiter Algorithm
- Implements **Sliding Window** algorithm
- Stores timestamps of recent requests
- Old timestamps are filtered out on each check
- More accurate than fixed window counters

### Memory Considerations
- Cache entries are stored in memory (consider Redis for production)
- Old rate limit timestamps are automatically cleaned up
- Each rate limit key stores an array of timestamps

## Testing

Run the test suite:

```bash
npx tsx src/test/test-api-cache.ts
```

Run the example demo:

```bash
npx tsx src/examples/api-cache-example.ts
```

## Production Considerations

### For High-Scale Production Use:

1. **Use Redis for caching** instead of in-memory storage
   - Shared across multiple instances
   - Persistence across restarts
   - Built-in expiration support

2. **Use Redis for rate limiting**
   - Shared state across instances
   - More sophisticated algorithms available
   - Better performance at scale

3. **Monitor cache hit rates**
   - Track cache effectiveness
   - Adjust TTL values based on usage

4. **Set appropriate rate limits**
   - Match external API limits
   - Add buffer for safety (e.g., 90% of actual limit)
   - Consider different limits for different endpoints

5. **Error handling**
   - Handle rate limit timeout errors gracefully
   - Implement exponential backoff for repeated failures
   - Log rate limit violations for monitoring

## License

Part of the AI Agent Platform project.
