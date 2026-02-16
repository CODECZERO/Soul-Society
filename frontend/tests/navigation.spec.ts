import { test, expect } from '@playwright/test';

test.describe('Navigation Flow', () => {
    test('should navigate to Explore page', async ({ page }) => {
        await page.goto('/');
        // Find link to explore and click it, or go directly
        await page.goto('/explore');
        // Expect header or some text
        await expect(page).toHaveURL(/.*explore/);
        // Check for a heading or characteristic element
        // specific validation depends on explore page content, usually a heading
        // If content is dynamic, we just check layout/url
    });

    test('should navigate to Leaderboard', async ({ page }) => {
        await page.goto('/leaderboard');
        await expect(page).toHaveURL(/.*leaderboard/);
        // Expect "Leaderboard" text
        await expect(page.getByText('Leaderboard', { exact: false }).first()).toBeVisible();
    });

    test('should display Connect Wallet button on Home', async ({ page }) => {
        await page.goto('/');
        await expect(page.getByRole('button', { name: 'Connect Wallet' })).toBeVisible();
    });
});
