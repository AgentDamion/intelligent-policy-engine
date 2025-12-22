/**
 * Marketing Site E2E Tests
 * 
 * These tests verify the PUBLIC marketing pages that belong to the marketing site.
 * Platform-only routes (enterprise/*, governance/*, vendor/*, auth) are NOT tested here.
 * 
 * Marketing owns:
 * - / (homepage)
 * - /vera (demo VERA conversation)
 * - /workflows (workflow template library)
 * - /pricing, /contact, /about
 * - /governance-lab, /boundary-lab
 * - /who-its-for, /how-it-works
 */

import { test, expect } from '@playwright/test';

test.describe('Marketing Site - Public Pages', () => {
  test('Homepage loads and displays key sections', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check for main headline/value prop (use first() to avoid strict mode violation)
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible({ timeout: 10000 });

    // Check for key marketing elements
    await expect(page.getByText(/governance|compliance|policy/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('Pricing page renders', async ({ page }) => {
    await page.goto('/pricing');
    await page.waitForLoadState('networkidle');

    // Look for any heading or prominent text on pricing page
    await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 10000 });
  });

  test('Contact page renders', async ({ page }) => {
    await page.goto('/contact');
    await page.waitForLoadState('networkidle');

    // Contact page should have a form
    await expect(page.locator('form').first()).toBeVisible({ timeout: 10000 });
  });

  test('Workflow Library page renders', async ({ page }) => {
    await page.goto('/workflows');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: /Workflow Intelligence Library/i })).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Marketing Site - VERA Demo', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('demoMode', 'true');
      localStorage.setItem('demoRole', 'enterprise');
    });
  });

  test('VERA demo page loads with chat interface', async ({ page }) => {
    await page.goto('/vera');
    await page.waitForLoadState('networkidle');

    // Demo scenarios or Talk to VERA copy
    await expect(page.getByText(/Demo Scenarios|Talk to VERA/i)).toBeVisible({ timeout: 10000 });

    // Chat input should be visible
    await expect(page.getByPlaceholder(/Ask VERA/i)).toBeVisible({ timeout: 10000 });
  });

  test('VERA demo shows system status', async ({ page }) => {
    await page.goto('/vera');
    await page.waitForLoadState('networkidle');

    // Check for demo metrics/status
    await expect(page.getByText(/SYSTEM READY/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/partners/i).first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Marketing Site - Legal Pages', () => {
  test('Terms page renders', async ({ page }) => {
    await page.goto('/terms');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: 'Terms of Service' })).toBeVisible({ timeout: 10000 });
  });

  test('Privacy page renders', async ({ page }) => {
    await page.goto('/privacy');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: /privacy policy/i })).toBeVisible({ timeout: 10000 });
  });
});

