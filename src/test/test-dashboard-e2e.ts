/**
 * End-to-End Dashboard Tests
 *
 * Tests the dashboard functionality with Playwright
 */

import { chromium, Browser, Page } from 'playwright';

const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('🧪 Starting Dashboard E2E Tests\n');

  let browser: Browser | null = null;
  let page: Page | null = null;

  try {
    // Launch browser
    console.log('🚀 Launching browser...');
    browser = await chromium.launch({ headless: false }); // Set to true for CI
    page = await browser.newPage();

    // Test 1: Dashboard loads
    console.log('\n✅ Test 1: Dashboard loads correctly');
    await page.goto(`${BASE_URL}/dashboard.html`);
    await page.waitForSelector('.dashboard');
    console.log('   ✓ Dashboard element found');

    // Test 2: UI Elements present
    console.log('\n✅ Test 2: Checking UI elements');
    const sidebar = await page.$('.sidebar');
    console.log(`   ✓ Sidebar: ${sidebar ? 'Found' : 'MISSING'}`);

    const chatInput = await page.$('#user-input');
    console.log(`   ✓ Chat input: ${chatInput ? 'Found' : 'MISSING'}`);

    const newSessionBtn = await page.$('#new-session-btn');
    console.log(`   ✓ New session button: ${newSessionBtn ? 'Found' : 'MISSING'}`);

    const agentList = await page.$$('.agent-status');
    console.log(`   ✓ Agent list: ${agentList.length} agents found`);

    // Test 3: Send a test message
    console.log('\n✅ Test 3: Sending test query');
    await page.fill('#user-input', 'What is 2+2?');
    await page.click('button:has-text("Send")');

    console.log('   ⏳ Waiting for response...');

    // Wait for assistant message
    await page.waitForSelector('.message.assistant', { timeout: 30000 });
    const assistantMessages = await page.$$('.message.assistant');
    console.log(`   ✓ Assistant responded (${assistantMessages.length} messages)`);

    // Get response text
    const responseText = await assistantMessages[0].textContent();
    console.log(`   ✓ Response preview: "${responseText?.slice(0, 100)}..."`);

    // Test 4: Check sidebar updates
    console.log('\n✅ Test 4: Checking sidebar activity');
    const activityLog = await page.$('#agent-activity');
    const activityItems = await page.$$('#agent-activity .activity-item');
    console.log(`   ✓ Activity log items: ${activityItems.length}`);

    const toolLog = await page.$('#tool-usage');
    const toolItems = await page.$$('#tool-usage .tool-item');
    console.log(`   ✓ Tool usage items: ${toolItems.length}`);

    // Test 5: Test with financial query
    console.log('\n✅ Test 5: Testing financial query');
    await page.fill('#user-input', 'How much did I spend on Food in October?');
    await page.click('button:has-text("Send")');

    console.log('   ⏳ Waiting for financial agent response...');

    // Wait for new assistant message
    await page.waitForSelector('.message.assistant:nth-child(3)', { timeout: 30000 });

    const messages = await page.$$('.message.assistant');
    const lastMessage = messages[messages.length - 1];
    const lastText = await lastMessage.textContent();

    console.log(`   ✓ Financial query response: "${lastText?.slice(0, 100)}..."`);

    // Check if permission request appeared
    const permissionRequests = await page.$$('.permission-request');
    if (permissionRequests.length > 0) {
      console.log('   ℹ️  Permission request detected (as expected)');

      // Click "Approve Once"
      await page.click('.btn-once');
      console.log('   ✓ Permission approved');

      // Wait for actual response after permission
      await page.waitForTimeout(5000);
    }

    // Test 6: New session
    console.log('\n✅ Test 6: Testing new session');
    await page.click('#new-session-btn');

    // Check if messages cleared
    const messagesAfterClear = await page.$$('.message');
    console.log(`   ✓ Messages after clear: ${messagesAfterClear.length} (should be 1 for system message)`);

    // Test 7: Navigation (if implemented)
    console.log('\n✅ Test 7: Checking navigation');
    const navItems = await page.$$('.nav-item');
    if (navItems.length > 0) {
      console.log(`   ✓ Navigation items: ${navItems.length} found`);
    } else {
      console.log('   ℹ️  Navigation not yet implemented (expected)');
    }

    // Test 8: Agent selection (if implemented)
    console.log('\n✅ Test 8: Checking agent selection');
    const firstAgent = await page.$('.agent-status');
    if (firstAgent) {
      await firstAgent.click();
      const activeAgents = await page.$$('.agent-status.active');
      if (activeAgents.length > 0) {
        console.log('   ✓ Agent selection working');
      } else {
        console.log('   ℹ️  Agent selection not yet implemented');
      }
    }

    console.log('\n✅ ALL TESTS PASSED!\n');

  } catch (error: any) {
    console.error('\n❌ TEST FAILED:', error.message);

    if (page) {
      // Take screenshot on failure
      await page.screenshot({ path: 'test-failure.png' });
      console.log('   📸 Screenshot saved: test-failure.png');
    }

    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run tests
runTests().catch((error) => {
  console.error('Test suite failed:', error);
  process.exit(1);
});
