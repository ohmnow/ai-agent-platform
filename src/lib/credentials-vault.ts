/**
 * Credentials Vault
 *
 * Securely stores and retrieves API credentials and OAuth tokens.
 * Uses encryption for sensitive data stored in database.
 *
 * TODO for Claude Code:
 * - Implement AES-256-GCM encryption for tokens
 * - Add database CRUD operations via Prisma
 * - Implement key rotation capability
 * - Add audit logging for credential access
 */

import { z } from 'zod';
import { PrismaClient } from '../generated/prisma/index.js';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const prisma = new PrismaClient();

// Credential Schema
export const CredentialSchema = z.object({
  userId: z.string(),
  service: z.string(),
  accessToken: z.string(),
  refreshToken: z.string().optional(),
  expiresAt: z.date().optional(),
  metadata: z.record(z.any()).optional(),
});

export type Credential = z.infer<typeof CredentialSchema>;

/**
 * Credentials Vault
 *
 * TODO: Implement the following methods:
 *
 * 1. encrypt(plaintext: string): Promise<string>
 *    - Use crypto module with AES-256-GCM
 *    - Generate random IV for each encryption
 *    - Store IV with ciphertext (prepend or JSON)
 *    - Return encrypted string
 *    - Use ENCRYPTION_KEY from environment variable
 *
 * 2. decrypt(ciphertext: string): Promise<string>
 *    - Extract IV from ciphertext
 *    - Decrypt using AES-256-GCM
 *    - Return plaintext
 *    - Handle decryption errors gracefully
 *
 * 3. store(credential: Credential): Promise<void>
 *    - Encrypt accessToken and refreshToken
 *    - Store in ApiCredential table via Prisma
 *    - Use upsert to handle updates
 *    - Serialize metadata as JSON string
 *
 * 4. retrieve(userId: string, service: string): Promise<Credential | null>
 *    - Query ApiCredential table
 *    - Decrypt tokens
 *    - Parse metadata JSON
 *    - Return credential object or null if not found
 *
 * 5. delete(userId: string, service: string): Promise<void>
 *    - Remove credential from database
 *    - Log deletion for audit trail
 *
 * 6. list(userId: string): Promise<Array<{ service: string; expiresAt?: Date }>>
 *    - Return list of services user has connected
 *    - Don't return actual tokens (security)
 *    - Include expiration status
 */

export class CredentialsVault {
  private encryptionKey: string;

  constructor() {
    // TODO: Load encryption key from environment
    // ENCRYPTION_KEY should be 32 bytes (256 bits) for AES-256
    // Generate with: openssl rand -hex 32
    this.encryptionKey = process.env.ENCRYPTION_KEY || '';

    if (!this.encryptionKey) {
      console.warn('⚠️  ENCRYPTION_KEY not set! Credentials will not be secure!');
    }
  }

  /**
   * Encrypts plaintext using AES-256-GCM
   * Returns base64 encoded string with format: IV:AuthTag:Ciphertext
   */
  private async encrypt(plaintext: string): Promise<string> {
    if (!this.encryptionKey) {
      throw new Error('Encryption key not configured');
    }

    // Convert hex key to buffer (32 bytes for AES-256)
    const key = Buffer.from(this.encryptionKey, 'hex');

    // Generate random 12-byte IV (recommended for GCM)
    const iv = randomBytes(12);

    // Create cipher
    const cipher = createCipheriv('aes-256-gcm', key, iv);

    // Encrypt the plaintext
    let encrypted = cipher.update(plaintext, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    // Get authentication tag
    const authTag = cipher.getAuthTag();

    // Combine IV, authTag, and ciphertext (all base64 encoded, separated by :)
    return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
  }

  /**
   * Decrypts ciphertext encrypted with AES-256-GCM
   * Expects format: IV:AuthTag:Ciphertext (all base64 encoded)
   */
  private async decrypt(ciphertext: string): Promise<string> {
    if (!this.encryptionKey) {
      throw new Error('Encryption key not configured');
    }

    try {
      // Convert hex key to buffer
      const key = Buffer.from(this.encryptionKey, 'hex');

      // Split the ciphertext into components
      const parts = ciphertext.split(':');
      if (parts.length !== 3) {
        throw new Error('Invalid ciphertext format');
      }

      const iv = Buffer.from(parts[0], 'base64');
      const authTag = Buffer.from(parts[1], 'base64');
      const encrypted = parts[2];

      // Create decipher
      const decipher = createDecipheriv('aes-256-gcm', key, iv);
      decipher.setAuthTag(authTag);

      // Decrypt
      let decrypted = decipher.update(encrypted, 'base64', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Stores or updates credentials for a user and service
   * Encrypts tokens before storing
   */
  async store(credential: Credential): Promise<void> {
    try {
      // Validate input
      CredentialSchema.parse(credential);

      // Encrypt tokens
      const encryptedAccessToken = await this.encrypt(credential.accessToken);
      const encryptedRefreshToken = credential.refreshToken
        ? await this.encrypt(credential.refreshToken)
        : null;

      // Serialize metadata to JSON string
      const metadataJson = credential.metadata
        ? JSON.stringify(credential.metadata)
        : null;

      // Upsert to database
      await prisma.apiCredential.upsert({
        where: {
          userId_service: {
            userId: credential.userId,
            service: credential.service,
          },
        },
        update: {
          accessToken: encryptedAccessToken,
          refreshToken: encryptedRefreshToken,
          expiresAt: credential.expiresAt,
          metadata: metadataJson,
          updatedAt: new Date(),
        },
        create: {
          userId: credential.userId,
          service: credential.service,
          accessToken: encryptedAccessToken,
          refreshToken: encryptedRefreshToken,
          expiresAt: credential.expiresAt,
          metadata: metadataJson,
        },
      });

      console.log(`✓ Stored credentials for ${credential.service} (user: ${credential.userId})`);
    } catch (error) {
      console.error('Error storing credentials:', error);
      throw new Error(`Failed to store credentials: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Retrieves and decrypts credentials for a user and service
   */
  async retrieve(userId: string, service: string): Promise<Credential | null> {
    try {
      // Query database
      const record = await prisma.apiCredential.findUnique({
        where: {
          userId_service: {
            userId,
            service,
          },
        },
      });

      if (!record) {
        return null;
      }

      // Decrypt tokens
      const accessToken = await this.decrypt(record.accessToken);
      const refreshToken = record.refreshToken
        ? await this.decrypt(record.refreshToken)
        : undefined;

      // Parse metadata
      const metadata = record.metadata
        ? JSON.parse(record.metadata)
        : undefined;

      return {
        userId: record.userId,
        service: record.service,
        accessToken,
        refreshToken,
        expiresAt: record.expiresAt || undefined,
        metadata,
      };
    } catch (error) {
      console.error('Error retrieving credentials:', error);
      throw new Error(`Failed to retrieve credentials: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Deletes credentials for a user and service
   */
  async delete(userId: string, service: string): Promise<void> {
    try {
      await prisma.apiCredential.delete({
        where: {
          userId_service: {
            userId,
            service,
          },
        },
      });

      console.log(`✓ Deleted credentials for ${service} (user: ${userId})`);
    } catch (error) {
      // If record doesn't exist, that's okay
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
        console.log(`Credentials for ${service} not found (user: ${userId})`);
        return;
      }
      console.error('Error deleting credentials:', error);
      throw new Error(`Failed to delete credentials: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Lists all services a user has connected
   * Does not return actual tokens for security
   */
  async list(userId: string): Promise<Array<{ service: string; expiresAt?: Date }>> {
    try {
      const records = await prisma.apiCredential.findMany({
        where: { userId },
        select: {
          service: true,
          expiresAt: true,
        },
      });

      return records.map((record) => ({
        service: record.service,
        expiresAt: record.expiresAt || undefined,
      }));
    } catch (error) {
      console.error('Error listing credentials:', error);
      throw new Error(`Failed to list credentials: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Updates token expiration without decrypting tokens
   * Useful when refreshing tokens
   */
  async updateExpiration(userId: string, service: string, expiresAt: Date): Promise<void> {
    try {
      await prisma.apiCredential.update({
        where: {
          userId_service: {
            userId,
            service,
          },
        },
        data: {
          expiresAt,
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      console.error('Error updating expiration:', error);
      throw new Error(`Failed to update expiration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Singleton instance
export const credentialsVault = new CredentialsVault();
