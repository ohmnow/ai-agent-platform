/**
 * Email MCP Server
 *
 * Gmail API integration for email management with OAuth authentication
 */

import { createSdkMcpServer, tool } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';
import { google } from 'googleapis';
import { promises as fs } from 'fs';
import { join } from 'path';
import * as readline from 'readline';

// Gmail API client
const gmail = google.gmail('v1');

// OAuth2 client setup - Import proper types
import { OAuth2Client } from 'google-auth-library';

// Type definitions for Gmail API responses
interface EmailHeader {
  name: string;
  value: string;
}

interface EmailDetails {
  id: string;
  from: string;
  subject: string;
  date: string;
  isUnread?: boolean;
  snippet?: string;
}

interface GmailMessage {
  id: string;
  threadId?: string;
  labelIds?: string[];
  snippet?: string;
  payload?: {
    headers?: EmailHeader[];
    body?: {
      data?: string;
    };
    parts?: Array<{
      mimeType: string;
      body?: {
        data?: string;
      };
    }>;
  };
}

let oauth2Client: OAuth2Client | null = null;

// Initialize OAuth2 client with credentials
async function initializeAuth(): Promise<OAuth2Client> {
  if (oauth2Client) return oauth2Client;

  try {
    // Try to load credentials from file
    const credentialsPath = join(process.cwd(), 'credentials.json');
    const credentials = JSON.parse(await fs.readFile(credentialsPath, 'utf8'));

    const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
    oauth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    // Try to load existing token
    const tokenPath = join(process.cwd(), 'token.json');
    try {
      const token = JSON.parse(await fs.readFile(tokenPath, 'utf8'));
      oauth2Client.setCredentials(token);
      console.log('📧 Email authentication loaded from token.json');
    } catch (err) {
      console.log('⚠️  No existing token found. OAuth flow required on first use.');
    }

    return oauth2Client;
  } catch (error) {
    console.error('❌ Failed to initialize Gmail OAuth:', error);
    throw new Error('Gmail credentials not found. Please add credentials.json to project root.');
  }
}

// Handle OAuth flow if needed
async function authenticate(): Promise<OAuth2Client> {
  if (!oauth2Client) {
    await initializeAuth();
  }

  // Check if we have valid credentials
  try {
    await oauth2Client.getAccessToken();
    return oauth2Client;
  } catch (error) {
    console.log('🔐 Starting OAuth flow...');

    // Generate auth URL
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/gmail.modify'
      ],
    });

    console.log('Please visit this URL to authorize the application:', authUrl);

    // Get authorization code from user
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    return new Promise((resolve, reject) => {
      rl.question('Enter the authorization code: ', async (code) => {
        rl.close();

        try {
          const { tokens } = await oauth2Client.getToken(code);
          oauth2Client.setCredentials(tokens);

          // Save token for future use
          const tokenPath = join(process.cwd(), 'token.json');
          await fs.writeFile(tokenPath, JSON.stringify(tokens));

          console.log('✅ Authentication successful! Token saved.');
          resolve(oauth2Client);
        } catch (err) {
          reject(err);
        }
      });
    });
  }
}

// Helper function to parse email body
function parseEmailBody(payload: any): string {
  if (payload.body?.data) {
    return Buffer.from(payload.body.data, 'base64').toString();
  }

  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        return Buffer.from(part.body.data, 'base64').toString();
      }
    }

    // If no plain text, try HTML
    for (const part of payload.parts) {
      if (part.mimeType === 'text/html' && part.body?.data) {
        return Buffer.from(part.body.data, 'base64').toString();
      }
    }
  }

  return 'No readable content found';
}

// Helper function to extract email headers
function getHeader(headers: any[], name: string): string {
  const header = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
  return header?.value || '';
}

// Helper function to get date filter query
function getDateQuery(timeframe: string): string {
  const now = new Date();

  switch (timeframe) {
    case 'today':
      const today = now.toISOString().split('T')[0];
      return `after:${today}`;
    case 'week':
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const weekDate = weekAgo.toISOString().split('T')[0];
      return `after:${weekDate}`;
    case 'all_unread':
      return 'is:unread';
    default:
      return '';
  }
}

const getInboxSummaryTool = tool(
  'get_inbox_summary',
  'Get summarized view of inbox with grouping by sender and priority detection',
  {
    timeframe: z.enum(['today', 'week', 'all_unread']).default('today'),
    maxEmails: z.number().default(50),
  },
  async (args) => {
    try {
      const auth = await authenticate();
      google.options({ auth });

      const query = getDateQuery(args.timeframe);

      const response = await gmail.users.messages.list({
        userId: 'me',
        q: query,
        maxResults: args.maxEmails,
      });

      const messages = response.data.messages || [];

      if (messages.length === 0) {
        return {
          content: [{
            type: 'text',
            text: `No emails found for timeframe: ${args.timeframe}`,
          }],
        };
      }

      // Fetch email details
      const emailDetails = await Promise.all(
        messages.slice(0, 20).map(async (msg) => {
          const email = await gmail.users.messages.get({
            userId: 'me',
            id: msg.id!,
            format: 'metadata',
            metadataHeaders: ['From', 'Subject', 'Date'],
          });

          const headers = email.data.payload?.headers || [];
          const from = getHeader(headers, 'From');
          const subject = getHeader(headers, 'Subject');
          const date = getHeader(headers, 'Date');

          return {
            id: msg.id,
            from: from.replace(/<[^>]*>/g, '').trim(), // Remove email addresses, keep names
            subject,
            date: new Date(date).toLocaleDateString(),
            isUnread: email.data.labelIds?.includes('UNREAD') || false,
          };
        })
      );

      // Group by sender
      const groupedEmails: Record<string, any[]> = {};
      let urgentCount = 0;

      emailDetails.forEach(email => {
        const sender = email.from || 'Unknown';
        if (!groupedEmails[sender]) {
          groupedEmails[sender] = [];
        }
        groupedEmails[sender].push(email);

        // Simple priority detection
        if (email.isUnread && (
          email.subject.toLowerCase().includes('urgent') ||
          email.subject.toLowerCase().includes('asap') ||
          email.subject.includes('!')
        )) {
          urgentCount++;
        }
      });

      // Format summary
      const senderSummary = Object.entries(groupedEmails)
        .map(([sender, emails]) => {
          const unreadCount = emails.filter(e => e.isUnread).length;
          const latestSubject = emails[0].subject;
          return `**${sender}** (${emails.length} emails, ${unreadCount} unread)\n  Latest: "${latestSubject}"`;
        })
        .join('\n\n');

      const summary = `📧 **Inbox Summary (${args.timeframe})**

📊 **Overview:**
- Total emails: ${emailDetails.length}
- Unread: ${emailDetails.filter(e => e.isUnread).length}
- Unique senders: ${Object.keys(groupedEmails).length}
- Potentially urgent: ${urgentCount}

👥 **By Sender:**
${senderSummary}

${urgentCount > 0 ? '⚠️  **Action Required:** You have potentially urgent emails that need attention!' : '✅ No urgent emails detected.'}`;

      return {
        content: [{
          type: 'text',
          text: summary,
        }],
      };

    } catch (error) {
      console.error('Email summary error:', error);
      return {
        content: [{
          type: 'text',
          text: `Error fetching inbox summary: ${error instanceof Error ? error.message : 'Unknown error'}`,
        }],
      };
    }
  }
);

const searchEmailsTool = tool(
  'search_emails',
  'Search emails using Gmail search syntax',
  {
    query: z.string().describe('Search query (Gmail search syntax, e.g., "from:john subject:meeting")'),
    maxResults: z.number().default(20),
  },
  async (args) => {
    try {
      const auth = await authenticate();
      google.options({ auth });

      const response = await gmail.users.messages.list({
        userId: 'me',
        q: args.query,
        maxResults: args.maxResults,
      });

      const messages = response.data.messages || [];

      if (messages.length === 0) {
        return {
          content: [{
            type: 'text',
            text: `No emails found for query: "${args.query}"`,
          }],
        };
      }

      // Fetch email details
      const emailDetails = await Promise.all(
        messages.map(async (msg) => {
          const email = await gmail.users.messages.get({
            userId: 'me',
            id: msg.id!,
            format: 'metadata',
            metadataHeaders: ['From', 'Subject', 'Date'],
          });

          const headers = email.data.payload?.headers || [];
          return {
            id: msg.id,
            from: getHeader(headers, 'From'),
            subject: getHeader(headers, 'Subject'),
            date: new Date(getHeader(headers, 'Date')).toLocaleDateString(),
            snippet: email.data.snippet || '',
          };
        })
      );

      const results = emailDetails
        .map(email => `**From:** ${email.from}\n**Subject:** ${email.subject}\n**Date:** ${email.date}\n**Preview:** ${email.snippet}\n**ID:** ${email.id}`)
        .join('\n\n---\n\n');

      return {
        content: [{
          type: 'text',
          text: `🔍 **Search Results for "${args.query}"**\n\nFound ${emailDetails.length} emails:\n\n${results}`,
        }],
      };

    } catch (error) {
      console.error('Email search error:', error);
      return {
        content: [{
          type: 'text',
          text: `Error searching emails: ${error instanceof Error ? error.message : 'Unknown error'}`,
        }],
      };
    }
  }
);

const getEmailContentTool = tool(
  'get_email_content',
  'Get full content of a specific email by ID',
  {
    emailId: z.string().describe('Gmail message ID'),
  },
  async (args) => {
    try {
      const auth = await authenticate();
      google.options({ auth });

      const email = await gmail.users.messages.get({
        userId: 'me',
        id: args.emailId,
        format: 'full',
      });

      const headers = email.data.payload?.headers || [];
      const from = getHeader(headers, 'From');
      const to = getHeader(headers, 'To');
      const subject = getHeader(headers, 'Subject');
      const date = getHeader(headers, 'Date');

      const body = parseEmailBody(email.data.payload!);

      const content = `📧 **Email Details**

**From:** ${from}
**To:** ${to}
**Subject:** ${subject}
**Date:** ${new Date(date).toLocaleString()}

**Content:**
${body}`;

      return {
        content: [{
          type: 'text',
          text: content,
        }],
      };

    } catch (error) {
      console.error('Get email content error:', error);
      return {
        content: [{
          type: 'text',
          text: `Error fetching email content: ${error instanceof Error ? error.message : 'Unknown error'}`,
        }],
      };
    }
  }
);

const draftReplyTool = tool(
  'draft_reply',
  'Generate email reply draft based on original email context',
  {
    emailId: z.string().describe('Email ID to reply to'),
    tone: z.enum(['formal', 'casual', 'brief', 'detailed']).default('casual'),
    keyPoints: z.array(z.string()).optional().describe('Key points to include in reply'),
    customMessage: z.string().optional().describe('Custom message to include'),
  },
  async (args) => {
    try {
      const auth = await authenticate();
      google.options({ auth });

      // Get original email
      const email = await gmail.users.messages.get({
        userId: 'me',
        id: args.emailId,
        format: 'full',
      });

      const headers = email.data.payload?.headers || [];
      const originalFrom = getHeader(headers, 'From');
      const originalSubject = getHeader(headers, 'Subject');
      const originalBody = parseEmailBody(email.data.payload!);

      // Generate reply subject (add "Re:" if not present)
      const replySubject = originalSubject.toLowerCase().startsWith('re:')
        ? originalSubject
        : `Re: ${originalSubject}`;

      // Generate reply based on tone and context
      let replyBody = '';

      switch (args.tone) {
        case 'formal':
          replyBody = `Dear ${originalFrom.split('<')[0].trim()},

Thank you for your email regarding ${originalSubject}.

${args.customMessage || 'I have reviewed your message and will respond accordingly.'}

${args.keyPoints ? args.keyPoints.map(point => `• ${point}`).join('\n') : ''}

Best regards,
[Your name]`;
          break;

        case 'brief':
          replyBody = `${args.customMessage || 'Thanks for your email.'}

${args.keyPoints ? args.keyPoints.join('. ') + '.' : ''}

Best,
[Your name]`;
          break;

        case 'detailed':
          replyBody = `Hi ${originalFrom.split('<')[0].trim()},

Thank you for reaching out about ${originalSubject}. I've carefully reviewed your message.

${args.customMessage || 'Here is my detailed response:'}

${args.keyPoints ? args.keyPoints.map((point, i) => `${i + 1}. ${point}`).join('\n\n') : ''}

Please let me know if you need any clarification or have additional questions.

Best regards,
[Your name]`;
          break;

        default: // casual
          replyBody = `Hi ${originalFrom.split('<')[0].trim()},

${args.customMessage || 'Thanks for your email!'}

${args.keyPoints ? args.keyPoints.map(point => `• ${point}`).join('\n') : ''}

Best,
[Your name]`;
      }

      const draft = `📝 **Draft Reply**

**To:** ${originalFrom}
**Subject:** ${replySubject}

**Body:**
${replyBody}

---
*This is a draft reply. Review and edit before sending.*`;

      return {
        content: [{
          type: 'text',
          text: draft,
        }],
      };

    } catch (error) {
      console.error('Draft reply error:', error);
      return {
        content: [{
          type: 'text',
          text: `Error generating reply draft: ${error instanceof Error ? error.message : 'Unknown error'}`,
        }],
      };
    }
  }
);

const sendEmailTool = tool(
  'send_email',
  'Send an email (requires explicit user permission)',
  {
    to: z.string().describe('Recipient email address'),
    subject: z.string().describe('Email subject'),
    body: z.string().describe('Email body content'),
    replyToId: z.string().optional().describe('Message ID to reply to'),
  },
  async (args) => {
    try {
      // This would integrate with the permission system
      console.log('⚠️  SEND EMAIL REQUESTED - This requires user permission!');

      // For now, return the email that would be sent for approval
      const emailPreview = `📧 **Email Ready to Send**

**To:** ${args.to}
**Subject:** ${args.subject}
${args.replyToId ? `**In Reply To:** ${args.replyToId}` : ''}

**Body:**
${args.body}

---
⚠️  **Permission Required:** This email is ready to send but requires user approval.
To implement sending, integrate with the permission system in src/lib/permissions.ts`;

      return {
        content: [{
          type: 'text',
          text: emailPreview,
        }],
      };

      // TODO: Implement actual sending after permission granted
      /*
      const auth = await authenticate();
      google.options({ auth });

      const emailText = `To: ${args.to}
Subject: ${args.subject}
${args.replyToId ? `In-Reply-To: ${args.replyToId}` : ''}

${args.body}`;

      const encodedEmail = Buffer.from(emailText).toString('base64url');

      const result = await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedEmail,
          ...(args.replyToId && { threadId: args.replyToId })
        },
      });

      return {
        content: [{
          type: 'text',
          text: `✅ Email sent successfully! Message ID: ${result.data.id}`,
        }],
      };
      */

    } catch (error) {
      console.error('Send email error:', error);
      return {
        content: [{
          type: 'text',
          text: `Error sending email: ${error instanceof Error ? error.message : 'Unknown error'}`,
        }],
      };
    }
  }
);

export const emailServer = createSdkMcpServer({
  name: 'email',
  description: 'Gmail integration for email management, summarization, and drafting',
  tools: [
    getInboxSummaryTool,
    searchEmailsTool,
    getEmailContentTool,
    draftReplyTool,
    sendEmailTool,
  ],
});

/*
OAuth Setup Instructions:

1. Go to Google Cloud Console: https://console.cloud.google.com
2. Create new project or select existing project
3. Enable Gmail API:
   - Go to "APIs & Services" > "Library"
   - Search for "Gmail API"
   - Click "Enable"
4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Select "Desktop application"
   - Download the credentials JSON file
5. Rename the file to "credentials.json" and place in project root
6. First run will prompt for authorization in browser
7. Token will be saved to "token.json" for future use

Required scopes:
- https://www.googleapis.com/auth/gmail.readonly (read emails)
- https://www.googleapis.com/auth/gmail.send (send emails)
- https://www.googleapis.com/auth/gmail.modify (mark as read/unread)
*/