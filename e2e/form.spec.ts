import { test, expect } from '@playwright/test';

test.describe('Form Navigation and Data Persistence', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should navigate through form pages and persist data', async ({ page }) => {
    // 1. Verify initial state (Main Information page)
    await expect(page.locator('h2#form-title')).toHaveText('Создание персонажа');
    await expect(page.locator('#prev-btn')).toBeDisabled();
    await expect(page.locator('#char-full-name')).toBeVisible();

    // 2. Fill in some main information
    await page.fill('#char-full-name', 'Test Character Name');
    await page.selectOption('#attr-constitution', '5');
    await page.selectOption('#attr-attention', '4');

    // 3. Navigate to the next page
    await page.click('#next-btn');

    // 4. Verify the next page (first skill category page)
    await expect(page.locator('.form-page.active .category-name-input')).toBeVisible();
    await expect(page.locator('#prev-btn')).toBeEnabled();

    // 5. Add a new skill category
    await page.click('#add-category-btn');

    // 6. Verify the new category page
    const newCategoryInput = page.locator('.form-page.active .category-name-input');
    await expect(newCategoryInput).toBeVisible();

    // 7. Navigate back to the main info page
    await page.click('#prev-btn');
    await page.click('#prev-btn');

    // 8. Verify data persistence
    await expect(page.locator('#char-full-name')).toHaveValue('Test Character Name');
    await expect(page.locator('#attr-constitution')).toHaveValue('5');
    await expect(page.locator('#attr-attention')).toHaveValue('4');
  });
});
