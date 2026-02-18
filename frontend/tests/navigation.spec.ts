import { test, expect } from '@playwright/test';

test.describe('Navigation Flow', () => {
    test('should navigate to Explore page', async ({ page }) => {
        await page.goto('/', { waitUntil: 'domcontentloaded' });
        await page.goto('/explore', { waitUntil: 'domcontentloaded' });
        await expect(page).toHaveURL(/.*explore/);
        await expect(page.locator('body')).toBeVisible({ timeout: 10000 });
    });

    test('should navigate to Leaderboard', async ({ page }) => {
        await page.goto('/leaderboard', { waitUntil: 'domcontentloaded' });
        await expect(page).toHaveURL(/.*leaderboard/);
        await expect(page.getByText('Leaderboard', { exact: false }).first()).toBeVisible({ timeout: 15000 });
    });

    test('should display Connect Wallet button on Home', async ({ page }) => {
        await page.goto('/', { waitUntil: 'domcontentloaded' });
        // Button shows "Connect" on small viewport, "Connect Wallet" on larger (responsive header)
        const connectBtn = page.getByRole('button', { name: /Connect(\s+Wallet)?/i });
        await expect(connectBtn).toBeVisible({ timeout: 10000 });
    });

    test('should check NGO Login page static elements', async ({ page }) => {
        await page.goto('/ngo/login', { waitUntil: 'domcontentloaded' });
        await expect(page.getByText('NGO Login', { exact: true })).toBeVisible({ timeout: 10000 });
        await expect(page.getByPlaceholder(/Enter your email/i)).toBeVisible({ timeout: 5000 });
        await expect(page.getByRole('button', { name: /Sign In/i })).toBeVisible({ timeout: 5000 });
    });
});
