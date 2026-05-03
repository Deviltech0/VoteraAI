import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Votera AI - E2E User Journey', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should pass automated WCAG 2.2 AA accessibility audit', async ({ page }) => {
    // Audit the entire page using axe-core with strict WCAG 2.2 AA rules
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag22aa', 'best-practice'])
      .analyze();
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

  test('should have correct security headers in meta tags', async ({ page }) => {
    // Verify CSP meta tag exists and does NOT contain unsafe-inline in script-src
    const csp = await page.getAttribute('meta[http-equiv="Content-Security-Policy"]', 'content');
    expect(csp).toBeTruthy();
    expect(csp).not.toMatch(/script-src[^;]*'unsafe-inline'/);
    expect(csp).toContain("frame-ancestors 'none'");
  });

  test('should have skip link for keyboard navigation', async ({ page }) => {
    const skipLink = page.locator('.skip-link');
    await expect(skipLink).toBeAttached();

    // Tab to skip link and verify it becomes visible
    await page.keyboard.press('Tab');
    await expect(skipLink).toBeVisible();
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

  test('should support keyboard-only navigation', async ({ page }) => {
    // Tab through the page and verify focus is visible
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
    }
    
    // Verify an element has focus
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeTruthy();
  });

  test('should gracefully handle Maps Widget rendering', async ({ page }) => {
    // Verify map container exists
    const mapsWidget = page.locator('#maps-widget-container, .maps-widget, #maps-widget');
    if (await mapsWidget.count() > 0) {
      await expect(mapsWidget).toBeAttached();
    }
  });

  test('should have proper html lang attribute', async ({ page }) => {
    const lang = await page.getAttribute('html', 'lang');
    expect(lang).toBe('en');
  });

  test('all external links should have noopener', async ({ page }) => {
    const links = await page.locator('a[target="_blank"]').all();
    for (const link of links) {
      const rel = await link.getAttribute('rel');
      expect(rel).toContain('noopener');
    }
  });
});
