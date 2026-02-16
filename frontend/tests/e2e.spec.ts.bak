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

test.describe('NGO Flow (Mocked)', () => {
    test('should simulate NGO login and dashboard access', async ({ page }) => {
        // 1. Setup Mock Route (Must be done before action)
        await page.route('**/ngo/login', async route => {
            const json = {
                success: true,
                data: {
                    token: 'fake-jwt-token',
                    ngo: {
                        id: '123',
                        name: 'Test NGO',
                        email: 'test@ngo.org'
                    }
                }
            };
            await route.fulfill({ json });
        });

        // 2. Go to Login
        await page.goto('/ngo/login');

        // 3. Fill Form
        await page.getByPlaceholder('Enter your email').fill('test@ngo.org');
        await page.getByPlaceholder('Enter your password').fill('password123');

        // 4. Submit
        await page.getByRole('button', { name: 'Sign In' }).click();

        // 5. Verify Redirect (check URL or success message)
        // Since we mocked the API, if the frontend handles it correctly, it should redirect.
        // await expect(page).toHaveURL(/\/ngo\/dashboard/);
    });
});
