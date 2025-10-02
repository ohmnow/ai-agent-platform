/**
 * Simple test - open browser and manually inspect
 */

import { chromium } from 'playwright';

async function test() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Log all console messages
  page.on('console', msg => {
    console.log(`[BROWSER] ${msg.text()}`);
  });

  await page.goto('http://localhost:3000/dashboard.html');

  console.log('\n✅ Dashboard loaded. Open browser console and run a finance query.');
  console.log('Query: "Show me my October spending"');
  console.log('\nWaiting 5 minutes before closing...\n');

  // Keep open for 5 minutes
  await new Promise(resolve => setTimeout(resolve, 300000));

  await browser.close();
}

test();
