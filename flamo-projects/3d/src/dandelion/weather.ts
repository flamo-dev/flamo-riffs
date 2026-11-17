// Project-local meadow air and vegetation response. Only the scene geometry and its clock are inputs.
import { FLOWER_CENTER, type V3, type Quaternion } from './model';

const TAU = Math.PI * 2;
const GRID_COLS = 33, GRID_ROWS = 19, GRID_STEP = 2.5, GRID_PERIOD = 0.14;
const GRID_X = -40, GRID_Z = -39;
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (v: number) => {
  const x = Math.max(0, Math.min(1, v));
  return x * x * (3 - 2 * x);
};
// Same seeded lattice noise and vector-knot interpolation used by MasterWind.
function hash(knot: number, key: number) {
  let n = Math.imul(knot ^ key, 0x45d9f3b);
  n = Math.imul(n ^ (n >>> 16), 0x45d9f3b);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}
function noise(t: number, key: number) {
  const i = Math.floor(t);
  return mix(hash(i, key), hash(i + 1, key), smooth(t - i));
}
function knot(i: number, key: number): V3 {
  const bearing = TAU * hash(i, key + 163);
  const speed = 0.45 + 2.65 * hash(i, key + 257);
  return [Math.cos(bearing) * speed, (hash(i, key + 191) - 0.43) * 1.05, Math.sin(bearing) * speed];
}

export function createMeadowWind(key = Math.floor(Math.random() * 0x7fffffff)) {
  const phaseOffset = hash(0, key + 71) * 47;
  const bearing = Math.PI + (hash(0, key + 149) - 0.5) * 1.65;
  const prevailingX = Math.sin(bearing), prevailingZ = Math.cos(bearing);
  function sample(t: number, x: number, y: number, z: number): V3 {
    // Neighbouring positions see the same front at slightly different times.
    const travel = t - (x * prevailingX + z * prevailingZ) * 0.26 + y * 0.10;
    const phase = travel * 0.39 + 0.92 * noise(travel * 0.21, key + 83) + phaseOffset;
    const i = Math.floor(phase), u = smooth(phase - i);
    const a = knot(i, key), b = knot(i + 1, key);
    const strength = 0.23 + 1.25 * smooth((noise(travel * 0.31, key + 373) - 0.13) / 0.61);
    const swirl = noise(t * 0.69 + x * 0.31 - z * 0.26, key + 11) - 0.5;
    const eddy = noise(t * 0.88 + z * 0.29 + y * 0.37 - x * 0.12, key + 31) - 0.5;
    // Above the sheltered stems the prevailing current carries seeds out over the meadow.
    const throughFlow = 0.69 + 0.87 * smooth((y - 0.45) / 3.2);
    return [prevailingX * throughFlow + (mix(a[0], b[0], u) + 0.46 * swirl) * strength,
      0.16 + (mix(a[1], b[1], u) + 0.34 * eddy) * strength,
      prevailingZ * throughFlow + (mix(a[2], b[2], u) + 0.41 * eddy) * strength];
  }

  function stemAt(time: number) {
    // Weighted wind history gives the stem lag and a small elastic recoil.
    const a = sample(time - 0.10, ...FLOWER_CENTER), b = sample(time - 0.36, ...FLOWER_CENTER);
    const c = sample(time - 0.73, ...FLOWER_CENTER), d = sample(time - 1.15, ...FLOWER_CENTER);
    const wx = 0.48*a[0] + 0.40*b[0] + 0.23*c[0] - 0.11*d[0];
    const wz = 0.48*a[2] + 0.40*b[2] + 0.23*c[2] - 0.11*d[2];
    const flexibility = 0.158 / (1 + 0.19 * Math.hypot(wx, wz));
    const dx = wx * flexibility, dz = wz * flexibility, h = FLOWER_CENTER[1];
    const tip: V3 = [dx, -0.67 * (dx*dx + dz*dz) / h, dz];
    // The flower head turns as a rigid body along the tangent at the end of the stem.
    const tx = 2 * dx / h, tz = 2 * dz / h, len = Math.hypot(tx, 1, tz);
    const norm = Math.hypot(tz, len + 1, tx);
    const rotation: Quaternion = [tz / norm, 0, -tx / norm, (len + 1) / norm];
    return { tip, rotation };
  }

  // Each GPU cell holds two successive samples of grass lean. Bilinear spatial
  // sampling and interpolation in time make fronts travel through the blades.
  const grass = new Float32Array(8 + GRID_COLS * GRID_ROWS * 4);
  grass.set([GRID_X, GRID_Z, 1 / GRID_STEP, GRID_COLS, GRID_ROWS, 0, 0, 0]);
  let cachedTick = -Infinity;
  function grassAt(t: number, x: number, z: number) {
    const a = sample(t - 0.07, x, 0.55, z), b = sample(t - 0.26, x, 0.55, z);
    const wx = mix(a[0], b[0], 0.32), wz = mix(a[2], b[2], 0.32);
    const compliance = 1 / (1 + 0.21 * Math.hypot(wx, wz));
    return [wx * compliance, wz * compliance];
  }
  function prepareGrass(time: number) {
    const tick = Math.floor(time / GRID_PERIOD), blend = time / GRID_PERIOD - tick;
    const changed = tick !== cachedTick;
    if (changed) {
      for (let row = 0; row < GRID_ROWS; row++) for (let col = 0; col < GRID_COLS; col++) {
        const i = 8 + (row * GRID_COLS + col) * 4;
        const x = GRID_X + col * GRID_STEP, z = GRID_Z + row * GRID_STEP;
        if (tick === cachedTick + 1) { grass[i] = grass[i + 2]; grass[i + 1] = grass[i + 3]; }
        else grass.set(grassAt(tick * GRID_PERIOD, x, z), i);
        grass.set(grassAt((tick + 1) * GRID_PERIOD, x, z), i + 2);
      }
      cachedTick = tick;
    }
    return { changed, blend };
  }
  return { key, sample, stemAt, grass, prepareGrass };
}

export type MeadowWind = ReturnType<typeof createMeadowWind>;
