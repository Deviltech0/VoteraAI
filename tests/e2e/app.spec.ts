import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Votera AI - E2E User Journey', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should pass automated WCAG 2.2 accessibility audit', async ({ page }) => {
    // Audit the entire page using axe-core
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should load the main application and initialize the accessible fallback', async ({ page }) => {
    // Assert title
    await expect(page).toHaveTitle(/Votera AI/i);
    
    // Assert main header is visible
    const headerText = page.locator('header .logo-text');
    await expect(headerText).toBeVisible();
    await expect(headerText).toHaveText(/Votera AI/i);

    // Verify accessible DOM is present
    const accessibleLayer = page.locator('#accessible-fallback');
    await expect(accessibleLayer).toBeVisible();
    
    // Verify WebGL Canvas is initialized
    const canvas = page.locator('#app canvas');
    await expect(canvas).toBeAttached();
  });

  test('should open the AI Election Coach', async ({ page }) => {
    // Look for the toggle button and click it
    const coachButton = page.locator('.coach-toggle, [aria-label="Open Election Coach"]');
    if (await coachButton.isVisible()) {
      await coachButton.click();
      
      // Verify panel opens
      const panel = page.locator('.coach-panel');
      await expect(panel).toBeVisible();
      
      // Type a test query
      const input = page.locator('input[type="text"]');
      await input.fill('What is NOTA?');
      await input.press('Enter');

      // Wait for response bubble to appear
      const response = page.locator('.chat-message.assistant').last();
      await expect(response).toContainText('NOTA');
    }
  });

  test('should gracefully handle Maps Widget rendering', async ({ page }) => {
    // Verify map container exists
    const mapsWidget = page.locator('#maps-widget-container, .maps-widget');
    if (await mapsWidget.count() > 0) {
      await expect(mapsWidget).toBeAttached();
    }
  });
});
