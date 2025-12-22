import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('demoMode', 'true');
    localStorage.setItem('demoRole', 'enterprise');
  });
});

test('VERA Chat widget opens and displays interface', async ({ page }) => {
  await page.goto('/vera');
  await page.waitForLoadState('networkidle');
  await expect(page.getByText(/Demo Scenarios|Talk to VERA/i)).toBeVisible({ timeout: 10000 });
  
  // Check for chat interface elements (inline chat input)
  await expect(page.getByPlaceholder(/Ask VERA/i)).toBeVisible({ timeout: 10000 });
});

test('VERA Chat can submit a query', async ({ page }) => {
  await page.goto('/vera');
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
  
  // Find inline chat input and type message (opens modal with widget)
  const chatInput = page.getByPlaceholder(/Ask VERA/i);
  await expect(chatInput).toBeVisible({ timeout: 10000 });
  await chatInput.fill('What is the policy for AI tools?');
  await chatInput.press('Enter');
  
  // Wait for response
  await expect(page.locator('text=This is a test response from VERA').or(page.locator('text=demo mode - live agent unavailable')))
    .toBeVisible({ timeout: 10000 });
});

test('VERA Dashboard displays metrics', async ({ page }) => {
  await page.goto('/vera');
  await page.waitForLoadState('networkidle');
  
  // Check for demo UI cues / metrics badges on marketing VERA page
  await expect(page.getByText(/SYSTEM READY/i)).toBeVisible({ timeout: 10000 });
  await expect(page.getByText(/partners/i).first()).toBeVisible({ timeout: 10000 });
  await expect(page.getByText(/auto-clear/i).first()).toBeVisible({ timeout: 10000 });
});
