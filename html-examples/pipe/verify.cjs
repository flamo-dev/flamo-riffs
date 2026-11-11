// Requires Playwright. Optional PLAYWRIGHT_MODULE points to an existing install.
// Start ../serve.mjs first, then run: node html-demos/pipe/verify.cjs
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const output = path.join(__dirname, 'verification');
const url = 'http://localhost:8080/pipe/';
const results = [];
const keys = ['1', '2', '3', '4', 'group'];
const selector = key => `[data-pipe="${key}"]`;

async function states(page, key) {
  return page.locator(`${selector(key)} [data-flamo-component]`).evaluate(element =>
    Object.entries(element.instance.artifact.nodeArtifacts)
      .filter(([, value]) => value.interactions?.some(i => i.behaviorRef === 'hmi.pipe-flow'))
      .map(([id, value]) => ({
        id,
        ...element.instance.scene.get(id).call('getFlowState'),
        renderedOffset: value.roles.flow
          ? element.instance.scene.get(value.roles.flow)?.get('StrokeStyleCpt.strokeDashOffset') : null,
      })));
}
async function allReady(page) {
  await page.waitForFunction(() => document.querySelectorAll('[data-pipe][data-ready="true"]').length === 5, null, { timeout: 45000 });
}
function check(name, value) { assert.ok(value, name); results.push({ name, passed: true }); }

async function paintedMargins(page, key) {
  const screenshot = await page.locator(`${selector(key)} [data-flamo-component]`).screenshot();
  return page.evaluate(async base64 => {
    const image = new Image();
    image.src = `data:image/png;base64,${base64}`;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const context = canvas.getContext('2d');
    context.drawImage(image, 0, 0);
    const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
    let minX = canvas.width, minY = canvas.height, maxX = -1, maxY = -1, pixels = 0;
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const i = (y * canvas.width + x) * 4;
        const channels = [data[i], data[i + 1], data[i + 2]];
        // Actual colored pipes, excluding the neutral canvas background.
        if (Math.max(...channels) - Math.min(...channels) < 45 || data[i + 3] < 128) continue;
        pixels++;
        minX = Math.min(minX, x); maxX = Math.max(maxX, x);
        minY = Math.min(minY, y); maxY = Math.max(maxY, y);
      }
    }
    return { pixels, left: minX, top: minY, right: canvas.width - 1 - maxX, bottom: canvas.height - 1 - maxY };
  }, screenshot.toString('base64'));
}

(async () => {
  await fs.mkdir(output, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1050 }, deviceScaleFactor: 1 });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
    await page.goto(url);
    await allReady(page);
    check('All five components loaded; ten controls enabled', await page.locator('[data-action]:enabled').count() === 10);
    check('Initial overview matches all five running components', await page.locator('#running-count').textContent() === '05');
    const pipe4Manifest = JSON.parse(await fs.readFile(path.join(__dirname, 'flamo-pipe-4-web-component/manifest.json'), 'utf8'));
    const pipe4Identity = await page.locator('flamo-pipe-4').evaluate(el => ({
      root: el.instance.root.id,
      revision: el.instance.artifact.metadata.revision,
    }));
    check('Pipe 4 mounts the updated export boundary and revision',
      pipe4Identity.root === pipe4Manifest.packaging.boundaryNodeId &&
      pipe4Identity.revision === pipe4Manifest.integration.artifactRevision);

    for (const key of keys) {
      const card = page.locator(selector(key));
      const element = card.locator('[data-flamo-component]');
      await card.scrollIntoViewIfNeeded();
      const before = await states(page, key);
      check(`${key}: expected number of real flow bindings is present`, before.length === (key === 'group' ? 4 : 1));
      const firstFrame = await element.screenshot();
      await page.waitForTimeout(140);
      const secondFrame = await element.screenshot();
      check(`${key}: running animation changes real rendered pixels`, !firstFrame.equals(secondFrame));

      await card.locator('[data-action="play"]').click();
      await page.waitForTimeout(100);
      const paused = await states(page, key);
      const pausedFrame = await element.screenshot();
      await page.waitForTimeout(160);
      const held = await states(page, key);
      check(`${key}: pause stops every bound flow without resetting phase`, held.every((s, i) => !s.running && s.offset === paused[i].offset));
      check(`${key}: paused rendered pixels stay unchanged`, pausedFrame.equals(await element.screenshot()));

      const othersBefore = await Promise.all(keys.filter(k => k !== key).map(k => states(page, k)));
      await card.locator('[data-action="direction"]').click();
      const reversed = await states(page, key);
      check(`${key}: direction changes while pause and phase are preserved`, reversed.every((s, i) => s.direction !== before[i].direction && !s.running && s.offset === paused[i].offset));
      const othersAfter = await Promise.all(keys.filter(k => k !== key).map(k => states(page, k)));
      check(`${key}: controls leave other components running in their own directions`, othersAfter.every((list, i) => list.every((s, j) => s.running === othersBefore[i][j].running && s.direction === othersBefore[i][j].direction)));

      await card.locator('[data-action="play"]').click();
      const resumed = await states(page, key);
      check(`${key}: start resumes all bound flows`, resumed.every(s => s.running));
      // Sample signed phase from zero for less than one dash period.
      await element.evaluate(el => {
        for (const [id, node] of Object.entries(el.instance.artifact.nodeArtifacts)) {
          if (node.interactions?.some(i => i.behaviorRef === 'hmi.pipe-flow')) el.instance.scene.get(id).call('setFlowState', { offset: 0 });
        }
      });
      await page.waitForTimeout(100);
      const travel = await states(page, key);
      check(`${key}: real phase advances in the selected direction`, travel.every(s => s.direction === 'forward' ? s.offset > 0 : s.offset < 0));
      await card.locator('[data-action="direction"]').click();
      check(`${key}: live direction toggle keeps playback running`, (await states(page, key)).every((s, i) => s.running && s.direction === before[i].direction));
      console.log(`Verified pipe ${key}`);
    }

    for (const key of ['4', 'group']) {
      const element = page.locator(`${selector(key)} [data-flamo-component]`);
      const oldId = await element.evaluate(el => el.instance.id);
      await element.evaluate(el => {
        const parent = el.parentNode;
        el.remove();
        setTimeout(() => parent.insertBefore(el, parent.querySelector('.loading-overlay')), 60);
      });
      await allReady(page);
      check(`${key}: reconnect creates a fresh instance and rebinds controls`, await element.evaluate(el => el.instance.id) !== oldId);
      await page.locator(`${selector(key)} [data-action="play"]`).click();
      check(`${key}: reconnected controls stop every bound flow`, (await states(page, key)).every(s => !s.running));
      await page.locator(`${selector(key)} [data-action="direction"]`).click();
      check(`${key}: reconnected direction control preserves pause`, (await states(page, key)).every(s => s.direction === 'reverse' && !s.running));
      await page.locator(`${selector(key)} [data-action="direction"]`).click();
      await page.locator(`${selector(key)} [data-action="play"]`).click();
      const remountMargins = await paintedMargins(page, key);
      check(`${key}: reconnect restores visible content and complete framing`, remountMargins.pixels > 0 && ['left', 'top', 'right', 'bottom'].every(edge => remountMargins[edge] >= 8));
    }

    // A second instance of the same export must not share control state.
    await page.evaluate(async () => {
      const duplicate = document.createElement('flamo-pipe-4');
      duplicate.id = 'pipe4-isolation-probe';
      duplicate.style.cssText = 'display:block;width:354px;height:167px';
      document.body.append(duplicate);
      await duplicate.ready;
    });
    await page.waitForFunction(() => {
      const el = document.querySelector('#pipe4-isolation-probe');
      return el.instance.scene.get(el.instance.root.id).call('getFlowState')?.ready;
    });
    await page.locator('[data-pipe="4"] [data-action="play"]').click();
    await page.locator('[data-pipe="4"] [data-action="direction"]').click();
    check('Pipe 4 controls are isolated from another instance of the same export', await page.locator('#pipe4-isolation-probe').evaluate(el => {
      const state = el.instance.scene.get(el.instance.root.id).call('getFlowState');
      return state.running && state.direction === 'forward';
    }));
    await page.locator('#pipe4-isolation-probe').evaluate(el => el.remove());
    await page.locator('[data-pipe="4"] [data-action="direction"]').click();
    await page.locator('[data-pipe="4"] [data-action="play"]').click();
    check('Removing the duplicate leaves the original Pipe 4 working', (await states(page, '4')).every(s => s.running && s.direction === 'forward'));

    const framing = [];
    for (const width of [1440, 1024, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.waitForTimeout(250);
      check(`${width}px: responsive page has no horizontal overflow`, await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      check(`${width}px: controls fit inside cards`, await page.locator('[data-action]').evaluateAll(buttons => buttons.every(button => {
        const b = button.getBoundingClientRect(), c = button.closest('[data-pipe]').getBoundingClientRect();
        return b.left >= c.left && b.right <= c.right && b.width >= 32 && b.height >= 32;
      })));
      check(`${width}px: all component canvases have usable dimensions`, await page.locator('[data-flamo-component]').evaluateAll(elements => elements.every(el => {
        const r = el.getBoundingClientRect(); return r.width > 150 && r.height > 150;
      })));
      for (const key of keys) {
        const margins = await paintedMargins(page, key);
        framing.push({ width, component: key, ...margins });
        // Arrow-only exports have much less painted area than solid pipes.
        // Require visible pixels and safe edges; animation is checked above.
        check(`${width}px: pipe ${key} renders with clear margins on all four edges`, margins.pixels > 0 && ['left', 'top', 'right', 'bottom'].every(edge => margins[edge] >= 8));
      }
      if (width === 390) await page.screenshot({ path: path.join(output, 'mobile.png'), fullPage: true });
    }
    await page.setViewportSize({ width: 1440, height: 1050 });
    await page.evaluate(() => scrollTo(0, 0));
    await page.waitForTimeout(250);
    await page.screenshot({ path: path.join(output, 'desktop.png'), fullPage: true });
    check('Main browser run has no console, page, or HTTP errors', errors.length === 0);
    await page.close();

    const reduced = await browser.newPage({ reducedMotion: 'reduce' });
    await reduced.goto(url);
    await allReady(reduced);
    check('Reduced-motion preference starts all five components paused', await reduced.locator('[data-pipe][data-running="false"]').count() === 5);
    await reduced.locator('[data-pipe="4"] [data-action="play"]').click();
    check('Reduced-motion preference still permits explicit playback', (await states(reduced, '4')).every(s => s.running));
    await reduced.close();

    const failure = await browser.newPage();
    await failure.route('**/flamo-pipe-2-web-component/manifest.json', route => route.fulfill({ status: 404, body: 'Missing test fixture' }));
    await failure.goto(url);
    await failure.waitForFunction(() => document.querySelectorAll('[data-pipe][data-ready="true"]').length === 4);
    check('Missing component resource does not block other four components', await failure.locator('[data-pipe="2"][data-failed="true"]').count() === 1);
    check('Failure disables both controls and provides a visible retry action', await failure.locator('[data-pipe="2"] [data-action]:disabled').count() === 2 && await failure.locator('[data-pipe="2"] .retry').isVisible());
    await failure.unrouteAll();
    await failure.locator('[data-pipe="2"] .retry').click();
    await allReady(failure);
    check('Retry recovers the failed component after resources return', await failure.locator('[data-action]:enabled').count() === 10);
    await failure.close();

    const report = { url, browser: await browser.version(), passed: results.length, checks: results, framing, errors,
      pipe4: { ...pipe4Identity, contractId: pipe4Manifest.integration.contractId }, verifiedAt: new Date().toISOString() };
    await fs.writeFile(path.join(output, 'report.json'), JSON.stringify(report, null, 2) + '\n');
    console.log(`PASS: ${results.length} checks. Evidence: ${output}`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
