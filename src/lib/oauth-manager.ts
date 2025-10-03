/**
 * OAuth Manager
 *
 * Handles OAuth 2.0 flows for Google services (Gmail, Calendar, etc.)
 * Manages token storage, refresh, and validation.
 *
 * TODO for Claude Code:
 * - Implement OAuth 2.0 authorization flow
 * - Add token refresh logic
 * - Implement token validation
 * - Add error handling for expired/invalid tokens
 * - Integrate with credentials vault for secure storage
 */

import { z } from 'zod';
import { credentialsVault } from './credentials-vault.js';

// OAuth Configuration Schema
export const OAuthConfigSchema = z.object({
  clientId: z.string(),
  clientSecret: z.string(),
  redirectUri: z.string(),
  scopes: z.array(z.string()),
});

export type OAuthConfig = z.infer<typeof OAuthConfigSchema>;

// OAuth Token Schema
export const OAuthTokenSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string().optional(),
  expiresAt: z.number(), // Unix timestamp
  scopes: z.array(z.string()),
});

export type OAuthToken = z.infer<typeof OAuthTokenSchema>;

/**
 * OAuth Manager for Google Services
 *
 * TODO: Implement the following methods:
 *
 * 1. getAuthorizationUrl(service: string, state?: string): Promise<string>
 *    - Generate OAuth authorization URL
 *    - Include state parameter for CSRF protection
 *    - Return URL to redirect user to Google consent screen
 *
 * 2. handleCallback(code: string, state: string): Promise<OAuthToken>
 *    - Exchange authorization code for access token
 *    - Validate state parameter
 *    - Store tokens securely in database via credentials vault
 *    - Return token object
 *
 * 3. refreshToken(userId: string, service: string): Promise<OAuthToken>
 *    - Check if token is expired
 *    - If expired, use refresh token to get new access token
 *    - Update stored credentials
 *    - Return new token
 *
 * 4. getValidToken(userId: string, service: string): Promise<string>
 *    - Retrieve token from database
 *    - Check if expired (using expiresAt timestamp)
 *    - If expired, automatically refresh
 *    - Return valid access token ready to use
 *
 * 5. revokeToken(userId: string, service: string): Promise<void>
 *    - Call Google's token revocation endpoint
 *    - Delete credentials from database
 *    - Clean up any cached data
 */

export class OAuthManager {
  private configs: Map<string, OAuthConfig> = new Map();
  private readonly GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
  private readonly GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
  private readonly GOOGLE_REVOKE_URL = 'https://oauth2.googleapis.com/revoke';

  // Service to scopes mapping
  private readonly SERVICE_SCOPES: Record<string, string[]> = {
    gmail: [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.send',
    ],
    'google-calendar': [
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/calendar.events',
    ],
    'google-drive': [
      'https://www.googleapis.com/auth/drive.readonly',
      'https://www.googleapis.com/auth/drive.file',
    ],
  };

  constructor() {
    // Load Google OAuth configuration from environment
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      console.warn('⚠️  Google OAuth credentials not configured. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI');
    } else {
      // Initialize configs for each Google service
      for (const [service, scopes] of Object.entries(this.SERVICE_SCOPES)) {
        this.configs.set(service, {
          clientId,
          clientSecret,
          redirectUri,
          scopes,
        });
      }
      console.log('✓ OAuth Manager initialized with services:', Array.from(this.configs.keys()).join(', '));
    }
  }

  /**
   * Generates OAuth authorization URL for a service
   * User will be redirected to this URL to grant permissions
   */
  async getAuthorizationUrl(service: string, userId: string, state?: string): Promise<string> {
    const config = this.configs.get(service);
    if (!config) {
      throw new Error(`Service '${service}' not configured`);
    }

    // Build authorization URL with query parameters
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      response_type: 'code',
      scope: config.scopes.join(' '),
      access_type: 'offline', // Request refresh token
      prompt: 'consent', // Force consent screen to get refresh token
      state: state || userId, // Use state for CSRF protection
    });

    return `${this.GOOGLE_AUTH_URL}?${params.toString()}`;
  }

  /**
   * Exchanges authorization code for access and refresh tokens
   * Stores tokens securely in the credentials vault
   */
  async handleCallback(code: string, state: string, userId: string, service: string): Promise<OAuthToken> {
    const config = this.configs.get(service);
    if (!config) {
      throw new Error(`Service '${service}' not configured`);
    }

    try {
      // Exchange code for tokens
      const response = await fetch(this.GOOGLE_TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          code,
          client_id: config.clientId,
          client_secret: config.clientSecret,
          redirect_uri: config.redirectUri,
          grant_type: 'authorization_code',
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Token exchange failed: ${error}`);
      }

      const data = await response.json();

      // Calculate expiration timestamp
      const expiresAt = new Date(Date.now() + (data.expires_in * 1000));

      // Store tokens in vault
      await credentialsVault.store({
        userId,
        service,
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt,
        metadata: {
          scopes: config.scopes,
          tokenType: data.token_type,
        },
      });

      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: expiresAt.getTime(),
        scopes: config.scopes,
      };
    } catch (error) {
      console.error('Error handling OAuth callback:', error);
      throw new Error(`OAuth callback failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Refreshes an expired access token using the refresh token
   * Updates stored credentials with new token
   */
  async refreshToken(userId: string, service: string): Promise<OAuthToken> {
    const config = this.configs.get(service);
    if (!config) {
      throw new Error(`Service '${service}' not configured`);
    }

    try {
      // Get current credentials
      const credential = await credentialsVault.retrieve(userId, service);
      if (!credential || !credential.refreshToken) {
        throw new Error('No refresh token available. User must re-authenticate.');
      }

      // Request new access token
      const response = await fetch(this.GOOGLE_TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: config.clientId,
          client_secret: config.clientSecret,
          refresh_token: credential.refreshToken,
          grant_type: 'refresh_token',
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Token refresh failed: ${error}`);
      }

      const data = await response.json();

      // Calculate new expiration
      const expiresAt = new Date(Date.now() + (data.expires_in * 1000));

      // Update stored credentials with new access token
      await credentialsVault.store({
        userId,
        service,
        accessToken: data.access_token,
        refreshToken: credential.refreshToken, // Keep existing refresh token
        expiresAt,
        metadata: credential.metadata,
      });

      console.log(`✓ Refreshed token for ${service} (user: ${userId})`);

      return {
        accessToken: data.access_token,
        refreshToken: credential.refreshToken,
        expiresAt: expiresAt.getTime(),
        scopes: config.scopes,
      };
    } catch (error) {
      console.error('Error refreshing token:', error);
      throw new Error(`Token refresh failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Gets a valid access token, automatically refreshing if expired
   * This is the main method to use when making API calls
   */
  async getValidToken(userId: string, service: string): Promise<string> {
    try {
      // Retrieve stored credentials
      const credential = await credentialsVault.retrieve(userId, service);
      if (!credential) {
        throw new Error('No credentials found. User must authenticate first.');
      }

      // Check if token is expired (with 5 minute buffer)
      const now = Date.now();
      const expiresAt = credential.expiresAt ? credential.expiresAt.getTime() : 0;
      const bufferMs = 5 * 60 * 1000; // 5 minutes

      if (expiresAt - now < bufferMs) {
        console.log(`Token expired or expiring soon for ${service}, refreshing...`);
        const refreshed = await this.refreshToken(userId, service);
        return refreshed.accessToken;
      }

      return credential.accessToken;
    } catch (error) {
      console.error('Error getting valid token:', error);
      throw new Error(`Failed to get valid token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Revokes a token with Google and deletes from local storage
   */
  async revokeToken(userId: string, service: string): Promise<void> {
    try {
      // Get credentials to revoke
      const credential = await credentialsVault.retrieve(userId, service);
      if (!credential) {
        console.log(`No credentials found for ${service} (user: ${userId})`);
        return;
      }

      // Revoke token with Google
      try {
        const response = await fetch(this.GOOGLE_REVOKE_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            token: credential.accessToken,
          }),
        });

        if (!response.ok) {
          console.warn(`Failed to revoke token with Google: ${response.statusText}`);
        }
      } catch (revokeError) {
        console.warn('Error revoking token with Google:', revokeError);
        // Continue to delete local credentials even if revocation fails
      }

      // Delete from local storage
      await credentialsVault.delete(userId, service);

      console.log(`✓ Revoked and deleted credentials for ${service} (user: ${userId})`);
    } catch (error) {
      console.error('Error revoking token:', error);
      throw new Error(`Failed to revoke token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Singleton instance
export const oauthManager = new OAuthManager();
