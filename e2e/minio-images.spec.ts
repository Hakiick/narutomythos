import { test, expect } from '@playwright/test';

/**
 * E2E test — Verify card images load from MinIO instead of CDN.
 *
 * Next.js Image proxies through /_next/image?url=<encoded>&w=&q=
 * so we check the encoded URL parameter, not the raw img src.
 */
test.describe('MinIO Image Storage', () => {
  test('card grid should load images from MinIO', async ({ page }) => {
    const imageRequests: string[] = [];

    // Intercept all image requests to track MinIO vs CDN
    page.on('request', (request) => {
      const url = request.url();
      if (url.includes('/_next/image')) {
        imageRequests.push(url);
      }
    });

    await page.goto('/fr/cards');
    await page.waitForLoadState('networkidle');

    // Wait for card grid to render
    await page.waitForSelector('img', { timeout: 10_000 });
    await page.waitForTimeout(2000);

    // Check img src attributes — Next.js Image uses /_next/image?url=<encoded>
    const allImgSrcs = await page.locator('img').evaluateAll((imgs) =>
      imgs.map((img) => (img as HTMLImageElement).src)
    );

    const minioImages = allImgSrcs.filter((src) =>
      src.includes('localhost%3A9000') || src.includes('localhost:9000')
    );
    const cdnImages = allImgSrcs.filter((src) =>
      src.includes('lirp.cdn-website.com')
    );

    console.log(`Total images: ${allImgSrcs.length}`);
    console.log(`MinIO images: ${minioImages.length}`);
    console.log(`CDN images: ${cdnImages.length}`);
    if (minioImages.length > 0) {
      console.log(`Sample MinIO src: ${minioImages[0].substring(0, 120)}...`);
    }

    await page.screenshot({ path: 'test-results/minio-01-cards-grid.png' });

    // Should have MinIO images, zero CDN images
    expect(minioImages.length).toBeGreaterThan(0);
    expect(cdnImages.length).toBe(0);
  });

  test('card detail dialog should load image from MinIO', async ({ page }) => {
    await page.goto('/fr/cards');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('img', { timeout: 10_000 });

    // Click first card to open detail dialog
    const firstCard = page.locator('[role="button"]').first();
    await firstCard.click();

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(1000);

    // Check dialog image src
    const dialogImgSrcs = await dialog.locator('img').evaluateAll((imgs) =>
      imgs.map((img) => (img as HTMLImageElement).src)
    );

    const minioDialogImages = dialogImgSrcs.filter((src) =>
      src.includes('localhost%3A9000') || src.includes('localhost:9000')
    );

    console.log(`Dialog images: ${dialogImgSrcs.length}`);
    console.log(`Dialog MinIO images: ${minioDialogImages.length}`);

    await page.screenshot({ path: 'test-results/minio-02-card-detail.png' });

    expect(minioDialogImages.length).toBeGreaterThan(0);
  });
});
