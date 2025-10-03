/**
 * OAuth Authentication API Endpoints
 *
 * Handles OAuth callback and credential management endpoints.
 *
 * TODO for Claude Code:
 * - Implement Google OAuth callback handler
 * - Add credential management endpoints (list, delete)
 * - Add CSRF protection with state parameter validation
 * - Implement session management
 */

import type { Request, Response } from 'express';
import { oauthManager } from '../../lib/oauth-manager.js';
import { credentialsVault } from '../../lib/credentials-vault.js';
import { randomBytes } from 'crypto';

// Simple in-memory state storage for CSRF protection
// In production, use Redis or session store
const stateStorage = new Map<string, { userId: string; service: string; timestamp: number }>();

// Clean up expired states every 10 minutes
setInterval(() => {
  const now = Date.now();
  const expirationMs = 10 * 60 * 1000; // 10 minutes
  const expiredStates: string[] = [];

  stateStorage.forEach((data, state) => {
    if (now - data.timestamp > expirationMs) {
      expiredStates.push(state);
    }
  });

  expiredStates.forEach(state => stateStorage.delete(state));
}, 10 * 60 * 1000);

/**
 * Generates a random state parameter for CSRF protection
 */
function generateState(): string {
  return randomBytes(32).toString('hex');
}

/**
 * GET /api/auth/:service/authorize
 *
 * Initiates OAuth flow by redirecting to service authorization URL
 *
 * TODO: Implement
 * 1. Extract service from params (gmail, google-calendar)
 * 2. Get userId from session (or use temp state storage)
 * 3. Generate random state parameter for CSRF protection
 * 4. Store state in session/redis with userId
 * 5. Get authorization URL from oauthManager
 * 6. Redirect user to Google consent screen
 */
export async function handleAuthorize(req: Request, res: Response) {
  const { service } = req.params;
  const userId = req.query.userId as string || 'user-001'; // TODO: Get from session

  try {
    if (!service) {
      return res.status(400).json({ error: 'Service parameter is required' });
    }

    // Generate random state for CSRF protection
    const state = generateState();

    // Store state with userId and service for validation in callback
    stateStorage.set(state, {
      userId,
      service,
      timestamp: Date.now(),
    });

    // Get authorization URL from OAuth manager
    const authUrl = await oauthManager.getAuthorizationUrl(service, userId, state);

    // Redirect user to Google consent screen
    res.redirect(authUrl);
  } catch (error: any) {
    console.error('Authorization error:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * GET /api/auth/:service/callback
 *
 * Handles OAuth callback from Google
 *
 * TODO: Implement
 * 1. Extract code and state from query params
 * 2. Validate state parameter against stored value
 * 3. Exchange code for tokens via oauthManager
 * 4. Store tokens via credentialsVault
 * 5. Redirect to success page or close popup window
 */
export async function handleCallback(req: Request, res: Response) {
  const { service } = req.params;
  const { code, state, error: oauthError } = req.query;

  // Check for OAuth errors
  if (oauthError) {
    console.error('OAuth error:', oauthError);
    return res.status(400).send(`
      <!DOCTYPE html>
      <html>
        <head><title>Authentication Failed</title></head>
        <body>
          <h1>Authentication Failed</h1>
          <p>Error: ${oauthError}</p>
          <p><a href="/">Return to app</a></p>
        </body>
      </html>
    `);
  }

  if (!code || !state) {
    return res.status(400).json({ error: 'Missing code or state parameter' });
  }

  try {
    // Validate state parameter
    const stateData = stateStorage.get(state as string);
    if (!stateData) {
      return res.status(400).json({ error: 'Invalid or expired state parameter' });
    }

    // Remove state after validation (one-time use)
    stateStorage.delete(state as string);

    const { userId, service: storedService } = stateData;

    // Verify service matches
    if (service !== storedService) {
      return res.status(400).json({ error: 'Service mismatch' });
    }

    // Exchange code for tokens
    await oauthManager.handleCallback(
      code as string,
      state as string,
      userId,
      service
    );

    // Redirect to success page
    res.send(`
      <!DOCTYPE html>
      <html>
        <head><title>Authentication Successful</title></head>
        <body>
          <h1>✓ Authentication Successful</h1>
          <p>You have successfully connected ${service}.</p>
          <p><a href="/">Return to app</a></p>
          <script>
            // Close popup window if opened in popup
            if (window.opener) {
              window.opener.postMessage({ type: 'oauth-success', service: '${service}' }, '*');
              setTimeout(() => window.close(), 2000);
            }
          </script>
        </body>
      </html>
    `);
  } catch (error: any) {
    console.error('Callback error:', error);
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
        <head><title>Authentication Error</title></head>
        <body>
          <h1>Authentication Error</h1>
          <p>Error: ${error.message}</p>
          <p><a href="/">Return to app</a></p>
        </body>
      </html>
    `);
  }
}

/**
 * GET /api/credentials
 *
 * Lists all connected services for current user
 *
 * TODO: Implement
 * 1. Get userId from session
 * 2. Call credentialsVault.list(userId)
 * 3. Return list of services with expiration status
 * 4. Don't return actual tokens (security)
 */
export async function listCredentials(req: Request, res: Response) {
  const userId = req.query.userId as string || 'user-001'; // TODO: Get from session

  try {
    // Get list of connected services
    const credentials = await credentialsVault.list(userId);

    // Add expiration status
    const credentialsWithStatus = credentials.map((cred) => {
      const now = Date.now();
      const expiresAt = cred.expiresAt ? cred.expiresAt.getTime() : null;

      let status = 'active';
      if (expiresAt) {
        if (expiresAt < now) {
          status = 'expired';
        } else if (expiresAt - now < 5 * 60 * 1000) {
          status = 'expiring_soon';
        }
      }

      return {
        service: cred.service,
        expiresAt: cred.expiresAt,
        status,
      };
    });

    res.json({ credentials: credentialsWithStatus });
  } catch (error: any) {
    console.error('List credentials error:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * DELETE /api/credentials/:service
 *
 * Revokes and deletes credentials for a service
 *
 * TODO: Implement
 * 1. Get userId from session
 * 2. Revoke token via oauthManager
 * 3. Delete from vault via credentialsVault
 * 4. Return success
 */
export async function deleteCredential(req: Request, res: Response) {
  const { service } = req.params;
  const userId = req.query.userId as string || 'user-001'; // TODO: Get from session

  try {
    if (!service) {
      return res.status(400).json({ error: 'Service parameter is required' });
    }

    // Revoke token with OAuth provider and delete from vault
    await oauthManager.revokeToken(userId, service);

    res.json({
      success: true,
      message: `Credentials for ${service} have been revoked and deleted`,
    });
  } catch (error: any) {
    console.error('Delete credential error:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * POST /api/credentials/:service/refresh
 *
 * Manually refreshes OAuth token for a service
 *
 * TODO: Implement
 * 1. Get userId from session
 * 2. Call oauthManager.refreshToken
 * 3. Return new expiration time
 */
export async function refreshCredential(req: Request, res: Response) {
  const { service } = req.params;
  const userId = req.query.userId as string || 'user-001'; // TODO: Get from session

  try {
    if (!service) {
      return res.status(400).json({ error: 'Service parameter is required' });
    }

    // Refresh the token
    const token = await oauthManager.refreshToken(userId, service);

    res.json({
      success: true,
      expiresAt: new Date(token.expiresAt),
      message: `Token for ${service} has been refreshed`,
    });
  } catch (error: any) {
    console.error('Refresh credential error:', error);
    res.status(500).json({ error: error.message });
  }
}
