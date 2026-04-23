import { expect, test } from '@playwright/test';

test('app mounts and shows brand', async ({ page }) => {
  await page.goto('/sleeve/');
  await expect(page.getByRole('heading', { name: /sleeve/i })).toBeVisible();
});
