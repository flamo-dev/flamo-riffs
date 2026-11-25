import { defineNodeScript } from '/vendor/flamo-runtime/index.es.js';

// Cubic centerlines from the two authored wave outlines, in the vector's own
// coordinates. The four instances of each outline supply their own mirroring.
const outerCurve = [
  [891.6975,0],
  [891.7152,19.6315], [887.7138,39.2641], [879.9261,57.2887],
  [858.0609,109.3772], [803.4233,145.5422], [746.861,144.8364],
  [626.4172,144.8364], [505.9736,144.8364], [385.5298,144.8364],
  [375.7411,144.8364], [365.9525,144.8364], [356.1638,144.8364],
  [187.3728,141.6292], [29.6268,275.4937], [4.8046,442.3582],
  [1.5971,461.7146], [-0.001,481.34], [0,501],
];

const innerCurve = [
  [892,0],
  [892.0732,17.2045], [885.4876,34.2989], [873.9207,47.0222],
  [860.8499,61.6314], [841.4279,70.3031], [821.8129,70.1871],
  [686.7985,70.1871], [551.7841,70.1871], [416.7697,70.1871],
  [335.3782,70.1871], [253.9867,70.1871], [172.5952,70.1871],
  [98.7842,69.0679], [28.3999,121.2652], [7.5915,192.0011],
  [2.5408,208.4149], [-0.0056,225.581], [0,242.7823],
];

type Point = { x: number; y: number };
const halfLight = 0.06; // The original blue core spans 12% of the path.
const grey = { r: 0.22115384, g: 0.22115384, b: 0.22115384, a: 1 };
const blue = { r: 7 / 255, g: 142 / 255, b: 251 / 255, a: 1 };
const baseStroke = [{ type: 'SOLID', visible: true, opacity: 1, blendMode: 'NORMAL', color: grey }];

function sampleCurve(controls: number[][]) {
  const points: { x: number; y: number; s: number; paint: number }[] = [];
  const width = controls[0][0];
  const height = controls[controls.length - 1][1];
  let s = 0;
  for (let i = 0; i < controls.length - 1; i += 3) {
    const [a, b, c, d] = controls.slice(i, i + 4);
    for (let j = i === 0 ? 0 : 1; j <= 32; j++) {
      const t = j / 32, u = 1 - t;
      const weights = [u ** 3, 3 * u * u * t, 3 * u * t * t, t ** 3];
      const at = (k: number) => a[k] * weights[0] + b[k] * weights[1] + c[k] * weights[2] + d[k] * weights[3];
      const x = at(0), y = at(1);
      const prev = points[points.length - 1];
      if (prev) s += Math.hypot(x - prev.x, y - prev.y);
      // A diagonal paint coordinate increases monotonically from the center tip to the outside tip.
      points.push({ x, y, s, paint: (1 + x / width - y / height) / 2 });
    }
  }
  return points;
}

type Curve = ReturnType<typeof sampleCurve>;
const curves = { inner: sampleCurve(innerCurve), outer: sampleCurve(outerCurve) };
const waves = [
  ['1:25', 'outer'], ['1:26', 'outer'], ['1:34', 'outer'], ['1:35', 'outer'],
  ['1:28', 'inner'], ['1:29', 'inner'], ['1:31', 'inner'], ['1:32', 'inner'],
] as const;

function nearest(curve: Curve, p: Point) {
  let best = Infinity, result = 0;
  for (let i = 1; i < curve.length; i++) {
    const a = curve[i - 1], b = curve[i];
    const dx = b.x - a.x, dy = b.y - a.y;
    const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy)));
    const distance = (a.x + dx * t - p.x) ** 2 + (a.y + dy * t - p.y) ** 2;
    if (distance < best) {
      best = distance;
      result = a.s + (b.s - a.s) * t;
    }
  }
  return result / curve[curve.length - 1].s;
}

function paintPosition(curve: Curve, fraction: number) {
  const length = curve[curve.length - 1].s * fraction;
  if (fraction <= 0) return 1;
  if (fraction >= 1) return 0;
  const i = curve.findIndex(p => p.s >= length);
  const a = curve[i - 1], b = curve[i];
  return a.paint + (b.paint - a.paint) * (length - a.s) / (b.s - a.s);
}

export default defineNodeScript({
  setup(_, ctx) {
    const frame = ctx.sourceNodeId;
    const rails = waves.map(([id, kind]) => {
      const layers = ctx.mounted.children(id)?.children ?? [];
      const rail = layers.find(l => l.snapshot?.name === 'grey');
      const lights = layers.filter(l => l.snapshot?.name === 'blue' || l.snapshot?.name === 'blue blur');
      if (!rail || lights.length !== 2) throw new Error('Missing wave artwork for ' + id);
      return {
        track: rail.entity, lights, curve: curves[kind], matrix: rail.snapshot?.worldTransform,
        current: halfLight, target: halfLight,
      };
    });
    let following = false;
    let unsettled = false;

    function draw(rail: typeof rails[number]) {
      // Paint the existing tapered stroke so the highlight always has its original silhouette.
      const lo = Math.max(0, paintPosition(rail.curve, rail.current + halfLight));
      const hi = Math.min(1, paintPosition(rail.curve, rail.current - halfLight));
      rail.track.set('StrokeStyleCpt.strokePaints', [{
        type: 'GRADIENT_LINEAR', visible: true, opacity: 1, blendMode: 'NORMAL',
        transform: { m00: 1, m01: -1, m02: 0.5, m10: 1, m11: 1, m12: -0.5 },
        stops: [{ position: 0, color: grey }, { position: lo, color: grey },
          { position: lo, color: blue }, { position: hi, color: blue },
          { position: hi, color: grey }, { position: 1, color: grey }],
      }]);
    }

    function follow(point: Point) {
      if (!following) {
        const { timeMs, durationMs, status } = ctx.figmaMotion.getState(frame);
        if (status === 'playing') ctx.figmaMotion.pause(frame);
        const t = durationMs ? Math.min(1, timeMs / durationMs) : 0;
        for (const rail of rails) {
          rail.current = halfLight + (1 - 2 * halfLight) * (1 - (1 - t) ** 3);
          for (const light of rail.lights) light.entity.setVisible(false);
          draw(rail);
        }
        following = true;
      }
      for (const rail of rails) {
        // The eight authored tracks are stationary; viewport zoom is already accounted for in the world point.
        const m = rail.matrix ??= ctx.mounted.probe(rail.track)?.worldTransform;
        if (!m) continue;
        const x = point.x - m.m02, y = point.y - m.m12;
        const det = m.m00 * m.m11 - m.m01 * m.m10;
        if (!det) continue;
        const local = { x: (m.m11 * x - m.m01 * y) / det, y: (m.m00 * y - m.m10 * x) / det };
        rail.target = Math.max(halfLight, Math.min(1 - halfLight, nearest(rail.curve, local)));
      }
      unsettled = true;
    }

    function release() {
      if (!following) return;
      following = false;
      unsettled = false;
      for (const rail of rails) {
        rail.track.set('StrokeStyleCpt.strokePaints', baseStroke);
        for (const light of rail.lights) light.entity.setVisible(true);
      }
    }

    ctx.node()?.setInteractive({ enabled: true });
    ctx.on('pointermove', e => follow(e.coordinates.world), { capture: true });
    ctx.on('pointerleave', () => {
      if (following) {
        for (const rail of rails) rail.target = 1 - halfLight;
        unsettled = true;
      }
    });
    ctx.onUpdate(dt => {
      if (!unsettled) return;
      const blend = 1 - Math.exp(-18 * dt);
      unsettled = false;
      for (const rail of rails) {
        const remaining = rail.target - rail.current;
        if (remaining === 0) continue;
        rail.current = Math.abs(remaining) < 0.0003 ? rail.target : rail.current + blend * remaining;
        draw(rail);
        if (rail.current !== rail.target) unsettled = true;
      }
    });
    ctx.dispose(ctx.figmaMotion.subscribe(frame, state => {
      if (state.status === 'playing') release();
    }));
    ctx.dispose(release);
  },
});
