import { test, expect } from '@playwright/test';

test('Debug - See what is on the enterprise dashboard', async ({ page }) => {
  // Capture console logs
  const consoleLogs: string[] = [];
  page.on('console', (msg) => {
    consoleLogs.push(`${msg.type()}: ${msg.text()}`);
  });

  await page.addInitScript(() => {
    localStorage.setItem('demoMode', 'true');
    localStorage.setItem('demoRole', 'enterprise');
  });
  
  await page.goto('/dashboard');
  await page.waitForLoadState('networkidle');
  
  // Verify localStorage was set correctly
  const demoMode = await page.evaluate(() => localStorage.getItem('demoMode'));
  const demoRole = await page.evaluate(() => localStorage.getItem('demoRole'));
  console.log('Demo mode:', demoMode);
  console.log('Demo role:', demoRole);

  // Check if React root element exists and has content
  const rootExists = await page.locator('#root').count();
  console.log('Root element exists:', rootExists > 0);
  
  if (rootExists > 0) {
    const rootContent = await page.locator('#root').textContent();
    console.log('Root content length:', rootContent?.length || 0);
  }

  console.log('Page title:', await page.title());
  console.log('Current URL:', page.url());
  
  const bodyText = await page.textContent('body');
  console.log('Body text length:', bodyText?.length || 0);
  console.log('Body text preview:', bodyText?.substring(0, 200));

  const headings = page.locator('h1, h2, h3');
  const count = await headings.count();
  console.log('Headings count:', count);
  for (let i = 0; i < Math.min(count, 10); i++) {
    console.log(`Heading ${i}:`, await headings.nth(i).textContent());
  }

  const navElements = page.locator('nav, [role="navigation"]');
  const navCount = await navElements.count();
  console.log('Navigation elements found:', navCount);
  
  // Log any console errors
  console.log('Console logs captured:', consoleLogs.length);
  consoleLogs.forEach((log, index) => {
    if (index < 10) console.log(`Console ${index}:`, log);
  });

  await page.screenshot({ path: 'e2e/screenshots/enterprise-dashboard.png', fullPage: true });

  // Sanity check: the enterprise dashboard header is visible
  await expect(page.getByRole('heading', { name: 'Enterprise Compliance Dashboard' })).toBeVisible();
});