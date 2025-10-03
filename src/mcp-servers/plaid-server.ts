/**
 * Plaid MCP Server
 *
 * Integrates with Plaid API for banking data (transactions, balances, accounts).
 * Provides secure access to financial data for finance agents.
 *
 * TODO for Claude Code:
 * - Implement Plaid client initialization
 * - Add Link token creation for account connection
 * - Implement transaction sync with database
 * - Add balance checking tools
 * - Handle webhooks for real-time updates
 */

import { tool, createSdkMcpServer } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';
import { PrismaClient } from '../generated/prisma/index.js';
import { credentialsVault } from '../lib/credentials-vault.js';

const prisma = new PrismaClient();

/**
 * Plaid Server Configuration
 *
 * TODO: Initialize Plaid client
 * 1. Install plaid package: npm install plaid
 * 2. Import: import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';
 * 3. Initialize client with env vars:
 *    - PLAID_CLIENT_ID
 *    - PLAID_SECRET
 *    - PLAID_ENV (sandbox, development, production)
 */

// TODO: Initialize Plaid client here
// const plaidClient = new PlaidApi(...);

/**
 * Tool: Create Plaid Link Token
 *
 * Generates a Link token for Plaid Link UI to connect bank accounts.
 *
 * TODO: Implement
 * 1. Call plaidClient.linkTokenCreate()
 * 2. Pass user info and products: ['transactions', 'auth']
 * 3. Set webhook URL for transaction updates
 * 4. Return link token to frontend
 * 5. Frontend uses this token to launch Plaid Link modal
 */
const createLinkToken = tool(
  'create_plaid_link_token',
  'Generate a Plaid Link token to connect a bank account',
  {
    userId: z.string().describe('User ID to link account for'),
  },
  async (args) => {
    // TODO: Implement
    // const request = {
    //   user: { client_user_id: args.userId },
    //   client_name: 'AI Agent Platform',
    //   products: ['transactions', 'auth'],
    //   country_codes: ['US'],
    //   language: 'en',
    //   webhook: 'https://your-domain.com/api/plaid/webhook',
    // };
    // const response = await plaidClient.linkTokenCreate(request);
    // return { content: [{ type: 'text', text: JSON.stringify(response.data) }] };

    return {
      content: [{
        type: 'text',
        text: 'Not implemented: create_plaid_link_token',
      }],
    };
  }
);

/**
 * Tool: Exchange Public Token
 *
 * After user completes Plaid Link, exchange public_token for access_token.
 *
 * TODO: Implement
 * 1. Call plaidClient.itemPublicTokenExchange()
 * 2. Get access_token and item_id
 * 3. Store in PlaidItem table (encrypted via credentials vault)
 * 4. Get account info via plaidClient.accountsGet()
 * 5. Return success with account details
 */
const exchangePublicToken = tool(
  'exchange_plaid_public_token',
  'Exchange Plaid public token for access token after Link completion',
  {
    userId: z.string().describe('User ID'),
    publicToken: z.string().describe('Public token from Plaid Link'),
  },
  async (args) => {
    // TODO: Implement
    // 1. Exchange token
    // 2. Get accounts
    // 3. Store in database
    // 4. Return account info

    return {
      content: [{
        type: 'text',
        text: 'Not implemented: exchange_plaid_public_token',
      }],
    };
  }
);

/**
 * Tool: Sync Transactions
 *
 * Fetches latest transactions from Plaid and stores in database.
 *
 * TODO: Implement
 * 1. Get PlaidItem from database for user
 * 2. Decrypt access_token via credentials vault
 * 3. Call plaidClient.transactionsSync() with cursor
 * 4. Transform Plaid transactions to our Transaction model
 * 5. Upsert transactions to database
 * 6. Update lastSync timestamp on PlaidItem
 * 7. Return count of new/updated transactions
 *
 * NOTE: Use transactionsSync (new API) not transactionsGet (deprecated)
 */
const syncTransactions = tool(
  'sync_plaid_transactions',
  'Sync latest transactions from Plaid to database',
  {
    userId: z.string().describe('User ID'),
    itemId: z.string().optional().describe('Specific Plaid item ID, or sync all'),
  },
  async (args) => {
    // TODO: Implement
    // 1. Get PlaidItem(s) from database
    // 2. For each item:
    //    a. Get access_token
    //    b. Call transactionsSync
    //    c. Transform and upsert transactions
    //    d. Update cursor and lastSync
    // 3. Return summary

    return {
      content: [{
        type: 'text',
        text: 'Not implemented: sync_plaid_transactions',
      }],
    };
  }
);

/**
 * Tool: Get Account Balances
 *
 * Fetches current balances for all linked accounts.
 *
 * TODO: Implement
 * 1. Get PlaidItem(s) from database
 * 2. For each item, call plaidClient.accountsBalanceGet()
 * 3. Format balances: account name, type, current balance, available balance
 * 4. Return formatted list
 */
const getBalances = tool(
  'get_plaid_balances',
  'Get current account balances from Plaid',
  {
    userId: z.string().describe('User ID'),
  },
  async (args) => {
    // TODO: Implement
    // 1. Get all PlaidItems for user
    // 2. Fetch balances for each
    // 3. Format and return

    return {
      content: [{
        type: 'text',
        text: 'Not implemented: get_plaid_balances',
      }],
    };
  }
);

/**
 * Tool: Get Linked Accounts
 *
 * Lists all bank accounts linked via Plaid.
 *
 * TODO: Implement
 * 1. Query PlaidItem table for user
 * 2. Parse accounts JSON field
 * 3. Return list: institution name, account names, types, masks
 * 4. Include lastSync timestamp
 */
const getLinkedAccounts = tool(
  'get_linked_plaid_accounts',
  'List all bank accounts linked via Plaid',
  {
    userId: z.string().describe('User ID'),
  },
  async (args) => {
    // TODO: Implement
    // Query database and return account list

    return {
      content: [{
        type: 'text',
        text: 'Not implemented: get_linked_plaid_accounts',
      }],
    };
  }
);

/**
 * Tool: Remove Linked Account
 *
 * Unlinks a bank account and deletes stored credentials.
 *
 * TODO: Implement
 * 1. Get PlaidItem from database
 * 2. Call plaidClient.itemRemove() to invalidate access_token
 * 3. Delete PlaidItem from database
 * 4. Optionally: Delete associated transactions
 * 5. Return success
 */
const removeLinkAccount = tool(
  'remove_plaid_account',
  'Unlink a bank account from Plaid',
  {
    userId: z.string().describe('User ID'),
    itemId: z.string().describe('Plaid item ID to remove'),
  },
  async (args) => {
    // TODO: Implement
    // 1. Remove from Plaid
    // 2. Delete from database
    // 3. Clean up transactions?

    return {
      content: [{
        type: 'text',
        text: 'Not implemented: remove_plaid_account',
      }],
    };
  }
);

// TODO: Export MCP server with all tools
export const plaidServer = createSdkMcpServer({
  name: 'plaid',
  version: '1.0.0',
  tools: [
    createLinkToken,
    exchangePublicToken,
    syncTransactions,
    getBalances,
    getLinkedAccounts,
    removeLinkAccount,
  ],
});

/**
 * Webhook Handler for Plaid
 *
 * TODO: Create separate endpoint in src/web/api/plaid-webhook.ts
 *
 * Handles real-time updates from Plaid:
 * - TRANSACTIONS_REMOVED: Transaction was deleted
 * - DEFAULT_UPDATE: New transactions available
 * - INITIAL_UPDATE: Initial transactions ready
 * - HISTORICAL_UPDATE: Historical transactions ready
 * - ITEM_LOGIN_REQUIRED: User needs to re-authenticate
 * - ERROR: Item error occurred
 *
 * Implementation:
 * 1. Verify webhook signature (Plaid provides verification)
 * 2. Parse webhook type
 * 3. For transaction webhooks: trigger syncTransactions
 * 4. For error webhooks: notify user, mark item as needs_reauth
 * 5. Log webhook for debugging
 */
