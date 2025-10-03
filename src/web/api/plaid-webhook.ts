/**
 * Plaid Webhook Handler
 *
 * Receives real-time updates from Plaid about transactions, errors, and account status.
 *
 * TODO for Claude Code:
 * - Implement webhook signature verification
 * - Handle transaction update webhooks
 * - Handle error webhooks
 * - Trigger background sync jobs
 * - Notify users of auth issues
 */

import type { Request, Response } from 'express';
import { PrismaClient } from '../../generated/prisma/index.js';

const prisma = new PrismaClient();

/**
 * Plaid Webhook Types:
 *
 * TRANSACTIONS:
 * - INITIAL_UPDATE: Historical transactions ready (first sync)
 * - HISTORICAL_UPDATE: Additional historical transactions ready
 * - DEFAULT_UPDATE: New transactions available
 * - TRANSACTIONS_REMOVED: Transactions were deleted/modified
 *
 * ITEM:
 * - ERROR: Item error occurred (login required, etc.)
 * - PENDING_EXPIRATION: Item will expire soon
 * - USER_PERMISSION_REVOKED: User revoked access
 *
 * ASSETS:
 * - PRODUCT_READY: Asset report ready
 * - ERROR: Asset report error
 */

/**
 * POST /api/plaid/webhook
 *
 * Main webhook endpoint for all Plaid events
 *
 * TODO: Implement
 * 1. Verify webhook signature using Plaid webhook verification
 * 2. Parse webhook_type and webhook_code
 * 3. Route to appropriate handler
 * 4. Return 200 OK quickly (< 30s timeout)
 * 5. Process webhook async in background
 */
export async function handlePlaidWebhook(req: Request, res: Response) {
  const { webhook_type, webhook_code, item_id } = req.body;

  console.log(`🔔 Plaid webhook: ${webhook_type} - ${webhook_code} for item ${item_id}`);

  try {
    // TODO: Verify webhook signature
    // const isValid = verifyPlaidWebhookSignature(req);
    // if (!isValid) {
    //   return res.status(401).json({ error: 'Invalid signature' });
    // }

    // Respond quickly
    res.status(200).json({ received: true });

    // Process webhook async
    // processWebhookAsync(webhook_type, webhook_code, req.body);

    // TODO: Implement based on webhook type

  } catch (error: any) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Handle Transaction Webhooks
 *
 * TODO: Implement
 * 1. Find PlaidItem by item_id
 * 2. For DEFAULT_UPDATE/INITIAL_UPDATE:
 *    - Trigger syncTransactions in background
 * 3. For TRANSACTIONS_REMOVED:
 *    - Parse removed_transactions array
 *    - Delete from database
 * 4. Update lastSync timestamp
 */
async function handleTransactionWebhook(
  webhookCode: string,
  itemId: string,
  data: any
) {
  // TODO: Implement
  console.log(`📊 Transaction webhook: ${webhookCode} for ${itemId}`);

  // switch (webhookCode) {
  //   case 'INITIAL_UPDATE':
  //   case 'HISTORICAL_UPDATE':
  //   case 'DEFAULT_UPDATE':
  //     // Trigger transaction sync
  //     break;
  //
  //   case 'TRANSACTIONS_REMOVED':
  //     // Delete removed transactions
  //     const removed = data.removed_transactions || [];
  //     for (const txId of removed) {
  //       await prisma.transaction.deleteMany({
  //         where: {
  //           // Need to store Plaid transaction_id in Transaction model
  //           externalId: txId
  //         }
  //       });
  //     }
  //     break;
  // }
}

/**
 * Handle Item Error Webhooks
 *
 * TODO: Implement
 * 1. Parse error_code from webhook
 * 2. Update PlaidItem status to 'needs_reauth' or 'error'
 * 3. Store error details in PlaidItem.error field
 * 4. Common errors:
 *    - ITEM_LOGIN_REQUIRED: User needs to re-login
 *    - ITEM_LOCKED: Account locked
 *    - ITEM_NOT_SUPPORTED: Institution not supported
 * 5. Notify user via email/dashboard notification
 */
async function handleItemErrorWebhook(
  itemId: string,
  errorCode: string,
  errorMessage: string
) {
  // TODO: Implement
  console.log(`❌ Item error: ${errorCode} - ${errorMessage} for ${itemId}`);

  // await prisma.plaidItem.update({
  //   where: { itemId },
  //   data: {
  //     status: errorCode === 'ITEM_LOGIN_REQUIRED' ? 'needs_reauth' : 'error',
  //     error: JSON.stringify({ code: errorCode, message: errorMessage })
  //   }
  // });

  // TODO: Notify user
  // - Send email
  // - Create in-app notification
  // - Update dashboard status
}

/**
 * Verify Plaid Webhook Signature
 *
 * TODO: Implement webhook signature verification
 * Plaid docs: https://plaid.com/docs/api/webhooks/webhook-verification/
 *
 * 1. Get PLAID_WEBHOOK_VERIFICATION_KEY from environment
 * 2. Extract Plaid-Verification header
 * 3. Verify JWT signature
 * 4. Check exp claim (not expired)
 * 5. Return true if valid
 */
function verifyPlaidWebhookSignature(req: Request): boolean {
  // TODO: Implement
  // const verificationKey = process.env.PLAID_WEBHOOK_VERIFICATION_KEY;
  // const jwt = req.headers['plaid-verification'];
  // ... verify JWT ...
  return true; // For now, skip verification in development
}

/**
 * Background Webhook Processor
 *
 * TODO: Implement async webhook processing
 * 1. Queue webhook for background processing
 * 2. Use job queue (Bull, BullMQ) or simple async
 * 3. Process webhooks in order
 * 4. Retry failed webhooks with exponential backoff
 * 5. Log all webhook events for debugging
 */
async function processWebhookAsync(
  webhookType: string,
  webhookCode: string,
  data: any
) {
  // TODO: Implement
  // This allows the webhook endpoint to return 200 quickly
  // while processing happens in background
}
