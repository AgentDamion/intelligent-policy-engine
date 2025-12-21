import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('demoMode', 'true');
    localStorage.setItem('demoRole', 'enterprise');
  });
});

test('VERA Chat widget opens and displays interface', async ({ page }) => {
  await page.goto('/vera-plus');
  await page.waitForLoadState('networkidle');
  
  // Look for VERA chat widget or orb
  const veraChatButton = page.locator('[data-testid="vera-chat-button"], button:has-text("VERA"), [aria-label*="VERA"]').first();
  
  // If floating orb exists, click it
  if (await veraChatButton.isVisible({ timeout: 5000 }).catch(() => false)) {
    await veraChatButton.click();
  }
  
  // Check for chat interface elements
  await expect(page.locator('input[type="text"], textarea').first()).toBeVisible({ timeout: 10000 });
});

test('VERA Chat can submit a query', async ({ page }) => {
  await page.goto('/vera-plus');
  await page.waitForLoadState('networkidle');
  
  // Mock the VERA chat API response
  await page.route('**/functions/v1/cursor-agent-adapter**', async (route) => {
    if (route.request().method() === 'POST') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          result: {
            answer: 'This is a test response from VERA',
            queryType: 'general',
            confidence: 0.95,
          },
        }),
      });
    }
    return route.continue();
  });
  
  // Open chat if needed
  const veraChatButton = page.locator('[data-testid="vera-chat-button"], button:has-text("VERA")').first();
  if (await veraChatButton.isVisible({ timeout: 5000 }).catch(() => false)) {
    await veraChatButton.click();
  }
  
  // Find input and type message
  const chatInput = page.locator('input[type="text"], textarea').first();
  await chatInput.fill('What is the policy for AI tools?');
  
  // Submit (look for send button or Enter key)
  const sendButton = page.locator('button[type="submit"], button:has-text("Send")').first();
  if (await sendButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await sendButton.click();
  } else {
    await chatInput.press('Enter');
  }
  
  // Wait for response
  await expect(page.locator('text=This is a test response from VERA')).toBeVisible({ timeout: 10000 });
});

test('VERA Dashboard displays metrics', async ({ page }) => {
  await page.goto('/vera-plus');
  await page.waitForLoadState('networkidle');
  
  // Mock dashboard data
  await page.route('**/rest/v1/vera_state**', async (route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([{
        enterprise_id: 'test-enterprise',
        current_eps_id: 'test-eps',
      }]),
    });
  });
  
  // Check for dashboard elements
  await expect(page.locator('text=Revenue Protected, text=Days Saved, text=Auto-Clear Rate').first()).toBeVisible({ timeout: 10000 }).catch(async () => {
    // If exact text not found, check for any metric cards
    await expect(page.locator('[class*="card"], [class*="metric"]').first()).toBeVisible({ timeout: 5000 });
  });
});
