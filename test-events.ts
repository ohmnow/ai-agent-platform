/**
 * Test Event Flow - Trace events from backend to frontend
 */

import { chromium, Browser, Page } from 'playwright';

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testEventFlow() {
  let browser: Browser | null = null;
  let page: Page | null = null;

  try {
    console.log('\n🔍 Testing Event Flow: Backend → API → Frontend\n');
    console.log('='.repeat(50));

    browser = await chromium.launch({ headless: false });
    page = await browser.newPage();

    // Enable console logging from browser
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('📥') || text.includes('Events')) {
        console.log('[BROWSER]', text);
      }
    });

    // Navigate to dashboard
    await page.goto('http://localhost:3000/dashboard.html');
    await sleep(1000);

    console.log('\n📋 TEST: Query that should trigger Task delegation');
    console.log('-'.repeat(50));
    await page.fill('#chat-input', 'Analyze my budget and give me recommendations');
    await page.click('#send-btn');

    console.log('⏳ Waiting for response (20 seconds)...');
    await sleep(20000); // Give it time to complete

    // Check activity log
    const activityLog = await page.locator('#agent-activity').textContent();
    const toolLog = await page.locator('#tool-usage').textContent();

    console.log('\n📊 Activity Log:');
    console.log(activityLog || '(empty)');
    console.log('\n📊 Tool Log:');
    console.log(toolLog || '(empty)');

    console.log('\n✅ Test complete. Check browser console logs above.');
    console.log('\nKeeping browser open for 30 seconds for inspection...');
    await sleep(30000);

  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

testEventFlow();
