/**
 * Test API Cache and Rate Limiter
 *
 * Simple tests to verify caching and rate limiting functionality
 */

import { apiCache, rateLimiter } from '../lib/api-cache';

async function testCache() {
  console.log('\n🧪 Testing API Cache...\n');

  // Test set and get
  await apiCache.set('test-key', { data: 'test-value' }, 5);
  const result = await apiCache.get<{ data: string }>('test-key');
  console.log('✅ Cache set/get:', result?.data === 'test-value' ? 'PASS' : 'FAIL');

  // Test expiration
  await apiCache.set('expire-key', 'short-lived', 1);
  await new Promise((resolve) => setTimeout(resolve, 1500));
  const expired = await apiCache.get('expire-key');
  console.log('✅ Cache expiration:', expired === null ? 'PASS' : 'FAIL');

  // Test size
  await apiCache.set('key1', 'value1', 10);
  await apiCache.set('key2', 'value2', 10);
  console.log('✅ Cache size:', apiCache.size() >= 2 ? 'PASS' : 'FAIL');

  // Test delete
  await apiCache.delete('key1');
  const deleted = await apiCache.get('key1');
  console.log('✅ Cache delete:', deleted === null ? 'PASS' : 'FAIL');

  // Test clear
  await apiCache.clear();
  console.log('✅ Cache clear:', apiCache.size() === 0 ? 'PASS' : 'FAIL');
}

async function testRateLimiter() {
  console.log('\n🧪 Testing Rate Limiter...\n');

  const options = {
    maxRequests: 3,
    windowMs: 1000, // 1 second
  };

  // Clear any existing state
  rateLimiter.clearKey('test-endpoint');

  // Test allowing requests within limit
  const allowed1 = await rateLimiter.checkLimit('test-endpoint', options);
  const allowed2 = await rateLimiter.checkLimit('test-endpoint', options);
  const allowed3 = await rateLimiter.checkLimit('test-endpoint', options);
  console.log(
    '✅ Allow within limit:',
    allowed1 && allowed2 && allowed3 ? 'PASS' : 'FAIL'
  );

  // Test blocking when limit exceeded
  const blocked = await rateLimiter.checkLimit('test-endpoint', options);
  console.log('✅ Block when exceeded:', !blocked ? 'PASS' : 'FAIL');

  // Test request count
  const count = rateLimiter.getRequestCount('test-endpoint', options.windowMs);
  console.log('✅ Request count:', count === 3 ? 'PASS' : `FAIL (got ${count})`);

  // Wait for window to pass
  console.log('⏳ Waiting for rate limit window to reset...');
  await new Promise((resolve) => setTimeout(resolve, 1100));

  // Test allowing after window passes
  const allowedAfterWait = await rateLimiter.checkLimit('test-endpoint', options);
  console.log('✅ Allow after window:', allowedAfterWait ? 'PASS' : 'FAIL');

  // Test waitForSlot
  rateLimiter.clearKey('wait-test');
  await rateLimiter.checkLimit('wait-test', options);
  await rateLimiter.checkLimit('wait-test', options);
  await rateLimiter.checkLimit('wait-test', options);

  console.log('⏳ Testing waitForSlot (should wait ~1 second)...');
  const startTime = Date.now();
  await rateLimiter.waitForSlot('wait-test', options, 5000);
  const waitTime = Date.now() - startTime;
  console.log(
    `✅ WaitForSlot: ${waitTime > 900 && waitTime < 2000 ? 'PASS' : 'FAIL'} (waited ${waitTime}ms)`
  );

  // Test clearKey
  rateLimiter.clearKey('test-endpoint');
  const countAfterClear = rateLimiter.getRequestCount(
    'test-endpoint',
    options.windowMs
  );
  console.log('✅ Clear key:', countAfterClear === 0 ? 'PASS' : 'FAIL');
}

async function runTests() {
  console.log('=================================');
  console.log('API Cache & Rate Limiter Tests');
  console.log('=================================');

  try {
    await testCache();
    await testRateLimiter();

    console.log('\n=================================');
    console.log('✅ All tests completed!');
    console.log('=================================\n');

    // Cleanup
    apiCache.stopCleanup();
  } catch (error) {
    console.error('\n❌ Test failed with error:', error);
    process.exit(1);
  }
}

runTests();
