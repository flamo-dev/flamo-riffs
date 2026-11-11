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
var DEFAULT_PIPE_FLOW_RUNTIME_STATE = Object.freeze({
  enabled: false,
  speed: 24,
  direction: "forward",
  offset: 0,
  color: "#F8FAFC",
  width: 2,
  dashPattern: DEFAULT_PIPE_DASH_PATTERN
});
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
// ../hmi/src/pipe-script-contract.ts
function createPipeScriptContract(points, geometryHash) {
  if (typeof geometryHash !== "string" || !geometryHash.trim() || geometryHash.length > 256)
    throw new TypeError("Pipe script geometryHash is required");
  const path = new MotionPath(points);
  return {
    version: 1,
    pathId: "centerline",
    coordinateSpace: "source-local",
    geometryHash,
    points: path.points,
    length: path.length,
    endpoints: { start: 0, end: path.length }
  };
}
function parsePipeScriptContract(value, geometryHash) {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new TypeError("Invalid pipe script contract");
  const v = value;
  if (v.version !== 1 || v.pathId !== "centerline" || v.coordinateSpace !== "source-local" || !Array.isArray(v.points))
    throw new TypeError("Unsupported pipe script contract");
  const result = createPipeScriptContract(v.points, v.geometryHash);
  if (v.appearanceMode !== undefined) {
    if (v.appearanceMode !== "runtime")
      throw new TypeError("Invalid pipe appearance mode");
    result.appearanceMode = "runtime";
  }
  if (typeof v.length !== "number" || !Number.isFinite(v.length) || Math.abs(v.length - result.length) > 0.000001 || v.endpoints?.start !== 0 || v.endpoints?.end !== v.length)
    throw new TypeError("Pipe script path length/endpoints mismatch");
  if (geometryHash !== undefined && result.geometryHash !== geometryHash)
    throw new TypeError("Pipe script geometry is stale; regenerate the pipe in Figma");
  return result;
}
function resolvePipeFlowRange(value, length) {
  if (!Number.isFinite(length) || length <= 0)
    throw new TypeError("Invalid path length");
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new TypeError("Flow range must be an object");
  const v = value;
  if (Object.keys(v).some((k) => !["start", "end", "unit"].includes(k)) || v.unit !== "ratio" && v.unit !== "distance")
    throw new TypeError("Flow range requires start, end and unit (ratio/distance)");
  const max = v.unit === "ratio" ? 1 : length;
  if (typeof v.start !== "number" || typeof v.end !== "number" || !Number.isFinite(v.start) || !Number.isFinite(v.end) || v.start < 0 || v.end < v.start || v.end > max)
    throw new RangeError("Flow range must satisfy 0 <= start <= end <= path length");
  const scale = v.unit === "ratio" ? length : 1;
  return { start: v.start * scale, end: v.end * scale, unit: "distance" };
}
function slicePipePath(path, range2) {
  resolvePipeFlowRange(range2, path.length);
  if (range2.start === range2.end)
    return [];
  const start = path.at(range2.start), end = path.at(range2.end);
  return [
    { x: start.x, y: start.y },
    ...path.points.filter((_, i) => path.lengths[i] > range2.start && path.lengths[i] < range2.end).map((p) => ({ ...p })),
    { x: end.x, y: end.y }
  ];
}
// src/hmi/motion-batches.ts
function createMotionBatches(ctx, node, slots, materials) {
  const counts = new Map;
  for (const slot of slots) {
    const material = materials.find((m) => m.id === slot.materialId);
    if (material.shape === "image")
      continue;
    const key = `${slot.itemId}/${slot.materialId}`;
    const bucket = counts.get(key) ?? { material, count: 0 };
    bucket.count++;
    counts.set(key, bucket);
  }
  const batches = [];
  try {
    for (const [key, { material, count }] of counts) {
      const points = material.shape === "dot" ? Array.from({ length: 64 }, (_, i) => ({ x: 0.5 + 0.5 * Math.cos(i * Math.PI / 32), y: 0.5 + 0.5 * Math.sin(i * Math.PI / 32) })) : MOTION_SHAPES[material.shape];
      batches.push({ key, material, data: new Float32Array(count * 10), handle: ctx.createShapeBatch({ node, polygon: points.flatMap((p) => [p.x, p.y]), capacity: count }) });
    }
  } catch (error) {
    for (const b of batches)
      b.handle.dispose();
    throw error;
  }
  const colors = new Map;
  return {
    size: batches.length,
    render(queues) {
      for (const b of batches) {
        const poses = queues.get(b.key) ?? [];
        if (poses.length * 10 > b.data.length)
          throw new RangeError("Motion batch exceeded authored capacity");
        for (let i = 0;i < poses.length; i++) {
          const p = poses[i], t = motionTransform(p, b.material.aspect), angle = p.rotation * Math.PI / 180;
          const c = Math.cos(angle), s = Math.sin(angle), o = i * 10;
          let rgb = colors.get(p.color);
          if (!rgb) {
            rgb = [1, 3, 5].map((start) => parseInt(p.color.slice(start, start + 2), 16) / 255);
            colors.set(p.color, rgb);
          }
          b.data[o] = c * t.scaleX;
          b.data[o + 1] = s * t.scaleX;
          b.data[o + 2] = -s * t.scaleY;
          b.data[o + 3] = c * t.scaleY;
          b.data[o + 4] = t.x;
          b.data[o + 5] = t.y;
          b.data[o + 6] = rgb[0];
          b.data[o + 7] = rgb[1];
          b.data[o + 8] = rgb[2];
          b.data[o + 9] = p.opacity;
        }
        b.handle.update(b.data, poses.length);
      }
    },
    dispose() {
      for (const b of batches)
        b.handle.dispose();
    }
  };
}

// src/hmi/path-flow-realtime.ts
var REALTIME_PATH_FLOW_IDENTITY = "hmi.pipe-flow@2.6.0";
var record2 = (v) => !!v && typeof v === "object" && !Array.isArray(v);
var copy = (v) => JSON.parse(JSON.stringify(v));
var color = (v) => ({ r: parseInt(v.slice(1, 3), 16) / 255, g: parseInt(v.slice(3, 5), 16) / 255, b: parseInt(v.slice(5, 7), 16) / 255, a: 1 });
var path_flow_realtime_default = {
  setup(_props, ctx) {
    const binding = ctx.behavior(REALTIME_PATH_FLOW_IDENTITY);
    if (!binding)
      throw new Error(`Missing ${REALTIME_PATH_FLOW_IDENTITY}`);
    const initial = binding.binding.options?.initialState;
    const contract = parsePipeScriptContract(initial?.scriptContract), path = new MotionPath(contract.points);
    const projection = initial?.motionProjection ? parseRuntimeMotionProjection(initial.motionProjection) : undefined;
    if (projection && JSON.stringify(projection.points) !== JSON.stringify(contract.points))
      throw new TypeError("Motion/script path mismatch");
    const motion = projection?.motion, track = motion ? new MotionTrack(motion) : undefined;
    const useBatches = !!motion && !motion.materials.some((material) => material.shape === "image");
    const carrier = binding.role("motion");
    if (!carrier)
      throw new Error("Missing runtime carrier role: motion");
    const appearance = initial?.appearance;
    if (appearance !== undefined && (!record2(appearance) || typeof appearance.wallVisible !== "boolean" || typeof appearance.mediumVisible !== "boolean" || typeof appearance.hollow !== "boolean"))
      throw new TypeError("Missing runtime pipe appearance");
    const appearances = (record2(appearance) ? [
      { role: "wall", visible: !appearance.hollow && appearance.wallVisible === true, designVisible: !appearance.hollow },
      { role: "medium", visible: appearance.mediumVisible === true, designVisible: true },
      ...appearance.hollow ? [{ role: "wallOutline", visible: appearance.wallVisible === true, designVisible: true }] : []
    ] : []).map((setting) => {
      const handle = binding.role(setting.role);
      if (!handle)
        throw new Error(`Missing pipe appearance role: ${setting.role}`);
      return { ...setting, handle, mounted: undefined };
    });
    let appearanceApplied = false;
    const authoredFlow = binding.role("flow");
    if (!authoredFlow)
      throw new Error("Missing authored flow role");
    let mountedCarrier, mountedFlow;
    const slots = motion ? motionPool(motion, path.length) : [];
    const particles = [];
    let batches;
    let root, unmounted;
    let dash, ready = false, disposed = false, paused = false, failure = null;
    let frame = null, previous = 0, lastTrace = -Infinity;
    let renderedEnabled;
    let range2 = { start: 0, end: path.length, unit: "distance" };
    let state = {
      enabled: false,
      speed: 24,
      acceleration: motion?.acceleration ?? 0,
      direction: "forward",
      offset: 0,
      color: "#F8FAFC",
      width: 2,
      dashPattern: [10, 10]
    };
    const snapshot = () => ({
      ...state,
      dashPattern: [...state.dashPattern],
      range: { ...range2 },
      ready,
      paused,
      running: frame !== null,
      error: failure
    });
    const assertLive = () => {
      if (disposed)
        throw new Error(failure ?? "Pipe flow disposed");
    };
    function validate(patch) {
      if (!record2(patch))
        throw new TypeError("Flow state must be an object");
      const next = { ...state, dashPattern: [...state.dashPattern] };
      for (const [key, value] of Object.entries(patch)) {
        if (!(key in next) || !Object.hasOwn(next, key))
          throw new TypeError(`Unsupported flow state: ${key}`);
        if (key === "enabled") {
          if (typeof value !== "boolean")
            throw new TypeError("enabled must be boolean");
          next.enabled = value;
        } else if (key === "direction") {
          if (value !== "forward" && value !== "reverse")
            throw new TypeError("Invalid direction");
          next.direction = value;
        } else if (key === "color") {
          if (typeof value !== "string" || !/^#[0-9a-f]{6}$/i.test(value))
            throw new TypeError("Invalid flow color");
          next.color = value;
        } else if (key === "dashPattern") {
          const pattern = normalizePipeDashPattern(value);
          if (!pattern)
            throw new TypeError("Invalid dash pattern");
          next.dashPattern = pattern;
        } else {
          if (typeof value !== "number" || !Number.isFinite(value) || key !== "offset" && value < 0 || key === "acceleration" && value > 1e4 || key === "speed" && value > 1e5 || key === "width" && value > 1e4)
            throw new TypeError(`Invalid ${key}`);
          next[key] = value;
        }
      }
      if (!motion && next.acceleration !== 0)
        throw new TypeError("Acceleration requires cycle-group motion");
      if (motion) {
        if (motionPool({ ...motion, acceleration: next.acceleration }, path.length).length > slots.length)
          throw new RangeError("Acceleration exceeds authored particle budget; regenerate in Figma");
        samplePathMotion(new MotionTrack(motion), path.length, next.offset, next.speed, next.direction === "reverse", next.acceleration);
      }
      return next;
    }
    function publish(reason, requestId) {
      const result = snapshot();
      ctx.trace("pipe-flow.state", { reason, state: result });
      if (typeof document !== "undefined")
        document.dispatchEvent(new CustomEvent("flamo:hmi-pipe-flow:state", {
          detail: { instanceId: ctx.instance.id, nodeId: ctx.nodeId, requestId, reason, state: result }
        }));
      return result;
    }
    function render() {
      if (!ready || disposed)
        return;
      if (renderedEnabled !== state.enabled) {
        mountedFlow.setVisible(false);
        mountedCarrier.setVisible(state.enabled);
        renderedEnabled = state.enabled;
      }
      if (dash) {
        dash.setVisible(state.enabled && range2.start < range2.end);
        dash.set("StrokeStyleCpt.strokeDashOffset", state.offset - range2.start);
      }
      if (!motion || !track)
        return;
      const queues = new Map;
      if (state.enabled && range2.start < range2.end) {
        for (const p of samplePathMotion(track, path.length, state.offset, state.speed, state.direction === "reverse", state.acceleration)) {
          const material = motion.materials.find((m) => m.id === p.materialId);
          const margin = Math.hypot(p.size, p.size / material.aspect) / 2;
          if (p.distance - margin < range2.start || p.distance + margin > range2.end)
            continue;
          const key = `${p.itemId}/${p.materialId}`, q = queues.get(key) ?? [];
          q.push(path.pose(p, state.direction === "reverse"));
          queues.set(key, q);
        }
      }
      batches?.render(queues);
      for (const particle of particles) {
        const pose = queues.get(`${particle.itemId}/${particle.materialId}`)?.shift();
        particle.handle.setVisible(!!pose);
        if (!pose)
          continue;
        const material = motion.materials.find((m) => m.id === pose.materialId);
        const t = motionTransform(pose, material.aspect);
        particle.handle.setTransform(t.x, t.y, t.scaleX, t.scaleY, pose.rotation);
        particle.handle.setOpacity(pose.opacity);
        if (material.shape !== "image")
          particle.handle.setFillColor(color(pose.color));
      }
    }
    function updateDash() {
      if (!dash || !ready)
        return;
      const points = slicePipePath(path, range2);
      if (points.length)
        dash.set("VectorCpt.vectorData", pathVector(points));
      dash.setStrokeColor(color(state.color));
      dash.setStrokeWidth(state.width);
      dash.set("StrokeStyleCpt.strokeDashArray", [...state.dashPattern]);
    }
    function cancel() {
      if (frame !== null)
        cancelAnimationFrame(frame);
      frame = null;
    }
    function schedule() {
      if (!disposed && ready && !paused && (typeof document === "undefined" || !document.hidden) && state.enabled && (state.speed > 0 || state.acceleration > 0) && frame === null) {
        previous = performance.now();
        frame = requestAnimationFrame(tick);
      }
    }
    function onVisibilityChange() {
      cancel();
      schedule();
    }
    function tick(now) {
      frame = null;
      if (disposed || paused || !state.enabled)
        return;
      const dt = Math.max(0, now - previous) / 1000;
      previous = now;
      state.offset += dt * (motion ? motionPhaseSpeed(motion, state.speed, state.acceleration) : state.speed) * (state.direction === "reverse" ? -1 : 1);
      render();
      if (now - lastTrace >= 250) {
        ctx.trace("pipe-flow.phase-sample", { offset: state.offset, range: { ...range2 } });
        lastTrace = now;
      }
      frame = requestAnimationFrame(tick);
    }
    function update(patch) {
      assertLive();
      const next = validate(patch);
      if (frame !== null && !Object.hasOwn(patch, "offset")) {
        const dt = Math.max(0, performance.now() - previous) / 1000;
        next.offset += dt * (motion ? motionPhaseSpeed(motion, state.speed, state.acceleration) : state.speed) * (state.direction === "reverse" ? -1 : 1);
      }
      state = next;
      cancel();
      updateDash();
      render();
      schedule();
      return publish("business-update");
    }
    function setRange(value) {
      assertLive();
      const next = resolvePipeFlowRange(value, path.length);
      range2 = next;
      updateDash();
      render();
      ctx.trace("pipe-flow.range", { range: { ...range2 }, pathLength: path.length });
      return publish("range");
    }
    const onCommand = (event) => {
      const d = event.detail;
      if (!record2(d) || d.instanceId !== ctx.instance.id || d.nodeId !== ctx.nodeId)
        return;
      try {
        if (d.range !== undefined) {
          if (d.patch !== undefined)
            throw new TypeError("Send either range or patch");
          setRange(d.range);
        } else
          update(d.patch);
        publish("host-event", typeof d.requestId === "string" ? d.requestId : undefined);
      } catch (error) {
        ctx.trace("pipe-flow.command-error", { error: String(error) });
        document.dispatchEvent(new CustomEvent("flamo:hmi-pipe-flow:state", { detail: {
          instanceId: ctx.instance.id,
          nodeId: ctx.nodeId,
          requestId: d.requestId,
          error: String(error)
        } }));
      }
    };
    const cleanup = () => {
      if (disposed)
        return;
      disposed = true;
      ready = false;
      cancel();
      if (typeof document !== "undefined") {
        document.removeEventListener("flamo:hmi-pipe-flow:set", onCommand);
        document.removeEventListener("visibilitychange", onVisibilityChange);
      }
      batches?.dispose();
      try {
        if (unmounted && unmounted !== root)
          ctx.scene.remove(unmounted);
      } finally {
        if (root)
          ctx.scene.remove(root);
      }
      if (appearanceApplied)
        for (const setting of appearances) {
          const entity = ctx.mounted.resolve(setting.handle.id)?.entity;
          if (entity)
            entity.setVisible(setting.designVisible);
        }
      ctx.trace("pipe-flow.disposed", { rootNodeId: ctx.nodeId });
    };
    ctx.dispose(cleanup);
    try {
      state = validate({
        enabled: initial?.enabled ?? false,
        speed: initial?.speed ?? 24,
        direction: initial?.direction ?? "forward",
        offset: initial?.offset ?? 0,
        color: initial?.color ?? "#F8FAFC",
        width: initial?.width ?? 2,
        dashPattern: initial?.dashPattern ?? [10, 10]
      });
      ctx.expose({
        getFlowPath: () => copy(contract),
        getFlowState: snapshot,
        setFlowState: (...args) => update(args[0]),
        setFlowRange: (...args) => setRange(args[0]),
        reverseFlow: () => update({ direction: state.direction === "forward" ? "reverse" : "forward" }),
        startFlow: () => {
          assertLive();
          paused = false;
          schedule();
          return publish("start");
        },
        stopFlow: (...args) => {
          assertLive();
          paused = true;
          cancel();
          if (args[0] === true || record2(args[0]) && args[0].resetOffset === true) {
            state.offset = 0;
            render();
          }
          return publish("stop");
        }
      });
      if (typeof document !== "undefined") {
        document.addEventListener("flamo:hmi-pipe-flow:set", onCommand);
        document.addEventListener("visibilitychange", onVisibilityChange);
      }
      (async () => {
        for (let attempt = 0;!disposed; attempt++) {
          mountedCarrier = ctx.mounted.resolve(carrier.id)?.entity;
          mountedFlow = ctx.mounted.resolve(authoredFlow.id)?.entity;
          for (const setting of appearances)
            setting.mounted = ctx.mounted.resolve(setting.handle.id)?.entity;
          if (mountedCarrier && mountedFlow && appearances.every((setting) => setting.mounted))
            break;
          if (attempt >= 120)
            throw new Error("Runtime pipe roles did not finish mounting");
          await ctx.scene.flush();
        }
        if (disposed)
          return;
        appearanceApplied = true;
        for (const setting of appearances)
          setting.mounted.setVisible(setting.visible);
        root = ctx.scene.create("group", { name: "Runtime Pipe Flow", lifecycle: "ephemeral", interactive: false });
        unmounted = root;
        ctx.scene.mount(root, { parent: carrier });
        unmounted = undefined;
        const create = (kind, props) => {
          const node = ctx.scene.create(kind, { ...props, lifecycle: "ephemeral", interactive: false, visible: false });
          unmounted = node;
          ctx.scene.mount(node, { parent: root });
          unmounted = undefined;
          const handle = ctx.node(node.id);
          if (!handle)
            throw new Error(`Cannot resolve ${node.id}`);
          return handle;
        };
        if (!motion)
          dash = create("vector", {
            name: "Runtime Flow Range",
            size: { width: 1, height: 1 },
            fill: [],
            stroke: state.color,
            strokeWidth: state.width,
            vectorData: pathVector(path.points)
          });
        for (const slot of slots) {
          const material = motion.materials.find((m) => m.id === slot.materialId);
          if (useBatches)
            continue;
          const handle = create(material.shape === "image" ? "image" : material.shape === "dot" ? "ellipse" : "vector", {
            name: `${material.name} · ${slot.itemId}`,
            size: { width: 1, height: 1 },
            fill: "#FFFFFF",
            stroke: [],
            ...material.shape === "image" ? { assetId: material.imageHash, fit: "FILL" } : material.shape === "dot" ? {} : { vectorData: materialVector(material) }
          });
          particles.push({ handle, ...slot });
        }
        const pending = new Set([root.id, ...dash ? [dash.id] : [], ...particles.map((p) => p.handle.id)]);
        for (let attempt = 0;pending.size && !disposed; attempt++) {
          if (attempt >= 120)
            throw new Error("Runtime flow resources did not finish mounting");
          await ctx.scene.flush();
          for (const id2 of pending)
            if (ctx.mounted.resolve(id2))
              pending.delete(id2);
        }
        if (disposed)
          return;
        if (motion && useBatches)
          batches = createMotionBatches(ctx, root, slots, motion.materials);
        ready = true;
        updateDash();
        render();
        schedule();
        ctx.trace("pipe-flow.mounted", { behavior: REALTIME_PATH_FLOW_IDENTITY, rootNodeId: ctx.nodeId, particles: slots.length, nodes: particles.length, batches: batches?.size ?? 0 });
        publish("ready");
      })().catch((error) => {
        failure = String(error);
        cleanup();
        ctx.trace("pipe-flow.error", { error: failure });
        publish("error");
      });
    } catch (error) {
      failure = String(error);
      cleanup();
      throw error;
    }
  }
};
function pathVector(points) {
  return { normalizedSize: { x: 1, y: 1 }, vectorNetwork: {
    vertices: points.map((p) => ({ ...p, styleID: 0 })),
    segments: points.slice(1).map((_, i) => ({ styleID: 0, start: { vertex: i, dx: 0, dy: 0 }, end: { vertex: i + 1, dx: 0, dy: 0 } })),
    regions: []
  } };
}
function materialVector(material) {
  const points = MOTION_SHAPES[material.shape];
  return { normalizedSize: { x: 1, y: 1 }, vectorNetwork: {
    vertices: points.map((p) => ({ ...p, styleID: 0 })),
    segments: points.map((_, i) => ({ styleID: 0, start: { vertex: i, dx: 0, dy: 0 }, end: { vertex: (i + 1) % points.length, dx: 0, dy: 0 } })),
    regions: [{ styleID: 0, windingRule: "NONZERO", loops: [{ segments: points.map((_, i) => i) }] }]
  } };
}
export {
  path_flow_realtime_default as default,
  REALTIME_PATH_FLOW_IDENTITY
};
