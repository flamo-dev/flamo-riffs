// The court is the imported 1080 x 1350 Riff. All moving parts are its own layers.
import { defineNodeScript } from '/vendor/flamo-runtime/index.es.js';

type Point = { x: number; y: number };
type Mode = 'ready' | 'aim' | 'flight' | 'result' | 'film';
const rimY = 640;
const files = [
  { type: 'PDF', name: 'playbook.pdf', weight: '2.4 MB', seconds: 0.94, lift: 305, color: { r: 0.88, g: 0.16, b: 0.23 } },
  { type: 'SVG', name: 'curve.svg', weight: '18 KB', seconds: 1.14, lift: 365, color: { r: 0.0, g: 0.46, b: 0.41 } },
  { type: 'ZIP', name: 'archive.zip', weight: '42 MB', seconds: 0.80, lift: 260, color: { r: 0.34, g: 0.27, b: 0.68 } },
];
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

export default defineNodeScript({
  setup(_props, ctx) {
    const handles = new Map<number, NonNullable<ReturnType<typeof ctx.node>>>();
    function layer(id: number) {
      let handle = handles.get(id);
      if (!handle) { handle = ctx.node('17:' + id)!; handles.set(id, handle); }
      return handle;
    }
    const canvas = ctx.instance.canvas;
    if (!canvas) return;
    const doc = canvas.ownerDocument;
    const win = doc.defaultView!;
    const card = layer(702), net = layer(710), receipt = layer(715);
    const dots = Array.from({ length: 10 }, (_, i) => layer(689 + i));
    const oldTouch = canvas.style.touchAction, oldCursor = canvas.style.cursor;
    const oldTab = canvas.getAttribute('tabindex');
    const events = new AbortController();
    const signal = events.signal;
    canvas.style.touchAction = 'none';
    canvas.tabIndex = 0;

    let mode: Mode = 'ready', round = 0, score = 0, streak = 0, attempts = 0;
    let anchor = { x: 245, y: 1030 }, aim = { x: 540, y: rimY };
    let pointer: number | null = null, moved = false, press: Point = anchor;
    let time = 0, flight = 0, result = 0, rimX = 540, hit = false, judged = false;
    let flash = 0, points = 0, initialized = false;
    const file = () => files[round % files.length];
    const text = (id: number, value: string) => layer(id).setText(value);
    const alpha = (id: number, value: number) => layer(id).set('NodeCpt.opacity', value);
    const translations = new Map<number, Record<string, number>>();
    function place(id: number, x: number, y: number) {
      const node = layer(id);
      let base = translations.get(id);
      if (!base) { base = node.design().geometry.localTransform; translations.set(id, base); }
      node.set('TransformCpt.transform', { ...base, m02: x, m12: y });
    }

    // A shot strip sits inside the original backboard target. Its samples are
    // taken from the just-played trajectory, including its actual end time.
    const replayParent = layer(683);
    function replayPart(kind: string, name: string, props: Record<string, unknown>) {
      const part = ctx.scene.create(kind, { name, visible: false, interactive: false, ...props });
      ctx.scene.mount(part, { parent: replayParent });
      return part;
    }
    const ink = { r: 0.16, g: 0.22, b: 0.29, a: 1 };
    const legend = replayPart('text', 'Shot replay caption', {
      position: { x: 205, y: 255 }, size: { width: 176, height: 23 },
      text: 'LAST SHOT', fontFamily: 'Arial', fontWeight: 700, fontSize: 16, fill: ink,
    });
    const miniRim = replayPart('rect', 'Recorded rim', {
      size: { width: 32, height: 4 }, corners: 2, fill: ink,
    });
    const samples = Array.from({ length: 15 }, () => replayPart('ellipse', 'Shot sample', {
      size: { width: 6, height: 6 }, fill: '#ff6728',
    }));
    let revealed = 0, replay = false, recordedRim = 540;
    function showReplay(show: boolean) {
      legend.setVisible(show); miniRim.setVisible(show);
      samples.forEach((dot, i) => dot.setVisible(show && i < revealed));
    }
    function recordReplay() {
      replay = true; revealed = 0;
      legend.setText('REPLAY ' + String(attempts).padStart(2, '0') + (hit ? '  /  IN' : '  /  OUT'));
      const miniX = (x: number) => 201 + clamp(x / 1080, 0, 1) * 178;
      const miniY = (y: number) => 278 + clamp(y / 1350, 0, 1) * 82;
      miniRim.setPosition(miniX(recordedRim) - 16, miniY(rimY));
      samples.forEach((dot, i) => {
        const p = path(flight / file().seconds * i / (samples.length - 1));
        dot.setPosition(miniX(p.x) - 3, miniY(p.y) - 3);
      });
      showReplay(true);
    }

    function pose(p: Point, size: number, angle: number) {
      const c = Math.cos(angle) * size, s = Math.sin(angle) * size;
      card.set('TransformCpt.transform', { m00: c, m01: -s, m10: s, m11: c,
        m02: p.x - 60 * c + 75 * s, m12: p.y - 60 * s - 75 * c });
    }

    // One quadratic supplies both the aim beads and the flying file.
    // Continue it past release so scoring can use the descending rim crossing.
    function path(u: number): Point {
      return { x: anchor.x + (aim.x - anchor.x) * u,
        y: anchor.y + (aim.y - anchor.y) * u - 4 * file().lift * u * (1 - u) };
    }

    function beads(show: boolean) {
      dots.forEach((dot, i) => {
        if (show) {
          const p = path((i + 1) / 10);
          place(689 + i, p.x - 5, p.y - 5);
        }
        dot.set('NodeCpt.opacity', show ? 0.45 + 0.05 * i : 0);
      });
    }

    function moveHoop(x: number, stretch = 0) {
      rimX = x;
      const shift = x - 540;
      place(683, 250 + shift, 250);
      place(699, 522 + shift, 628);
      place(700, 420 + shift, 622);
      place(712, 420 + shift, 622);
      net.set('TransformCpt.transform', { m00: 1, m01: 0, m10: 0, m11: 1 + stretch, m02: 425 + shift, m12: 646 });
    }

    function labels(large: string, small: string) {
      text(686, large); text(687, small);
      place(686, 290 - layer(686).measureText(large) / 2, 112);
      place(687, 290 - layer(687).measureText(small) / 2, 160);
    }

    function resetPaint(id: number, fill: boolean, stroke = false) {
      const node = layer(id), appearance = node.design().appearance;
      if (fill && appearance.fills[0]?.color) node.setFillColor(appearance.fills[0].color);
      if (stroke && appearance.strokes[0]?.color) node.setStrokeColor(appearance.strokes[0].color);
    }
    function resetCourt() {
      resetPaint(683, true, true);
      resetPaint(729, true);
      mode = 'ready';
      anchor = { x: round % 2 ? 805 : 245, y: 1030 };
      aim = { x: rimX, y: rimY };
      text(676, 'Drop Shot');
      text(677, 'Drag the file to the rim. Release.');
      text(679, 'Points');
      text(681, String(score));
      layer(680).setWidth(80);
      layer(681).setWidth(78);
      place(680, 98, 8);
      place(681, 0, 0);
      layer(682).setVisible(false);
      text(709, file().type);
      layer(708).setFillColor(file().color);
      layer(722).setFillColor(file().color);
      text(733, file().name);
      place(733, anchor.x - layer(733).measureText(file().name) / 2, 1135);
      layer(733).setVisible(true);
      alpha(733, 1);
      [734,736,744].forEach(id => layer(id).setVisible(false));
      labels(round ? 'Lead the rim' : 'Take a shot', round ? 'moving target' : 'aim for center');
      pose(anchor, 1, round % 2 ? 0.10 : -0.10);
      card.setVisible(true);
      alpha(702, 1);
      receipt.setVisible(false);
      layer(714).setVisible(false);
      beads(false);
      if (replay) { revealed = samples.length; showReplay(true); }
      moveHoop(round ? rimX : 540);
      canvas.style.cursor = 'grab';
    }

    function readPoint(e: PointerEvent): Point {
      const rect = canvas.getBoundingClientRect();
      const p = ctx.camera.screenToWorld({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      const board = ctx.probe()?.worldTransform;
      if (!board) return p;
      const det = board.m00 * board.m11 - board.m01 * board.m10;
      if (!det) return p;
      const x = p.x - board.m02, y = p.y - board.m12;
      return { x: (x * board.m11 - y * board.m01) / det,
        y: (y * board.m00 - x * board.m10) / det };
    }

    function setAim(p: Point) {
      aim = { x: clamp(p.x, 20, 1060), y: clamp(p.y, 310, 1110) };
      beads(true);
      pose(anchor, 1.06, clamp((aim.x - anchor.x) / 2000, -0.30, 0.30));
    }

    function enterAim() {
      mode = 'aim';
      labels('Line it up', 'release to fire');
      canvas.style.cursor = 'crosshair';
      setAim({ x: rimX, y: rimY });
    }

    function launch() {
      mode = 'flight'; flight = 0; judged = false; hit = false; flash = 0;
      attempts++; recordedRim = rimX;
      beads(false);
      layer(733).setVisible(false);
      canvas.style.cursor = 'default';
      labels('In flight', file().type + ' / shot ' + attempts);
    }

    function judge(x: number, basketX: number) {
      judged = true; recordedRim = basketX;
      const gap = Math.abs(x - basketX);
      hit = gap <= 84;
      if (!hit) return;
      const swish = gap <= 37;
      streak++;
      points = (swish ? 2 : 1) + (streak >= 3 ? 1 : 0);
      score += points;
      flash = 0.62;
      text(681, String(score));
      text(714, '+' + points);
      place(714, rimX + 105, 548);
      layer(714).setVisible(true);
      alpha(714, 1);
      labels(swish ? 'Swish!' : 'Bucket!', streak > 1 ? 'streak x' + streak : 'clean delivery');
      ctx.trace('basket', { score, points, streak, file: file().name });
    }

    function settle() {
      mode = 'result'; result = 0;
      card.setVisible(false);
      if (!judged) recordedRim = rimX;
      recordReplay();
      if (!hit) {
        streak = 0;
        labels('Off target', 'try that file again');
      }
      receipt.setVisible(true);
      alpha(715, 1);
      text(724, file().name);
      text(725, file().weight);
      text(726, hit ? 'Filed' : 'Retry');
      alpha(726, 1); alpha(727, 0); alpha(730, hit ? 1 : 0);
      text(723, file().type);
      layer(729).setWidth(hit ? 260 : 1);
      ctx.trace('shotFinished', { made: hit, score, attempts });
    }

    function releaseCapture() {
      const id = pointer;
      pointer = null;
      if (id !== null && canvas.hasPointerCapture(id)) canvas.releasePointerCapture(id);
    }
    function cancelAim() {
      releaseCapture();
      if (mode === 'aim') resetCourt();
    }

    // Preview also offers the eight-second original. Give its tracks sole control
    // until the visitor returns to the court with a pointer or the keyboard.
    const cinema = () => doc.querySelector<HTMLButtonElement>('[data-flamo-motion-controls] button');
    const filmLayers = [676,677,679,680,681,682,683,686,687,...Array.from({length:10},(_,i)=>689+i),
      699,700,702,709,710,712,714,715,723,724,725,726,727,729,730,733,734,736,744];
    function captureFilmPose() {
      return filmLayers.map(id => ({ id, state: ctx.probe('17:' + id) }));
    }
    let filmPose: ReturnType<typeof captureFilmPose> = [];
    function enterFilm() {
      if (mode === 'film') return;
      releaseCapture();
      mode = 'film'; showReplay(false);
      canvas.style.cursor = 'pointer';
      text(676, 'Upload files'); text(677, 'Drag and drop, or take the shot.');
      text(679, 'Uploaded'); text(681, '0'); place(680, 121, 8);
      layer(680).setWidth(18); layer(681).setWidth(18);
      text(709, 'PDF'); text(723, 'PDF'); text(733, 'final_final_v7.pdf');
      text(724, 'final_final_v7.pdf'); text(725, '2.4 MB');
      text(726, 'Uploading…'); text(714, '+1'); labels('Drop files here', 'or take the shot');
      place(686, 179, 112); place(687, 208, 160);
      layer(708).setFillColor(layer(708).design().appearance.fills[0].color);
      layer(722).setFillColor(layer(722).design().appearance.fills[0].color);
      place(733, 163, 1150); place(714, 640, 548); moveHoop(540);
      for (const { id, state } of filmPose) {
        if (!state) continue;
        const node = layer(id);
        node.set('TransformCpt.transform', state.transform);
        node.set('NodeCpt.opacity', state.opacity ?? 1);
        node.setVisible(state.visible !== false);
        if (id === 729) node.setWidth(state.size.x);
      }
    }
    doc.addEventListener('click', e => {
      const button = cinema();
      if (button?.contains(e.target as Node)) enterFilm();
    }, { capture: true, signal });

    function resumeCourt() {
      if (mode !== 'film') return;
      const button = cinema();
      if (button?.textContent?.includes('Ⅱ')) button.click();
      filmPose = captureFilmPose();
      // Restore the card's companions from their authored local transforms.
      for (const id of [680,681,683,699,700,710,712,714,715,726,727,729,730,733]) {
        const node = layer(id);
        node.set('TransformCpt.transform', node.design().geometry.localTransform);
      }
      resetCourt();
    }

    canvas.addEventListener('pointerdown', e => {
      if (!initialized || e.button !== 0 || pointer !== null) return;
      if (mode === 'film') { resumeCourt(); return; }
      if (mode !== 'ready') return;
      const p = readPoint(e);
      if (Math.abs(p.x - anchor.x) > 106 || Math.abs(p.y - anchor.y) > 127) return;
      e.preventDefault(); e.stopImmediatePropagation();
      canvas.focus({ preventScroll: true });
      pointer = e.pointerId; moved = false; press = p;
      canvas.setPointerCapture(pointer);
      enterAim();
    }, { capture: true, signal });
    canvas.addEventListener('pointermove', e => {
      if (pointer !== e.pointerId || mode !== 'aim') return;
      const p = readPoint(e);
      if (!moved && Math.hypot(p.x - press.x, p.y - press.y) < 12) return;
      moved = true; setAim(p);
    }, { signal });
    canvas.addEventListener('pointerup', e => {
      if (pointer !== e.pointerId) return;
      if (moved) setAim(readPoint(e));
      releaseCapture();
      if (moved) launch(); else resetCourt();
    }, { signal });
    canvas.addEventListener('pointercancel', cancelAim, { signal });
    canvas.addEventListener('lostpointercapture', e => {
      if (e.pointerId === pointer) cancelAim();
    }, { signal });
    win.addEventListener('blur', cancelAim, { signal });
    canvas.addEventListener('keydown', e => {
      if (!initialized) return;
      if (!['Enter',' ','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Escape'].includes(e.key)) return;
      e.preventDefault();
      if (e.repeat && (e.key === 'Enter' || e.key === ' ')) return;
      if (mode === 'film') { resumeCourt(); return; }
      if (e.key === 'Escape') { cancelAim(); return; }
      if (pointer !== null) return;
      if (mode === 'ready') { enterAim(); return; }
      if (mode !== 'aim') return;
      if (e.key === 'Enter' || e.key === ' ') { launch(); return; }
      const dx = e.key === 'ArrowLeft' ? -22 : e.key === 'ArrowRight' ? 22 : 0;
      const dy = e.key === 'ArrowUp' ? -22 : e.key === 'ArrowDown' ? 22 : 0;
      setAim({ x: aim.x + dx, y: aim.y + dy });
    }, { signal });

    // Let Preview commit its initial native keyframe before taking ownership.
    // An export without native controls becomes playable on the same schedule.
    let warmup = 0;
    ctx.onUpdate(dt => {
      dt = clamp(dt, 0, 0.1);
      time += dt;
      if (!initialized) {
        warmup += dt;
        if (warmup < 0.24) return;
        filmPose = captureFilmPose();
        initialized = true;
        if (mode === 'ready') resetCourt();
      }
      if (mode === 'film') return;
      const oldRim = rimX;
      if (round || flash > 0) {
        flash = Math.max(0, flash - dt);
        const wave = round ? Math.min(155, 74 + round * 14) * Math.sin(time * 1.35) : 0;
        moveHoop(540 + wave, flash ? 0.30 * Math.sin((0.62 - flash) * 18) * flash / 0.62 : 0);
      }
      if (mode === 'result') {
        result += dt;
        const count = Math.min(samples.length, Math.ceil(result * 22));
        while (revealed < count) samples[revealed++].setVisible(true);
        if (result >= 1.35) { if (hit) round++; resetCourt(); }
        return;
      }
      if (mode !== 'flight') return;
      const previous = path(flight / file().seconds);
      flight += dt;
      const u = flight / file().seconds, p = path(u);
      const size = 1 - 0.58 * Math.min(u, 1);
      pose(p, size, Math.sin(Math.min(u, 1) * Math.PI) * (anchor.x < 540 ? 0.65 : -0.65));
      if (!judged && previous.y <= rimY && p.y >= rimY && p.y > previous.y) {
        const a = (rimY - previous.y) / (p.y - previous.y);
        judge(previous.x + (p.x - previous.x) * a, oldRim + (rimX - oldRim) * a);
      }
      if (hit) {
        alpha(714, clamp(flash / 0.3, 0, 1));
        place(714, rimX + 104, 507 + 65 * flash);
      }
      if ((hit && p.y > rimY + 178) || p.y > 1300 || p.x < -120 || p.x > 1200) settle();
    });
    ctx.dispose(() => {
      events.abort(); releaseCapture();
      [legend, miniRim, ...samples].forEach(node => node.remove());
      canvas.style.touchAction = oldTouch; canvas.style.cursor = oldCursor;
      if (oldTab === null) canvas.removeAttribute('tabindex'); else canvas.setAttribute('tabindex', oldTab);
    });
  },
});
