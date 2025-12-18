import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('demoMode', 'true');
    localStorage.setItem('demoRole', 'enterprise');
  });
});

test('Enterprise Dashboard renders and nav works', async ({ page }) => {
  // Try main dashboard route first
  await page.goto('/dashboard');
  await page.waitForLoadState('networkidle');
  
  // Wait a bit longer for React to hydrate
  await page.waitForTimeout(2000);

  // Check if we ended up on the right page, try fallback if needed
  const currentUrl = page.url();
  if (!currentUrl.includes('/dashboard') && !await page.getByRole('heading', { name: 'Enterprise Compliance Dashboard' }).isVisible()) {
    console.log('Main route failed, trying /enterprise-dashboard');
    await page.goto('/enterprise-dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
  }

  // Header - increased timeout for React rendering
  await expect(page.getByRole('heading', { level: 1, name: 'Enterprise Compliance Dashboard' }), 
    'Main dashboard heading should be visible'
  ).toBeVisible({ timeout: 10000 });

  // Key sections on dashboard - with longer timeouts
  await expect(page.getByText('Quick Actions')).toBeVisible({ timeout: 5000 });
  await expect(page.getByText('Recent Activity')).toBeVisible({ timeout: 5000 });
  await expect(page.getByText('Policy Management')).toBeVisible({ timeout: 5000 });
  await expect(page.getByText('Compliance Overview')).toBeVisible({ timeout: 5000 });

  // Header actions
  await expect(page.getByRole('button', { name: 'Settings' })).toBeVisible({ timeout: 5000 });
  await expect(page.getByRole('button', { name: 'Create Policy' })).toBeVisible({ timeout: 5000 });

  // Sidebar nav (enterprise) - check for any Analytics link
  const analyticsLink = page.getByText('Analytics').first();
  await expect(analyticsLink).toBeVisible({ timeout: 5000 });
  await expect(page.getByText('Policies')).toBeVisible({ timeout: 5000 });
  await expect(page.getByText('Workflows')).toBeVisible({ timeout: 5000 });
  await expect(page.getByText('Audit Trail')).toBeVisible({ timeout: 5000 });

  // Navigate to Analytics and confirm page header
  await analyticsLink.click();
  
  // Wait for navigation to complete
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  
  await expect(page).toHaveURL(/\/analytics$/, { timeout: 5000 });
  await expect(page.getByRole('heading', { name: 'Analytics Dashboard' })).toBeVisible({ timeout: 10000 });
});