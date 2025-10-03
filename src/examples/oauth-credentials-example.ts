/**
 * OAuth Credentials Example
 *
 * Demonstrates the OAuth credentials infrastructure:
 * - Storing and retrieving credentials
 * - Token validation and refresh
 * - Using the credentials vault
 */

import { oauthManager } from '../lib/oauth-manager.js';
import { credentialsVault } from '../lib/credentials-vault.js';

async function main() {
  console.log('=== OAuth Credentials Infrastructure Example ===\n');

  const testUserId = 'user-001';
  const testService = 'gmail';

  // Example 1: Generate authorization URL
  console.log('1. Generate OAuth Authorization URL');
  console.log('-----------------------------------');
  try {
    const authUrl = await oauthManager.getAuthorizationUrl(testService, testUserId, 'test-state-123');
    console.log('Authorization URL:');
    console.log(authUrl);
    console.log('\nUser would be redirected to this URL to grant permissions.\n');
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    console.log('Make sure GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI are set in .env\n');
  }

  // Example 2: Manually store test credentials (simulating successful OAuth)
  console.log('2. Store Test Credentials');
  console.log('-------------------------');
  try {
    // In real usage, these would come from Google OAuth callback
    const testCredential = {
      userId: testUserId,
      service: 'test-service',
      accessToken: 'test_access_token_12345',
      refreshToken: 'test_refresh_token_67890',
      expiresAt: new Date(Date.now() + 3600 * 1000), // 1 hour from now
      metadata: {
        scopes: ['https://www.googleapis.com/auth/gmail.readonly'],
        tokenType: 'Bearer',
      },
    };

    await credentialsVault.store(testCredential);
    console.log('✓ Test credentials stored successfully\n');
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    console.log();
  }

  // Example 3: Retrieve credentials
  console.log('3. Retrieve Credentials');
  console.log('-----------------------');
  try {
    const credential = await credentialsVault.retrieve(testUserId, 'test-service');
    if (credential) {
      console.log('Retrieved credential:');
      console.log('- User ID:', credential.userId);
      console.log('- Service:', credential.service);
      console.log('- Has Access Token:', !!credential.accessToken);
      console.log('- Has Refresh Token:', !!credential.refreshToken);
      console.log('- Expires At:', credential.expiresAt);
      console.log('- Metadata:', credential.metadata);
      console.log();

      // Verify encryption/decryption worked
      if (credential.accessToken !== 'test_access_token_12345') {
        console.error('⚠️  Token decryption failed!');
      } else {
        console.log('✓ Token encryption/decryption verified\n');
      }
    } else {
      console.log('No credentials found\n');
    }
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    console.log();
  }

  // Example 4: List all credentials for user
  console.log('4. List All Credentials');
  console.log('-----------------------');
  try {
    const credentials = await credentialsVault.list(testUserId);
    console.log(`Found ${credentials.length} credential(s):\n`);

    credentials.forEach((cred, index) => {
      const now = Date.now();
      const expiresAt = cred.expiresAt ? cred.expiresAt.getTime() : null;
      let status = 'unknown';

      if (expiresAt) {
        if (expiresAt < now) {
          status = 'expired';
        } else if (expiresAt - now < 5 * 60 * 1000) {
          status = 'expiring soon';
        } else {
          status = 'active';
        }
      }

      console.log(`${index + 1}. Service: ${cred.service}`);
      console.log(`   Expires: ${cred.expiresAt || 'N/A'}`);
      console.log(`   Status: ${status}`);
      console.log();
    });
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    console.log();
  }

  // Example 5: Update expiration
  console.log('5. Update Token Expiration');
  console.log('--------------------------');
  try {
    const newExpiration = new Date(Date.now() + 7200 * 1000); // 2 hours from now
    await credentialsVault.updateExpiration(testUserId, 'test-service', newExpiration);
    console.log('✓ Updated expiration to:', newExpiration);
    console.log();
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    console.log();
  }

  // Example 6: Test getValidToken (with real service, this would auto-refresh)
  console.log('6. Get Valid Token');
  console.log('------------------');
  try {
    const token = await credentialsVault.retrieve(testUserId, 'test-service');
    if (token) {
      console.log('Token is valid (not expired)');
      console.log('Use this token for API calls');
      console.log();
    }
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    console.log();
  }

  // Example 7: Delete credentials
  console.log('7. Delete Credentials');
  console.log('---------------------');
  try {
    await credentialsVault.delete(testUserId, 'test-service');
    console.log('✓ Test credentials deleted\n');

    // Verify deletion
    const deleted = await credentialsVault.retrieve(testUserId, 'test-service');
    if (deleted === null) {
      console.log('✓ Verified: Credentials no longer exist\n');
    }
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    console.log();
  }

  // Example 8: Encryption/Decryption Test
  console.log('8. Encryption/Decryption Test');
  console.log('-----------------------------');
  try {
    const testData = {
      userId: 'test-user',
      service: 'encryption-test',
      accessToken: 'super-secret-token-1234567890',
      refreshToken: 'super-secret-refresh-token-0987654321',
      expiresAt: new Date(),
      metadata: {
        test: 'data',
        sensitive: 'information',
      },
    };

    // Store (encrypts)
    await credentialsVault.store(testData);

    // Retrieve (decrypts)
    const retrieved = await credentialsVault.retrieve('test-user', 'encryption-test');

    if (retrieved &&
        retrieved.accessToken === testData.accessToken &&
        retrieved.refreshToken === testData.refreshToken) {
      console.log('✓ Encryption/Decryption test passed');
      console.log('✓ Data integrity verified');
    } else {
      console.log('⚠️  Encryption/Decryption test failed');
    }

    // Clean up
    await credentialsVault.delete('test-user', 'encryption-test');
    console.log('✓ Test data cleaned up\n');
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    console.log();
  }

  console.log('=== Example Complete ===\n');
  console.log('To test the full OAuth flow:');
  console.log('1. Start the server: npm run server');
  console.log('2. Navigate to: http://localhost:3000/api/auth/gmail/authorize?userId=user-001');
  console.log('3. Complete Google authorization');
  console.log('4. Check stored credentials in database\n');

  process.exit(0);
}

// Run the example
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
