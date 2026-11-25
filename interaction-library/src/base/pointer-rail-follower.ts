/** Project a world-space pointer onto each fixed rail and ease a fixed-length highlight along it. */
export interface RailPoint { x: number; y: number }
export interface PointerRail {
  /** Ordered local centerline, from the outside tip to the return tip. */
  points: readonly RailPoint[];
  worldTransform?: { m00: number; m01: number; m02: number; m10: number; m11: number; m12: number };
  /** Fractions of local arc length. Paint the original artwork in this interval. */
  draw(start: number, end: number): void;
  restore?(): void;
}

export function sampleCubicRail(controls: readonly RailPoint[], steps = 32): RailPoint[] {
  if (controls.length < 4 || (controls.length - 1) % 3 !== 0) throw new RangeError('Expected 1 + 3n cubic control points');
  if (!Number.isInteger(steps) || steps < 1) throw new RangeError('Expected a positive integer subdivision count');
  const points = [controls[0]];
  for (let i = 0; i + 3 < controls.length; i += 3) {
    const [a, b, c, d] = controls.slice(i, i + 4);
    for (let j = 1; j <= steps; j++) {
      const t = j / steps, u = 1 - t;
      const coord = (key: 'x' | 'y') => u ** 3 * a[key] + 3 * u * u * t * b[key] + 3 * u * t * t * c[key] + t ** 3 * d[key];
      points.push({ x: coord('x'), y: coord('y') });
    }
  }
  return points;
}

function prepareRail(rail: PointerRail) {
  const m = rail.worldTransform;
  let length = 0;
  const vertices = rail.points.map((p, i) => {
    if (i) length += Math.hypot(p.x - rail.points[i - 1].x, p.y - rail.points[i - 1].y);
    const x = m ? m.m00 * p.x + m.m01 * p.y + m.m02 : p.x;
    const y = m ? m.m10 * p.x + m.m11 * p.y + m.m12 : p.y;
    if (!Number.isFinite(x) || !Number.isFinite(y)) throw new RangeError('Expected finite rail geometry');
    return { x, y, length };
  });
  if (!(length > 0) || !Number.isFinite(length)) throw new RangeError('Expected a rail of positive length');
  return { rail, vertices, length, center: 0, target: 0 };
}

function nearestFraction(track: ReturnType<typeof prepareRail>, p: RailPoint) {
  let best = Infinity, along = 0;
  for (let i = 1; i < track.vertices.length; i++) {
    const a = track.vertices[i - 1], b = track.vertices[i];
    const dx = b.x - a.x, dy = b.y - a.y, squared = dx * dx + dy * dy;
    if (!squared) continue;
    const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / squared));
    const distance = (a.x + t * dx - p.x) ** 2 + (a.y + t * dy - p.y) ** 2;
    if (distance < best) {
      best = distance;
      along = a.length + t * (b.length - a.length);
    }
  }
  return along / track.length;
}

export function createPointerRailFollower(rails: readonly PointerRail[], options: { span?: number; response?: number } = {}) {
  const { span = 0.12, response = 18 } = options;
  if (!(span > 0 && span <= 1 && response > 0 && Number.isFinite(response))) throw new RangeError('Invalid highlight span or response');
  const tracks = rails.map(prepareRail), half = span / 2;
  const clamp = (s: number) => Math.max(half, Math.min(1 - half, s));
  let active = false;
  return {
    /** On first input, take over from the center fraction currently shown by native playback. */
    follow(point: RailPoint, from = half) {
      if (![point.x, point.y, from].every(Number.isFinite)) return;
      for (const track of tracks) {
        if (!active) {
          track.center = clamp(from);
          track.rail.draw(track.center - half, track.center + half);
        }
        track.target = clamp(nearestFraction(track, point));
      }
      active = true;
    },
    returnToEnd() {
      if (active) for (const track of tracks) track.target = 1 - half;
    },
    update(seconds: number) {
      if (!active || !(seconds > 0) || !Number.isFinite(seconds)) return;
      const blend = -Math.expm1(-response * seconds);
      for (const track of tracks) {
        const distance = track.target - track.center;
        if (!distance) continue;
        track.center = Math.abs(distance) < 0.0003 ? track.target : track.center + distance * blend;
        track.rail.draw(track.center - half, track.center + half);
      }
    },
    /** Yield to authored playback or dispose the script. */
    release() {
      if (!active) return;
      active = false;
      for (const track of tracks) track.rail.restore?.();
    },
  };
}
