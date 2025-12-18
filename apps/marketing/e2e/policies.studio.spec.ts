import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('demoMode', 'true');
    localStorage.setItem('demoRole', 'enterprise');
    localStorage.setItem('api-settings', JSON.stringify({
      apiBaseUrl: 'http://localhost:3000',
      wsBaseUrl: 'ws://localhost:3000',
    }));
  });

  // Optional: stub certain /api/* endpoints if backend doesn't implement them
  await page.route('**/api/**', async (route) => {
    const url = route.request().url();
    if (url.endsWith('/api/metrics')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          metrics: {
            avgApprovalTime: '18 days',
            humanInLoopRate: '12%',
            regulatoryCoverage: '92%',
            auditCompleteness: '100%',
          },
        }),
      });
    }
    if (url.includes('/api/recent-decisions')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    }
    // Fallback: continue unhandled routes to real backend
    return route.continue();
  });
});

test('Policy Management -> Universal Policy Studio flow', async ({ page }) => {
  // Go to Policy Management
  await page.goto('/policies');
  await expect(page.getByRole('heading', { name: 'Policy Management' })).toBeVisible();

  // Open Studio
  await page.getByRole('button', { name: 'Create Policy' }).click();
  await expect(page).toHaveURL(/\/policies\/new$/);

  // Confirm Universal Policy Studio Interface visible
  await expect(page.getByRole('heading', { name: 'Select a Policy Template' })).toBeVisible();
});