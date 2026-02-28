import { test, expect, Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';

/**
 * E2E test — plays a full game vs AI and records a video.
 * Videos saved to: test-results/
 * Run with: pnpm e2e
 */

function loadCardData(): unknown[] {
  const filePath = path.resolve(__dirname, '../prisma/data/cards.json');
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

async function mockCardsAPI(page: Page) {
  const cards = loadCardData();
  await page.route('**/api/cards*', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: cards }),
    });
  });
}

/** Quick visibility check — very short timeout */
async function isVisible(page: Page, selector: string, ms = 150): Promise<boolean> {
  return page.locator(selector).first().isVisible({ timeout: ms }).catch(() => false);
}

async function isGameOver(page: Page): Promise<boolean> {
  // GameOverScreen has a "Play Again" button
  return isVisible(page, 'button:has-text("Play Again")');
}

async function clickThroughEvaluation(page: Page) {
  for (let i = 0; i < 8; i++) {
    if (!(await isVisible(page, '.fixed.inset-0.z-50', 300))) break;
    await page.locator('.fixed.inset-0.z-50').click();
    await page.waitForTimeout(1000);
  }
}

async function waitForTurnOrEnd(page: Page, maxWait = 45000): Promise<'turn' | 'over' | 'timeout'> {
  const deadline = Date.now() + maxWait;

  while (Date.now() < deadline) {
    // Handle evaluation overlays
    if (await isVisible(page, '.fixed.inset-0.z-50', 100)) {
      await clickThroughEvaluation(page);
    }

    if (await isGameOver(page)) return 'over';

    // Check for the guidance messages that prove it's our turn
    const tapCardVisible = await isVisible(page, ':text("Tap a card in your hand")');
    const noPlaysVisible = await isVisible(page, ':text("No playable cards")');
    const chooseTgtVisible = await isVisible(page, ':text("Choose a target")');

    if (tapCardVisible || noPlaysVisible || chooseTgtVisible) return 'turn';

    await page.waitForTimeout(300);
  }
  return 'timeout';
}

test.describe('Gameplay Recording', () => {
  test('play a full game vs AI', async ({ page }) => {
    await mockCardsAPI(page);

    // --- Lobby: select deck and start ---
    await page.goto('/en/play');
    await page.waitForLoadState('networkidle');

    await page.locator('button', { hasText: 'Leaf Village Aggro' }).click();
    await page.waitForTimeout(400);
    await page.locator('button', { hasText: 'Start Game' }).click();
    await page.waitForURL('**/play/game', { timeout: 15000 });
    await page.waitForTimeout(3000);

    // --- Mulligan ---
    const keepBtn = page.locator('button', { hasText: 'Keep Hand' });
    if (await keepBtn.isVisible({ timeout: 25000 }).catch(() => false)) {
      await page.waitForTimeout(1000);
      await keepBtn.click();
    }

    await expect(page.locator('[data-tutorial="board"]')).toBeVisible({ timeout: 30000 });
    await page.waitForTimeout(1500);

    // --- Main game loop ---
    let cycles = 0;

    while (cycles < 100) {
      cycles++;

      const result = await waitForTurnOrEnd(page);

      if (result === 'over') {
        console.log(`Game over at cycle ${cycles}`);
        break;
      }

      if (result === 'timeout') {
        console.log(`Timeout at cycle ${cycles}`);
        // Try once more to clear overlays
        await clickThroughEvaluation(page);
        if (await isGameOver(page)) break;
        // Force a pass if we somehow have a pass button
        const passBtn = page.locator('button', { hasText: 'Pass' }).first();
        if (await passBtn.isVisible({ timeout: 500 }).catch(() => false)) {
          await passBtn.click();
          await page.waitForTimeout(1000);
        }
        continue;
      }

      // --- It's our turn ---
      let played = false;

      // Try to play up to 3 cards per turn
      for (let attempt = 0; attempt < 3; attempt++) {
        // Get playable (non-disabled) cards in hand
        const handCards = page.locator('[data-tutorial="hand"] button:not([disabled])');
        if ((await handCards.count()) === 0) break;

        await handCards.first().click();
        await page.waitForTimeout(600);

        // Check if guidance changed to "Now tap a mission"
        const missionGuideVisible = await isVisible(page, ':text("Now tap a mission")', 800);

        if (missionGuideVisible) {
          // Find enabled mission buttons that contain "vs" text (actual mission lanes)
          const missionBtns = page.locator('[data-tutorial="board"] button:not([disabled]):has-text("vs")');
          const mCount = await missionBtns.count();

          if (mCount > 0) {
            await missionBtns.first().click();
            await page.waitForTimeout(800);
            played = true;
          } else {
            // Deselect
            await handCards.first().click().catch(() => {});
            await page.waitForTimeout(200);
            break;
          }
        } else {
          // Card didn't select (maybe not playable after all)
          await handCards.first().click().catch(() => {});
          await page.waitForTimeout(200);
          break;
        }

        if (await isGameOver(page)) break;

        // Check if still our turn for another play
        const stillTurn = await isVisible(page, ':text("Tap a card in your hand")');
        if (!stillTurn) break;
      }

      if (await isGameOver(page)) break;

      // Pass if nothing was played
      if (!played) {
        const passBtn = page.locator('button', { hasText: 'Pass' }).first();
        if (await passBtn.isVisible({ timeout: 800 }).catch(() => false)) {
          await passBtn.click();
          await page.waitForTimeout(400);
        }
      }

      // Let AI play
      await page.waitForTimeout(2000);
      await clickThroughEvaluation(page);
      if (await isGameOver(page)) break;
    }

    // Linger on final screen for the video
    await page.waitForTimeout(5000);
    console.log(`Done after ${cycles} cycles! Video in test-results/`);
  });
});
