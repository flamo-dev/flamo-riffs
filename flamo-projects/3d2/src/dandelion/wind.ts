import { FLOWER_CENTER, type Quaternion, type SeedGeometry, type V3 } from './model';
import type { MeadowWind } from './weather';

const REFILL_SECONDS = 3;
const TAU = 2 * Math.PI;
const ease = (x: number) => {
  const u = Math.max(0, Math.min(1, x));
  return u * u * (3 - 2 * u);
};
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

const FAR_DETAIL = 9;
const FADE_START = 24;
const FADE_END = 42;
const POSE_FLOATS = 16;

function composeRotation(a: Quaternion, b: Quaternion): Quaternion {
  const [x,y,z,w] = a, [i,j,k,s] = b;
  return [w*i+x*s+y*k-z*j, w*j+y*s+z*i-x*k, w*k+z*s+x*j-y*i, w*s-x*i-y*j-z*k];
}

interface Flight {
  id: number; serial: number; start: number; last: number; detached: boolean;
  phase: number; rate: number; carry: number; lift: number; spin: number; sway: number;
  response: number; lane: number; releaseRotation: Quaternion; offset: V3; velocity: V3; distance: number;
}

export function createSeedFlights(seeds: SeedGeometry[], onRefill: () => void, weather: MeadowWind) {
  const headCount = seeds.length;
  let available = seeds.map((_, id) => id);
  const flights: Flight[] = [];
  let poses = new Float32Array(headCount * 2 * POSE_FLOATS);
  let attached = headCount, nearCount = 0, farCount = 0, serial = 0, cycle = 0;
  let lastDeparture = -1, refillAt = -1, lastFrame = -1, dirty = true;
  let selected: number[] = [];
  for (const [id, seed] of seeds.entries()) {
    poses.set([...seed.hub, 1, 0, 0, 0, seed.first, 0, 0, 0, 1, seed.count, 0, 0, 0], id * POSE_FLOATS);
  }

  function blow(now: number, eye: V3) {
    update(now, eye);
    if (!available.length) return 0;
    selected = [];
    const amount = Math.min(available.length, Math.round(headCount * (0.105 + Math.random() * 0.055)));
    const duration = (1.95 + Math.random() * 0.65) * (amount - 1) / Math.max(1, amount);
    for (let i = 0; i < amount; i++) {
      const index = Math.floor(Math.random() * available.length);
      const id = available[index];
      available[index] = available[available.length - 1];
      available.pop();
      // Stratify departure times so the first loose seed lifts immediately and
      // the rest feed into the same gust over its lifetime, with irregular gaps.
      const rank = amount === 1 ? 0 : i / (amount - 1);
      const beat = i === 0 ? 0 : (i - 0.8 * Math.random()) / (amount - 1);
      const start = now + duration * (0.78 * beat + 0.22 * ease(beat));
      const phase = Math.random() * TAU;
      const carry = 0.45 + 1.38 * (0.54 * (1 - rank) + 0.46 * Math.random());
      const response = 0.8 + carry * 1.1 + Math.random() * 0.8;
      const lane = (Math.random() - 0.5) * 0.17;
      flights.push({ id, serial: ++serial, start, last: start, detached: false, distance: 0,
        phase, rate: 2.5 + Math.random() * 3.1, carry, response, lane, releaseRotation: [0, 0, 0, 1],
        lift: Math.random() * 0.20 - 0.08, spin: (Math.random() - 0.5) * 2.2, sway: 0.25 + Math.random() * 0.55,
        offset: [0, 0, 0], velocity: [0, 0, 0] });
      selected.push(id);
      lastDeparture = Math.max(lastDeparture, start);
    }
    if (!available.length) refillAt = lastDeparture + REFILL_SECONDS;
    return amount;
  }

  function detach(f: Flight) {
    const hub = seeds[f.id].hub;
    const { tip, rotation } = weather.stemAt(f.start);
    // Orient the released seed exactly as it sat on the moving crown.
    const [rx, , rz, rw] = rotation;
    const x = hub[0] - FLOWER_CENTER[0], y = hub[1] - FLOWER_CENTER[1], z = hub[2] - FLOWER_CENTER[2];
    const tx = -2*rz*y, ty = 2*(rz*x-rx*z), tz = 2*rx*y;
    f.offset = [tip[0] + rw*tx - rz*ty, tip[1] + rw*ty + rz*tx - rx*tz, tip[2] + rw*tz + rx*ty];
    f.releaseRotation = rotation;
    const air = weather.sample(f.start, hub[0] + f.offset[0], hub[1] + f.offset[1], hub[2] + f.offset[2]);
    const pickup = 0.58 + 0.35 * f.carry;
    f.velocity = [pickup * air[0], 0.24 + pickup * air[1] + f.lift, pickup * air[2]];
    f.detached = true;
    poses[f.id * POSE_FLOATS + 3] = 0;
    attached--;
  }

  function advance(f: Flight, now: number, eye: V3) {
    const hub = seeds[f.id].hub;
    const elapsed = now - f.last;
    // Bound catch-up work after a suspended tab while still advancing real time.
    const steps = Math.min(24, Math.ceil(Math.max(0, elapsed) * 30));
    const dt = steps ? elapsed / steps : 0;
    for (let step = 1; step <= steps; step++) {
      const t = f.last + step * dt, age = t - f.start, wave = age * f.rate + f.phase;
      const x = hub[0] + f.offset[0], y = hub[1] + f.offset[1], z = hub[2] + f.offset[2];
      const air = weather.sample(t, x, y, z);
      const pickup = f.carry * (0.74 + 0.26 * ease(age / 1.7));
      const horizontal = Math.hypot(air[0], air[2]);
      const drift = f.lane + Math.sin(wave) * f.sway * 0.13;
      const groundLift = 0.9 * (1 - ease((y - 0.25) / 0.95));
      const target: V3 = [pickup * (air[0] + drift * air[2]),
        pickup * air[1] + f.lift + Math.cos(wave * 0.81) * Math.min(0.16, 0.065 * horizontal) + groundLift,
        pickup * (air[2] - drift * air[0])];
      const drag = 1 - Math.exp(-dt * f.response);
      for (let axis = 0; axis < 3; axis++) {
        f.velocity[axis] = mix(f.velocity[axis], target[axis], drag);
        f.offset[axis] += f.velocity[axis] * dt;
      }
    }
    f.last = now;
    f.distance = Math.hypot(hub[0] + f.offset[0] - eye[0], hub[1] + f.offset[1] - eye[1], hub[2] + f.offset[2] - eye[2]);
  }

  function packFlights(now: number) {
    const slots = headCount + nearCount + farCount;
    if (slots * POSE_FLOATS > poses.length) {
      const larger = new Float32Array(Math.max(slots * POSE_FLOATS, poses.length * 2));
      larger.set(poses.subarray(0, headCount * POSE_FLOATS));
      poses = larger;
    }
    let nearSlot = headCount, farSlot = headCount + nearCount;
    for (const f of flights) {
      if (!f.detached) continue;
      const far = f.distance >= FAR_DETAIL;
      const i = (far ? farSlot++ : nearSlot++) * POSE_FLOATS;
      const age = now - f.start;
      const tilt = (Math.sin(age * f.rate + f.phase) - Math.sin(f.phase)) * f.sway
        + f.velocity[0] * 0.12 * ease(age / 0.25);
      const yaw = f.spin * age + 0.35 * (Math.sin(age * f.rate * 0.73 + f.phase) - Math.sin(f.phase));
      const geom = seeds[f.id];
      poses.set(geom.hub, i);
      poses[i + 3] = 1 - ease((f.distance - FADE_START) / (FADE_END - FADE_START));
      poses.set(f.offset, i + 4);
      poses[i + 7] = geom.first;
      const sy = Math.sin(yaw/2), cy = Math.cos(yaw/2), st = Math.sin(tilt/2), ct = Math.cos(tilt/2);
      poses.set(composeRotation([sy*st, sy*ct, cy*st, cy*ct], f.releaseRotation), i + 8);
      poses[i + 12] = geom.count;
      poses[i + 13] = far ? 1 : 0;
    }
    dirty = true;
  }

  function update(now: number, eye: V3) {
    lastFrame = now;
    if (flights.length) {
      nearCount = 0; farCount = 0;
      let kept = 0;
      for (const f of flights) {
        if (now >= f.start) {
          if (!f.detached) detach(f);
          advance(f, now, eye);
          if (f.distance >= FADE_END) continue;
          if (f.distance < FAR_DETAIL) nearCount++; else farCount++;
        }
        flights[kept++] = f;
      }
      flights.length = kept;
      packFlights(now);
    }
    if (refillAt >= 0 && now >= refillAt) {
      available = seeds.map((_, id) => id);
      for (const id of available) poses[id * POSE_FLOATS + 3] = 1;
      attached = headCount; cycle++; dirty = true;
      lastDeparture = -1; refillAt = -1;
      onRefill();
    }
  }

  function takeChanges() {
    if (!dirty) return null;
    dirty = false;
    return poses.subarray(0, (headCount + nearCount + farCount) * POSE_FLOATS);
  }
  function inspect() {
    const samples = flights.filter(f => f.detached).slice(0, 4).map(f => ({
      serial: f.serial, id: f.id, offset: [...f.offset], distance: f.distance,
      opacity: 1 - ease((f.distance - FADE_START) / (FADE_END - FADE_START)),
    }));
    return { windKey: weather.key, air: weather.sample(lastFrame, ...FLOWER_CENTER), released: selected.length, selected: selected.slice(0, 8),
      attached, available: available.length, active: nearCount + farCount, distant: farCount,
      cycle, lastDeparture, refillAt, samples };
  }
  return { blow, update, inspect, takeChanges, get capacityBytes() { return poses.byteLength; },
    get nearCount() { return nearCount; }, get farCount() { return farCount; } };
}
