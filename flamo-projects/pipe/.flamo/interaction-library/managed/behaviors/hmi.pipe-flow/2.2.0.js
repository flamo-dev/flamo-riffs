// ../hmi/src/dash-pattern.ts
var DEFAULT_PIPE_DASH_PATTERN = Object.freeze([8, 6]);
var MAX_PIPE_DASH_PATTERN_ITEMS = 64;
function normalizePipeDashPattern(value) {
  if (!Array.isArray(value) || value.length === 0 || value.length > MAX_PIPE_DASH_PATTERN_ITEMS)
    return null;
  const pattern = [];
  let hasPositiveItem = false;
  let sum = 0;
  for (const item of value) {
    if (typeof item !== "number" || !Number.isFinite(item) || item < 0)
      return null;
    pattern.push(item);
    sum += item;
    if (!Number.isFinite(sum))
      return null;
    if (item > 0)
      hasPositiveItem = true;
  }
  if (!hasPositiveItem || pattern.length % 2 === 1 && !Number.isFinite(sum * 2))
    return null;
  return pattern;
}
function pipeDashPatternCycle(pattern) {
  const normalized = normalizePipeDashPattern(pattern);
  if (!normalized)
    return 0;
  const sum = normalized.reduce((total, item) => total + item, 0);
  return normalized.length % 2 === 1 ? sum * 2 : sum;
}
function pipeDashPatternsEqual(first, second) {
  return first.length === second.length && first.every((item, index) => item === second[index]);
}
// ../hmi/src/path-motion.ts
var MAX_MOTION_NODES = 1600;
var record = (v) => !!v && typeof v === "object" && !Array.isArray(v);
var fail = (path, message) => {
  throw new TypeError(`${path}: ${message}`);
};
function number(v, path, min, max) {
  if (typeof v !== "number" || !Number.isFinite(v) || v < min || v > max)
    fail(path, `需要 ${min}–${max} 的有限数值`);
  return v;
}
function integer(v, path, min, max) {
  const n = number(v, path, min, max);
  if (!Number.isInteger(n))
    fail(path, "需要整数");
  return n;
}
function range(v, path, min, max) {
  if (!Array.isArray(v) || v.length !== 2)
    return fail(path, "需要 [最小值, 最大值]");
  const a = number(v[0], path, min, max), b = number(v[1], path, min, max);
  if (a > b)
    fail(path, "最小值不能大于最大值");
  return [a, b];
}
function choice(v, path, choices) {
  if (!choices.includes(v))
    fail(path, `需要 ${choices.join(" / ")}`);
  return v;
}
function id(v, path) {
  if (typeof v !== "string" || !/^[\w:-]{1,100}$/.test(v))
    fail(path, "id 无效");
  return v;
}
function keys(v, allowed, path) {
  for (const k of Object.keys(v))
    if (!allowed.includes(k))
      fail(`${path}.${k}`, "未知字段");
}
function parsePathMotion(v) {
  if (!record(v))
    return fail("motion", "需要循环组对象");
  keys(v, ["version", "seed", "repeat", "materials", "items", "offset", "acceleration", "pixelsPerMeter", "emissionPeriod"], "motion");
  if (v.version !== 1)
    fail("motion.version", "不支持的循环组版本");
  if (!Array.isArray(v.materials) || v.materials.length < 1 || v.materials.length > 16)
    fail("motion.materials", "需要 1–16 个素材");
  const materialIds = new Set;
  const materials = v.materials.map((m, i) => {
    const p = `motion.materials.${i}`;
    if (!record(m))
      return fail(p, "需要素材对象");
    keys(m, ["id", "name", "shape", "aspect", "imageHash"], p);
    const materialId = id(m.id, `${p}.id`);
    if (materialIds.has(materialId))
      fail(p, "素材 id 重复");
    materialIds.add(materialId);
    const shape = choice(m.shape, p, ["coal", "arrow", "dot", "car", "image"]);
    if (typeof m.name !== "string" || m.name.length > 100)
      fail(p, "素材名称过长或无效");
    if (shape === "image" && (typeof m.imageHash !== "string" || !/^[a-f0-9]{40}$/i.test(m.imageHash)))
      fail(p, "图像快照丢失");
    return {
      id: materialId,
      name: m.name,
      shape,
      aspect: number(m.aspect, `${p}.aspect`, 0.02, 50),
      ...shape === "image" ? { imageHash: m.imageHash } : {}
    };
  });
  if (!Array.isArray(v.items) || v.items.length < 1 || v.items.length > 32)
    fail("motion.items", "需要 1–32 个循环元素");
  const itemIds = new Set;
  const items = v.items.map((item, i) => {
    const p = `motion.items.${i}`;
    if (!record(item))
      return fail(p, "需要循环元素");
    const itemId = id(item.id, `${p}.id`);
    if (itemIds.has(itemId))
      fail(p, "元素 id 重复");
    itemIds.add(itemId);
    const kind = choice(item.kind, `${p}.kind`, ["gap", "object", "scatter"]);
    if (kind === "gap") {
      keys(item, ["id", "kind", "length"], p);
      return { id: itemId, kind, length: range(item.length, `${p}.length`, 0, 1e4) };
    }
    keys(item, [
      "id",
      "kind",
      "length",
      "count",
      "band",
      "distribution",
      "materials",
      "size",
      "along",
      "across",
      "rotation",
      "opacity",
      "colors",
      "orientation",
      "forwardAngle"
    ], p);
    if (!Array.isArray(item.materials) || !item.materials.length || item.materials.length > 16 || new Set(item.materials).size !== item.materials.length || item.materials.some((x) => typeof x !== "string" || !materialIds.has(x)))
      fail(p, "引用的素材不存在或重复");
    if (!Array.isArray(item.colors) || !item.colors.length || item.colors.length > 16 || item.colors.some((c) => typeof c !== "string" || !/^#[0-9a-f]{6}$/i.test(c)))
      fail(p, "需要 1–16 个 #RRGGBB 颜色");
    const count = integer(item.count, `${p}.count`, 1, 200);
    if (kind === "object" && count !== 1)
      fail(p, "单个对象的数量必须为 1");
    return {
      id: itemId,
      kind,
      length: number(item.length, `${p}.length`, 1, 1e4),
      count,
      band: number(item.band, `${p}.band`, 0, 2000),
      distribution: choice(item.distribution, p, ["stratified", "free"]),
      materials: [...item.materials],
      size: range(item.size, `${p}.size`, 0.1, 1000),
      along: range(item.along, `${p}.along`, -2000, 2000),
      across: range(item.across, `${p}.across`, -2000, 2000),
      rotation: range(item.rotation, `${p}.rotation`, -3600, 3600),
      opacity: range(item.opacity, `${p}.opacity`, 0, 1),
      colors: item.colors.map((c) => c.toUpperCase()),
      orientation: choice(item.orientation, p, ["path", "fixed"]),
      forwardAngle: number(item.forwardAngle, `${p}.forwardAngle`, -3600, 3600)
    };
  });
  if (!items.some((item) => item.kind !== "gap"))
    fail("motion.items", "循环组至少需要一个对象或散布片段");
  return {
    version: 1,
    seed: integer(v.seed, "motion.seed", 0, 4294967295),
    ...v.acceleration !== undefined ? { acceleration: number(v.acceleration, "motion.acceleration", 0, 1e4) } : {},
    ...v.pixelsPerMeter !== undefined ? { pixelsPerMeter: number(v.pixelsPerMeter, "motion.pixelsPerMeter", 1, 1e4) } : {},
    ...v.emissionPeriod !== undefined ? { emissionPeriod: number(v.emissionPeriod, "motion.emissionPeriod", 0.01, 3600) } : {},
    ...v.offset !== undefined ? { offset: number(v.offset, "motion.offset", -1e7, 1e7) } : {},
    repeat: choice(v.repeat, "motion.repeat", ["identical", "vary"]),
    materials,
    items
  };
}
function random(seed, key) {
  let h = (2166136261 ^ seed) >>> 0;
  for (let i = 0;i < key.length; i++)
    h = Math.imul(h ^ key.charCodeAt(i), 16777619) >>> 0;
  h ^= h >>> 16;
  h = Math.imul(h, 2146121005);
  h ^= h >>> 15;
  h = Math.imul(h, 2221713035);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
function sampled(r, seed, key) {
  return r[0] + (r[1] - r[0]) * random(seed, key);
}
function sampleMotionGroup(spec, index) {
  let cursor = 0;
  const particles = [];
  const sampleIndex = spec.repeat === "identical" ? 0 : index;
  for (const item of spec.items) {
    const prefix = `${sampleIndex}/${item.id}`;
    if (item.kind === "gap") {
      cursor += sampled(item.length, spec.seed, `${prefix}/gap`);
      continue;
    }
    const rows = Math.max(1, Math.round(Math.sqrt(item.count * item.band / item.length)));
    const columns = Math.ceil(item.count / rows);
    for (let i = 0;i < item.count; i++) {
      const k = `${prefix}/${i}`;
      const jitterX = random(spec.seed, `${k}/x`), jitterY = random(spec.seed, `${k}/y`);
      const x = item.kind === "object" ? 0.5 : item.distribution === "free" ? jitterX : (i % columns + jitterX) / columns;
      const y = item.kind === "object" ? 0 : (item.distribution === "free" ? jitterY - 0.5 : (Math.floor(i / columns) + jitterY) / rows - 0.5) * item.band;
      particles.push({
        key: `${index}/${item.id}/${i}`,
        itemId: item.id,
        materialId: item.materials[Math.floor(random(spec.seed, `${k}/material`) * item.materials.length)],
        distance: cursor + x * item.length + sampled(item.along, spec.seed, `${k}/along`),
        across: y + sampled(item.across, spec.seed, `${k}/across`),
        size: sampled(item.size, spec.seed, `${k}/size`),
        angle: sampled(item.rotation, spec.seed, `${k}/rotation`) - (item.orientation === "path" ? item.forwardAngle : 0),
        opacity: sampled(item.opacity, spec.seed, `${k}/opacity`),
        color: item.colors[Math.floor(random(spec.seed, `${k}/color`) * item.colors.length)],
        orientation: item.orientation
      });
    }
    cursor += item.length;
  }
  return { length: cursor, particles };
}
function motionGroupLength(spec, index) {
  const sampleIndex = spec.repeat === "identical" ? 0 : index;
  return spec.items.reduce((sum, item) => sum + (item.kind === "gap" ? sampled(item.length, spec.seed, `${sampleIndex}/${item.id}/gap`) : item.length), 0);
}
function motionBounds(spec) {
  let minLength = 0, margin = 0;
  for (const item of spec.items) {
    minLength += item.kind === "gap" ? item.length[0] : item.length;
    if (item.kind !== "gap")
      margin = Math.max(margin, Math.max(Math.abs(item.along[0]), Math.abs(item.along[1])) + item.size[1] * 2);
  }
  return { minLength, margin };
}
function motionPool(spec, pathLength) {
  const { minLength, margin } = motionBounds(spec);
  const acceleration = (spec.acceleration ?? 0) * (spec.pixelsPerMeter ?? 100);
  const window = acceleration > 0 ? Math.max(pathLength, motionEmissionRate(spec) * motionResidenceTime(pathLength, 0, acceleration)) : pathLength;
  const groups = Math.ceil((window + 2 * margin) / minLength) + 2;
  const total = spec.items.reduce((sum, item) => sum + (item.kind === "gap" ? 0 : item.count * item.materials.length * groups), 0);
  if (total > MAX_MOTION_NODES)
    throw new RangeError(`当前路径与循环组需要 ${total} 个素材节点，上限 ${MAX_MOTION_NODES}。请增加组长、减少片段数量或素材种类。`);
  const slots = [];
  for (const item of spec.items)
    if (item.kind !== "gap")
      for (const materialId of item.materials)
        for (let i = 0;i < groups * item.count; i++)
          slots.push({ itemId: item.id, materialId });
  return slots;
}
function motionEmissionRate(spec) {
  const length = spec.items.reduce((sum, item) => sum + (item.kind === "gap" ? (item.length[0] + item.length[1]) / 2 : item.length), 0);
  return length / (spec.emissionPeriod ?? 1);
}
function motionResidenceTime(distance, speed, acceleration) {
  if (distance === 0)
    return 0;
  return 2 * distance / (speed + Math.sqrt(speed * speed + 2 * acceleration * distance));
}
function motionPhaseSpeed(spec, speed, acceleration = spec.acceleration ?? 0) {
  return acceleration > 0 ? motionEmissionRate(spec) : speed;
}
function samplePathMotion(track, pathLength, travel, speed, reverse = false, acceleration = track.spec.acceleration ?? 0) {
  number(speed, "speed", 0, 1e5);
  number(acceleration, "acceleration", 0, 1e4);
  if (acceleration === 0)
    return track.sample(pathLength, travel);
  const rate = motionEmissionRate(track.spec);
  const a = acceleration * (track.spec.pixelsPerMeter ?? 100);
  const window = rate * motionResidenceTime(pathLength, speed, a);
  return track.sample(window, reverse ? -travel : travel).map((p) => {
    const age = p.distance / rate;
    const distance = Math.min(pathLength, speed * age + 0.5 * a * age * age);
    return { ...p, distance: reverse ? pathLength - distance : distance };
  });
}

class MotionTrack {
  spec;
  index = 0;
  start = 0;
  groups = new Map;
  constructor(spec) {
    this.spec = spec;
  }
  group(index) {
    let group = this.groups.get(index);
    if (!group) {
      group = sampleMotionGroup(this.spec, index);
      this.groups.set(index, group);
      if (this.groups.size > 256)
        this.groups.delete(this.groups.keys().next().value);
    }
    return group;
  }
  sample(pathLength, travel) {
    if (!Number.isFinite(travel))
      throw new TypeError("travel must be finite");
    const { margin } = motionBounds(this.spec);
    const left = -travel - margin, right = pathLength - travel + margin;
    if (this.spec.repeat === "identical" || this.spec.items.every((item) => item.kind !== "gap" || item.length[0] === item.length[1])) {
      const cycle = motionGroupLength(this.spec, 0);
      this.index = Math.floor(left / cycle);
      this.start = this.index * cycle;
    }
    let length = motionGroupLength(this.spec, this.index), steps = 0;
    while (this.start > left) {
      if (++steps > 1e5)
        throw new RangeError("运动跳转距离过大");
      this.index--;
      length = motionGroupLength(this.spec, this.index);
      this.start -= length;
    }
    while (this.start + length <= left) {
      if (++steps > 1e5)
        throw new RangeError("运动跳转距离过大");
      this.start += length;
      length = motionGroupLength(this.spec, ++this.index);
    }
    const particles = [];
    let start = this.start, index = this.index;
    while (start <= right) {
      if (++steps > 1e5)
        throw new RangeError("循环组数量过大");
      const group = this.group(index);
      for (const p of group.particles) {
        const distance = start + p.distance + travel;
        if (distance >= 0 && distance <= pathLength)
          particles.push({ ...p, distance });
      }
      start += group.length;
      index++;
    }
    for (const key of this.groups.keys())
      if (key < this.index - 1 || key > index + 1)
        this.groups.delete(key);
    return particles;
  }
}

class MotionPath {
  points;
  lengths = [0];
  length;
  constructor(points) {
    if (points.length < 2 || points.length > 20000)
      throw new TypeError("路径需要 2–20000 个点");
    this.points = points.map((p) => ({ x: number(p?.x, "path.x", -1e7, 1e7), y: number(p?.y, "path.y", -1e7, 1e7) })).filter((p, i, a) => i === 0 || Math.hypot(p.x - a[i - 1].x, p.y - a[i - 1].y) > 0.000000001);
    for (let i = 1;i < this.points.length; i++)
      this.lengths.push(this.lengths[i - 1] + Math.hypot(this.points[i].x - this.points[i - 1].x, this.points[i].y - this.points[i - 1].y));
    this.length = this.lengths[this.lengths.length - 1];
    if (this.length < 0.01)
      throw new RangeError("路径长度必须大于零");
  }
  at(distance) {
    const d = Math.max(0, Math.min(this.length, distance));
    let lo = 1, hi = this.lengths.length - 1;
    while (lo < hi) {
      const mid = lo + hi >>> 1;
      if (this.lengths[mid] <= d)
        lo = mid + 1;
      else
        hi = mid;
    }
    const a = this.points[lo - 1], b = this.points[lo], length = this.lengths[lo] - this.lengths[lo - 1];
    const t = length > 0 ? (d - this.lengths[lo - 1]) / length : 0;
    return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, angle: Math.atan2(b.y - a.y, b.x - a.x) };
  }
  pose(p, reverse = false) {
    const point = this.at(p.distance);
    return {
      ...p,
      x: point.x - Math.sin(point.angle) * p.across,
      y: point.y + Math.cos(point.angle) * p.across,
      rotation: p.angle + (p.orientation === "path" ? point.angle * 180 / Math.PI + (reverse ? 180 : 0) : 0)
    };
  }
}
var MOTION_SHAPES = {
  coal: [
    { x: 0.03, y: 0.31 },
    { x: 0.26, y: 0.02 },
    { x: 0.63, y: 0.08 },
    { x: 0.98, y: 0.4 },
    { x: 0.85, y: 0.8 },
    { x: 0.52, y: 0.97 },
    { x: 0.12, y: 0.79 }
  ],
  arrow: [
    { x: 0, y: 0.3 },
    { x: 0.55, y: 0.3 },
    { x: 0.55, y: 0 },
    { x: 1, y: 0.5 },
    { x: 0.55, y: 1 },
    { x: 0.55, y: 0.7 },
    { x: 0, y: 0.7 }
  ],
  car: [
    { x: 0.03, y: 0.24 },
    { x: 0.12, y: 0.08 },
    { x: 0.77, y: 0.08 },
    { x: 0.97, y: 0.28 },
    { x: 0.97, y: 0.72 },
    { x: 0.77, y: 0.92 },
    { x: 0.12, y: 0.92 },
    { x: 0.03, y: 0.76 }
  ]
};
function parseRuntimeMotionProjection(value) {
  if (!record(value) || value.version !== 2)
    throw new TypeError("Invalid runtime motion projection version");
  const motion = parsePathMotion(value.motion);
  if (!Array.isArray(value.points))
    throw new TypeError("Missing motion projection path");
  const path = new MotionPath(value.points);
  motionPool(motion, path.length);
  samplePathMotion(new MotionTrack(motion), path.length, motion.offset ?? 0, 0, false);
  return { version: 2, points: path.points, motion };
}
function parseMotionProjection(value) {
  if (!record(value) || value.version !== 1)
    throw new TypeError("Invalid motion projection version");
  const motion = parsePathMotion(value.motion);
  if (!Array.isArray(value.points))
    throw new TypeError("Missing motion projection path");
  const path = new MotionPath(value.points), expected = motionPool(motion, path.length), seen = new Set;
  new MotionTrack(motion).sample(path.length, motion.offset ?? 0);
  if (!Array.isArray(value.slots) || value.slots.length !== expected.length)
    throw new TypeError("Motion pool size mismatch");
  const slots = expected.map((slot, i) => {
    const actual = value.slots[i];
    if (!record(actual) || actual.itemId !== slot.itemId || actual.materialId !== slot.materialId || typeof actual.nodeId !== "string" || !actual.nodeId || actual.nodeId.trim() !== actual.nodeId || seen.has(actual.nodeId))
      throw new TypeError(`Invalid motion pool slot ${i}`);
    seen.add(actual.nodeId);
    return { ...slot, nodeId: actual.nodeId };
  });
  return { version: 1, motion, points: path.points, slots };
}
function motionTransform(p, aspect) {
  const width = p.size, height = p.size / aspect, r = p.rotation * Math.PI / 180;
  return {
    x: p.x - Math.cos(r) * width / 2 + Math.sin(r) * height / 2,
    y: p.y - Math.sin(r) * width / 2 - Math.cos(r) * height / 2,
    scaleX: width,
    scaleY: height,
    rotation: r
  };
}

// ../hmi/src/pipe.ts
var PIPE_SPEC_KEYS = new Set(["kind", "schemaVersion", "id", "geometry", "appearance", "flow"]);
var GEOMETRY_AUTHORING_KEYS = new Set(["kind", "nodeId", "geometryHash"]);
var GEOMETRY_POLYLINE_KEYS = new Set(["kind", "points"]);
var POINT_KEYS = new Set(["x", "y"]);
var APPEARANCE_KEYS = new Set(["diameter", "wallThickness", "wallColor", "mediumColor", "cap", "join", "wallVisible", "mediumVisible", "wallOpacity", "mediumOpacity"]);
var FLOW_SPEC_V1_KEYS = new Set(["enabled", "color", "width", "dash", "gap", "direction", "speed"]);
var FLOW_SPEC_V2_KEYS = new Set(["enabled", "color", "width", "dashPattern", "direction", "speed", "motion"]);
var PATCH_KEYS = new Set(["appearance", "flow"]);
// ../hmi/src/pipe-flow-controller.ts
class PipeFlowValidationError extends TypeError {
  issues;
  constructor(issues) {
    super(issues.map((issue) => `${issue.path}: ${issue.message}`).join("; "));
    this.name = "PipeFlowValidationError";
    this.issues = issues.map((issue) => ({ ...issue }));
  }
}
var DEFAULT_PIPE_FLOW_RUNTIME_STATE = Object.freeze({
  enabled: false,
  speed: 24,
  direction: "forward",
  offset: 0,
  color: "#F8FAFC",
  width: 2,
  dashPattern: DEFAULT_PIPE_DASH_PATTERN
});
var HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;
var PATCH_KEYS2 = new Set([
  "enabled",
  "speed",
  "direction",
  "offset",
  "color",
  "width",
  "dashPattern",
  "dash",
  "gap"
]);
var MAX_FRAME_DELTA_MS = 250;
function createPipeFlowController(options) {
  validateTarget(options.target);
  const scheduler = options.scheduler ?? createBrowserPipeFlowScheduler();
  validateScheduler(scheduler);
  const initial = validatePatch(options.initial ?? {}, DEFAULT_PIPE_FLOW_RUNTIME_STATE);
  let state = cloneState(initial);
  let started = options.autoStart ?? true;
  let disposed = false;
  let hasPendingFrame = false;
  let pendingFrame;
  let previousTimestamp;
  const snapshot = () => ({
    ...state,
    dashPattern: [...state.dashPattern],
    dash: state.dashPattern[0],
    gap: state.dashPattern[1] ?? state.dashPattern[0],
    running: hasPendingFrame
  });
  const cancelPendingFrame = () => {
    if (hasPendingFrame) {
      scheduler.cancel(pendingFrame);
      hasPendingFrame = false;
      pendingFrame = undefined;
    }
    previousTimestamp = undefined;
  };
  const shouldSchedule = () => !disposed && started && state.enabled && state.speed > 0;
  const scheduleFrame = () => {
    if (!shouldSchedule() || hasPendingFrame)
      return;
    if (previousTimestamp === undefined)
      previousTimestamp = finiteTimestamp(scheduler.now(), 0);
    hasPendingFrame = true;
    try {
      pendingFrame = scheduler.request(onFrame);
    } catch (error) {
      hasPendingFrame = false;
      pendingFrame = undefined;
      throw error;
    }
  };
  function onFrame(timestamp) {
    hasPendingFrame = false;
    pendingFrame = undefined;
    if (!shouldSchedule())
      return;
    const previous = previousTimestamp ?? finiteTimestamp(scheduler.now(), 0);
    const current = finiteTimestamp(timestamp, previous);
    const deltaSeconds = Math.min(Math.max(current - previous, 0), MAX_FRAME_DELTA_MS) / 1000;
    previousTimestamp = current;
    if (deltaSeconds > 0) {
      const signedSpeed = state.direction === "forward" ? state.speed : -state.speed;
      const nextOffset = advancePhaseSafely(state.offset, signedSpeed * deltaSeconds, pipeDashPatternCycle(state.dashPattern), state.direction);
      if (nextOffset !== state.offset) {
        state = { ...state, offset: nextOffset };
        options.target.setDashOffset(state.offset);
      }
    }
    scheduleFrame();
  }
  const reconcileScheduling = (resetBaseline = false) => {
    if (!shouldSchedule()) {
      cancelPendingFrame();
      return;
    }
    if (resetBaseline)
      previousTimestamp = finiteTimestamp(scheduler.now(), previousTimestamp ?? 0);
    scheduleFrame();
  };
  options.target.setVisible(state.enabled);
  options.target.setStrokeColor(state.color);
  options.target.setStrokeWidth(state.width);
  options.target.setDashPattern([...state.dashPattern]);
  options.target.setDashOffset(state.offset);
  reconcileScheduling(true);
  return {
    update(patch) {
      if (disposed)
        throw new Error("PipeFlowController has been disposed");
      const candidate = validatePatch(patch, state);
      const patternChanged = !pipeDashPatternsEqual(candidate.dashPattern, state.dashPattern);
      const directionChanged = candidate.direction !== state.direction;
      const speedChanged = candidate.speed !== state.speed;
      const offsetChanged = candidate.offset !== state.offset;
      const normalizedOffset = patternChanged && candidate.offset !== 0 ? normalizeNonZeroPhase(candidate.offset, pipeDashPatternCycle(candidate.dashPattern), phaseSign(candidate.offset, candidate.direction)) : candidate.offset;
      const next = {
        ...candidate,
        dashPattern: [...candidate.dashPattern],
        offset: normalizedOffset
      };
      const visibleChanged = next.enabled !== state.enabled;
      const colorChanged = next.color !== state.color;
      const widthChanged = next.width !== state.width;
      const phaseChanged = next.offset !== state.offset;
      state = next;
      if (visibleChanged)
        options.target.setVisible(state.enabled);
      if (colorChanged)
        options.target.setStrokeColor(state.color);
      if (widthChanged)
        options.target.setStrokeWidth(state.width);
      if (patternChanged)
        options.target.setDashPattern([...state.dashPattern]);
      if (phaseChanged)
        options.target.setDashOffset(state.offset);
      reconcileScheduling(visibleChanged || speedChanged || directionChanged || offsetChanged || patternChanged);
      return snapshot();
    },
    start() {
      if (disposed)
        return;
      started = true;
      reconcileScheduling(true);
    },
    stop(stopOptions = {}) {
      if (disposed)
        return;
      started = false;
      cancelPendingFrame();
      if (stopOptions.resetOffset && state.offset !== 0) {
        state = { ...state, offset: 0 };
        options.target.setDashOffset(0);
      }
    },
    snapshot,
    dispose() {
      if (disposed)
        return;
      started = false;
      cancelPendingFrame();
      disposed = true;
    }
  };
}
function createBrowserPipeFlowScheduler() {
  const scope = globalThis;
  if (typeof scope.requestAnimationFrame !== "function" || typeof scope.cancelAnimationFrame !== "function") {
    throw new Error("Pipe flow requires requestAnimationFrame or an explicit PipeFlowScheduler");
  }
  const request = scope.requestAnimationFrame.bind(scope);
  const cancel = scope.cancelAnimationFrame.bind(scope);
  return {
    request,
    cancel,
    now: () => scope.performance?.now?.() ?? Date.now()
  };
}
function validatePatch(patch, base) {
  const issues = [];
  if (!isRecord(patch)) {
    throw new PipeFlowValidationError([{ path: "", message: "Pipe flow patch must be an object" }]);
  }
  for (const key of Object.keys(patch)) {
    if (!PATCH_KEYS2.has(key)) {
      issues.push({ path: key, message: "Unknown field" });
    }
  }
  validateOptionalBoolean(patch, "enabled", issues);
  validateOptionalNonNegative(patch, "speed", issues);
  validateOptionalDirection(patch, issues);
  validateOptionalFinite(patch, "offset", issues);
  validateOptionalColor(patch, issues);
  validateOptionalPositive(patch, "width", issues);
  const dashPattern = resolveDashPatternPatch(patch, base.dashPattern, issues);
  if (issues.length > 0)
    throw new PipeFlowValidationError(issues);
  return {
    enabled: patch.enabled === undefined ? base.enabled : patch.enabled,
    speed: patch.speed === undefined ? base.speed : patch.speed,
    direction: patch.direction === undefined ? base.direction : patch.direction,
    offset: patch.offset === undefined ? base.offset : patch.offset,
    color: patch.color === undefined ? base.color : patch.color.toUpperCase(),
    width: patch.width === undefined ? base.width : patch.width,
    dashPattern
  };
}
function resolveDashPatternPatch(patch, base, issues) {
  const hasCanonical = patch.dashPattern !== undefined;
  const hasLegacyDash = patch.dash !== undefined;
  const hasLegacyGap = patch.gap !== undefined;
  if (hasCanonical && (hasLegacyDash || hasLegacyGap)) {
    issues.push({ path: "dashPattern", message: "dashPattern cannot be combined with legacy dash/gap fields" });
    return [...base];
  }
  if (hasCanonical) {
    const pattern2 = normalizePipeDashPattern(patch.dashPattern);
    if (!pattern2) {
      issues.push({
        path: "dashPattern",
        message: "Expected 1-64 finite numbers >= 0 with at least one positive item"
      });
      return [...base];
    }
    return pattern2;
  }
  if (!hasLegacyDash && !hasLegacyGap)
    return [...base];
  const issueCountBeforeLegacyItems = issues.length;
  validateOptionalPositive(patch, "dash", issues);
  validateOptionalPositive(patch, "gap", issues);
  if (issues.length !== issueCountBeforeLegacyItems)
    return [...base];
  if ((!hasLegacyDash || !hasLegacyGap) && base.length !== 2) {
    issues.push({
      path: hasLegacyDash ? "gap" : "dash",
      message: "A partial legacy dash/gap patch requires an existing two-item dashPattern"
    });
    return [...base];
  }
  const dash = hasLegacyDash ? patch.dash : base[0];
  const gap = hasLegacyGap ? patch.gap : base[1];
  const pattern = normalizePipeDashPattern([dash, gap]);
  if (!pattern) {
    issues.push({
      path: "dashPattern",
      message: "Expected 1-64 finite numbers >= 0 with a finite cycle and at least one positive item"
    });
    return [...base];
  }
  return pattern;
}
function cloneState(state) {
  return { ...state, dashPattern: [...state.dashPattern] };
}
function validateTarget(target) {
  const candidate = target;
  for (const method of ["setVisible", "setStrokeColor", "setStrokeWidth", "setDashPattern", "setDashOffset"]) {
    if (typeof candidate?.[method] !== "function")
      throw new TypeError(`PipeFlowTarget.${method} must be a function`);
  }
}
function validateScheduler(scheduler) {
  const candidate = scheduler;
  for (const method of ["request", "cancel", "now"]) {
    if (typeof candidate?.[method] !== "function")
      throw new TypeError(`PipeFlowScheduler.${method} must be a function`);
  }
}
function validateOptionalBoolean(patch, key, issues) {
  if (patch[key] !== undefined && typeof patch[key] !== "boolean") {
    issues.push({ path: key, message: "Expected a boolean" });
  }
}
function validateOptionalNonNegative(patch, key, issues) {
  if (patch[key] !== undefined && (!isFiniteNumber(patch[key]) || patch[key] < 0)) {
    issues.push({ path: key, message: "Expected a finite number >= 0" });
  }
}
function validateOptionalDirection(patch, issues) {
  if (patch.direction !== undefined && patch.direction !== "forward" && patch.direction !== "reverse") {
    issues.push({ path: "direction", message: "Expected forward or reverse" });
  }
}
function validateOptionalFinite(patch, key, issues) {
  if (patch[key] !== undefined && !isFiniteNumber(patch[key])) {
    issues.push({ path: key, message: "Expected a finite number" });
  }
}
function validateOptionalColor(patch, issues) {
  if (patch.color !== undefined && (typeof patch.color !== "string" || !HEX_COLOR.test(patch.color))) {
    issues.push({ path: "color", message: "Color must use #RRGGBB" });
  }
}
function validateOptionalPositive(patch, key, issues) {
  if (patch[key] !== undefined && (!isFiniteNumber(patch[key]) || patch[key] <= 0)) {
    issues.push({ path: key, message: "Expected a finite number > 0" });
  }
}
function normalizeNonZeroPhase(value, cycle, signHint) {
  let remainder = value % cycle;
  if (signHint > 0 && remainder < 0)
    remainder += cycle;
  if (signHint < 0 && remainder > 0)
    remainder -= cycle;
  if (Math.abs(remainder) <= Number.EPSILON * Math.max(1, cycle))
    return signHint * cycle;
  return remainder;
}
function advancePhaseSafely(offset, signedDistance, cycle, direction) {
  if (!Number.isFinite(offset) || !Number.isFinite(signedDistance) || !Number.isFinite(cycle) || cycle <= 0) {
    return offset;
  }
  const signHint = phaseSumSign(offset, signedDistance, direction);
  const offsetRemainder = offset % cycle;
  const distanceRemainder = signedDistance % cycle;
  const remainder = addPhaseRemainders(offsetRemainder, distanceRemainder, cycle);
  const nextOffset = normalizeNonZeroPhase(remainder, cycle, signHint);
  return Number.isFinite(nextOffset) ? nextOffset : offset;
}
function addPhaseRemainders(first, second, cycle) {
  if (first > 0 && second > 0) {
    const remaining = cycle - second;
    return first >= remaining ? first - remaining : first + second;
  }
  if (first < 0 && second < 0) {
    const remaining = -cycle - second;
    return first <= remaining ? first + (cycle + second) : first + second;
  }
  return first + second;
}
function phaseSumSign(first, second, direction) {
  if (first >= 0 && second >= 0 || first <= 0 && second <= 0) {
    if (first > 0 || second > 0)
      return 1;
    if (first < 0 || second < 0)
      return -1;
  } else {
    const firstMagnitude = Math.abs(first);
    const secondMagnitude = Math.abs(second);
    if (firstMagnitude > secondMagnitude)
      return first > 0 ? 1 : -1;
    if (secondMagnitude > firstMagnitude)
      return second > 0 ? 1 : -1;
  }
  return direction === "forward" ? 1 : -1;
}
function phaseSign(value, direction) {
  if (value > 0)
    return 1;
  if (value < 0)
    return -1;
  return direction === "forward" ? 1 : -1;
}
function finiteTimestamp(value, fallback) {
  return Number.isFinite(value) ? value : fallback;
}
function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}
function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
// src/hmi/pipe-flow.ts
var HMI_PIPE_FLOW_BEHAVIOR_REF = "hmi.pipe-flow";
var HMI_PIPE_FLOW_BEHAVIOR_VERSION = "1.0.0";
var HMI_PIPE_FLOW_BEHAVIOR_IDENTITY = `${HMI_PIPE_FLOW_BEHAVIOR_REF}@${HMI_PIPE_FLOW_BEHAVIOR_VERSION}`;
var HMI_PIPE_FLOW_HOST_COMMAND_EVENT = "flamo:hmi-pipe-flow:set";
var HMI_PIPE_FLOW_HOST_STATE_EVENT = "flamo:hmi-pipe-flow:state";
var PHASE_TRACE_INTERVAL_MS = 250;
var hmiPipeFlowBehavior = {
  setup(_props, ctx) {
    const behavior = ctx.behavior(HMI_PIPE_FLOW_BEHAVIOR_IDENTITY);
    if (!behavior) {
      throw new Error(`Missing behavior binding ${HMI_PIPE_FLOW_BEHAVIOR_IDENTITY} on ${ctx.sourceNodeId}`);
    }
    const flow = behavior.role("flow");
    if (!flow)
      throw new Error(`Behavior ${HMI_PIPE_FLOW_BEHAVIOR_IDENTITY} cannot resolve its flow role`);
    let lastPhaseSampleAt = Number.NEGATIVE_INFINITY;
    const controller = createPipeFlowController({
      initial: readInitialPatch(behavior.binding.options?.initialState),
      target: {
        setVisible: (value) => flow.setVisible(value),
        setStrokeColor: (color) => flow.setStrokeColor(parseHexColor(color)),
        setStrokeWidth: (width) => flow.setStrokeWidth(width),
        setDashPattern: (pattern) => flow.set("StrokeStyleCpt.strokeDashArray", [...pattern]),
        setDashOffset: (offset) => {
          flow.set("StrokeStyleCpt.strokeDashOffset", offset);
          const now = globalThis.performance?.now?.() ?? Date.now();
          if (now - lastPhaseSampleAt >= PHASE_TRACE_INTERVAL_MS || offset === 0) {
            lastPhaseSampleAt = now;
            ctx.trace("pipe-flow.phase-sample", { flowNodeId: flow.id, offset });
          }
        }
      }
    });
    const hostEventTarget = typeof document === "undefined" ? null : document;
    const publishState = (reason, state, requestId) => {
      ctx.trace("pipe-flow.state", { reason, flowNodeId: flow.id, state });
      dispatchHostState(hostEventTarget, {
        requestId,
        instanceId: ctx.instance.id,
        nodeId: ctx.sourceNodeId,
        reason,
        state
      });
      return state;
    };
    const updateState = (patch, reason) => {
      return publishState(reason, controller.update(patch));
    };
    ctx.expose({
      setFlowState: (...args) => updateState(requirePatch(args[0]), "business-update"),
      getFlowState: () => controller.snapshot(),
      startFlow: () => {
        controller.start();
        return publishState("start", controller.snapshot());
      },
      stopFlow: (...args) => {
        const resetOffset = args[0] === true || isRecord2(args[0]) && args[0].resetOffset === true;
        controller.stop({ resetOffset });
        return publishState("stop", controller.snapshot());
      }
    });
    const onHostCommand = (event) => {
      const detail = event.detail;
      if (!isRecord2(detail) || !matchesHostTarget(detail, ctx.instance.id, ctx.sourceNodeId, ctx.nodeId))
        return;
      const requestId = typeof detail.requestId === "string" ? detail.requestId : undefined;
      try {
        publishState("host-event", controller.update(requirePatch(detail.patch, "host command patch")), requestId);
      } catch (error) {
        dispatchHostState(hostEventTarget, {
          requestId,
          instanceId: ctx.instance.id,
          nodeId: ctx.sourceNodeId,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    };
    hostEventTarget?.addEventListener(HMI_PIPE_FLOW_HOST_COMMAND_EVENT, onHostCommand);
    const initial = controller.snapshot();
    ctx.trace("pipe-flow.mounted", {
      behavior: HMI_PIPE_FLOW_BEHAVIOR_IDENTITY,
      rootNodeId: ctx.sourceNodeId,
      flowNodeId: flow.id,
      state: initial
    });
    publishState("initial", initial);
    ctx.dispose(() => {
      hostEventTarget?.removeEventListener(HMI_PIPE_FLOW_HOST_COMMAND_EVENT, onHostCommand);
      controller.dispose();
      ctx.trace("pipe-flow.disposed", { rootNodeId: ctx.sourceNodeId, flowNodeId: flow.id });
    });
  }
};
var pipe_flow_default = hmiPipeFlowBehavior;
function readInitialPatch(value) {
  if (value === undefined)
    return {};
  return requirePatch(value, "behavior binding options.initialState");
}
function requirePatch(value, label = "setFlowState") {
  if (!isRecord2(value))
    throw new TypeError(`${label} must be an object`);
  return value;
}
function parseHexColor(value) {
  const match = /^#([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})$/.exec(value);
  if (!match)
    throw new TypeError("Pipe flow color must use #RRGGBB");
  return {
    r: Number.parseInt(match[1], 16) / 255,
    g: Number.parseInt(match[2], 16) / 255,
    b: Number.parseInt(match[3], 16) / 255,
    a: 1
  };
}
function matchesHostTarget(detail, instanceId, sourceNodeId, runtimeNodeId) {
  const hasInstance = typeof detail.instanceId === "string";
  const hasNode = typeof detail.nodeId === "string";
  if (!hasInstance && !hasNode)
    return false;
  if (hasInstance && detail.instanceId !== instanceId)
    return false;
  if (hasNode && detail.nodeId !== sourceNodeId && detail.nodeId !== runtimeNodeId)
    return false;
  return true;
}
function dispatchHostState(target, detail) {
  target?.dispatchEvent(new CustomEvent(HMI_PIPE_FLOW_HOST_STATE_EVENT, { detail }));
}
function isRecord2(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// src/hmi/path-flow-accelerated.ts
var ACCELERATED_PATH_FLOW_IDENTITY = "hmi.pipe-flow@2.1.0";
var isRecord3 = (v) => !!v && typeof v === "object" && !Array.isArray(v);
var path_flow_accelerated_default = {
  setup(props, ctx) {
    const binding = ctx.behavior(ACCELERATED_PATH_FLOW_IDENTITY);
    if (!binding)
      throw new Error(`Missing ${ACCELERATED_PATH_FLOW_IDENTITY}`);
    const initial = binding.binding.options?.initialState;
    const projection = initial?.motionProjection;
    if (!projection) {
      pipe_flow_default.setup(props, {
        ...ctx,
        behavior: (identity) => identity === "hmi.pipe-flow@1.0.0" ? binding : ctx.behavior(identity)
      });
      return;
    }
    const validated = parseMotionProjection(projection), motion = validated.motion, path = new MotionPath(validated.points), track = new MotionTrack(motion);
    const frame = binding.role("motion");
    if (!frame)
      throw new Error("Missing motion role");
    const slots = projection.slots.map((slot, i) => {
      const handle = binding.role(`motion:${i}`);
      if (!handle)
        throw new Error(`Missing motion:${i}`);
      return { slot, handle, key: "", color: "", visible: undefined };
    });
    let state = { enabled: false, speed: 24, acceleration: motion.acceleration ?? 0, direction: "forward", offset: 0 }, request = null, previous = 0, disposed = false, paused = false, lastTrace = -Infinity;
    const snapshot = () => ({ ...state, running: request !== null });
    function validate(value) {
      if (!isRecord3(value))
        throw new TypeError("Flow state must be an object");
      const next = { ...state };
      for (const [key, v] of Object.entries(value)) {
        if (!["enabled", "speed", "acceleration", "direction", "offset"].includes(key))
          throw new TypeError(`循环组不支持运行时属性 ${key}`);
        if (key === "enabled") {
          if (typeof v !== "boolean")
            throw new TypeError("enabled must be boolean");
          next.enabled = v;
        }
        if (key === "direction") {
          if (v !== "forward" && v !== "reverse")
            throw new TypeError("direction must be forward/reverse");
          next.direction = v;
        }
        if (key === "speed" || key === "offset" || key === "acceleration") {
          if (typeof v !== "number" || !Number.isFinite(v) || key === "speed" && (v < 0 || v > 1e5) || key === "acceleration" && (v < 0 || v > 1e4))
            throw new TypeError(`${key} is invalid`);
          next[key] = v;
        }
      }
      if (next.acceleration !== state.acceleration) {
        const required = motionPool({ ...motion, acceleration: next.acceleration }, path.length);
        if (required.length > slots.length)
          throw new RangeError("加速度需要更多素材节点，请在插件中修改并重新生成");
      }
      return next;
    }
    function render() {
      frame.setVisible(state.enabled);
      const queues = new Map;
      if (state.enabled)
        for (const p of samplePathMotion(track, path.length, state.offset, state.speed, state.direction === "reverse", state.acceleration)) {
          const pose = path.pose(p, state.direction === "reverse"), key = `${pose.itemId}/${pose.materialId}`, q = queues.get(key) ?? [];
          q.push(pose);
          queues.set(key, q);
        }
      for (const entry of slots) {
        const key = `${entry.slot.itemId}/${entry.slot.materialId}`, pose = queues.get(key)?.shift();
        if (entry.visible !== !!pose) {
          entry.handle.setVisible(!!pose);
          entry.visible = !!pose;
        }
        if (!pose)
          continue;
        const material = motion.materials.find((m) => m.id === pose.materialId), t = motionTransform(pose, material.aspect);
        entry.handle.setTransform(t.x, t.y, t.scaleX, t.scaleY, pose.rotation);
        if (entry.key !== pose.key) {
          entry.handle.setOpacity(pose.opacity);
          entry.key = pose.key;
        }
        if (material.shape !== "image" && entry.color !== pose.color) {
          entry.handle.setFillColor({
            r: parseInt(pose.color.slice(1, 3), 16) / 255,
            g: parseInt(pose.color.slice(3, 5), 16) / 255,
            b: parseInt(pose.color.slice(5, 7), 16) / 255,
            a: 1
          });
          entry.color = pose.color;
        }
      }
    }
    function schedule() {
      if (!disposed && !paused && state.enabled && (state.speed > 0 || state.acceleration > 0) && request === null) {
        previous = performance.now();
        request = requestAnimationFrame(tick);
      }
    }
    function tick(now) {
      request = null;
      if (disposed || paused || !state.enabled)
        return;
      const delta = Math.max(0, Math.min(250, now - previous)) / 1000;
      previous = now;
      state.offset += delta * motionPhaseSpeed(motion, state.speed, state.acceleration) * (state.direction === "reverse" ? -1 : 1);
      render();
      if (now - lastTrace >= 250) {
        ctx.trace("pipe-flow.phase-sample", { offset: state.offset });
        lastTrace = now;
      }
      if (state.speed > 0 || state.acceleration > 0)
        request = requestAnimationFrame(tick);
    }
    function cancel() {
      if (request !== null) {
        cancelAnimationFrame(request);
        request = null;
      }
    }
    function publish(reason, requestId) {
      const result = snapshot();
      ctx.trace("pipe-flow.state", { reason, state: result });
      if (typeof document !== "undefined")
        document.dispatchEvent(new CustomEvent("flamo:hmi-pipe-flow:state", {
          detail: {
            requestId,
            instanceId: ctx.instance.id,
            nodeId: ctx.sourceNodeId,
            reason,
            state: result
          }
        }));
      return result;
    }
    function update(patch) {
      if (disposed)
        throw new Error("Path motion disposed");
      const next = validate(patch);
      samplePathMotion(new MotionTrack(motion), path.length, next.offset, next.speed, next.direction === "reverse", next.acceleration);
      state = next;
      cancel();
      render();
      schedule();
      return publish("business-update");
    }
    state = validate({
      enabled: initial?.enabled ?? false,
      speed: initial?.speed ?? 24,
      acceleration: motion.acceleration ?? 0,
      direction: initial?.direction ?? "forward",
      offset: initial?.offset ?? 0
    });
    const onCommand = (event) => {
      const detail = event.detail;
      if (!isRecord3(detail))
        return;
      const hasInstance = typeof detail.instanceId === "string", hasNode = typeof detail.nodeId === "string";
      if (!hasInstance && !hasNode || hasInstance && detail.instanceId !== ctx.instance.id || hasNode && detail.nodeId !== ctx.sourceNodeId && detail.nodeId !== ctx.nodeId)
        return;
      try {
        update(detail.patch);
        publish("host-event", typeof detail.requestId === "string" ? detail.requestId : undefined);
      } catch (error) {
        document.dispatchEvent(new CustomEvent("flamo:hmi-pipe-flow:state", {
          detail: {
            requestId: detail.requestId,
            instanceId: ctx.instance.id,
            nodeId: ctx.sourceNodeId,
            error: String(error)
          }
        }));
      }
    };
    ctx.expose({
      setFlowState: (...args) => update(args[0]),
      getFlowState: () => snapshot(),
      startFlow: () => {
        paused = false;
        schedule();
        return publish("start");
      },
      stopFlow: (...args) => {
        paused = true;
        cancel();
        if (args[0] === true || isRecord3(args[0]) && args[0].resetOffset === true) {
          state.offset = 0;
          render();
        }
        return publish("stop");
      }
    });
    if (typeof document !== "undefined")
      document.addEventListener("flamo:hmi-pipe-flow:set", onCommand);
    render();
    schedule();
    ctx.trace("pipe-flow.mounted", {
      behavior: ACCELERATED_PATH_FLOW_IDENTITY,
      rootNodeId: ctx.sourceNodeId,
      particles: slots.length
    });
    publish("initial");
    ctx.dispose(() => {
      disposed = true;
      cancel();
      if (typeof document !== "undefined")
        document.removeEventListener("flamo:hmi-pipe-flow:set", onCommand);
      ctx.trace("pipe-flow.disposed", { rootNodeId: ctx.sourceNodeId });
    });
  }
};

// src/hmi/path-flow-runtime.ts
var RUNTIME_PATH_FLOW_IDENTITY = "hmi.pipe-flow@2.2.0";
var path_flow_runtime_default = {
  setup(props, ctx) {
    const binding = ctx.behavior(RUNTIME_PATH_FLOW_IDENTITY);
    if (!binding)
      throw new Error(`Missing ${RUNTIME_PATH_FLOW_IDENTITY}`);
    const initial = binding.binding.options?.initialState;
    const input = initial?.motionProjection;
    if (input?.version !== 2) {
      path_flow_accelerated_default.setup(props, {
        ...ctx,
        behavior: (identity) => identity === ACCELERATED_PATH_FLOW_IDENTITY ? binding : ctx.behavior(identity)
      });
      return;
    }
    const compact = parseRuntimeMotionProjection(input);
    const frame = binding.role("motion");
    if (!frame)
      throw new Error("Missing motion role");
    const slots = motionPool(compact.motion, new MotionPath(compact.points).length);
    let poolRoot;
    let unmounted;
    const cleanups = [];
    let disposed = false;
    const cleanup = () => {
      if (disposed)
        return;
      disposed = true;
      try {
        for (const dispose of cleanups.reverse())
          dispose();
      } finally {
        try {
          if (unmounted)
            ctx.scene.remove(unmounted);
        } finally {
          if (poolRoot)
            ctx.scene.remove(poolRoot);
        }
      }
    };
    ctx.dispose(cleanup);
    try {
      poolRoot = ctx.scene.create("group", { name: "Runtime Path Motion", lifecycle: "ephemeral", interactive: false });
      ctx.scene.mount(poolRoot, { parent: frame });
      const handles = new Map;
      const projection = { version: 1, points: compact.points, motion: compact.motion, slots: [] };
      for (const [i, slot] of slots.entries()) {
        const material = compact.motion.materials.find((m) => m.id === slot.materialId);
        const node = ctx.scene.create(material.shape === "image" ? "image" : material.shape === "dot" ? "ellipse" : "vector", {
          name: `${material.name} · ${slot.itemId}`,
          size: { width: 1, height: 1 },
          visible: false,
          lifecycle: "ephemeral",
          interactive: false,
          fill: "#FFFFFF",
          stroke: [],
          ...material.shape === "image" ? { assetId: material.imageHash, fit: "FILL" } : material.shape === "dot" ? {} : { vectorData: materialVector(material) }
        });
        unmounted = node;
        ctx.scene.mount(node, { parent: poolRoot });
        unmounted = undefined;
        const handle = ctx.node(node.id);
        if (!handle)
          throw new Error(`Cannot resolve runtime particle ${node.id}`);
        handles.set(`motion:${i}`, handle);
        projection.slots.push({ ...slot, nodeId: node.id });
      }
      const runtimeBinding = {
        binding: { ...binding.binding, options: { ...binding.binding.options, initialState: { ...initial, motionProjection: projection } } },
        role: (name) => handles.get(name) ?? binding.role(name)
      };
      (async () => {
        const pending = new Set(projection.slots.map((slot) => slot.nodeId));
        pending.add(poolRoot.id);
        for (let attempt = 0;pending.size && !disposed; attempt++) {
          if (attempt >= 120)
            throw new Error("Runtime motion nodes did not finish mounting");
          await ctx.scene.flush();
          for (const id2 of pending)
            if (ctx.mounted.resolve(id2))
              pending.delete(id2);
        }
        if (disposed)
          return;
        path_flow_accelerated_default.setup(props, {
          ...ctx,
          behavior: (identity) => identity === ACCELERATED_PATH_FLOW_IDENTITY ? runtimeBinding : ctx.behavior(identity),
          dispose: (callback) => cleanups.push(callback)
        });
        ctx.trace("pipe-flow.runtime-pool", { behavior: RUNTIME_PATH_FLOW_IDENTITY, particles: slots.length });
      })().catch((error) => {
        cleanup();
        ctx.trace("pipe-flow.error", { behavior: RUNTIME_PATH_FLOW_IDENTITY, error: String(error) });
      });
    } catch (error) {
      cleanup();
      throw error;
    }
  }
};
function materialVector(material) {
  const points = MOTION_SHAPES[material.shape];
  return {
    normalizedSize: { x: 1, y: 1 },
    vectorNetwork: {
      vertices: points.map((p) => ({ ...p, styleID: 0 })),
      segments: points.map((_, i) => ({
        styleID: 0,
        start: { vertex: i, dx: 0, dy: 0 },
        end: { vertex: (i + 1) % points.length, dx: 0, dy: 0 }
      })),
      regions: [{ styleID: 0, windingRule: "NONZERO", loops: [{ segments: points.map((_, i) => i) }] }]
    }
  };
}
export {
  path_flow_runtime_default as default,
  RUNTIME_PATH_FLOW_IDENTITY
};
