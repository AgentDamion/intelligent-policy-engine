import { test, expect } from '@playwright/test';

test('VERA+ dashboard renders', async ({ page }) => {
  await page.goto('/vera-plus');
  await expect(page.getByText(/VERA|Velocity Engine/i)).toBeVisible();
});

test('VERA settings renders', async ({ page }) => {
  await page.goto('/vera-settings');
  await expect(page.getByText(/Settings|Mode|Velocity/i)).toBeVisible();
});


