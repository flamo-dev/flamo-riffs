import type { InteractionContext } from '../types';

export type ScrollAxis = 'x' | 'y';
export type ScrollDirection = ScrollAxis | 'both';
export type ScrollPointerType = 'mouse' | 'touch' | 'pen';

export interface ScrollContainerMetrics {
  viewportWidth: number;
  viewportHeight: number;
  contentWidth: number;
  contentHeight: number;
  horizontalTrackLength?: number;
  verticalTrackLength?: number;
  horizontalThumbLength?: number;
  verticalThumbLength?: number;
}

export interface ScrollContainerState {
  offsetX: number;
  offsetY: number;
  /** Rendered offset. It may temporarily exceed the clamped offset during touch/pen bounce. */
  displayOffsetX: number;
  displayOffsetY: number;
  hovered: boolean;
  focused: boolean;
  barsVisible: boolean;
  dragging: ScrollDirection | null;
  momentum: boolean;
  pointerId: number | null;
  pointerType: ScrollPointerType | null;
}

export interface ScrollContainerCommit {
  reason: 'continuous' | 'discrete' | 'visibility' | 'cancel';
  changedAxes: ScrollAxis[];
}

/** Platform-neutral values for a DOM semantic proxy or native accessibility adapter. */
export interface ScrollContainerAccessibilitySnapshot {
  role: 'scrollbar';
  tabIndex: 0;
  orientation: 'horizontal' | 'vertical';
  valueMin: 0;
  valueMax: number;
  valueNow: number;
  valueText: string;
  label?: string;
}

export interface ScrollContainerOptions {
  direction?: ScrollDirection;
  initialOffsetX?: number;
  initialOffsetY?: number;
  pageStep?: number;
  lineStep?: number;
  autoHideDelayMs?: number;
  momentumFriction?: number;
  bounceSpring?: number;
  bounceDamping?: number;
  minimumVelocity?: number;
  overscrollRatio?: number;
  reducedMotion?: boolean;
  scheduler?: Partial<ScrollContainerScheduler>;
  onCommit(state: Readonly<ScrollContainerState>, commit: ScrollContainerCommit): void;
}

export interface ScrollContainerScheduler {
  requestFrame(callback: (timestamp: number) => void): unknown;
  cancelFrame(handle: unknown): void;
  setDelay(callback: () => void, delayMs: number): unknown;
  clearDelay(handle: unknown): void;
  now(): number;
}

export interface ScrollContainerController {
  readonly state: ScrollContainerState;
  updateMetrics(metrics: ScrollContainerMetrics): void;
  setHovered(value: boolean): void;
  setFocused(value: boolean): void;
  wheel(deltaX: number, deltaY: number): void;
  jumpTo(axis: ScrollAxis, trackCoordinate: number): void;
  beginThumbDrag(axis: ScrollAxis, pointerId: number, trackCoordinate: number, pointerType?: ScrollPointerType): boolean;
  moveThumbDrag(pointerId: number, trackCoordinate: number, buttons?: number): boolean;
  endThumbDrag(pointerId: number): boolean;
  beginContentDrag(pointerId: number, pointX: number, pointY: number, timestamp?: number, pointerType?: ScrollPointerType): boolean;
  moveContentDrag(pointerId: number, pointX: number, pointY: number, timestamp?: number, buttons?: number): boolean;
  endContentDrag(pointerId: number, timestamp?: number): boolean;
  cancelThumbDrag(pointerId?: number): boolean;
  cancelContentDrag(pointerId?: number): boolean;
  key(key: string): boolean;
  accessibility(axis: ScrollAxis, label?: string): ScrollContainerAccessibilitySnapshot | null;
  flush(): void;
  dispose(): void;
}

interface DragSnapshot {
  kind: 'thumb';
  axis: ScrollAxis;
  pointerId: number;
  startCoordinate: number;
  startOffset: number;
  ratio: number;
}

interface ContentDragSnapshot {
  kind: 'content';
  pointerId: number;
  pointerType: ScrollPointerType;
  startX: number;
  startY: number;
  startDisplayX: number;
  startDisplayY: number;
  lastX: number;
  lastY: number;
  lastTimestamp: number;
  velocityX: number;
  velocityY: number;
}

type ActiveDrag = DragSnapshot | ContentDragSnapshot;

export function createScrollContainer(
  ctx: Pick<InteractionContext, 'reactive' | 'schedule' | 'dispose' | 'trace'>,
  options: ScrollContainerOptions,
): ScrollContainerController {
  const direction = options.direction ?? 'both';
  const initialOffsetX = Math.max(0, options.initialOffsetX ?? 0);
  const initialOffsetY = Math.max(0, options.initialOffsetY ?? 0);
  const scheduler = resolveScheduler(options.scheduler);
  const autoHideDelayMs = Math.max(0, finite(options.autoHideDelayMs ?? 1000));
  const momentumFriction = positive(options.momentumFriction, 0.006);
  const bounceSpring = positive(options.bounceSpring, 0.0012);
  const bounceDamping = positive(options.bounceDamping, 0.018);
  const minimumVelocity = positive(options.minimumVelocity, 0.02);
  const overscrollRatio = clamp(finite(options.overscrollRatio ?? 0.18), 0, 1);
  const state = ctx.reactive<ScrollContainerState>({
    offsetX: initialOffsetX,
    offsetY: initialOffsetY,
    displayOffsetX: initialOffsetX,
    displayOffsetY: initialOffsetY,
    hovered: false,
    focused: false,
    barsVisible: false,
    dragging: null,
    momentum: false,
    pointerId: null,
    pointerType: null,
  });
  let metrics = normalizeMetrics({ viewportWidth: 0, viewportHeight: 0, contentWidth: 0, contentHeight: 0 });
  let drag: ActiveDrag | null = null;
  let disposed = false;
  let scheduled = false;
  let hideHandle: unknown = null;
  let momentumHandle: unknown = null;
  let momentumLastTimestamp = 0;
  let momentumVelocityX = 0;
  let momentumVelocityY = 0;
  const dirtyAxes = new Set<ScrollAxis>();

  const publish = (reason: ScrollContainerCommit['reason']) => {
    if (disposed) return;
    const changedAxes = [...dirtyAxes];
    dirtyAxes.clear();
    scheduled = false;
    options.onCommit({ ...state }, { reason, changedAxes });
  };
  const schedulePublish = () => {
    if (scheduled || disposed) return;
    scheduled = true;
    const run = () => {
      if (scheduled) publish('continuous');
    };
    if (ctx.schedule) ctx.schedule(run);
    else queueMicrotask(run);
  };
  const setOffset = (axis: ScrollAxis, value: number, mode: 'continuous' | 'discrete') => {
    if (!axisEnabled(direction, axis)) return false;
    const next = clamp(value, 0, scrollRange(metrics, axis));
    const key = axis === 'x' ? 'offsetX' : 'offsetY';
    const displayKey = axis === 'x' ? 'displayOffsetX' : 'displayOffsetY';
    if (Math.abs(state[key] - next) < 1e-6 && Math.abs(state[displayKey] - next) < 1e-6) return false;
    state[key] = next;
    state[displayKey] = next;
    dirtyAxes.add(axis);
    if (mode === 'discrete') publish('discrete');
    else schedulePublish();
    return true;
  };
  const setBarsVisible = (value: boolean) => {
    if (state.barsVisible === value) return;
    state.barsVisible = value;
    options.onCommit({ ...state }, { reason: 'visibility', changedAxes: [] });
  };
  const clearHide = () => {
    if (hideHandle === null) return;
    scheduler.clearDelay(hideHandle);
    hideHandle = null;
  };
  const showBars = () => {
    clearHide();
    setBarsVisible(true);
  };
  const scheduleHide = () => {
    clearHide();
    if (disposed || state.hovered || state.focused || drag || state.momentum) return;
    if (autoHideDelayMs === 0) {
      setBarsVisible(false);
      return;
    }
    hideHandle = scheduler.setDelay(() => {
      hideHandle = null;
      if (!disposed && !state.hovered && !state.focused && !drag && !state.momentum) setBarsVisible(false);
    }, autoHideDelayMs);
  };
  const setDisplayOffset = (axis: ScrollAxis, value: number) => {
    if (!axisEnabled(direction, axis)) return false;
    const displayKey = axis === 'x' ? 'displayOffsetX' : 'displayOffsetY';
    const offsetKey = axis === 'x' ? 'offsetX' : 'offsetY';
    const nextDisplay = finite(value);
    const nextOffset = clamp(nextDisplay, 0, scrollRange(metrics, axis));
    if (Math.abs(state[displayKey] - nextDisplay) < 1e-6 && Math.abs(state[offsetKey] - nextOffset) < 1e-6) return false;
    state[displayKey] = nextDisplay;
    state[offsetKey] = nextOffset;
    dirtyAxes.add(axis);
    return true;
  };
  const stopMomentum = (settle: boolean) => {
    if (momentumHandle !== null) scheduler.cancelFrame(momentumHandle);
    momentumHandle = null;
    momentumLastTimestamp = 0;
    momentumVelocityX = 0;
    momentumVelocityY = 0;
    const wasActive = state.momentum;
    state.momentum = false;
    if (settle) {
      setDisplayOffset('x', state.offsetX);
      setDisplayOffset('y', state.offsetY);
    }
    if (wasActive) ctx.trace?.('scroll.momentum.end', { offsetX: state.offsetX, offsetY: state.offsetY });
  };
  const settleAxis = (axis: ScrollAxis, velocity: number, deltaMs: number) => {
    const range = scrollRange(metrics, axis);
    const display = axis === 'x' ? state.displayOffsetX : state.displayOffsetY;
    let nextDisplay = display + velocity * deltaMs;
    let nextVelocity = velocity;
    const boundary = nextDisplay < 0 ? 0 : nextDisplay > range ? range : null;
    if (boundary !== null) {
      nextVelocity += (boundary - nextDisplay) * bounceSpring * deltaMs;
      nextVelocity *= Math.exp(-bounceDamping * deltaMs);
      const viewport = axis === 'x' ? metrics.viewportWidth : metrics.viewportHeight;
      const maximumOverscroll = Math.max(1, viewport * overscrollRatio);
      nextDisplay = clamp(nextDisplay, -maximumOverscroll, range + maximumOverscroll);
      const settled = Math.abs(boundary - nextDisplay) < 0.5 && Math.abs(nextVelocity) < minimumVelocity;
      return settled
        ? { display: boundary, velocity: 0, settled: true }
        : { display: nextDisplay, velocity: nextVelocity, settled: false };
    }
    nextVelocity *= Math.exp(-momentumFriction * deltaMs);
    return { display: nextDisplay, velocity: Math.abs(nextVelocity) < minimumVelocity ? 0 : nextVelocity, settled: Math.abs(nextVelocity) < minimumVelocity };
  };
  const momentumStep = (timestamp: number) => {
    if (disposed || !state.momentum) return;
    momentumHandle = null;
    const deltaMs = momentumLastTimestamp === 0 ? 16 : clamp(timestamp - momentumLastTimestamp, 8, 32);
    momentumLastTimestamp = timestamp;
    const x = settleAxis('x', momentumVelocityX, deltaMs);
    const y = settleAxis('y', momentumVelocityY, deltaMs);
    momentumVelocityX = x.velocity;
    momentumVelocityY = y.velocity;
    setDisplayOffset('x', x.display);
    setDisplayOffset('y', y.display);
    if (dirtyAxes.size > 0) publish('continuous');
    if (x.settled && y.settled) {
      stopMomentum(true);
      if (dirtyAxes.size > 0) publish('continuous');
      scheduleHide();
      return;
    }
    momentumHandle = scheduler.requestFrame(momentumStep);
  };
  const startMomentum = (velocityX: number, velocityY: number) => {
    stopMomentum(false);
    momentumVelocityX = axisEnabled(direction, 'x') ? finite(velocityX) : 0;
    momentumVelocityY = axisEnabled(direction, 'y') ? finite(velocityY) : 0;
    const outsideBounds = state.displayOffsetX !== state.offsetX || state.displayOffsetY !== state.offsetY;
    if (options.reducedMotion || (!outsideBounds
      && Math.abs(momentumVelocityX) < minimumVelocity
      && Math.abs(momentumVelocityY) < minimumVelocity)) {
      setDisplayOffset('x', state.offsetX);
      setDisplayOffset('y', state.offsetY);
      if (dirtyAxes.size > 0) publish('continuous');
      scheduleHide();
      return;
    }
    state.momentum = true;
    showBars();
    ctx.trace?.('scroll.momentum.start', { velocityX: momentumVelocityX, velocityY: momentumVelocityY });
    momentumHandle = scheduler.requestFrame(momentumStep);
  };

  const controller: ScrollContainerController = {
    state,
    updateMetrics(nextMetrics) {
      const previousOffsetX = state.offsetX;
      const previousOffsetY = state.offsetY;
      if (drag?.kind === 'thumb') controller.cancelThumbDrag(drag.pointerId);
      else if (drag?.kind === 'content') controller.cancelContentDrag(drag.pointerId);
      stopMomentum(false);
      metrics = normalizeMetrics(nextMetrics);
      state.offsetX = clamp(state.offsetX, 0, scrollRange(metrics, 'x'));
      state.offsetY = clamp(state.offsetY, 0, scrollRange(metrics, 'y'));
      state.displayOffsetX = state.offsetX;
      state.displayOffsetY = state.offsetY;
      if (state.offsetX !== previousOffsetX) dirtyAxes.add('x');
      if (state.offsetY !== previousOffsetY) dirtyAxes.add('y');
      if (dirtyAxes.size > 0) publish('discrete');
    },
    setHovered(value) {
      state.hovered = value;
      if (value) showBars();
      else scheduleHide();
    },
    setFocused(value) {
      state.focused = value;
      if (value) showBars();
      else scheduleHide();
    },
    wheel(deltaX, deltaY) {
      stopMomentum(true);
      showBars();
      if (axisEnabled(direction, 'x')) setOffset('x', state.offsetX + finite(deltaX), 'continuous');
      if (axisEnabled(direction, 'y')) setOffset('y', state.offsetY + finite(deltaY), 'continuous');
      ctx.trace?.('scroll.wheel', { deltaX, deltaY });
      scheduleHide();
    },
    jumpTo(axis, trackCoordinate) {
      stopMomentum(true);
      showBars();
      const ratio = thumbRatio(metrics, axis);
      const thumbLength = thumbSize(metrics, axis);
      const next = (finite(trackCoordinate) - thumbLength / 2) * ratio;
      const changed = setOffset(axis, next, 'discrete');
      if (changed) ctx.trace?.('scroll.track-jump', { axis, offset: axis === 'x' ? state.offsetX : state.offsetY });
      scheduleHide();
    },
    beginThumbDrag(axis, pointerId, trackCoordinate, pointerType = 'mouse') {
      if (!axisEnabled(direction, axis) || drag) return false;
      stopMomentum(true);
      drag = {
        kind: 'thumb',
        axis,
        pointerId,
        startCoordinate: finite(trackCoordinate),
        startOffset: axis === 'x' ? state.offsetX : state.offsetY,
        ratio: thumbRatio(metrics, axis),
      };
      state.dragging = axis;
      state.pointerId = pointerId;
      state.pointerType = pointerType;
      showBars();
      ctx.trace?.('scroll.thumb-drag.start', { axis, pointerId, pointerType });
      return true;
    },
    moveThumbDrag(pointerId, trackCoordinate, buttons) {
      if (drag?.kind !== 'thumb' || drag.pointerId !== pointerId) return false;
      if (state.pointerType === 'mouse' && buttons === 0) return controller.cancelThumbDrag(pointerId);
      const next = drag.startOffset + (finite(trackCoordinate) - drag.startCoordinate) * drag.ratio;
      return setOffset(drag.axis, next, 'continuous');
    },
    endThumbDrag(pointerId) {
      if (drag?.kind !== 'thumb' || drag.pointerId !== pointerId) return false;
      const axis = drag.axis;
      drag = null;
      state.dragging = null;
      state.pointerId = null;
      state.pointerType = null;
      scheduleHide();
      ctx.trace?.('scroll.thumb-drag.end', { axis, pointerId });
      return true;
    },
    beginContentDrag(pointerId, pointX, pointY, timestamp = scheduler.now(), pointerType = 'touch') {
      if (drag) return false;
      stopMomentum(true);
      const x = finite(pointX);
      const y = finite(pointY);
      drag = {
        kind: 'content',
        pointerId,
        pointerType,
        startX: x,
        startY: y,
        startDisplayX: state.displayOffsetX,
        startDisplayY: state.displayOffsetY,
        lastX: x,
        lastY: y,
        lastTimestamp: finite(timestamp),
        velocityX: 0,
        velocityY: 0,
      };
      state.dragging = direction;
      state.pointerId = pointerId;
      state.pointerType = pointerType;
      showBars();
      ctx.trace?.('scroll.content-drag.start', { pointerId, pointerType });
      return true;
    },
    moveContentDrag(pointerId, pointX, pointY, timestamp = scheduler.now(), buttons) {
      if (drag?.kind !== 'content' || drag.pointerId !== pointerId) return false;
      if (drag.pointerType === 'mouse' && buttons === 0) return controller.cancelContentDrag(pointerId);
      const x = finite(pointX);
      const y = finite(pointY);
      const time = finite(timestamp);
      const deltaMs = Math.max(1, time - drag.lastTimestamp);
      const previousDisplayX = state.displayOffsetX;
      const previousDisplayY = state.displayOffsetY;
      if (axisEnabled(direction, 'x')) {
        const rawX = drag.startDisplayX - (x - drag.startX);
        setDisplayOffset('x', resistOverscroll(rawX, scrollRange(metrics, 'x'), metrics.viewportWidth, overscrollRatio));
      }
      if (axisEnabled(direction, 'y')) {
        const rawY = drag.startDisplayY - (y - drag.startY);
        setDisplayOffset('y', resistOverscroll(rawY, scrollRange(metrics, 'y'), metrics.viewportHeight, overscrollRatio));
      }
      const instantVelocityX = (state.displayOffsetX - previousDisplayX) / deltaMs;
      const instantVelocityY = (state.displayOffsetY - previousDisplayY) / deltaMs;
      drag.velocityX = drag.velocityX * 0.72 + instantVelocityX * 0.28;
      drag.velocityY = drag.velocityY * 0.72 + instantVelocityY * 0.28;
      drag.lastX = x;
      drag.lastY = y;
      drag.lastTimestamp = time;
      if (dirtyAxes.size > 0) schedulePublish();
      return true;
    },
    endContentDrag(pointerId, timestamp = scheduler.now()) {
      if (drag?.kind !== 'content' || drag.pointerId !== pointerId) return false;
      const releaseDelay = Math.max(0, finite(timestamp) - drag.lastTimestamp);
      const staleFactor = releaseDelay > 80 ? 0.2 : 1;
      const velocityX = drag.velocityX * staleFactor;
      const velocityY = drag.velocityY * staleFactor;
      const pointerType = drag.pointerType;
      drag = null;
      state.dragging = null;
      state.pointerId = null;
      state.pointerType = null;
      ctx.trace?.('scroll.content-drag.end', { pointerId, pointerType, velocityX, velocityY });
      startMomentum(velocityX, velocityY);
      return true;
    },
    cancelThumbDrag(pointerId) {
      if (drag?.kind !== 'thumb' || (pointerId !== undefined && drag.pointerId !== pointerId)) return false;
      const axis = drag.axis;
      const cancelledPointerId = drag.pointerId;
      drag = null;
      state.dragging = null;
      state.pointerId = null;
      state.pointerType = null;
      scheduled = false;
      publish('cancel');
      scheduleHide();
      ctx.trace?.('scroll.thumb-drag.cancel', { axis, pointerId: cancelledPointerId });
      return true;
    },
    cancelContentDrag(pointerId) {
      if (drag?.kind !== 'content' || (pointerId !== undefined && drag.pointerId !== pointerId)) return false;
      const cancelledPointerId = drag.pointerId;
      drag = null;
      state.dragging = null;
      state.pointerId = null;
      state.pointerType = null;
      scheduled = false;
      setDisplayOffset('x', state.offsetX);
      setDisplayOffset('y', state.offsetY);
      publish('cancel');
      scheduleHide();
      ctx.trace?.('scroll.content-drag.cancel', { pointerId: cancelledPointerId });
      return true;
    },
    key(key) {
      stopMomentum(true);
      const line = Math.max(1, options.lineStep ?? 40);
      const pageX = Math.max(1, metrics.viewportWidth * (options.pageStep ?? 0.9));
      const pageY = Math.max(1, metrics.viewportHeight * (options.pageStep ?? 0.9));
      const actions: Record<string, [ScrollAxis, number]> = {
        ArrowLeft: ['x', state.offsetX - line],
        ArrowRight: ['x', state.offsetX + line],
        ArrowUp: ['y', state.offsetY - line],
        ArrowDown: ['y', state.offsetY + line],
        PageUp: ['y', state.offsetY - pageY],
        PageDown: ['y', state.offsetY + pageY],
        Home: [direction === 'x' ? 'x' : 'y', 0],
        End: [direction === 'x' ? 'x' : 'y', scrollRange(metrics, direction === 'x' ? 'x' : 'y')],
      };
      if (key === 'PageLeft') actions[key] = ['x', state.offsetX - pageX];
      if (key === 'PageRight') actions[key] = ['x', state.offsetX + pageX];
      const action = actions[key];
      if (!action || !axisEnabled(direction, action[0])) return false;
      showBars();
      const changed = setOffset(action[0], action[1], 'discrete');
      if (changed) ctx.trace?.('scroll.keyboard', { key, axis: action[0] });
      scheduleHide();
      return changed;
    },
    accessibility(axis, label) {
      if (!axisEnabled(direction, axis)) return null;
      const valueMax = scrollRange(metrics, axis);
      const valueNow = axis === 'x' ? state.offsetX : state.offsetY;
      return {
        role: 'scrollbar',
        tabIndex: 0,
        orientation: axis === 'x' ? 'horizontal' : 'vertical',
        valueMin: 0,
        valueMax,
        valueNow,
        valueText: valueMax > 0 ? `${Math.round(valueNow / valueMax * 100)}%` : '0%',
        ...(label ? { label } : {}),
      };
    },
    flush() {
      if (scheduled) publish('continuous');
    },
    dispose() {
      disposed = true;
      scheduled = false;
      dirtyAxes.clear();
      drag = null;
      clearHide();
      stopMomentum(false);
      state.dragging = null;
      state.pointerId = null;
      state.pointerType = null;
    },
  };
  ctx.dispose(() => controller.dispose());
  return controller;
}

export function scrollRange(metrics: ScrollContainerMetrics, axis: ScrollAxis): number {
  return Math.max(0, axis === 'x'
    ? finite(metrics.contentWidth) - finite(metrics.viewportWidth)
    : finite(metrics.contentHeight) - finite(metrics.viewportHeight));
}

export function thumbRatio(metrics: ScrollContainerMetrics, axis: ScrollAxis): number {
  const range = scrollRange(metrics, axis);
  const travel = Math.max(0, trackSize(metrics, axis) - thumbSize(metrics, axis));
  return travel > 0 ? range / travel : 0;
}

function trackSize(metrics: ScrollContainerMetrics, axis: ScrollAxis): number {
  return Math.max(0, finite(axis === 'x'
    ? metrics.horizontalTrackLength ?? metrics.viewportWidth
    : metrics.verticalTrackLength ?? metrics.viewportHeight));
}

function thumbSize(metrics: ScrollContainerMetrics, axis: ScrollAxis): number {
  const viewport = axis === 'x' ? metrics.viewportWidth : metrics.viewportHeight;
  const content = axis === 'x' ? metrics.contentWidth : metrics.contentHeight;
  const explicit = axis === 'x' ? metrics.horizontalThumbLength : metrics.verticalThumbLength;
  if (explicit !== undefined) return clamp(finite(explicit), 0, trackSize(metrics, axis));
  return content > 0 ? clamp(trackSize(metrics, axis) * viewport / content, 0, trackSize(metrics, axis)) : 0;
}

function axisEnabled(direction: ScrollDirection, axis: ScrollAxis): boolean {
  return direction === 'both' || direction === axis;
}

function normalizeMetrics(metrics: ScrollContainerMetrics): ScrollContainerMetrics {
  return {
    ...metrics,
    viewportWidth: Math.max(0, finite(metrics.viewportWidth)),
    viewportHeight: Math.max(0, finite(metrics.viewportHeight)),
    contentWidth: Math.max(0, finite(metrics.contentWidth)),
    contentHeight: Math.max(0, finite(metrics.contentHeight)),
  };
}

function finite(value: number): number {
  return Number.isFinite(value) ? value : 0;
}

function positive(value: number | undefined, fallback: number): number {
  const candidate = finite(value ?? fallback);
  return candidate > 0 ? candidate : fallback;
}

function resistOverscroll(value: number, range: number, viewport: number, ratio: number): number {
  if (value < 0) return Math.max(-Math.max(1, viewport * ratio), value * ratio);
  if (value > range) return Math.min(range + Math.max(1, viewport * ratio), range + (value - range) * ratio);
  return value;
}

function resolveScheduler(overrides: Partial<ScrollContainerScheduler> | undefined): ScrollContainerScheduler {
  const hasAnimationFrame = typeof globalThis.requestAnimationFrame === 'function';
  return {
    requestFrame: overrides?.requestFrame ?? (callback => hasAnimationFrame
      ? globalThis.requestAnimationFrame(callback)
      : globalThis.setTimeout(() => callback(Date.now()), 16)),
    cancelFrame: overrides?.cancelFrame ?? (handle => {
      if (hasAnimationFrame) globalThis.cancelAnimationFrame(handle as number);
      else globalThis.clearTimeout(handle as ReturnType<typeof setTimeout>);
    }),
    setDelay: overrides?.setDelay ?? ((callback, delayMs) => globalThis.setTimeout(callback, delayMs)),
    clearDelay: overrides?.clearDelay ?? (handle => globalThis.clearTimeout(handle as ReturnType<typeof setTimeout>)),
    now: overrides?.now ?? (() => typeof globalThis.performance?.now === 'function' ? globalThis.performance.now() : Date.now()),
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
