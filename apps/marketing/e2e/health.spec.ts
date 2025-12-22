import { test, expect } from '@playwright/test';

test.skip(process.env.NO_API === 'true', 'Backend API not running on :3000');

test('backend responds at /api', async ({ request }) => {
  const res = await request.get('http://localhost:3000/api');
  expect(res.ok()).toBeTruthy();
  const json = await res.json();
  expect(json).toHaveProperty('status');
});