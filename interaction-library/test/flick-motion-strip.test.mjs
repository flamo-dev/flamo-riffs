import test from 'node:test';
import assert from 'node:assert/strict';
import { createFlickMotionStrip } from '../src/base/flick-motion-strip.ts';

function fixture(t) {
  let now = 0, position = 100, update, transport;
  t.mock.method(performance, 'now', () => now);
  const strip = createFlickMotionStrip({
    frame: 'frame',
    track: {
      sample: ms => [ms / 2, 0],
      timeAtValue: (x, options) => (options.axis === 0 && x >= 0 && x <= 1000 ? x * 2 : null),
    },
    motion: {
      getState: () => ({ timeMs: position * 2 }),
      async seek(frame, ms) { assert.equal(frame, 'frame'); position = ms / 2; },
      subscribe(frame, callback) { transport = callback; return () => { transport = undefined; }; },
    },
    onUpdate(fn) { update = fn; return () => { update = undefined; }; },
  });
  return { strip, wait(ms) { now += ms; }, tick(dt) { update?.(dt); },
    playing() { transport?.({ status: 'playing', playbackKind: 'full' }); },
    get x() { return position; }, get coasting() { return !!update; } };
}

test('a fresh flick coasts from its filtered release speed, then yields to playback', t => {
  const f = fixture(t), s = f.strip;
  s.begin(1); f.wait(50); s.drag(2, 100); assert.equal(f.x, 100);
  s.drag(1, 100); s.release(1); s.release(1); f.tick(0.02);
  assert.equal(f.x, 214);
  f.tick(0.02);
  assert.ok(Math.abs(f.x - (214 + 14 * Math.exp(-4.5 * 0.02))) < 1e-9);
  f.playing(); assert.equal(f.coasting, false); s.dispose();
});

test('a held release or a cancelled drag stays at the last photograph', t => {
  const f = fixture(t), s = f.strip;
  s.begin(1); f.wait(20); s.drag(1, 60); f.wait(91); s.release(1);
  f.tick(0.05); assert.equal(f.x, 160); assert.equal(f.coasting, false);
  s.begin(2); f.wait(20); s.drag(2, -40); s.cancel(2); s.release(2);
  assert.equal(f.x, 120); assert.equal(f.coasting, false); s.dispose();
});

test('wheel selects X first and falls back to Y, and a new press catches a coast', t => {
  const f = fixture(t), s = f.strip;
  assert.equal(s.wheel(10, 60), true); assert.equal(f.x, 90);
  assert.equal(s.wheel(0.0001, -20), true); assert.equal(f.x, 110);
  s.begin(1); f.wait(10); s.drag(1, 40); s.release(1); f.tick(0.02);
  const caught = f.x; s.begin(2); f.tick(0.1); assert.equal(f.x, caught);
  f.wait(20); s.drag(2, -5); assert.equal(f.x, caught - 5);
  s.dispose(); assert.equal(s.wheel(20, 0), false);
});
