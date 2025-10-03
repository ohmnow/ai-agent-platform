# OAuth Credentials Infrastructure

This document explains the OAuth credentials infrastructure implementation for Google services (Gmail, Calendar, Drive).

## Overview

The implementation provides:
- Secure storage of OAuth tokens with AES-256-GCM encryption
- OAuth 2.0 authorization flow with Google
- Automatic token refresh when expired
- Token revocation and credential management
- RESTful API endpoints for credential operations

## Architecture

### Components

1. **CredentialsVault** (`src/lib/credentials-vault.ts`)
   - Encrypts/decrypts sensitive tokens using AES-256-GCM
   - Stores credentials in database via Prisma
   - Provides CRUD operations for credentials

2. **OAuthManager** (`src/lib/oauth-manager.ts`)
   - Handles OAuth 2.0 flow with Google
   - Manages token refresh and validation
   - Supports multiple Google services (Gmail, Calendar, Drive)

3. **Auth API Endpoints** (`src/web/api/auth.ts`)
   - REST endpoints for OAuth authorization and callbacks
   - Credential management (list, delete, refresh)
   - CSRF protection with state parameters

4. **Database Models** (`prisma/schema.prisma`)
   - `User`: User accounts
   - `ApiCredential`: Encrypted OAuth tokens per user/service

## Setup

### 1. Configure Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Google OAuth - Get these from Google Cloud Console
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

# Encryption Key - Generate with: openssl rand -hex 32
ENCRYPTION_KEY=your_32_byte_hex_key_here

# Database
DATABASE_URL="file:./dev.db"
```

### 2. Set up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable APIs:
   - Gmail API
   - Google Calendar API
   - Google Drive API (if needed)
4. Configure OAuth consent screen
5. Create OAuth 2.0 credentials (Web application)
6. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/gmail/callback`
   - `http://localhost:3000/api/auth/google-calendar/callback`
   - `http://localhost:3000/api/auth/google-drive/callback`

### 3. Generate Encryption Key

```bash
openssl rand -hex 32
```

Copy the output to your `.env` file as `ENCRYPTION_KEY`.

### 4. Run Database Migration

```bash
npx prisma migrate dev
```

## API Endpoints

### Start OAuth Authorization

```
GET /api/auth/:service/authorize?userId=<userId>
```

**Parameters:**
- `service`: Service to authorize (gmail, google-calendar, google-drive)
- `userId`: User ID (query parameter)

**Example:**
```
GET /api/auth/gmail/authorize?userId=user-001
```

Redirects user to Google consent screen.

### OAuth Callback (handled automatically)

```
GET /api/auth/:service/callback?code=<code>&state=<state>
```

Google redirects here after user authorizes. The endpoint exchanges the code for tokens and stores them securely.

### List Connected Services

```
GET /api/credentials?userId=<userId>
```

**Response:**
```json
{
  "credentials": [
    {
      "service": "gmail",
      "expiresAt": "2024-10-03T12:00:00.000Z",
      "status": "active"
    }
  ]
}
```

### Delete/Revoke Credentials

```
DELETE /api/credentials/:service?userId=<userId>
```

**Example:**
```
DELETE /api/credentials/gmail?userId=user-001
```

**Response:**
```json
{
  "success": true,
  "message": "Credentials for gmail have been revoked and deleted"
}
```

### Refresh Token

```
POST /api/credentials/:service/refresh?userId=<userId>
```

**Example:**
```
POST /api/credentials/gmail/refresh?userId=user-001
```

**Response:**
```json
{
  "success": true,
  "expiresAt": "2024-10-03T13:00:00.000Z",
  "message": "Token for gmail has been refreshed"
}
```

## Usage in Code

### Get a Valid Token for API Calls

```typescript
import { oauthManager } from './lib/oauth-manager.js';

// Automatically refreshes if expired
const accessToken = await oauthManager.getValidToken('user-001', 'gmail');

// Use the token for Gmail API calls
const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages', {
  headers: {
    'Authorization': `Bearer ${accessToken}`,
  },
});
```

### Store Credentials Manually

```typescript
import { credentialsVault } from './lib/credentials-vault.js';

await credentialsVault.store({
  userId: 'user-001',
  service: 'gmail',
  accessToken: 'ya29.a0...',
  refreshToken: '1//0e...',
  expiresAt: new Date(Date.now() + 3600 * 1000),
  metadata: {
    scopes: ['https://www.googleapis.com/auth/gmail.readonly'],
  },
});
```

### Retrieve Credentials

```typescript
const credential = await credentialsVault.retrieve('user-001', 'gmail');

if (credential) {
  console.log('Access Token:', credential.accessToken);
  console.log('Expires At:', credential.expiresAt);
}
```

## Security Features

1. **AES-256-GCM Encryption**: All tokens are encrypted before storage
2. **CSRF Protection**: State parameter validation in OAuth flow
3. **Secure Token Storage**: Tokens never exposed in logs or API responses
4. **Automatic Token Refresh**: Expired tokens refreshed automatically
5. **Token Revocation**: Tokens revoked with Google when deleted

## Supported Services

- **gmail**: Gmail API (read, send emails)
- **google-calendar**: Calendar API (read, create events)
- **google-drive**: Drive API (read, create files)

## Adding New Services

To add a new Google service:

1. Update `SERVICE_SCOPES` in `src/lib/oauth-manager.ts`:
```typescript
private readonly SERVICE_SCOPES: Record<string, string[]> = {
  'new-service': [
    'https://www.googleapis.com/auth/new-service.readonly',
  ],
};
```

2. Enable the API in Google Cloud Console
3. Add redirect URI: `http://localhost:3000/api/auth/new-service/callback`

## Testing

### Test OAuth Flow

1. Start the server:
```bash
npm run server
```

2. Open browser and navigate to:
```
http://localhost:3000/api/auth/gmail/authorize?userId=user-001
```

3. Complete Google authorization
4. Check stored credentials:
```bash
# Using SQLite CLI
sqlite3 dev.db "SELECT userId, service, expiresAt FROM ApiCredential"
```

### Test Token Refresh

```typescript
import { oauthManager } from './lib/oauth-manager.js';

// Force refresh
const token = await oauthManager.refreshToken('user-001', 'gmail');
console.log('New expiration:', new Date(token.expiresAt));
```

## Production Considerations

1. **State Storage**: Replace in-memory state storage with Redis or session store
2. **User Sessions**: Integrate with proper session management instead of passing userId in query params
3. **HTTPS**: Use HTTPS for all OAuth flows
4. **Key Rotation**: Implement encryption key rotation strategy
5. **Audit Logging**: Add comprehensive logging for credential access
6. **Rate Limiting**: Add rate limiting to API endpoints
7. **Error Handling**: Implement user-friendly error pages

## Troubleshooting

### "Encryption key not configured" Error

Make sure `ENCRYPTION_KEY` is set in `.env`:
```bash
openssl rand -hex 32
```

### "Service not configured" Error

Verify `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_REDIRECT_URI` are set in `.env`.

### "Token refresh failed" Error

User needs to re-authenticate. Refresh tokens can expire if:
- User revoked access in Google Account settings
- Token not used for 6 months
- User changed password

### OAuth Redirect URI Mismatch

Ensure redirect URI in `.env` exactly matches the one configured in Google Cloud Console.

## References

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Gmail API Reference](https://developers.google.com/gmail/api)
- [Google Calendar API Reference](https://developers.google.com/calendar)
- [Node.js Crypto Module](https://nodejs.org/api/crypto.html)
- [Prisma Documentation](https://www.prisma.io/docs)
