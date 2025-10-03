import { chromium } from 'playwright';

async function test() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Log ALL console messages including errors
  page.on('console', msg => {
    const type = msg.type();
    console.log(`[BROWSER ${type.toUpperCase()}]`, msg.text());
  });

  // Log page errors
  page.on('pageerror', error => {
    console.log('[PAGE ERROR]', error.message);
  });

  await page.goto('http://localhost:3000/dashboard.html');
  await new Promise(resolve => setTimeout(resolve, 2000));

  console.log('\n🔍 Submitting query...\n');
  await page.fill('#chat-input', 'Analyze my spending');
  await page.click('#send-btn');

  console.log('⏳ Waiting 20 seconds...\n');
  await new Promise(resolve => setTimeout(resolve, 20000));

  console.log('\n✅ Done. Check logs above.\n');
  await browser.close();
}

test();
