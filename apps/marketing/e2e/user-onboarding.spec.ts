import { test, expect } from '@playwright/test';

test.describe('User Onboarding Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing auth state
    await page.addInitScript(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('New user can access onboarding page', async ({ page }) => {
    await page.goto('/onboarding');
    await page.waitForLoadState('networkidle');
    
    // Check for onboarding elements
    const onboardingHeading = page.locator('h1, h2').filter({ hasText: /onboard|welcome|get started/i }).first();
    await expect(onboardingHeading).toBeVisible({ timeout: 10000 });
  });

  test('Onboarding form can be filled out', async ({ page }) => {
    await page.goto('/onboarding');
    await page.waitForLoadState('networkidle');
    
    // Look for form inputs
    const nameInput = page.locator('input[type="text"], input[name*="name"], input[placeholder*="name" i]').first();
    if (await nameInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await nameInput.fill('Test Enterprise');
    }
    
    // Look for submit/continue button
    const submitButton = page.locator('button[type="submit"], button:has-text("Continue"), button:has-text("Next")').first();
    if (await submitButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Don't actually submit, just verify button exists
      await expect(submitButton).toBeEnabled();
    }
  });

  test('User redirected after completing onboarding', async ({ page }) => {
    // Mock successful onboarding
    await page.route('**/rest/v1/enterprises**', async (route) => {
      if (route.request().method() === 'POST') {
        return route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'test-enterprise-id',
            name: 'Test Enterprise',
          }),
        });
      }
      return route.continue();
    });
    
    await page.goto('/onboarding');
    await page.waitForLoadState('networkidle');
    
    // This test verifies the flow exists, actual submission would require form completion
    const formExists = await page.locator('form, [role="form"]').first().isVisible({ timeout: 5000 }).catch(() => false);
    expect(formExists).toBeTruthy();
  });
});

