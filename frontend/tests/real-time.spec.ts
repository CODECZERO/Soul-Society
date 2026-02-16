import { test, expect } from '@playwright/test';

test.describe('Real-Time Data Integration', () => {
    test.beforeEach(async ({ page }) => {
        // Ensure we are running against the local dev server which connects to the real backend
        // baseURL is set to http://localhost:3000 in playwright.config.ts
    });

    test('should fetch and display real campaigns from backend', async ({ page }) => {
        await page.goto('http://127.0.0.1:3000/');

        // Wait for the skeleton loader to disappear
        await expect(page.locator('.animate-pulse').first()).toBeHidden({ timeout: 10000 });

        // Check if we have active campaigns or the "No active campaigns" message
        // This confirms the API call completed successfully (success or empty state)
        const hasCampaigns = await page.locator('text=Active Campaigns').isVisible();
        expect(hasCampaigns).toBeTruthy();

        // If campaigns exist, verify card structure
        const cards = page.locator('.rounded-xl.border.bg-card');
        if (await cards.count() > 0) {
            await expect(cards.first().getByText(/Raised|Goal/)).toBeVisible();
        } else {
            await expect(page.getByText('No active campaigns yet')).toBeVisible();
        }
    });

    test('should verify API test page connectivity', async ({ page }) => {
        await page.goto('http://127.0.0.1:3000/api-test');

        // Wait for results to populate
        await expect(page.getByText('Loading...')).toBeHidden();

        // Check for success indicators
        await expect(page.locator('pre').first()).toBeVisible();
        await expect(page.getByText('Error:')).toBeHidden();
    });
});
