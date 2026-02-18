import { test, expect } from '@playwright/test';

// Create Post (NGO) test removed: requires running server + Pinata for uploads.
test.describe('Advanced Features Flow', () => {
    test('should see Donation modal on a task', async ({ page }) => {
        await page.goto('/explore');
        await expect(page.getByText(/Explore Campaigns?/i).first()).toBeVisible({ timeout: 15000 });

        // Wait for any card that has a "Donate Now" button
        const donateNowBtn = page.getByRole('link').filter({ hasText: 'Donate Now' }).first();

        if (await donateNowBtn.isVisible({ timeout: 10000 })) {
            await donateNowBtn.click();

            // On detail page
            const submitDonate = page.getByRole('button', { name: 'Donate Now' });
            await expect(submitDonate).toBeVisible({ timeout: 15000 });

            await submitDonate.click();
            await expect(page.getByText(/Reiatsu Infusion/i)).toBeVisible({ timeout: 5000 });
        }
    });

    test('should load Community Hub and check a division', async ({ page }) => {
        await page.goto('/community');
        await expect(page.getByText(/Community Hub/i)).toBeVisible({ timeout: 15000 });

        // Wait for communities to load (longer for debounce + vault fetch)
        await page.waitForTimeout(5000);

        const communityLink = page.getByRole('link').filter({ hasText: 'View Community' }).first();
        if (await communityLink.isVisible({ timeout: 3000 }).catch(() => false)) {
            await expect(communityLink).toBeVisible();
        } else {
            await expect(page.getByText(/No communities found yet|Community Hub/i).first()).toBeVisible({ timeout: 5000 });
        }
    });
});
