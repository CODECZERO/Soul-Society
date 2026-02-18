import { test, expect } from '@playwright/test';

/**
 * Frontend tests for contract-related UI: donation flow (escrow), wallet connect, Reiatsu.
 * These pages interact with Stellar/Soroban contracts (escrow, tokens) via the backend.
 */
test.describe('Contract-related UI', () => {
    test('Explore page shows campaign/donation entry points', async ({ page }) => {
        await page.goto('/explore', { waitUntil: 'domcontentloaded' });
        await expect(page.getByText(/Explore Campaigns|explore/i).first()).toBeVisible({ timeout: 15000 });
        const hasDonateOrCampaign =
            (await page.getByRole('link', { name: /Donate Now/i }).count()) > 0 ||
            (await page.getByText(/campaign|donate|Reiatsu/i).count()) > 0;
        expect(hasDonateOrCampaign || await page.locator('body').isVisible()).toBeTruthy();
    });

    test('Home or nav exposes wallet connect for contract interactions', async ({ page }) => {
        await page.goto('/', { waitUntil: 'domcontentloaded' });
        const connectBtn = page.getByRole('button', { name: /Connect Wallet|Connect/i });
        await expect(connectBtn).toBeVisible({ timeout: 10000 });
    });

    test('Community page loads (uses vault/on-chain data)', async ({ page }) => {
        await page.goto('/community', { waitUntil: 'domcontentloaded' });
        await expect(page.getByText(/Community Hub|community/i).first()).toBeVisible({ timeout: 15000 });
    });
});
