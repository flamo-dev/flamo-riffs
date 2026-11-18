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
// ../hmi/src/pipe.ts
var PIPE_SPEC_KEYS = new Set(["kind", "schemaVersion", "id", "geometry", "appearance", "flow"]);
var GEOMETRY_AUTHORING_KEYS = new Set(["kind", "nodeId", "geometryHash"]);
var GEOMETRY_POLYLINE_KEYS = new Set(["kind", "points"]);
var POINT_KEYS = new Set(["x", "y"]);
var APPEARANCE_KEYS = new Set(["diameter", "wallThickness", "wallColor", "mediumColor", "cap", "join"]);
var FLOW_SPEC_V1_KEYS = new Set(["enabled", "color", "width", "dash", "gap", "direction", "speed"]);
var FLOW_SPEC_V2_KEYS = new Set(["enabled", "color", "width", "dashPattern", "direction", "speed"]);
var FLOW_PATCH_KEYS = new Set(["enabled", "color", "width", "dashPattern", "direction", "speed"]);
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
export {
  pipe_flow_default as default,
  HMI_PIPE_FLOW_HOST_STATE_EVENT,
  HMI_PIPE_FLOW_HOST_COMMAND_EVENT,
  HMI_PIPE_FLOW_BEHAVIOR_VERSION,
  HMI_PIPE_FLOW_BEHAVIOR_REF,
  HMI_PIPE_FLOW_BEHAVIOR_IDENTITY
};
