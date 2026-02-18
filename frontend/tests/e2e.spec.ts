import { test, expect } from '@playwright/test';

test.describe('Visitor Flow', () => {
    test('should load homepage and navigate to bounty board', async ({ page }) => {
        await page.goto('/', { waitUntil: 'domcontentloaded' });
        await expect(page).toHaveTitle(/Soul-Society/, { timeout: 10000 });

        await expect(page.getByText('AidBridge')).toBeVisible({ timeout: 10000 });

        await page.goto('/bounty-board', { waitUntil: 'domcontentloaded' });
        await expect(page.getByText('Hollow Bounty Board')).toBeVisible({ timeout: 15000 });

        const body = page.locator('body');
        await expect(body).toContainText(/(Hollow Bounty Board|No active|campaigns|tasks)/i, { timeout: 5000 });
    });
});
