import { test, expect } from '@playwright/test';

/**
 * E2E test — Card Scanner with real IriunWebcam.
 *
 * Prerequisites:
 * - Iriun Webcam app running on phone + connected via USB/WiFi
 * - Dev server running on :3000
 *
 * Run:
 *   PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test e2e/scanner.spec.ts --headed --reporter=list
 */

// No fake webcam flags — use real camera devices
test.use({
  launchOptions: {
    args: [
      '--use-fake-ui-for-media-stream', // Auto-accept camera prompt (no popup)
    ],
  },
});

test.describe('Card Scanner', () => {
  test.beforeEach(async ({ context }) => {
    await context.grantPermissions(['camera']);
  });

  test('should load scanner page and show camera access button', async ({ page }) => {
    await page.goto('/fr/scanner');
    await expect(page.locator('h1')).toContainText('Scanner de cartes');
    await expect(page.getByRole('button', { name: /accéder à la caméra/i })).toBeVisible();
  });

  test('should start camera, select IriunWebcam, and run recognition', async ({ page }) => {
    test.setTimeout(120_000);

    // Collect console logs
    const logs: string[] = [];
    page.on('console', (msg) => {
      const text = msg.text();
      logs.push(`[${msg.type()}] ${text}`);
      if (
        text.includes('[Init]') ||
        text.includes('[Match]') ||
        text.includes('[Detection]')
      ) {
        console.log(text);
      }
    });
    page.on('pageerror', (err) => {
      console.log(`[PAGE ERROR] ${err.message}`);
    });

    await page.goto('/fr/scanner');

    // Start camera (gets default device first)
    await page.getByRole('button', { name: /accéder à la caméra/i }).click();

    const video = page.locator('video');
    await expect(video).toBeVisible({ timeout: 15_000 });
    await page.waitForFunction(() => {
      const v = document.querySelector('video');
      return v && v.videoWidth > 0 && v.videoHeight > 0;
    }, { timeout: 15_000 });

    // Select IriunWebcam from dropdown
    const select = page.locator('select');
    await expect(select).toBeVisible({ timeout: 5_000 });

    const options = await select.locator('option').allTextContents();
    console.log(`[Camera] Available devices: ${options.join(', ')}`);

    // Find and select Iriun
    const optionElements = select.locator('option');
    const count = await optionElements.count();
    let iriunFound = false;
    for (let i = 0; i < count; i++) {
      const text = await optionElements.nth(i).textContent();
      if (text?.toLowerCase().includes('iriun')) {
        const value = await optionElements.nth(i).getAttribute('value');
        if (value) {
          await select.selectOption(value);
          console.log(`[Camera] Selected: ${text}`);
          iriunFound = true;

          // Wait for camera to reinitialize with IriunWebcam
          await page.waitForFunction(() => {
            const v = document.querySelector('video');
            return v && v.videoWidth > 0 && v.videoHeight > 0;
          }, { timeout: 10_000 });
        }
        break;
      }
    }

    if (!iriunFound) {
      console.log('[Camera] WARNING: IriunWebcam not found! Test will use default camera.');
    }

    await page.screenshot({ path: 'test-results/scanner-01-camera-ready.png' });

    // Start recognition
    const startBtn = page.getByRole('button', { name: /lancer le scan/i });
    await expect(startBtn).toBeVisible({ timeout: 5_000 });
    await startBtn.click();
    console.log('\n=== Recognition started ===');

    // Wait for ML model to load
    await page.waitForTimeout(15_000);
    await page.screenshot({ path: 'test-results/scanner-02-ml-loaded.png' });

    const fpsVisible = await page.locator('text=/IPS|FPS/').first()
      .isVisible({ timeout: 5_000 }).catch(() => false);
    console.log(`FPS indicator: ${fpsVisible}`);

    // Collect recognition for 30 seconds
    console.log('Collecting recognition data for 30s...');
    await page.waitForTimeout(30_000);
    await page.screenshot({ path: 'test-results/scanner-03-after-30s.png' });

    // Summary
    const initLogs = logs.filter((l) => l.includes('[Init]'));
    const matchLogs = logs.filter((l) => l.includes('[Match]'));
    const detectionLogs = logs.filter((l) => l.includes('[Detection]'));

    console.log('\n=== Summary ===');
    console.log(`Init: ${initLogs.length}`);
    for (const log of initLogs) console.log(`  ${log}`);
    console.log(`Matches: ${matchLogs.length}`);
    for (const log of matchLogs.slice(0, 15)) console.log(`  ${log}`);
    if (matchLogs.length > 15) console.log(`  ... and ${matchLogs.length - 15} more`);
    console.log(`Detections (no match): ${detectionLogs.length}`);
    for (const log of detectionLogs.slice(0, 5)) console.log(`  ${log}`);

    const matches = matchLogs.map((l) => {
      const m = l.match(/\[Match\]\s*(\S+)/);
      return m?.[1];
    }).filter(Boolean);
    const uniqueMatches = [...new Set(matches)];
    console.log(`\nUnique card matches: ${uniqueMatches.length > 0 ? uniqueMatches.join(', ') : 'none'}`);

    // Stop
    const stopBtn = page.getByRole('button', { name: /arrêter le scan/i });
    if (await stopBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await stopBtn.click();
    }
  });
});
