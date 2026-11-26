import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createMotionDragScrubber } from '../src/base/motion-drag-scrubber.ts';

function fixture(axis, distance) {
  let time = 500, playing = false, update, listener, requested = time;
  const index = axis === 'x' ? 0 : 1;
  const track = {
    startMs: 0, endMs: 1000,
    sample(ms) {
      const values = [0, 0];
      values[index] = distance * (ms / 1000) ** 2;
      return values;
    },
    timeAtValue(value, options) {
      assert.equal(options.axis, index);
      return 1000 * Math.sqrt(value / distance);
    },
  };
  const motion = {
    getState: () => ({ timeMs: time, status: playing ? 'playing' : 'paused' }),
    pause() { playing = false; },
    async seek(frame, ms) { requested = ms; await Promise.resolve(); time = requested; },
    subscribe(frame, callback) { listener = callback; return () => { listener = undefined; }; },
  };
  const scrubber = createMotionDragScrubber({ frame: 'frame', axis, track, motion,
    onUpdate(callback) { update = callback; return () => { update = undefined; }; },
  });
  return {
    scrubber, position: () => track.sample(requested)[index], tick: () => update?.(0.016),
    scheduled: () => !!update, subscribed: () => !!listener,
    play() { playing = true; listener?.({ status: 'playing' }); },
  };
}

for (const [axis, distance] of [['x', 1000], ['y', -1000]]) {
  test(axis + ' drag follows the authored curve and hands control back to playback', () => {
    const f = fixture(axis, distance), s = f.scrubber, sign = Math.sign(distance);
    s.begin(1);
    s.drag(2, 200);
    assert.equal(f.position(), distance / 4);
    s.drag(1, sign * 55);
    s.drag(1, sign * 30);
    assert.ok(Math.abs(f.position() - (distance / 4 + sign * 30)) < 1e-9);
    s.cancel(2);
    s.drag(1, sign * 65);
    const held = f.position();
    s.release(1);
    f.tick();
    assert.ok(sign * (f.position() - held) > 0);
    f.play();
    assert.equal(f.scheduled(), false);
    s.dispose();
    assert.equal(f.subscribed(), false);
  });
}

test('wheel bursts accumulate while an asynchronous seek is pending and stop at the boundary', async () => {
  const f = fixture('y', -1000);
  f.scrubber.wheel(30);
  f.scrubber.wheel(40);
  assert.ok(Math.abs(f.position() + 320) < 1e-9);
  await Promise.resolve();
  f.scrubber.wheel(2000);
  assert.equal(f.position(), -1000);
  f.scrubber.dispose();
});

test('cancellation and disposal prevent inertia and further seeks', () => {
  const f = fixture('x', 1000), s = f.scrubber;
  s.begin(8); s.drag(8, 100); s.cancel(8); s.release(8);
  assert.equal(f.scheduled(), false);
  const held = f.position();
  s.dispose(); s.begin(9); s.drag(9, 20); s.wheel(25);
  assert.equal(f.position(), held);
});

test('the SoftScrollY Studio project ships the module its saved script imports', async () => {
  const text = async url => (await readFile(new URL(url, import.meta.url), 'utf8')).replaceAll('\r\n', '\n');
  assert.equal(await text('../../flamo-projects/softScrollY/src/.flamo/interaction-library/base/motion-drag-scrubber.ts'),
    await text('../src/base/motion-drag-scrubber.ts'));
  assert.match(await text('../../flamo-projects/softScrollY/src/scroll-y.ts'), /from '@flamo\/interaction-library\/base\/motion-drag-scrubber'/);
});
