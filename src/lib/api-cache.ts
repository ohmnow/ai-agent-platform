/**
 * API Rate Limiting & Caching Layer
 *
 * Provides caching and rate limiting for external API calls.
 * Prevents hitting rate limits and improves performance.
 *
 * Features:
 * - In-memory cache with TTL and automatic expiration cleanup
 * - Sliding window rate limiter with configurable limits
 * - Wait mechanism for automatic retry when rate limited
 */

export interface CacheOptions {
  ttl: number; // Time to live in seconds
  key: string; // Cache key
}

export interface RateLimitOptions {
  maxRequests: number; // Max requests per window
  windowMs: number; // Time window in milliseconds
}

/**
 * Simple in-memory cache with TTL
 *
 * Stores key-value pairs with expiration and auto-cleanup of expired entries.
 * For production use with multiple instances, consider using Redis.
 */
class ApiCache {
  private cache = new Map<string, { value: any; expires: number }>();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Run cleanup every 5 minutes
    this.cleanupInterval = setInterval(() => this.cleanupExpired(), 5 * 60 * 1000);
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return null;
    }

    return entry.value as T;
  }

  async set(key: string, value: any, ttlSeconds: number): Promise<void> {
    const expires = Date.now() + ttlSeconds * 1000;
    this.cache.set(key, { value, expires });
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }

  /**
   * Clean up expired entries from the cache
   */
  private cleanupExpired(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, entry] of Array.from(this.cache.entries())) {
      if (now > entry.expires) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned up ${cleanedCount} expired cache entries`);
    }
  }

  /**
   * Get the number of cached entries
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Stop the automatic cleanup interval (useful for testing or shutdown)
   */
  stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

/**
 * Rate Limiter
 *
 * Uses a sliding window algorithm to track and limit requests per time window.
 */
class RateLimiter {
  private requests = new Map<string, number[]>();

  /**
   * Check if a request would exceed the rate limit
   * @param key Identifier for the rate limit (e.g., API endpoint, user ID)
   * @param options Rate limit configuration
   * @returns true if request is allowed, false if limit exceeded
   */
  async checkLimit(key: string, options: RateLimitOptions): Promise<boolean> {
    const now = Date.now();
    const { maxRequests, windowMs } = options;

    // Get existing request timestamps for this key
    let timestamps = this.requests.get(key) || [];

    // Remove timestamps outside the current window (sliding window)
    timestamps = timestamps.filter((timestamp) => now - timestamp < windowMs);

    // Check if we've exceeded the limit
    if (timestamps.length >= maxRequests) {
      // Update the map with cleaned timestamps
      this.requests.set(key, timestamps);
      return false;
    }

    // Add current timestamp and allow the request
    timestamps.push(now);
    this.requests.set(key, timestamps);

    return true;
  }

  /**
   * Wait until a rate limit slot becomes available
   * @param key Identifier for the rate limit
   * @param options Rate limit configuration
   * @param maxWaitMs Maximum time to wait in milliseconds (default: 60000ms = 1 minute)
   * @throws Error if max wait time is exceeded
   */
  async waitForSlot(
    key: string,
    options: RateLimitOptions,
    maxWaitMs: number = 60000
  ): Promise<void> {
    const startTime = Date.now();

    while (true) {
      // Check if we've exceeded max wait time
      if (Date.now() - startTime > maxWaitMs) {
        throw new Error(
          `Rate limit wait timeout exceeded for key: ${key} (max wait: ${maxWaitMs}ms)`
        );
      }

      // Check if a slot is available
      const allowed = await this.checkLimit(key, options);
      if (allowed) {
        return;
      }

      // Calculate wait time until next slot is available
      const timestamps = this.requests.get(key) || [];
      if (timestamps.length > 0) {
        const oldestTimestamp = timestamps[0];
        const waitTime = Math.min(
          options.windowMs - (Date.now() - oldestTimestamp) + 100, // Add 100ms buffer
          1000 // Max 1 second wait between checks
        );

        // Wait before checking again
        await new Promise((resolve) => setTimeout(resolve, Math.max(waitTime, 100)));
      } else {
        // If no timestamps, wait a short time before retrying
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }
  }

  /**
   * Get the number of requests made in the current window
   */
  getRequestCount(key: string, windowMs: number): number {
    const now = Date.now();
    const timestamps = this.requests.get(key) || [];
    return timestamps.filter((timestamp) => now - timestamp < windowMs).length;
  }

  /**
   * Clear all rate limit data for a specific key
   */
  clearKey(key: string): void {
    this.requests.delete(key);
  }

  /**
   * Clear all rate limit data
   */
  clearAll(): void {
    this.requests.clear();
  }
}

export const apiCache = new ApiCache();
export const rateLimiter = new RateLimiter();
