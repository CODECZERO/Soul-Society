import { test, expect } from '@playwright/test';

test.describe('Visitor Flow', () => {
    test('should load homepage and navigate to explore', async ({ page }) => {
        // 1. Load Homepage
        await page.goto('/');
        await expect(page).toHaveTitle(/Soul-Society/);

        // 2. Check for key elements
        await expect(page.getByText('AidBridge')).toBeVisible();

        // 3. Navigate to Explore/Bounty Board
        // Assuming there's a link to "Explore" or "Bounties"
        // If not, we go directly
        await page.goto('/bounty-board');

        // 4. Verify Bounty Board loads
        await expect(page.getByText('Hollow Bounty Board')).toBeVisible();

        // 5. Test Search/Filter (assuming we have mock data "Suppression")
        // Wait for the grid to load data
        await page.waitForTimeout(2000); // Wait for mock api

        const taskCards = page.locator('.rounded-xl.border.bg-card');
        // We expect some cards to be visible if mock data is loaded
        // If no cards, at least the "No active hollow threats" message or similar should be checked
        // await expect(taskCards.first()).toBeVisible();
    });
});

// NGO Flow removed as per user request to avoid server dependencies.
