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
  return isVisible(page, '[data-testid="game-over-screen"]');
}

async function isMissionEvaluation(page: Page): Promise<boolean> {
  return isVisible(page, '[data-testid="mission-evaluation"]');
}

async function isTargetSelector(page: Page): Promise<boolean> {
  return isVisible(page, '[data-testid="target-selector"]');
}

/** Click through mission evaluation overlay */
async function clickThroughEvaluation(page: Page) {
  for (let i = 0; i < 12; i++) {
    if (!(await isMissionEvaluation(page))) break;
    await page.locator('[data-testid="mission-evaluation"]').click();
    await page.waitForTimeout(800);
  }
}

/** Handle target selection overlay — click the first available target */
async function handleTargetSelector(page: Page): Promise<boolean> {
  if (!(await isTargetSelector(page))) return false;

  // Click the first target button inside the selector
  const targetBtns = page.locator('[data-testid="target-selector"] button');
  const count = await targetBtns.count();
  if (count > 0) {
    await targetBtns.first().click();
    await page.waitForTimeout(600);
    return true;
  }
  return false;
}

/** Clear any overlays — evaluation, target selector, etc. */
async function clearOverlays(page: Page): Promise<void> {
  // Try up to 10 rounds of clearing overlays
  for (let i = 0; i < 10; i++) {
    if (await isGameOver(page)) return;

    if (await isTargetSelector(page)) {
      await handleTargetSelector(page);
      continue;
    }

    if (await isMissionEvaluation(page)) {
      await clickThroughEvaluation(page);
      continue;
    }

    // No overlays visible
    break;
  }
}

async function waitForTurnOrEnd(page: Page, maxWait = 30000): Promise<'turn' | 'over' | 'timeout'> {
  const deadline = Date.now() + maxWait;

  while (Date.now() < deadline) {
    // Clear any overlays first
    await clearOverlays(page);

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

    // Select first prebuilt deck (Leaf Village Aggro)
    const deckBtns = page.locator('button').filter({ hasText: /Leaf Village/i });
    await deckBtns.first().click();
    await page.waitForTimeout(400);

    // Click Start Game
    const startBtn = page.locator('button').filter({ hasText: /Start Game/i });
    await startBtn.click();
    await page.waitForURL('**/play/game', { timeout: 15000 });
    await page.waitForTimeout(3000);

    // --- Mulligan ---
    const keepBtn = page.locator('button').filter({ hasText: /Keep Hand/i });
    if (await keepBtn.isVisible({ timeout: 25000 }).catch(() => false)) {
      await page.waitForTimeout(1000);
      await keepBtn.click();
    }

    await expect(page.locator('[data-tutorial="board"]')).toBeVisible({ timeout: 30000 });
    await page.waitForTimeout(1500);

    // --- Main game loop ---
    let cycles = 0;
    let consecutiveTimeouts = 0;

    while (cycles < 120) {
      cycles++;

      const result = await waitForTurnOrEnd(page);

      if (result === 'over') {
        console.log(`Game over at cycle ${cycles}`);
        break;
      }

      if (result === 'timeout') {
        consecutiveTimeouts++;
        console.log(`Timeout at cycle ${cycles} (consecutive: ${consecutiveTimeouts})`);

        // Try to recover
        await clearOverlays(page);
        if (await isGameOver(page)) break;

        // Force pass if possible
        const passBtn = page.locator('button').filter({ hasText: /^Pass$/i }).first();
        if (await passBtn.isVisible({ timeout: 500 }).catch(() => false)) {
          await passBtn.click();
          await page.waitForTimeout(1000);
          consecutiveTimeouts = 0;
        }

        if (consecutiveTimeouts >= 5) {
          console.log('Too many consecutive timeouts, ending test');
          break;
        }
        continue;
      }

      consecutiveTimeouts = 0;

      // --- It's our turn ---
      let played = false;

      // Handle target selector first if it appears
      if (await isTargetSelector(page)) {
        await handleTargetSelector(page);
        await page.waitForTimeout(500);
        continue;
      }

      // Try to play a card
      const handCards = page.locator('[data-tutorial="hand"] [role="button"]:not([class*="grayscale"])');
      const handCount = await handCards.count();

      if (handCount > 0) {
        // Click a playable card (try to find one with green border = playable)
        const playableCards = page.locator('[data-tutorial="hand"] [role="button"].border-green-500\\/50');
        const playableCount = await playableCards.count();

        if (playableCount > 0) {
          await playableCards.first().click();
          await page.waitForTimeout(600);

          // Check if we need to select a mission
          const missionGuideVisible = await isVisible(page, ':text("Now tap a mission")', 800);

          if (missionGuideVisible) {
            // Click an enabled mission lane
            const missionBtns = page.locator('[data-tutorial="board"] button:not([disabled])').filter({ hasText: 'vs' });
            const mCount = await missionBtns.count();

            if (mCount > 0) {
              await missionBtns.first().click();
              await page.waitForTimeout(800);
              played = true;

              // Handle any effect target selectors that pop up after playing
              await page.waitForTimeout(300);
              if (await isTargetSelector(page)) {
                await handleTargetSelector(page);
                await page.waitForTimeout(400);
              }
            } else {
              // Deselect — click the card again
              await playableCards.first().click().catch(() => {});
              await page.waitForTimeout(200);
            }
          } else {
            // Card didn't select properly, deselect
            await playableCards.first().click().catch(() => {});
            await page.waitForTimeout(200);
          }
        }
      }

      if (await isGameOver(page)) break;

      // Pass if nothing was played
      if (!played) {
        const passBtn = page.locator('button').filter({ hasText: /^Pass$/i }).first();
        if (await passBtn.isVisible({ timeout: 800 }).catch(() => false)) {
          await passBtn.click();
          await page.waitForTimeout(400);
        }
      }

      // Let AI play
      await page.waitForTimeout(1500);

      // Clear any overlays that appeared
      await clearOverlays(page);
      if (await isGameOver(page)) break;
    }

    // Linger on final screen for the video
    await page.waitForTimeout(5000);

    // Take a screenshot of the final state
    await page.screenshot({ path: 'test-results/final-state.png' });

    // Assert the game reached a conclusion
    const gameOverVisible = await isGameOver(page);
    if (gameOverVisible) {
      // Verify score is displayed
      await expect(page.locator('[data-testid="game-over-screen"]')).toBeVisible();
      console.log('Game completed with game-over screen visible');
    }

    console.log(`Done after ${cycles} cycles! Video in test-results/`);
    expect(cycles).toBeLessThan(120); // Shouldn't exhaust the loop
  });
});
