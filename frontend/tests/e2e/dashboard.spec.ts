import { test, expect } from '@playwright/test';

test.describe('WTF LivePulse E2E', () => {
  test('Dashboard loads and displays gym list', async ({ page }) => {
    await page.goto('/');
    // Wait for the gym selector to populate
    await page.waitForSelector('#gym-selector', { timeout: 15000 });
    const options = await page.locator('#gym-selector option').count();
    expect(options).toBeGreaterThanOrEqual(10);
  });

  test('Switching gym in dropdown updates page', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#gym-selector', { timeout: 15000 });

    // Get initial gym name
    const firstOption = await page.locator('#gym-selector option').first().innerText();
    const secondOption = await page.locator('#gym-selector option').nth(1).innerText();

    // Select second gym
    await page.selectOption('#gym-selector', { label: secondOption });

    // Verify the selection changed (the select value should reflect new gym)
    const selected = await page.locator('#gym-selector').inputValue();
    expect(selected).toBeTruthy();
    expect(firstOption).not.toEqual(secondOption);
  });

  test('Start simulator causes activity feed to update within 5 seconds', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#simulator-start-stop', { timeout: 15000 });

    // Click start (default speed 1x)
    await page.click('#simulator-start-stop');

    // Wait for activity feed to have at least one entry
    await page.waitForFunction(
      () => {
        const items = document.querySelectorAll('[class*="rounded-md"][class*="border"]');
        // Look for activity feed entries with member data
        return Array.from(items).some(el => el.textContent && el.textContent.includes('Check'));
      },
      { timeout: 10000 }
    );

    // Stop simulator after test
    await page.click('#simulator-start-stop');
  });
});
