export function createScrollContainer(ctx, options) {
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
    const state = ctx.reactive({
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
    let drag = null;
    let disposed = false;
    let scheduled = false;
    let hideHandle = null;
    let momentumHandle = null;
    let momentumLastTimestamp = 0;
    let momentumVelocityX = 0;
    let momentumVelocityY = 0;
    const dirtyAxes = new Set();
    const publish = (reason) => {
        if (disposed)
            return;
        const changedAxes = [...dirtyAxes];
        dirtyAxes.clear();
        scheduled = false;
        options.onCommit({ ...state }, { reason, changedAxes });
    };
    const schedulePublish = () => {
        if (scheduled || disposed)
            return;
        scheduled = true;
        const run = () => {
            if (scheduled)
                publish('continuous');
        };
        if (ctx.schedule)
            ctx.schedule(run);
        else
            queueMicrotask(run);
    };
    const setOffset = (axis, value, mode) => {
        if (!axisEnabled(direction, axis))
            return false;
        const next = clamp(value, 0, scrollRange(metrics, axis));
        const key = axis === 'x' ? 'offsetX' : 'offsetY';
        const displayKey = axis === 'x' ? 'displayOffsetX' : 'displayOffsetY';
        if (Math.abs(state[key] - next) < 1e-6 && Math.abs(state[displayKey] - next) < 1e-6)
            return false;
        state[key] = next;
        state[displayKey] = next;
        dirtyAxes.add(axis);
        if (mode === 'discrete')
            publish('discrete');
        else
            schedulePublish();
        return true;
    };
    const setBarsVisible = (value) => {
        if (state.barsVisible === value)
            return;
        state.barsVisible = value;
        options.onCommit({ ...state }, { reason: 'visibility', changedAxes: [] });
    };
    const clearHide = () => {
        if (hideHandle === null)
            return;
        scheduler.clearDelay(hideHandle);
        hideHandle = null;
    };
    const showBars = () => {
        clearHide();
        setBarsVisible(true);
    };
    const scheduleHide = () => {
        clearHide();
        if (disposed || state.hovered || state.focused || drag || state.momentum)
            return;
        if (autoHideDelayMs === 0) {
            setBarsVisible(false);
            return;
        }
        hideHandle = scheduler.setDelay(() => {
            hideHandle = null;
            if (!disposed && !state.hovered && !state.focused && !drag && !state.momentum)
                setBarsVisible(false);
        }, autoHideDelayMs);
    };
    const setDisplayOffset = (axis, value) => {
        if (!axisEnabled(direction, axis))
            return false;
        const displayKey = axis === 'x' ? 'displayOffsetX' : 'displayOffsetY';
        const offsetKey = axis === 'x' ? 'offsetX' : 'offsetY';
        const nextDisplay = finite(value);
        const nextOffset = clamp(nextDisplay, 0, scrollRange(metrics, axis));
        if (Math.abs(state[displayKey] - nextDisplay) < 1e-6 && Math.abs(state[offsetKey] - nextOffset) < 1e-6)
            return false;
        state[displayKey] = nextDisplay;
        state[offsetKey] = nextOffset;
        dirtyAxes.add(axis);
        return true;
    };
    const stopMomentum = (settle) => {
        if (momentumHandle !== null)
            scheduler.cancelFrame(momentumHandle);
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
        if (wasActive)
            ctx.trace?.('scroll.momentum.end', { offsetX: state.offsetX, offsetY: state.offsetY });
    };
    const settleAxis = (axis, velocity, deltaMs) => {
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
    const momentumStep = (timestamp) => {
        if (disposed || !state.momentum)
            return;
        momentumHandle = null;
        const deltaMs = momentumLastTimestamp === 0 ? 16 : clamp(timestamp - momentumLastTimestamp, 8, 32);
        momentumLastTimestamp = timestamp;
        const x = settleAxis('x', momentumVelocityX, deltaMs);
        const y = settleAxis('y', momentumVelocityY, deltaMs);
        momentumVelocityX = x.velocity;
        momentumVelocityY = y.velocity;
        setDisplayOffset('x', x.display);
        setDisplayOffset('y', y.display);
        if (dirtyAxes.size > 0)
            publish('continuous');
        if (x.settled && y.settled) {
            stopMomentum(true);
            if (dirtyAxes.size > 0)
                publish('continuous');
            scheduleHide();
            return;
        }
        momentumHandle = scheduler.requestFrame(momentumStep);
    };
    const startMomentum = (velocityX, velocityY) => {
        stopMomentum(false);
        momentumVelocityX = axisEnabled(direction, 'x') ? finite(velocityX) : 0;
        momentumVelocityY = axisEnabled(direction, 'y') ? finite(velocityY) : 0;
        const outsideBounds = state.displayOffsetX !== state.offsetX || state.displayOffsetY !== state.offsetY;
        if (options.reducedMotion || (!outsideBounds
            && Math.abs(momentumVelocityX) < minimumVelocity
            && Math.abs(momentumVelocityY) < minimumVelocity)) {
            setDisplayOffset('x', state.offsetX);
            setDisplayOffset('y', state.offsetY);
            if (dirtyAxes.size > 0)
                publish('continuous');
            scheduleHide();
            return;
        }
        state.momentum = true;
        showBars();
        ctx.trace?.('scroll.momentum.start', { velocityX: momentumVelocityX, velocityY: momentumVelocityY });
        momentumHandle = scheduler.requestFrame(momentumStep);
    };
    const controller = {
        state,
        updateMetrics(nextMetrics) {
            const previousOffsetX = state.offsetX;
            const previousOffsetY = state.offsetY;
            if (drag?.kind === 'thumb')
                controller.cancelThumbDrag(drag.pointerId);
            else if (drag?.kind === 'content')
                controller.cancelContentDrag(drag.pointerId);
            stopMomentum(false);
            metrics = normalizeMetrics(nextMetrics);
            state.offsetX = clamp(state.offsetX, 0, scrollRange(metrics, 'x'));
            state.offsetY = clamp(state.offsetY, 0, scrollRange(metrics, 'y'));
            state.displayOffsetX = state.offsetX;
            state.displayOffsetY = state.offsetY;
            if (state.offsetX !== previousOffsetX)
                dirtyAxes.add('x');
            if (state.offsetY !== previousOffsetY)
                dirtyAxes.add('y');
            if (dirtyAxes.size > 0)
                publish('discrete');
        },
        setHovered(value) {
            state.hovered = value;
            if (value)
                showBars();
            else
                scheduleHide();
        },
        setFocused(value) {
            state.focused = value;
            if (value)
                showBars();
            else
                scheduleHide();
        },
        wheel(deltaX, deltaY) {
            stopMomentum(true);
            showBars();
            if (axisEnabled(direction, 'x'))
                setOffset('x', state.offsetX + finite(deltaX), 'continuous');
            if (axisEnabled(direction, 'y'))
                setOffset('y', state.offsetY + finite(deltaY), 'continuous');
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
            if (changed)
                ctx.trace?.('scroll.track-jump', { axis, offset: axis === 'x' ? state.offsetX : state.offsetY });
            scheduleHide();
        },
        beginThumbDrag(axis, pointerId, trackCoordinate, pointerType = 'mouse') {
            if (!axisEnabled(direction, axis) || drag)
                return false;
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
            if (drag?.kind !== 'thumb' || drag.pointerId !== pointerId)
                return false;
            if (state.pointerType === 'mouse' && buttons === 0)
                return controller.cancelThumbDrag(pointerId);
            const next = drag.startOffset + (finite(trackCoordinate) - drag.startCoordinate) * drag.ratio;
            return setOffset(drag.axis, next, 'continuous');
        },
        endThumbDrag(pointerId) {
            if (drag?.kind !== 'thumb' || drag.pointerId !== pointerId)
                return false;
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
            if (drag)
                return false;
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
            if (drag?.kind !== 'content' || drag.pointerId !== pointerId)
                return false;
            if (drag.pointerType === 'mouse' && buttons === 0)
                return controller.cancelContentDrag(pointerId);
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
            if (dirtyAxes.size > 0)
                schedulePublish();
            return true;
        },
        endContentDrag(pointerId, timestamp = scheduler.now()) {
            if (drag?.kind !== 'content' || drag.pointerId !== pointerId)
                return false;
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
            if (drag?.kind !== 'thumb' || (pointerId !== undefined && drag.pointerId !== pointerId))
                return false;
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
            if (drag?.kind !== 'content' || (pointerId !== undefined && drag.pointerId !== pointerId))
                return false;
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
            const actions = {
                ArrowLeft: ['x', state.offsetX - line],
                ArrowRight: ['x', state.offsetX + line],
                ArrowUp: ['y', state.offsetY - line],
                ArrowDown: ['y', state.offsetY + line],
                PageUp: ['y', state.offsetY - pageY],
                PageDown: ['y', state.offsetY + pageY],
                Home: [direction === 'x' ? 'x' : 'y', 0],
                End: [direction === 'x' ? 'x' : 'y', scrollRange(metrics, direction === 'x' ? 'x' : 'y')],
            };
            if (key === 'PageLeft')
                actions[key] = ['x', state.offsetX - pageX];
            if (key === 'PageRight')
                actions[key] = ['x', state.offsetX + pageX];
            const action = actions[key];
            if (!action || !axisEnabled(direction, action[0]))
                return false;
            showBars();
            const changed = setOffset(action[0], action[1], 'discrete');
            if (changed)
                ctx.trace?.('scroll.keyboard', { key, axis: action[0] });
            scheduleHide();
            return changed;
        },
        accessibility(axis, label) {
            if (!axisEnabled(direction, axis))
                return null;
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
            if (scheduled)
                publish('continuous');
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
export function scrollRange(metrics, axis) {
    return Math.max(0, axis === 'x'
        ? finite(metrics.contentWidth) - finite(metrics.viewportWidth)
        : finite(metrics.contentHeight) - finite(metrics.viewportHeight));
}
export function thumbRatio(metrics, axis) {
    const range = scrollRange(metrics, axis);
    const travel = Math.max(0, trackSize(metrics, axis) - thumbSize(metrics, axis));
    return travel > 0 ? range / travel : 0;
}
function trackSize(metrics, axis) {
    return Math.max(0, finite(axis === 'x'
        ? metrics.horizontalTrackLength ?? metrics.viewportWidth
        : metrics.verticalTrackLength ?? metrics.viewportHeight));
}
function thumbSize(metrics, axis) {
    const viewport = axis === 'x' ? metrics.viewportWidth : metrics.viewportHeight;
    const content = axis === 'x' ? metrics.contentWidth : metrics.contentHeight;
    const explicit = axis === 'x' ? metrics.horizontalThumbLength : metrics.verticalThumbLength;
    if (explicit !== undefined)
        return clamp(finite(explicit), 0, trackSize(metrics, axis));
    return content > 0 ? clamp(trackSize(metrics, axis) * viewport / content, 0, trackSize(metrics, axis)) : 0;
}
function axisEnabled(direction, axis) {
    return direction === 'both' || direction === axis;
}
function normalizeMetrics(metrics) {
    return {
        ...metrics,
        viewportWidth: Math.max(0, finite(metrics.viewportWidth)),
        viewportHeight: Math.max(0, finite(metrics.viewportHeight)),
        contentWidth: Math.max(0, finite(metrics.contentWidth)),
        contentHeight: Math.max(0, finite(metrics.contentHeight)),
    };
}
function finite(value) {
    return Number.isFinite(value) ? value : 0;
}
function positive(value, fallback) {
    const candidate = finite(value ?? fallback);
    return candidate > 0 ? candidate : fallback;
}
function resistOverscroll(value, range, viewport, ratio) {
    if (value < 0)
        return Math.max(-Math.max(1, viewport * ratio), value * ratio);
    if (value > range)
        return Math.min(range + Math.max(1, viewport * ratio), range + (value - range) * ratio);
    return value;
}
function resolveScheduler(overrides) {
    const hasAnimationFrame = typeof globalThis.requestAnimationFrame === 'function';
    return {
        requestFrame: overrides?.requestFrame ?? (callback => hasAnimationFrame
            ? globalThis.requestAnimationFrame(callback)
            : globalThis.setTimeout(() => callback(Date.now()), 16)),
        cancelFrame: overrides?.cancelFrame ?? (handle => {
            if (hasAnimationFrame)
                globalThis.cancelAnimationFrame(handle);
            else
                globalThis.clearTimeout(handle);
        }),
        setDelay: overrides?.setDelay ?? ((callback, delayMs) => globalThis.setTimeout(callback, delayMs)),
        clearDelay: overrides?.clearDelay ?? (handle => globalThis.clearTimeout(handle)),
        now: overrides?.now ?? (() => typeof globalThis.performance?.now === 'function' ? globalThis.performance.now() : Date.now()),
    };
}
function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGVhZi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImxlYWYudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBeUhBLE1BQU0sVUFBVSxxQkFBcUIsQ0FDbkMsR0FBNEUsRUFDNUUsT0FBK0I7SUFFL0IsTUFBTSxTQUFTLEdBQUcsT0FBTyxDQUFDLFNBQVMsSUFBSSxNQUFNLENBQUM7SUFDOUMsTUFBTSxjQUFjLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsT0FBTyxDQUFDLGNBQWMsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUNoRSxNQUFNLGNBQWMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxPQUFPLENBQUMsY0FBYyxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQ2hFLE1BQU0sU0FBUyxHQUFHLGdCQUFnQixDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUN0RCxNQUFNLGVBQWUsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxNQUFNLENBQUMsT0FBTyxDQUFDLGVBQWUsSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQzdFLE1BQU0sZ0JBQWdCLEdBQUcsUUFBUSxDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUNuRSxNQUFNLFlBQVksR0FBRyxRQUFRLENBQUMsT0FBTyxDQUFDLFlBQVksRUFBRSxNQUFNLENBQUMsQ0FBQztJQUM1RCxNQUFNLGFBQWEsR0FBRyxRQUFRLENBQUMsT0FBTyxDQUFDLGFBQWEsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUM3RCxNQUFNLGVBQWUsR0FBRyxRQUFRLENBQUMsT0FBTyxDQUFDLGVBQWUsRUFBRSxJQUFJLENBQUMsQ0FBQztJQUNoRSxNQUFNLGVBQWUsR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxlQUFlLElBQUksSUFBSSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQzdFLE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQyxRQUFRLENBQXVCO1FBQy9DLE9BQU8sRUFBRSxjQUFjO1FBQ3ZCLE9BQU8sRUFBRSxjQUFjO1FBQ3ZCLGNBQWMsRUFBRSxjQUFjO1FBQzlCLGNBQWMsRUFBRSxjQUFjO1FBQzlCLE9BQU8sRUFBRSxLQUFLO1FBQ2QsT0FBTyxFQUFFLEtBQUs7UUFDZCxXQUFXLEVBQUUsS0FBSztRQUNsQixRQUFRLEVBQUUsSUFBSTtRQUNkLFFBQVEsRUFBRSxLQUFLO1FBQ2YsU0FBUyxFQUFFLElBQUk7UUFDZixXQUFXLEVBQUUsSUFBSTtLQUNsQixDQUFDLENBQUM7SUFDSCxJQUFJLE9BQU8sR0FBRyxnQkFBZ0IsQ0FBQyxFQUFFLGFBQWEsRUFBRSxDQUFDLEVBQUUsY0FBYyxFQUFFLENBQUMsRUFBRSxZQUFZLEVBQUUsQ0FBQyxFQUFFLGFBQWEsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQzNHLElBQUksSUFBSSxHQUFzQixJQUFJLENBQUM7SUFDbkMsSUFBSSxRQUFRLEdBQUcsS0FBSyxDQUFDO0lBQ3JCLElBQUksU0FBUyxHQUFHLEtBQUssQ0FBQztJQUN0QixJQUFJLFVBQVUsR0FBWSxJQUFJLENBQUM7SUFDL0IsSUFBSSxjQUFjLEdBQVksSUFBSSxDQUFDO0lBQ25DLElBQUkscUJBQXFCLEdBQUcsQ0FBQyxDQUFDO0lBQzlCLElBQUksaUJBQWlCLEdBQUcsQ0FBQyxDQUFDO0lBQzFCLElBQUksaUJBQWlCLEdBQUcsQ0FBQyxDQUFDO0lBQzFCLE1BQU0sU0FBUyxHQUFHLElBQUksR0FBRyxFQUFjLENBQUM7SUFFeEMsTUFBTSxPQUFPLEdBQUcsQ0FBQyxNQUF1QyxFQUFFLEVBQUU7UUFDMUQsSUFBSSxRQUFRO1lBQUUsT0FBTztRQUNyQixNQUFNLFdBQVcsR0FBRyxDQUFDLEdBQUcsU0FBUyxDQUFDLENBQUM7UUFDbkMsU0FBUyxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ2xCLFNBQVMsR0FBRyxLQUFLLENBQUM7UUFDbEIsT0FBTyxDQUFDLFFBQVEsQ0FBQyxFQUFFLEdBQUcsS0FBSyxFQUFFLEVBQUUsRUFBRSxNQUFNLEVBQUUsV0FBVyxFQUFFLENBQUMsQ0FBQztJQUMxRCxDQUFDLENBQUM7SUFDRixNQUFNLGVBQWUsR0FBRyxHQUFHLEVBQUU7UUFDM0IsSUFBSSxTQUFTLElBQUksUUFBUTtZQUFFLE9BQU87UUFDbEMsU0FBUyxHQUFHLElBQUksQ0FBQztRQUNqQixNQUFNLEdBQUcsR0FBRyxHQUFHLEVBQUU7WUFDZixJQUFJLFNBQVM7Z0JBQUUsT0FBTyxDQUFDLFlBQVksQ0FBQyxDQUFDO1FBQ3ZDLENBQUMsQ0FBQztRQUNGLElBQUksR0FBRyxDQUFDLFFBQVE7WUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDOztZQUMvQixjQUFjLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDM0IsQ0FBQyxDQUFDO0lBQ0YsTUFBTSxTQUFTLEdBQUcsQ0FBQyxJQUFnQixFQUFFLEtBQWEsRUFBRSxJQUErQixFQUFFLEVBQUU7UUFDckYsSUFBSSxDQUFDLFdBQVcsQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDO1lBQUUsT0FBTyxLQUFLLENBQUM7UUFDaEQsTUFBTSxJQUFJLEdBQUcsS0FBSyxDQUFDLEtBQUssRUFBRSxDQUFDLEVBQUUsV0FBVyxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQ3pELE1BQU0sR0FBRyxHQUFHLElBQUksS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDO1FBQ2pELE1BQU0sVUFBVSxHQUFHLElBQUksS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQztRQUN0RSxJQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLElBQUksSUFBSSxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxJQUFJO1lBQUUsT0FBTyxLQUFLLENBQUM7UUFDbEcsS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQztRQUNsQixLQUFLLENBQUMsVUFBVSxDQUFDLEdBQUcsSUFBSSxDQUFDO1FBQ3pCLFNBQVMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDcEIsSUFBSSxJQUFJLEtBQUssVUFBVTtZQUFFLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQzs7WUFDeEMsZUFBZSxFQUFFLENBQUM7UUFDdkIsT0FBTyxJQUFJLENBQUM7SUFDZCxDQUFDLENBQUM7SUFDRixNQUFNLGNBQWMsR0FBRyxDQUFDLEtBQWMsRUFBRSxFQUFFO1FBQ3hDLElBQUksS0FBSyxDQUFDLFdBQVcsS0FBSyxLQUFLO1lBQUUsT0FBTztRQUN4QyxLQUFLLENBQUMsV0FBVyxHQUFHLEtBQUssQ0FBQztRQUMxQixPQUFPLENBQUMsUUFBUSxDQUFDLEVBQUUsR0FBRyxLQUFLLEVBQUUsRUFBRSxFQUFFLE1BQU0sRUFBRSxZQUFZLEVBQUUsV0FBVyxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7SUFDNUUsQ0FBQyxDQUFDO0lBQ0YsTUFBTSxTQUFTLEdBQUcsR0FBRyxFQUFFO1FBQ3JCLElBQUksVUFBVSxLQUFLLElBQUk7WUFBRSxPQUFPO1FBQ2hDLFNBQVMsQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDakMsVUFBVSxHQUFHLElBQUksQ0FBQztJQUNwQixDQUFDLENBQUM7SUFDRixNQUFNLFFBQVEsR0FBRyxHQUFHLEVBQUU7UUFDcEIsU0FBUyxFQUFFLENBQUM7UUFDWixjQUFjLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDdkIsQ0FBQyxDQUFDO0lBQ0YsTUFBTSxZQUFZLEdBQUcsR0FBRyxFQUFFO1FBQ3hCLFNBQVMsRUFBRSxDQUFDO1FBQ1osSUFBSSxRQUFRLElBQUksS0FBSyxDQUFDLE9BQU8sSUFBSSxLQUFLLENBQUMsT0FBTyxJQUFJLElBQUksSUFBSSxLQUFLLENBQUMsUUFBUTtZQUFFLE9BQU87UUFDakYsSUFBSSxlQUFlLEtBQUssQ0FBQyxFQUFFLENBQUM7WUFDMUIsY0FBYyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3RCLE9BQU87UUFDVCxDQUFDO1FBQ0QsVUFBVSxHQUFHLFNBQVMsQ0FBQyxRQUFRLENBQUMsR0FBRyxFQUFFO1lBQ25DLFVBQVUsR0FBRyxJQUFJLENBQUM7WUFDbEIsSUFBSSxDQUFDLFFBQVEsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxJQUFJLENBQUMsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVE7Z0JBQUUsY0FBYyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3ZHLENBQUMsRUFBRSxlQUFlLENBQUMsQ0FBQztJQUN0QixDQUFDLENBQUM7SUFDRixNQUFNLGdCQUFnQixHQUFHLENBQUMsSUFBZ0IsRUFBRSxLQUFhLEVBQUUsRUFBRTtRQUMzRCxJQUFJLENBQUMsV0FBVyxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUM7WUFBRSxPQUFPLEtBQUssQ0FBQztRQUNoRCxNQUFNLFVBQVUsR0FBRyxJQUFJLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsZ0JBQWdCLENBQUM7UUFDdEUsTUFBTSxTQUFTLEdBQUcsSUFBSSxLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUM7UUFDdkQsTUFBTSxXQUFXLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ2xDLE1BQU0sVUFBVSxHQUFHLEtBQUssQ0FBQyxXQUFXLEVBQUUsQ0FBQyxFQUFFLFdBQVcsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUNyRSxJQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxHQUFHLFdBQVcsQ0FBQyxHQUFHLElBQUksSUFBSSxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsR0FBRyxVQUFVLENBQUMsR0FBRyxJQUFJO1lBQUUsT0FBTyxLQUFLLENBQUM7UUFDckgsS0FBSyxDQUFDLFVBQVUsQ0FBQyxHQUFHLFdBQVcsQ0FBQztRQUNoQyxLQUFLLENBQUMsU0FBUyxDQUFDLEdBQUcsVUFBVSxDQUFDO1FBQzlCLFNBQVMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDcEIsT0FBTyxJQUFJLENBQUM7SUFDZCxDQUFDLENBQUM7SUFDRixNQUFNLFlBQVksR0FBRyxDQUFDLE1BQWUsRUFBRSxFQUFFO1FBQ3ZDLElBQUksY0FBYyxLQUFLLElBQUk7WUFBRSxTQUFTLENBQUMsV0FBVyxDQUFDLGNBQWMsQ0FBQyxDQUFDO1FBQ25FLGNBQWMsR0FBRyxJQUFJLENBQUM7UUFDdEIscUJBQXFCLEdBQUcsQ0FBQyxDQUFDO1FBQzFCLGlCQUFpQixHQUFHLENBQUMsQ0FBQztRQUN0QixpQkFBaUIsR0FBRyxDQUFDLENBQUM7UUFDdEIsTUFBTSxTQUFTLEdBQUcsS0FBSyxDQUFDLFFBQVEsQ0FBQztRQUNqQyxLQUFLLENBQUMsUUFBUSxHQUFHLEtBQUssQ0FBQztRQUN2QixJQUFJLE1BQU0sRUFBRSxDQUFDO1lBQ1gsZ0JBQWdCLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUNyQyxnQkFBZ0IsQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ3ZDLENBQUM7UUFDRCxJQUFJLFNBQVM7WUFBRSxHQUFHLENBQUMsS0FBSyxFQUFFLENBQUMscUJBQXFCLEVBQUUsRUFBRSxPQUFPLEVBQUUsS0FBSyxDQUFDLE9BQU8sRUFBRSxPQUFPLEVBQUUsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUM7SUFDeEcsQ0FBQyxDQUFDO0lBQ0YsTUFBTSxVQUFVLEdBQUcsQ0FBQyxJQUFnQixFQUFFLFFBQWdCLEVBQUUsT0FBZSxFQUFFLEVBQUU7UUFDekUsTUFBTSxLQUFLLEdBQUcsV0FBVyxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQztRQUN6QyxNQUFNLE9BQU8sR0FBRyxJQUFJLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDO1FBQzNFLElBQUksV0FBVyxHQUFHLE9BQU8sR0FBRyxRQUFRLEdBQUcsT0FBTyxDQUFDO1FBQy9DLElBQUksWUFBWSxHQUFHLFFBQVEsQ0FBQztRQUM1QixNQUFNLFFBQVEsR0FBRyxXQUFXLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFdBQVcsR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO1FBQzFFLElBQUksUUFBUSxLQUFLLElBQUksRUFBRSxDQUFDO1lBQ3RCLFlBQVksSUFBSSxDQUFDLFFBQVEsR0FBRyxXQUFXLENBQUMsR0FBRyxZQUFZLEdBQUcsT0FBTyxDQUFDO1lBQ2xFLFlBQVksSUFBSSxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsYUFBYSxHQUFHLE9BQU8sQ0FBQyxDQUFDO1lBQ25ELE1BQU0sUUFBUSxHQUFHLElBQUksS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxjQUFjLENBQUM7WUFDL0UsTUFBTSxpQkFBaUIsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxRQUFRLEdBQUcsZUFBZSxDQUFDLENBQUM7WUFDbEUsV0FBVyxHQUFHLEtBQUssQ0FBQyxXQUFXLEVBQUUsQ0FBQyxpQkFBaUIsRUFBRSxLQUFLLEdBQUcsaUJBQWlCLENBQUMsQ0FBQztZQUNoRixNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLFFBQVEsR0FBRyxXQUFXLENBQUMsR0FBRyxHQUFHLElBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQUMsR0FBRyxlQUFlLENBQUM7WUFDbkcsT0FBTyxPQUFPO2dCQUNaLENBQUMsQ0FBQyxFQUFFLE9BQU8sRUFBRSxRQUFRLEVBQUUsUUFBUSxFQUFFLENBQUMsRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFO2dCQUNuRCxDQUFDLENBQUMsRUFBRSxPQUFPLEVBQUUsV0FBVyxFQUFFLFFBQVEsRUFBRSxZQUFZLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxDQUFDO1FBQ3ZFLENBQUM7UUFDRCxZQUFZLElBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLGdCQUFnQixHQUFHLE9BQU8sQ0FBQyxDQUFDO1FBQ3RELE9BQU8sRUFBRSxPQUFPLEVBQUUsV0FBVyxFQUFFLFFBQVEsRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLFlBQVksQ0FBQyxHQUFHLGVBQWUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxZQUFZLEVBQUUsT0FBTyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFDLEdBQUcsZUFBZSxFQUFFLENBQUM7SUFDNUosQ0FBQyxDQUFDO0lBQ0YsTUFBTSxZQUFZLEdBQUcsQ0FBQyxTQUFpQixFQUFFLEVBQUU7UUFDekMsSUFBSSxRQUFRLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUTtZQUFFLE9BQU87UUFDeEMsY0FBYyxHQUFHLElBQUksQ0FBQztRQUN0QixNQUFNLE9BQU8sR0FBRyxxQkFBcUIsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLFNBQVMsR0FBRyxxQkFBcUIsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDbkcscUJBQXFCLEdBQUcsU0FBUyxDQUFDO1FBQ2xDLE1BQU0sQ0FBQyxHQUFHLFVBQVUsQ0FBQyxHQUFHLEVBQUUsaUJBQWlCLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDdEQsTUFBTSxDQUFDLEdBQUcsVUFBVSxDQUFDLEdBQUcsRUFBRSxpQkFBaUIsRUFBRSxPQUFPLENBQUMsQ0FBQztRQUN0RCxpQkFBaUIsR0FBRyxDQUFDLENBQUMsUUFBUSxDQUFDO1FBQy9CLGlCQUFpQixHQUFHLENBQUMsQ0FBQyxRQUFRLENBQUM7UUFDL0IsZ0JBQWdCLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUNqQyxnQkFBZ0IsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ2pDLElBQUksU0FBUyxDQUFDLElBQUksR0FBRyxDQUFDO1lBQUUsT0FBTyxDQUFDLFlBQVksQ0FBQyxDQUFDO1FBQzlDLElBQUksQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDM0IsWUFBWSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ25CLElBQUksU0FBUyxDQUFDLElBQUksR0FBRyxDQUFDO2dCQUFFLE9BQU8sQ0FBQyxZQUFZLENBQUMsQ0FBQztZQUM5QyxZQUFZLEVBQUUsQ0FBQztZQUNmLE9BQU87UUFDVCxDQUFDO1FBQ0QsY0FBYyxHQUFHLFNBQVMsQ0FBQyxZQUFZLENBQUMsWUFBWSxDQUFDLENBQUM7SUFDeEQsQ0FBQyxDQUFDO0lBQ0YsTUFBTSxhQUFhLEdBQUcsQ0FBQyxTQUFpQixFQUFFLFNBQWlCLEVBQUUsRUFBRTtRQUM3RCxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDcEIsaUJBQWlCLEdBQUcsV0FBVyxDQUFDLFNBQVMsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDeEUsaUJBQWlCLEdBQUcsV0FBVyxDQUFDLFNBQVMsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDeEUsTUFBTSxhQUFhLEdBQUcsS0FBSyxDQUFDLGNBQWMsS0FBSyxLQUFLLENBQUMsT0FBTyxJQUFJLEtBQUssQ0FBQyxjQUFjLEtBQUssS0FBSyxDQUFDLE9BQU8sQ0FBQztRQUN2RyxJQUFJLE9BQU8sQ0FBQyxhQUFhLElBQUksQ0FBQyxDQUFDLGFBQWE7ZUFDdkMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLGVBQWU7ZUFDN0MsSUFBSSxDQUFDLEdBQUcsQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLGVBQWUsQ0FBQyxFQUFFLENBQUM7WUFDcEQsZ0JBQWdCLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUNyQyxnQkFBZ0IsQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ3JDLElBQUksU0FBUyxDQUFDLElBQUksR0FBRyxDQUFDO2dCQUFFLE9BQU8sQ0FBQyxZQUFZLENBQUMsQ0FBQztZQUM5QyxZQUFZLEVBQUUsQ0FBQztZQUNmLE9BQU87UUFDVCxDQUFDO1FBQ0QsS0FBSyxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUM7UUFDdEIsUUFBUSxFQUFFLENBQUM7UUFDWCxHQUFHLENBQUMsS0FBSyxFQUFFLENBQUMsdUJBQXVCLEVBQUUsRUFBRSxTQUFTLEVBQUUsaUJBQWlCLEVBQUUsU0FBUyxFQUFFLGlCQUFpQixFQUFFLENBQUMsQ0FBQztRQUNyRyxjQUFjLEdBQUcsU0FBUyxDQUFDLFlBQVksQ0FBQyxZQUFZLENBQUMsQ0FBQztJQUN4RCxDQUFDLENBQUM7SUFFRixNQUFNLFVBQVUsR0FBOEI7UUFDNUMsS0FBSztRQUNMLGFBQWEsQ0FBQyxXQUFXO1lBQ3ZCLE1BQU0sZUFBZSxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUM7WUFDdEMsTUFBTSxlQUFlLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQztZQUN0QyxJQUFJLElBQUksRUFBRSxJQUFJLEtBQUssT0FBTztnQkFBRSxVQUFVLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztpQkFDbEUsSUFBSSxJQUFJLEVBQUUsSUFBSSxLQUFLLFNBQVM7Z0JBQUUsVUFBVSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUNoRixZQUFZLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDcEIsT0FBTyxHQUFHLGdCQUFnQixDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBQ3hDLEtBQUssQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQyxFQUFFLFdBQVcsQ0FBQyxPQUFPLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUNuRSxLQUFLLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUMsRUFBRSxXQUFXLENBQUMsT0FBTyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDbkUsS0FBSyxDQUFDLGNBQWMsR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDO1lBQ3JDLEtBQUssQ0FBQyxjQUFjLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQztZQUNyQyxJQUFJLEtBQUssQ0FBQyxPQUFPLEtBQUssZUFBZTtnQkFBRSxTQUFTLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQzFELElBQUksS0FBSyxDQUFDLE9BQU8sS0FBSyxlQUFlO2dCQUFFLFNBQVMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDMUQsSUFBSSxTQUFTLENBQUMsSUFBSSxHQUFHLENBQUM7Z0JBQUUsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQzlDLENBQUM7UUFDRCxVQUFVLENBQUMsS0FBSztZQUNkLEtBQUssQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDO1lBQ3RCLElBQUksS0FBSztnQkFBRSxRQUFRLEVBQUUsQ0FBQzs7Z0JBQ2pCLFlBQVksRUFBRSxDQUFDO1FBQ3RCLENBQUM7UUFDRCxVQUFVLENBQUMsS0FBSztZQUNkLEtBQUssQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDO1lBQ3RCLElBQUksS0FBSztnQkFBRSxRQUFRLEVBQUUsQ0FBQzs7Z0JBQ2pCLFlBQVksRUFBRSxDQUFDO1FBQ3RCLENBQUM7UUFDRCxLQUFLLENBQUMsTUFBTSxFQUFFLE1BQU07WUFDbEIsWUFBWSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ25CLFFBQVEsRUFBRSxDQUFDO1lBQ1gsSUFBSSxXQUFXLENBQUMsU0FBUyxFQUFFLEdBQUcsQ0FBQztnQkFBRSxTQUFTLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxPQUFPLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxFQUFFLFlBQVksQ0FBQyxDQUFDO1lBQzlGLElBQUksV0FBVyxDQUFDLFNBQVMsRUFBRSxHQUFHLENBQUM7Z0JBQUUsU0FBUyxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsRUFBRSxZQUFZLENBQUMsQ0FBQztZQUM5RixHQUFHLENBQUMsS0FBSyxFQUFFLENBQUMsY0FBYyxFQUFFLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUM7WUFDaEQsWUFBWSxFQUFFLENBQUM7UUFDakIsQ0FBQztRQUNELE1BQU0sQ0FBQyxJQUFJLEVBQUUsZUFBZTtZQUMxQixZQUFZLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDbkIsUUFBUSxFQUFFLENBQUM7WUFDWCxNQUFNLEtBQUssR0FBRyxVQUFVLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ3hDLE1BQU0sV0FBVyxHQUFHLFNBQVMsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDN0MsTUFBTSxJQUFJLEdBQUcsQ0FBQyxNQUFNLENBQUMsZUFBZSxDQUFDLEdBQUcsV0FBVyxHQUFHLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQztZQUNqRSxNQUFNLE9BQU8sR0FBRyxTQUFTLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxVQUFVLENBQUMsQ0FBQztZQUNsRCxJQUFJLE9BQU87Z0JBQUUsR0FBRyxDQUFDLEtBQUssRUFBRSxDQUFDLG1CQUFtQixFQUFFLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxJQUFJLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQztZQUM5RyxZQUFZLEVBQUUsQ0FBQztRQUNqQixDQUFDO1FBQ0QsY0FBYyxDQUFDLElBQUksRUFBRSxTQUFTLEVBQUUsZUFBZSxFQUFFLFdBQVcsR0FBRyxPQUFPO1lBQ3BFLElBQUksQ0FBQyxXQUFXLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxJQUFJLElBQUk7Z0JBQUUsT0FBTyxLQUFLLENBQUM7WUFDeEQsWUFBWSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ25CLElBQUksR0FBRztnQkFDTCxJQUFJLEVBQUUsT0FBTztnQkFDYixJQUFJO2dCQUNKLFNBQVM7Z0JBQ1QsZUFBZSxFQUFFLE1BQU0sQ0FBQyxlQUFlLENBQUM7Z0JBQ3hDLFdBQVcsRUFBRSxJQUFJLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsT0FBTztnQkFDekQsS0FBSyxFQUFFLFVBQVUsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDO2FBQ2pDLENBQUM7WUFDRixLQUFLLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQztZQUN0QixLQUFLLENBQUMsU0FBUyxHQUFHLFNBQVMsQ0FBQztZQUM1QixLQUFLLENBQUMsV0FBVyxHQUFHLFdBQVcsQ0FBQztZQUNoQyxRQUFRLEVBQUUsQ0FBQztZQUNYLEdBQUcsQ0FBQyxLQUFLLEVBQUUsQ0FBQyx5QkFBeUIsRUFBRSxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsV0FBVyxFQUFFLENBQUMsQ0FBQztZQUN6RSxPQUFPLElBQUksQ0FBQztRQUNkLENBQUM7UUFDRCxhQUFhLENBQUMsU0FBUyxFQUFFLGVBQWUsRUFBRSxPQUFPO1lBQy9DLElBQUksSUFBSSxFQUFFLElBQUksS0FBSyxPQUFPLElBQUksSUFBSSxDQUFDLFNBQVMsS0FBSyxTQUFTO2dCQUFFLE9BQU8sS0FBSyxDQUFDO1lBQ3pFLElBQUksS0FBSyxDQUFDLFdBQVcsS0FBSyxPQUFPLElBQUksT0FBTyxLQUFLLENBQUM7Z0JBQUUsT0FBTyxVQUFVLENBQUMsZUFBZSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQ2pHLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxXQUFXLEdBQUcsQ0FBQyxNQUFNLENBQUMsZUFBZSxDQUFDLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDOUYsT0FBTyxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsWUFBWSxDQUFDLENBQUM7UUFDbEQsQ0FBQztRQUNELFlBQVksQ0FBQyxTQUFTO1lBQ3BCLElBQUksSUFBSSxFQUFFLElBQUksS0FBSyxPQUFPLElBQUksSUFBSSxDQUFDLFNBQVMsS0FBSyxTQUFTO2dCQUFFLE9BQU8sS0FBSyxDQUFDO1lBQ3pFLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUM7WUFDdkIsSUFBSSxHQUFHLElBQUksQ0FBQztZQUNaLEtBQUssQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDO1lBQ3RCLEtBQUssQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDO1lBQ3ZCLEtBQUssQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDO1lBQ3pCLFlBQVksRUFBRSxDQUFDO1lBQ2YsR0FBRyxDQUFDLEtBQUssRUFBRSxDQUFDLHVCQUF1QixFQUFFLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxDQUFDLENBQUM7WUFDMUQsT0FBTyxJQUFJLENBQUM7UUFDZCxDQUFDO1FBQ0QsZ0JBQWdCLENBQUMsU0FBUyxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsU0FBUyxHQUFHLFNBQVMsQ0FBQyxHQUFHLEVBQUUsRUFBRSxXQUFXLEdBQUcsT0FBTztZQUM1RixJQUFJLElBQUk7Z0JBQUUsT0FBTyxLQUFLLENBQUM7WUFDdkIsWUFBWSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ25CLE1BQU0sQ0FBQyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUN6QixNQUFNLENBQUMsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDekIsSUFBSSxHQUFHO2dCQUNMLElBQUksRUFBRSxTQUFTO2dCQUNmLFNBQVM7Z0JBQ1QsV0FBVztnQkFDWCxNQUFNLEVBQUUsQ0FBQztnQkFDVCxNQUFNLEVBQUUsQ0FBQztnQkFDVCxhQUFhLEVBQUUsS0FBSyxDQUFDLGNBQWM7Z0JBQ25DLGFBQWEsRUFBRSxLQUFLLENBQUMsY0FBYztnQkFDbkMsS0FBSyxFQUFFLENBQUM7Z0JBQ1IsS0FBSyxFQUFFLENBQUM7Z0JBQ1IsYUFBYSxFQUFFLE1BQU0sQ0FBQyxTQUFTLENBQUM7Z0JBQ2hDLFNBQVMsRUFBRSxDQUFDO2dCQUNaLFNBQVMsRUFBRSxDQUFDO2FBQ2IsQ0FBQztZQUNGLEtBQUssQ0FBQyxRQUFRLEdBQUcsU0FBUyxDQUFDO1lBQzNCLEtBQUssQ0FBQyxTQUFTLEdBQUcsU0FBUyxDQUFDO1lBQzVCLEtBQUssQ0FBQyxXQUFXLEdBQUcsV0FBVyxDQUFDO1lBQ2hDLFFBQVEsRUFBRSxDQUFDO1lBQ1gsR0FBRyxDQUFDLEtBQUssRUFBRSxDQUFDLDJCQUEyQixFQUFFLEVBQUUsU0FBUyxFQUFFLFdBQVcsRUFBRSxDQUFDLENBQUM7WUFDckUsT0FBTyxJQUFJLENBQUM7UUFDZCxDQUFDO1FBQ0QsZUFBZSxDQUFDLFNBQVMsRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLFNBQVMsR0FBRyxTQUFTLENBQUMsR0FBRyxFQUFFLEVBQUUsT0FBTztZQUM3RSxJQUFJLElBQUksRUFBRSxJQUFJLEtBQUssU0FBUyxJQUFJLElBQUksQ0FBQyxTQUFTLEtBQUssU0FBUztnQkFBRSxPQUFPLEtBQUssQ0FBQztZQUMzRSxJQUFJLElBQUksQ0FBQyxXQUFXLEtBQUssT0FBTyxJQUFJLE9BQU8sS0FBSyxDQUFDO2dCQUFFLE9BQU8sVUFBVSxDQUFDLGlCQUFpQixDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQ2xHLE1BQU0sQ0FBQyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUN6QixNQUFNLENBQUMsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDekIsTUFBTSxJQUFJLEdBQUcsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQy9CLE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLElBQUksR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUM7WUFDdkQsTUFBTSxnQkFBZ0IsR0FBRyxLQUFLLENBQUMsY0FBYyxDQUFDO1lBQzlDLE1BQU0sZ0JBQWdCLEdBQUcsS0FBSyxDQUFDLGNBQWMsQ0FBQztZQUM5QyxJQUFJLFdBQVcsQ0FBQyxTQUFTLEVBQUUsR0FBRyxDQUFDLEVBQUUsQ0FBQztnQkFDaEMsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLGFBQWEsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQ3BELGdCQUFnQixDQUFDLEdBQUcsRUFBRSxnQkFBZ0IsQ0FBQyxJQUFJLEVBQUUsV0FBVyxDQUFDLE9BQU8sRUFBRSxHQUFHLENBQUMsRUFBRSxPQUFPLENBQUMsYUFBYSxFQUFFLGVBQWUsQ0FBQyxDQUFDLENBQUM7WUFDbkgsQ0FBQztZQUNELElBQUksV0FBVyxDQUFDLFNBQVMsRUFBRSxHQUFHLENBQUMsRUFBRSxDQUFDO2dCQUNoQyxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsYUFBYSxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDcEQsZ0JBQWdCLENBQUMsR0FBRyxFQUFFLGdCQUFnQixDQUFDLElBQUksRUFBRSxXQUFXLENBQUMsT0FBTyxFQUFFLEdBQUcsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxjQUFjLEVBQUUsZUFBZSxDQUFDLENBQUMsQ0FBQztZQUNwSCxDQUFDO1lBQ0QsTUFBTSxnQkFBZ0IsR0FBRyxDQUFDLEtBQUssQ0FBQyxjQUFjLEdBQUcsZ0JBQWdCLENBQUMsR0FBRyxPQUFPLENBQUM7WUFDN0UsTUFBTSxnQkFBZ0IsR0FBRyxDQUFDLEtBQUssQ0FBQyxjQUFjLEdBQUcsZ0JBQWdCLENBQUMsR0FBRyxPQUFPLENBQUM7WUFDN0UsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksR0FBRyxnQkFBZ0IsR0FBRyxJQUFJLENBQUM7WUFDakUsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksR0FBRyxnQkFBZ0IsR0FBRyxJQUFJLENBQUM7WUFDakUsSUFBSSxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUM7WUFDZixJQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQztZQUNmLElBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFDO1lBQzFCLElBQUksU0FBUyxDQUFDLElBQUksR0FBRyxDQUFDO2dCQUFFLGVBQWUsRUFBRSxDQUFDO1lBQzFDLE9BQU8sSUFBSSxDQUFDO1FBQ2QsQ0FBQztRQUNELGNBQWMsQ0FBQyxTQUFTLEVBQUUsU0FBUyxHQUFHLFNBQVMsQ0FBQyxHQUFHLEVBQUU7WUFDbkQsSUFBSSxJQUFJLEVBQUUsSUFBSSxLQUFLLFNBQVMsSUFBSSxJQUFJLENBQUMsU0FBUyxLQUFLLFNBQVM7Z0JBQUUsT0FBTyxLQUFLLENBQUM7WUFDM0UsTUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsTUFBTSxDQUFDLFNBQVMsQ0FBQyxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQztZQUN6RSxNQUFNLFdBQVcsR0FBRyxZQUFZLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNoRCxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsU0FBUyxHQUFHLFdBQVcsQ0FBQztZQUMvQyxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsU0FBUyxHQUFHLFdBQVcsQ0FBQztZQUMvQyxNQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDO1lBQ3JDLElBQUksR0FBRyxJQUFJLENBQUM7WUFDWixLQUFLLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQztZQUN0QixLQUFLLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQztZQUN2QixLQUFLLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQztZQUN6QixHQUFHLENBQUMsS0FBSyxFQUFFLENBQUMseUJBQXlCLEVBQUUsRUFBRSxTQUFTLEVBQUUsV0FBVyxFQUFFLFNBQVMsRUFBRSxTQUFTLEVBQUUsQ0FBQyxDQUFDO1lBQ3pGLGFBQWEsQ0FBQyxTQUFTLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDcEMsT0FBTyxJQUFJLENBQUM7UUFDZCxDQUFDO1FBQ0QsZUFBZSxDQUFDLFNBQVM7WUFDdkIsSUFBSSxJQUFJLEVBQUUsSUFBSSxLQUFLLE9BQU8sSUFBSSxDQUFDLFNBQVMsS0FBSyxTQUFTLElBQUksSUFBSSxDQUFDLFNBQVMsS0FBSyxTQUFTLENBQUM7Z0JBQUUsT0FBTyxLQUFLLENBQUM7WUFDdEcsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQztZQUN2QixNQUFNLGtCQUFrQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUM7WUFDMUMsSUFBSSxHQUFHLElBQUksQ0FBQztZQUNaLEtBQUssQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDO1lBQ3RCLEtBQUssQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDO1lBQ3ZCLEtBQUssQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDO1lBQ3pCLFNBQVMsR0FBRyxLQUFLLENBQUM7WUFDbEIsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ2xCLFlBQVksRUFBRSxDQUFDO1lBQ2YsR0FBRyxDQUFDLEtBQUssRUFBRSxDQUFDLDBCQUEwQixFQUFFLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxrQkFBa0IsRUFBRSxDQUFDLENBQUM7WUFDakYsT0FBTyxJQUFJLENBQUM7UUFDZCxDQUFDO1FBQ0QsaUJBQWlCLENBQUMsU0FBUztZQUN6QixJQUFJLElBQUksRUFBRSxJQUFJLEtBQUssU0FBUyxJQUFJLENBQUMsU0FBUyxLQUFLLFNBQVMsSUFBSSxJQUFJLENBQUMsU0FBUyxLQUFLLFNBQVMsQ0FBQztnQkFBRSxPQUFPLEtBQUssQ0FBQztZQUN4RyxNQUFNLGtCQUFrQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUM7WUFDMUMsSUFBSSxHQUFHLElBQUksQ0FBQztZQUNaLEtBQUssQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDO1lBQ3RCLEtBQUssQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDO1lBQ3ZCLEtBQUssQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDO1lBQ3pCLFNBQVMsR0FBRyxLQUFLLENBQUM7WUFDbEIsZ0JBQWdCLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUNyQyxnQkFBZ0IsQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ3JDLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUNsQixZQUFZLEVBQUUsQ0FBQztZQUNmLEdBQUcsQ0FBQyxLQUFLLEVBQUUsQ0FBQyw0QkFBNEIsRUFBRSxFQUFFLFNBQVMsRUFBRSxrQkFBa0IsRUFBRSxDQUFDLENBQUM7WUFDN0UsT0FBTyxJQUFJLENBQUM7UUFDZCxDQUFDO1FBQ0QsR0FBRyxDQUFDLEdBQUc7WUFDTCxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDbkIsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsT0FBTyxDQUFDLFFBQVEsSUFBSSxFQUFFLENBQUMsQ0FBQztZQUNqRCxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxPQUFPLENBQUMsYUFBYSxHQUFHLENBQUMsT0FBTyxDQUFDLFFBQVEsSUFBSSxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQzdFLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxjQUFjLEdBQUcsQ0FBQyxPQUFPLENBQUMsUUFBUSxJQUFJLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDOUUsTUFBTSxPQUFPLEdBQXlDO2dCQUNwRCxTQUFTLEVBQUUsQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7Z0JBQ3RDLFVBQVUsRUFBRSxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQztnQkFDdkMsT0FBTyxFQUFFLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDO2dCQUNwQyxTQUFTLEVBQUUsQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7Z0JBQ3RDLE1BQU0sRUFBRSxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQztnQkFDcEMsUUFBUSxFQUFFLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDO2dCQUN0QyxJQUFJLEVBQUUsQ0FBQyxTQUFTLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUM7Z0JBQ3hDLEdBQUcsRUFBRSxDQUFDLFNBQVMsS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLFdBQVcsQ0FBQyxPQUFPLEVBQUUsU0FBUyxLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQzthQUMxRixDQUFDO1lBQ0YsSUFBSSxHQUFHLEtBQUssVUFBVTtnQkFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUMsQ0FBQztZQUNwRSxJQUFJLEdBQUcsS0FBSyxXQUFXO2dCQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQyxDQUFDO1lBQ3JFLE1BQU0sTUFBTSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUM1QixJQUFJLENBQUMsTUFBTSxJQUFJLENBQUMsV0FBVyxDQUFDLFNBQVMsRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQUUsT0FBTyxLQUFLLENBQUM7WUFDaEUsUUFBUSxFQUFFLENBQUM7WUFDWCxNQUFNLE9BQU8sR0FBRyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxVQUFVLENBQUMsQ0FBQztZQUM1RCxJQUFJLE9BQU87Z0JBQUUsR0FBRyxDQUFDLEtBQUssRUFBRSxDQUFDLGlCQUFpQixFQUFFLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQ3RFLFlBQVksRUFBRSxDQUFDO1lBQ2YsT0FBTyxPQUFPLENBQUM7UUFDakIsQ0FBQztRQUNELGFBQWEsQ0FBQyxJQUFJLEVBQUUsS0FBSztZQUN2QixJQUFJLENBQUMsV0FBVyxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUM7Z0JBQUUsT0FBTyxJQUFJLENBQUM7WUFDL0MsTUFBTSxRQUFRLEdBQUcsV0FBVyxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQztZQUM1QyxNQUFNLFFBQVEsR0FBRyxJQUFJLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDO1lBQzlELE9BQU87Z0JBQ0wsSUFBSSxFQUFFLFdBQVc7Z0JBQ2pCLFFBQVEsRUFBRSxDQUFDO2dCQUNYLFdBQVcsRUFBRSxJQUFJLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLFVBQVU7Z0JBQ3JELFFBQVEsRUFBRSxDQUFDO2dCQUNYLFFBQVE7Z0JBQ1IsUUFBUTtnQkFDUixTQUFTLEVBQUUsUUFBUSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsR0FBRyxRQUFRLEdBQUcsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSTtnQkFDNUUsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO2FBQzVCLENBQUM7UUFDSixDQUFDO1FBQ0QsS0FBSztZQUNILElBQUksU0FBUztnQkFBRSxPQUFPLENBQUMsWUFBWSxDQUFDLENBQUM7UUFDdkMsQ0FBQztRQUNELE9BQU87WUFDTCxRQUFRLEdBQUcsSUFBSSxDQUFDO1lBQ2hCLFNBQVMsR0FBRyxLQUFLLENBQUM7WUFDbEIsU0FBUyxDQUFDLEtBQUssRUFBRSxDQUFDO1lBQ2xCLElBQUksR0FBRyxJQUFJLENBQUM7WUFDWixTQUFTLEVBQUUsQ0FBQztZQUNaLFlBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUNwQixLQUFLLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQztZQUN0QixLQUFLLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQztZQUN2QixLQUFLLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQztRQUMzQixDQUFDO0tBQ0YsQ0FBQztJQUNGLEdBQUcsQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLENBQUMsVUFBVSxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUM7SUFDeEMsT0FBTyxVQUFVLENBQUM7QUFDcEIsQ0FBQztBQUVELE1BQU0sVUFBVSxXQUFXLENBQUMsT0FBK0IsRUFBRSxJQUFnQjtJQUMzRSxPQUFPLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLElBQUksS0FBSyxHQUFHO1FBQzdCLENBQUMsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQyxHQUFHLE1BQU0sQ0FBQyxPQUFPLENBQUMsYUFBYSxDQUFDO1FBQzlELENBQUMsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxPQUFPLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQztBQUN0RSxDQUFDO0FBRUQsTUFBTSxVQUFVLFVBQVUsQ0FBQyxPQUErQixFQUFFLElBQWdCO0lBQzFFLE1BQU0sS0FBSyxHQUFHLFdBQVcsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDekMsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsU0FBUyxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsR0FBRyxTQUFTLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7SUFDaEYsT0FBTyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDekMsQ0FBQztBQUVELFNBQVMsU0FBUyxDQUFDLE9BQStCLEVBQUUsSUFBZ0I7SUFDbEUsT0FBTyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxNQUFNLENBQUMsSUFBSSxLQUFLLEdBQUc7UUFDcEMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxxQkFBcUIsSUFBSSxPQUFPLENBQUMsYUFBYTtRQUN4RCxDQUFDLENBQUMsT0FBTyxDQUFDLG1CQUFtQixJQUFJLE9BQU8sQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDO0FBQzlELENBQUM7QUFFRCxTQUFTLFNBQVMsQ0FBQyxPQUErQixFQUFFLElBQWdCO0lBQ2xFLE1BQU0sUUFBUSxHQUFHLElBQUksS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxjQUFjLENBQUM7SUFDL0UsTUFBTSxPQUFPLEdBQUcsSUFBSSxLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQztJQUM1RSxNQUFNLFFBQVEsR0FBRyxJQUFJLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMscUJBQXFCLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxtQkFBbUIsQ0FBQztJQUM1RixJQUFJLFFBQVEsS0FBSyxTQUFTO1FBQUUsT0FBTyxLQUFLLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsRUFBRSxTQUFTLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7SUFDeEYsT0FBTyxPQUFPLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsR0FBRyxRQUFRLEdBQUcsT0FBTyxFQUFFLENBQUMsRUFBRSxTQUFTLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUM3RyxDQUFDO0FBRUQsU0FBUyxXQUFXLENBQUMsU0FBMEIsRUFBRSxJQUFnQjtJQUMvRCxPQUFPLFNBQVMsS0FBSyxNQUFNLElBQUksU0FBUyxLQUFLLElBQUksQ0FBQztBQUNwRCxDQUFDO0FBRUQsU0FBUyxnQkFBZ0IsQ0FBQyxPQUErQjtJQUN2RCxPQUFPO1FBQ0wsR0FBRyxPQUFPO1FBQ1YsYUFBYSxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxPQUFPLENBQUMsYUFBYSxDQUFDLENBQUM7UUFDekQsY0FBYyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxPQUFPLENBQUMsY0FBYyxDQUFDLENBQUM7UUFDM0QsWUFBWSxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxPQUFPLENBQUMsWUFBWSxDQUFDLENBQUM7UUFDdkQsYUFBYSxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxPQUFPLENBQUMsYUFBYSxDQUFDLENBQUM7S0FDMUQsQ0FBQztBQUNKLENBQUM7QUFFRCxTQUFTLE1BQU0sQ0FBQyxLQUFhO0lBQzNCLE9BQU8sTUFBTSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDNUMsQ0FBQztBQUVELFNBQVMsUUFBUSxDQUFDLEtBQXlCLEVBQUUsUUFBZ0I7SUFDM0QsTUFBTSxTQUFTLEdBQUcsTUFBTSxDQUFDLEtBQUssSUFBSSxRQUFRLENBQUMsQ0FBQztJQUM1QyxPQUFPLFNBQVMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDO0FBQzlDLENBQUM7QUFFRCxTQUFTLGdCQUFnQixDQUFDLEtBQWEsRUFBRSxLQUFhLEVBQUUsUUFBZ0IsRUFBRSxLQUFhO0lBQ3JGLElBQUksS0FBSyxHQUFHLENBQUM7UUFBRSxPQUFPLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxRQUFRLEdBQUcsS0FBSyxDQUFDLEVBQUUsS0FBSyxHQUFHLEtBQUssQ0FBQyxDQUFDO0lBQzlFLElBQUksS0FBSyxHQUFHLEtBQUs7UUFBRSxPQUFPLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLFFBQVEsR0FBRyxLQUFLLENBQUMsRUFBRSxLQUFLLEdBQUcsQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUM7SUFDM0csT0FBTyxLQUFLLENBQUM7QUFDZixDQUFDO0FBRUQsU0FBUyxnQkFBZ0IsQ0FBQyxTQUF3RDtJQUNoRixNQUFNLGlCQUFpQixHQUFHLE9BQU8sVUFBVSxDQUFDLHFCQUFxQixLQUFLLFVBQVUsQ0FBQztJQUNqRixPQUFPO1FBQ0wsWUFBWSxFQUFFLFNBQVMsRUFBRSxZQUFZLElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLGlCQUFpQjtZQUNyRSxDQUFDLENBQUMsVUFBVSxDQUFDLHFCQUFxQixDQUFDLFFBQVEsQ0FBQztZQUM1QyxDQUFDLENBQUMsVUFBVSxDQUFDLFVBQVUsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDMUQsV0FBVyxFQUFFLFNBQVMsRUFBRSxXQUFXLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRTtZQUMvQyxJQUFJLGlCQUFpQjtnQkFBRSxVQUFVLENBQUMsb0JBQW9CLENBQUMsTUFBZ0IsQ0FBQyxDQUFDOztnQkFDcEUsVUFBVSxDQUFDLFlBQVksQ0FBQyxNQUF1QyxDQUFDLENBQUM7UUFDeEUsQ0FBQyxDQUFDO1FBQ0YsUUFBUSxFQUFFLFNBQVMsRUFBRSxRQUFRLElBQUksQ0FBQyxDQUFDLFFBQVEsRUFBRSxPQUFPLEVBQUUsRUFBRSxDQUFDLFVBQVUsQ0FBQyxVQUFVLENBQUMsUUFBUSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBQ2xHLFVBQVUsRUFBRSxTQUFTLEVBQUUsVUFBVSxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsWUFBWSxDQUFDLE1BQXVDLENBQUMsQ0FBQztRQUNqSCxHQUFHLEVBQUUsU0FBUyxFQUFFLEdBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLE9BQU8sVUFBVSxDQUFDLFdBQVcsRUFBRSxHQUFHLEtBQUssVUFBVSxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsV0FBVyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7S0FDN0gsQ0FBQztBQUNKLENBQUM7QUFFRCxTQUFTLEtBQUssQ0FBQyxLQUFhLEVBQUUsR0FBVyxFQUFFLEdBQVc7SUFDcEQsT0FBTyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDO0FBQzdDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgdHlwZSB7IEludGVyYWN0aW9uQ29udGV4dCB9IGZyb20gJy4uL3R5cGVzLmpzJztcclxuXHJcbmV4cG9ydCB0eXBlIFNjcm9sbEF4aXMgPSAneCcgfCAneSc7XHJcbmV4cG9ydCB0eXBlIFNjcm9sbERpcmVjdGlvbiA9IFNjcm9sbEF4aXMgfCAnYm90aCc7XHJcbmV4cG9ydCB0eXBlIFNjcm9sbFBvaW50ZXJUeXBlID0gJ21vdXNlJyB8ICd0b3VjaCcgfCAncGVuJztcclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgU2Nyb2xsQ29udGFpbmVyTWV0cmljcyB7XHJcbiAgdmlld3BvcnRXaWR0aDogbnVtYmVyO1xyXG4gIHZpZXdwb3J0SGVpZ2h0OiBudW1iZXI7XHJcbiAgY29udGVudFdpZHRoOiBudW1iZXI7XHJcbiAgY29udGVudEhlaWdodDogbnVtYmVyO1xyXG4gIGhvcml6b250YWxUcmFja0xlbmd0aD86IG51bWJlcjtcclxuICB2ZXJ0aWNhbFRyYWNrTGVuZ3RoPzogbnVtYmVyO1xyXG4gIGhvcml6b250YWxUaHVtYkxlbmd0aD86IG51bWJlcjtcclxuICB2ZXJ0aWNhbFRodW1iTGVuZ3RoPzogbnVtYmVyO1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIFNjcm9sbENvbnRhaW5lclN0YXRlIHtcclxuICBvZmZzZXRYOiBudW1iZXI7XHJcbiAgb2Zmc2V0WTogbnVtYmVyO1xyXG4gIC8qKiBSZW5kZXJlZCBvZmZzZXQuIEl0IG1heSB0ZW1wb3JhcmlseSBleGNlZWQgdGhlIGNsYW1wZWQgb2Zmc2V0IGR1cmluZyB0b3VjaC9wZW4gYm91bmNlLiAqL1xyXG4gIGRpc3BsYXlPZmZzZXRYOiBudW1iZXI7XHJcbiAgZGlzcGxheU9mZnNldFk6IG51bWJlcjtcclxuICBob3ZlcmVkOiBib29sZWFuO1xyXG4gIGZvY3VzZWQ6IGJvb2xlYW47XHJcbiAgYmFyc1Zpc2libGU6IGJvb2xlYW47XHJcbiAgZHJhZ2dpbmc6IFNjcm9sbERpcmVjdGlvbiB8IG51bGw7XHJcbiAgbW9tZW50dW06IGJvb2xlYW47XHJcbiAgcG9pbnRlcklkOiBudW1iZXIgfCBudWxsO1xyXG4gIHBvaW50ZXJUeXBlOiBTY3JvbGxQb2ludGVyVHlwZSB8IG51bGw7XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgU2Nyb2xsQ29udGFpbmVyQ29tbWl0IHtcclxuICByZWFzb246ICdjb250aW51b3VzJyB8ICdkaXNjcmV0ZScgfCAndmlzaWJpbGl0eScgfCAnY2FuY2VsJztcclxuICBjaGFuZ2VkQXhlczogU2Nyb2xsQXhpc1tdO1xyXG59XHJcblxyXG4vKiogUGxhdGZvcm0tbmV1dHJhbCB2YWx1ZXMgZm9yIGEgRE9NIHNlbWFudGljIHByb3h5IG9yIG5hdGl2ZSBhY2Nlc3NpYmlsaXR5IGFkYXB0ZXIuICovXHJcbmV4cG9ydCBpbnRlcmZhY2UgU2Nyb2xsQ29udGFpbmVyQWNjZXNzaWJpbGl0eVNuYXBzaG90IHtcclxuICByb2xlOiAnc2Nyb2xsYmFyJztcclxuICB0YWJJbmRleDogMDtcclxuICBvcmllbnRhdGlvbjogJ2hvcml6b250YWwnIHwgJ3ZlcnRpY2FsJztcclxuICB2YWx1ZU1pbjogMDtcclxuICB2YWx1ZU1heDogbnVtYmVyO1xyXG4gIHZhbHVlTm93OiBudW1iZXI7XHJcbiAgdmFsdWVUZXh0OiBzdHJpbmc7XHJcbiAgbGFiZWw/OiBzdHJpbmc7XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgU2Nyb2xsQ29udGFpbmVyT3B0aW9ucyB7XHJcbiAgZGlyZWN0aW9uPzogU2Nyb2xsRGlyZWN0aW9uO1xyXG4gIGluaXRpYWxPZmZzZXRYPzogbnVtYmVyO1xyXG4gIGluaXRpYWxPZmZzZXRZPzogbnVtYmVyO1xyXG4gIHBhZ2VTdGVwPzogbnVtYmVyO1xyXG4gIGxpbmVTdGVwPzogbnVtYmVyO1xyXG4gIGF1dG9IaWRlRGVsYXlNcz86IG51bWJlcjtcclxuICBtb21lbnR1bUZyaWN0aW9uPzogbnVtYmVyO1xyXG4gIGJvdW5jZVNwcmluZz86IG51bWJlcjtcclxuICBib3VuY2VEYW1waW5nPzogbnVtYmVyO1xyXG4gIG1pbmltdW1WZWxvY2l0eT86IG51bWJlcjtcclxuICBvdmVyc2Nyb2xsUmF0aW8/OiBudW1iZXI7XHJcbiAgcmVkdWNlZE1vdGlvbj86IGJvb2xlYW47XHJcbiAgc2NoZWR1bGVyPzogUGFydGlhbDxTY3JvbGxDb250YWluZXJTY2hlZHVsZXI+O1xyXG4gIG9uQ29tbWl0KHN0YXRlOiBSZWFkb25seTxTY3JvbGxDb250YWluZXJTdGF0ZT4sIGNvbW1pdDogU2Nyb2xsQ29udGFpbmVyQ29tbWl0KTogdm9pZDtcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBTY3JvbGxDb250YWluZXJTY2hlZHVsZXIge1xyXG4gIHJlcXVlc3RGcmFtZShjYWxsYmFjazogKHRpbWVzdGFtcDogbnVtYmVyKSA9PiB2b2lkKTogdW5rbm93bjtcclxuICBjYW5jZWxGcmFtZShoYW5kbGU6IHVua25vd24pOiB2b2lkO1xyXG4gIHNldERlbGF5KGNhbGxiYWNrOiAoKSA9PiB2b2lkLCBkZWxheU1zOiBudW1iZXIpOiB1bmtub3duO1xyXG4gIGNsZWFyRGVsYXkoaGFuZGxlOiB1bmtub3duKTogdm9pZDtcclxuICBub3coKTogbnVtYmVyO1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIFNjcm9sbENvbnRhaW5lckNvbnRyb2xsZXIge1xyXG4gIHJlYWRvbmx5IHN0YXRlOiBTY3JvbGxDb250YWluZXJTdGF0ZTtcclxuICB1cGRhdGVNZXRyaWNzKG1ldHJpY3M6IFNjcm9sbENvbnRhaW5lck1ldHJpY3MpOiB2b2lkO1xyXG4gIHNldEhvdmVyZWQodmFsdWU6IGJvb2xlYW4pOiB2b2lkO1xyXG4gIHNldEZvY3VzZWQodmFsdWU6IGJvb2xlYW4pOiB2b2lkO1xyXG4gIHdoZWVsKGRlbHRhWDogbnVtYmVyLCBkZWx0YVk6IG51bWJlcik6IHZvaWQ7XHJcbiAganVtcFRvKGF4aXM6IFNjcm9sbEF4aXMsIHRyYWNrQ29vcmRpbmF0ZTogbnVtYmVyKTogdm9pZDtcclxuICBiZWdpblRodW1iRHJhZyhheGlzOiBTY3JvbGxBeGlzLCBwb2ludGVySWQ6IG51bWJlciwgdHJhY2tDb29yZGluYXRlOiBudW1iZXIsIHBvaW50ZXJUeXBlPzogU2Nyb2xsUG9pbnRlclR5cGUpOiBib29sZWFuO1xyXG4gIG1vdmVUaHVtYkRyYWcocG9pbnRlcklkOiBudW1iZXIsIHRyYWNrQ29vcmRpbmF0ZTogbnVtYmVyLCBidXR0b25zPzogbnVtYmVyKTogYm9vbGVhbjtcclxuICBlbmRUaHVtYkRyYWcocG9pbnRlcklkOiBudW1iZXIpOiBib29sZWFuO1xyXG4gIGJlZ2luQ29udGVudERyYWcocG9pbnRlcklkOiBudW1iZXIsIHBvaW50WDogbnVtYmVyLCBwb2ludFk6IG51bWJlciwgdGltZXN0YW1wPzogbnVtYmVyLCBwb2ludGVyVHlwZT86IFNjcm9sbFBvaW50ZXJUeXBlKTogYm9vbGVhbjtcclxuICBtb3ZlQ29udGVudERyYWcocG9pbnRlcklkOiBudW1iZXIsIHBvaW50WDogbnVtYmVyLCBwb2ludFk6IG51bWJlciwgdGltZXN0YW1wPzogbnVtYmVyLCBidXR0b25zPzogbnVtYmVyKTogYm9vbGVhbjtcclxuICBlbmRDb250ZW50RHJhZyhwb2ludGVySWQ6IG51bWJlciwgdGltZXN0YW1wPzogbnVtYmVyKTogYm9vbGVhbjtcclxuICBjYW5jZWxUaHVtYkRyYWcocG9pbnRlcklkPzogbnVtYmVyKTogYm9vbGVhbjtcclxuICBjYW5jZWxDb250ZW50RHJhZyhwb2ludGVySWQ/OiBudW1iZXIpOiBib29sZWFuO1xyXG4gIGtleShrZXk6IHN0cmluZyk6IGJvb2xlYW47XHJcbiAgYWNjZXNzaWJpbGl0eShheGlzOiBTY3JvbGxBeGlzLCBsYWJlbD86IHN0cmluZyk6IFNjcm9sbENvbnRhaW5lckFjY2Vzc2liaWxpdHlTbmFwc2hvdCB8IG51bGw7XHJcbiAgZmx1c2goKTogdm9pZDtcclxuICBkaXNwb3NlKCk6IHZvaWQ7XHJcbn1cclxuXHJcbmludGVyZmFjZSBEcmFnU25hcHNob3Qge1xyXG4gIGtpbmQ6ICd0aHVtYic7XHJcbiAgYXhpczogU2Nyb2xsQXhpcztcclxuICBwb2ludGVySWQ6IG51bWJlcjtcclxuICBzdGFydENvb3JkaW5hdGU6IG51bWJlcjtcclxuICBzdGFydE9mZnNldDogbnVtYmVyO1xyXG4gIHJhdGlvOiBudW1iZXI7XHJcbn1cclxuXHJcbmludGVyZmFjZSBDb250ZW50RHJhZ1NuYXBzaG90IHtcclxuICBraW5kOiAnY29udGVudCc7XHJcbiAgcG9pbnRlcklkOiBudW1iZXI7XHJcbiAgcG9pbnRlclR5cGU6IFNjcm9sbFBvaW50ZXJUeXBlO1xyXG4gIHN0YXJ0WDogbnVtYmVyO1xyXG4gIHN0YXJ0WTogbnVtYmVyO1xyXG4gIHN0YXJ0RGlzcGxheVg6IG51bWJlcjtcclxuICBzdGFydERpc3BsYXlZOiBudW1iZXI7XHJcbiAgbGFzdFg6IG51bWJlcjtcclxuICBsYXN0WTogbnVtYmVyO1xyXG4gIGxhc3RUaW1lc3RhbXA6IG51bWJlcjtcclxuICB2ZWxvY2l0eVg6IG51bWJlcjtcclxuICB2ZWxvY2l0eVk6IG51bWJlcjtcclxufVxyXG5cclxudHlwZSBBY3RpdmVEcmFnID0gRHJhZ1NuYXBzaG90IHwgQ29udGVudERyYWdTbmFwc2hvdDtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVTY3JvbGxDb250YWluZXIoXHJcbiAgY3R4OiBQaWNrPEludGVyYWN0aW9uQ29udGV4dCwgJ3JlYWN0aXZlJyB8ICdzY2hlZHVsZScgfCAnZGlzcG9zZScgfCAndHJhY2UnPixcclxuICBvcHRpb25zOiBTY3JvbGxDb250YWluZXJPcHRpb25zLFxyXG4pOiBTY3JvbGxDb250YWluZXJDb250cm9sbGVyIHtcclxuICBjb25zdCBkaXJlY3Rpb24gPSBvcHRpb25zLmRpcmVjdGlvbiA/PyAnYm90aCc7XHJcbiAgY29uc3QgaW5pdGlhbE9mZnNldFggPSBNYXRoLm1heCgwLCBvcHRpb25zLmluaXRpYWxPZmZzZXRYID8/IDApO1xyXG4gIGNvbnN0IGluaXRpYWxPZmZzZXRZID0gTWF0aC5tYXgoMCwgb3B0aW9ucy5pbml0aWFsT2Zmc2V0WSA/PyAwKTtcclxuICBjb25zdCBzY2hlZHVsZXIgPSByZXNvbHZlU2NoZWR1bGVyKG9wdGlvbnMuc2NoZWR1bGVyKTtcclxuICBjb25zdCBhdXRvSGlkZURlbGF5TXMgPSBNYXRoLm1heCgwLCBmaW5pdGUob3B0aW9ucy5hdXRvSGlkZURlbGF5TXMgPz8gMTAwMCkpO1xyXG4gIGNvbnN0IG1vbWVudHVtRnJpY3Rpb24gPSBwb3NpdGl2ZShvcHRpb25zLm1vbWVudHVtRnJpY3Rpb24sIDAuMDA2KTtcclxuICBjb25zdCBib3VuY2VTcHJpbmcgPSBwb3NpdGl2ZShvcHRpb25zLmJvdW5jZVNwcmluZywgMC4wMDEyKTtcclxuICBjb25zdCBib3VuY2VEYW1waW5nID0gcG9zaXRpdmUob3B0aW9ucy5ib3VuY2VEYW1waW5nLCAwLjAxOCk7XHJcbiAgY29uc3QgbWluaW11bVZlbG9jaXR5ID0gcG9zaXRpdmUob3B0aW9ucy5taW5pbXVtVmVsb2NpdHksIDAuMDIpO1xyXG4gIGNvbnN0IG92ZXJzY3JvbGxSYXRpbyA9IGNsYW1wKGZpbml0ZShvcHRpb25zLm92ZXJzY3JvbGxSYXRpbyA/PyAwLjE4KSwgMCwgMSk7XHJcbiAgY29uc3Qgc3RhdGUgPSBjdHgucmVhY3RpdmU8U2Nyb2xsQ29udGFpbmVyU3RhdGU+KHtcclxuICAgIG9mZnNldFg6IGluaXRpYWxPZmZzZXRYLFxyXG4gICAgb2Zmc2V0WTogaW5pdGlhbE9mZnNldFksXHJcbiAgICBkaXNwbGF5T2Zmc2V0WDogaW5pdGlhbE9mZnNldFgsXHJcbiAgICBkaXNwbGF5T2Zmc2V0WTogaW5pdGlhbE9mZnNldFksXHJcbiAgICBob3ZlcmVkOiBmYWxzZSxcclxuICAgIGZvY3VzZWQ6IGZhbHNlLFxyXG4gICAgYmFyc1Zpc2libGU6IGZhbHNlLFxyXG4gICAgZHJhZ2dpbmc6IG51bGwsXHJcbiAgICBtb21lbnR1bTogZmFsc2UsXHJcbiAgICBwb2ludGVySWQ6IG51bGwsXHJcbiAgICBwb2ludGVyVHlwZTogbnVsbCxcclxuICB9KTtcclxuICBsZXQgbWV0cmljcyA9IG5vcm1hbGl6ZU1ldHJpY3MoeyB2aWV3cG9ydFdpZHRoOiAwLCB2aWV3cG9ydEhlaWdodDogMCwgY29udGVudFdpZHRoOiAwLCBjb250ZW50SGVpZ2h0OiAwIH0pO1xyXG4gIGxldCBkcmFnOiBBY3RpdmVEcmFnIHwgbnVsbCA9IG51bGw7XHJcbiAgbGV0IGRpc3Bvc2VkID0gZmFsc2U7XHJcbiAgbGV0IHNjaGVkdWxlZCA9IGZhbHNlO1xyXG4gIGxldCBoaWRlSGFuZGxlOiB1bmtub3duID0gbnVsbDtcclxuICBsZXQgbW9tZW50dW1IYW5kbGU6IHVua25vd24gPSBudWxsO1xyXG4gIGxldCBtb21lbnR1bUxhc3RUaW1lc3RhbXAgPSAwO1xyXG4gIGxldCBtb21lbnR1bVZlbG9jaXR5WCA9IDA7XHJcbiAgbGV0IG1vbWVudHVtVmVsb2NpdHlZID0gMDtcclxuICBjb25zdCBkaXJ0eUF4ZXMgPSBuZXcgU2V0PFNjcm9sbEF4aXM+KCk7XHJcblxyXG4gIGNvbnN0IHB1Ymxpc2ggPSAocmVhc29uOiBTY3JvbGxDb250YWluZXJDb21taXRbJ3JlYXNvbiddKSA9PiB7XHJcbiAgICBpZiAoZGlzcG9zZWQpIHJldHVybjtcclxuICAgIGNvbnN0IGNoYW5nZWRBeGVzID0gWy4uLmRpcnR5QXhlc107XHJcbiAgICBkaXJ0eUF4ZXMuY2xlYXIoKTtcclxuICAgIHNjaGVkdWxlZCA9IGZhbHNlO1xyXG4gICAgb3B0aW9ucy5vbkNvbW1pdCh7IC4uLnN0YXRlIH0sIHsgcmVhc29uLCBjaGFuZ2VkQXhlcyB9KTtcclxuICB9O1xyXG4gIGNvbnN0IHNjaGVkdWxlUHVibGlzaCA9ICgpID0+IHtcclxuICAgIGlmIChzY2hlZHVsZWQgfHwgZGlzcG9zZWQpIHJldHVybjtcclxuICAgIHNjaGVkdWxlZCA9IHRydWU7XHJcbiAgICBjb25zdCBydW4gPSAoKSA9PiB7XHJcbiAgICAgIGlmIChzY2hlZHVsZWQpIHB1Ymxpc2goJ2NvbnRpbnVvdXMnKTtcclxuICAgIH07XHJcbiAgICBpZiAoY3R4LnNjaGVkdWxlKSBjdHguc2NoZWR1bGUocnVuKTtcclxuICAgIGVsc2UgcXVldWVNaWNyb3Rhc2socnVuKTtcclxuICB9O1xyXG4gIGNvbnN0IHNldE9mZnNldCA9IChheGlzOiBTY3JvbGxBeGlzLCB2YWx1ZTogbnVtYmVyLCBtb2RlOiAnY29udGludW91cycgfCAnZGlzY3JldGUnKSA9PiB7XHJcbiAgICBpZiAoIWF4aXNFbmFibGVkKGRpcmVjdGlvbiwgYXhpcykpIHJldHVybiBmYWxzZTtcclxuICAgIGNvbnN0IG5leHQgPSBjbGFtcCh2YWx1ZSwgMCwgc2Nyb2xsUmFuZ2UobWV0cmljcywgYXhpcykpO1xyXG4gICAgY29uc3Qga2V5ID0gYXhpcyA9PT0gJ3gnID8gJ29mZnNldFgnIDogJ29mZnNldFknO1xyXG4gICAgY29uc3QgZGlzcGxheUtleSA9IGF4aXMgPT09ICd4JyA/ICdkaXNwbGF5T2Zmc2V0WCcgOiAnZGlzcGxheU9mZnNldFknO1xyXG4gICAgaWYgKE1hdGguYWJzKHN0YXRlW2tleV0gLSBuZXh0KSA8IDFlLTYgJiYgTWF0aC5hYnMoc3RhdGVbZGlzcGxheUtleV0gLSBuZXh0KSA8IDFlLTYpIHJldHVybiBmYWxzZTtcclxuICAgIHN0YXRlW2tleV0gPSBuZXh0O1xyXG4gICAgc3RhdGVbZGlzcGxheUtleV0gPSBuZXh0O1xyXG4gICAgZGlydHlBeGVzLmFkZChheGlzKTtcclxuICAgIGlmIChtb2RlID09PSAnZGlzY3JldGUnKSBwdWJsaXNoKCdkaXNjcmV0ZScpO1xyXG4gICAgZWxzZSBzY2hlZHVsZVB1Ymxpc2goKTtcclxuICAgIHJldHVybiB0cnVlO1xyXG4gIH07XHJcbiAgY29uc3Qgc2V0QmFyc1Zpc2libGUgPSAodmFsdWU6IGJvb2xlYW4pID0+IHtcclxuICAgIGlmIChzdGF0ZS5iYXJzVmlzaWJsZSA9PT0gdmFsdWUpIHJldHVybjtcclxuICAgIHN0YXRlLmJhcnNWaXNpYmxlID0gdmFsdWU7XHJcbiAgICBvcHRpb25zLm9uQ29tbWl0KHsgLi4uc3RhdGUgfSwgeyByZWFzb246ICd2aXNpYmlsaXR5JywgY2hhbmdlZEF4ZXM6IFtdIH0pO1xyXG4gIH07XHJcbiAgY29uc3QgY2xlYXJIaWRlID0gKCkgPT4ge1xyXG4gICAgaWYgKGhpZGVIYW5kbGUgPT09IG51bGwpIHJldHVybjtcclxuICAgIHNjaGVkdWxlci5jbGVhckRlbGF5KGhpZGVIYW5kbGUpO1xyXG4gICAgaGlkZUhhbmRsZSA9IG51bGw7XHJcbiAgfTtcclxuICBjb25zdCBzaG93QmFycyA9ICgpID0+IHtcclxuICAgIGNsZWFySGlkZSgpO1xyXG4gICAgc2V0QmFyc1Zpc2libGUodHJ1ZSk7XHJcbiAgfTtcclxuICBjb25zdCBzY2hlZHVsZUhpZGUgPSAoKSA9PiB7XHJcbiAgICBjbGVhckhpZGUoKTtcclxuICAgIGlmIChkaXNwb3NlZCB8fCBzdGF0ZS5ob3ZlcmVkIHx8IHN0YXRlLmZvY3VzZWQgfHwgZHJhZyB8fCBzdGF0ZS5tb21lbnR1bSkgcmV0dXJuO1xyXG4gICAgaWYgKGF1dG9IaWRlRGVsYXlNcyA9PT0gMCkge1xyXG4gICAgICBzZXRCYXJzVmlzaWJsZShmYWxzZSk7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIGhpZGVIYW5kbGUgPSBzY2hlZHVsZXIuc2V0RGVsYXkoKCkgPT4ge1xyXG4gICAgICBoaWRlSGFuZGxlID0gbnVsbDtcclxuICAgICAgaWYgKCFkaXNwb3NlZCAmJiAhc3RhdGUuaG92ZXJlZCAmJiAhc3RhdGUuZm9jdXNlZCAmJiAhZHJhZyAmJiAhc3RhdGUubW9tZW50dW0pIHNldEJhcnNWaXNpYmxlKGZhbHNlKTtcclxuICAgIH0sIGF1dG9IaWRlRGVsYXlNcyk7XHJcbiAgfTtcclxuICBjb25zdCBzZXREaXNwbGF5T2Zmc2V0ID0gKGF4aXM6IFNjcm9sbEF4aXMsIHZhbHVlOiBudW1iZXIpID0+IHtcclxuICAgIGlmICghYXhpc0VuYWJsZWQoZGlyZWN0aW9uLCBheGlzKSkgcmV0dXJuIGZhbHNlO1xyXG4gICAgY29uc3QgZGlzcGxheUtleSA9IGF4aXMgPT09ICd4JyA/ICdkaXNwbGF5T2Zmc2V0WCcgOiAnZGlzcGxheU9mZnNldFknO1xyXG4gICAgY29uc3Qgb2Zmc2V0S2V5ID0gYXhpcyA9PT0gJ3gnID8gJ29mZnNldFgnIDogJ29mZnNldFknO1xyXG4gICAgY29uc3QgbmV4dERpc3BsYXkgPSBmaW5pdGUodmFsdWUpO1xyXG4gICAgY29uc3QgbmV4dE9mZnNldCA9IGNsYW1wKG5leHREaXNwbGF5LCAwLCBzY3JvbGxSYW5nZShtZXRyaWNzLCBheGlzKSk7XHJcbiAgICBpZiAoTWF0aC5hYnMoc3RhdGVbZGlzcGxheUtleV0gLSBuZXh0RGlzcGxheSkgPCAxZS02ICYmIE1hdGguYWJzKHN0YXRlW29mZnNldEtleV0gLSBuZXh0T2Zmc2V0KSA8IDFlLTYpIHJldHVybiBmYWxzZTtcclxuICAgIHN0YXRlW2Rpc3BsYXlLZXldID0gbmV4dERpc3BsYXk7XHJcbiAgICBzdGF0ZVtvZmZzZXRLZXldID0gbmV4dE9mZnNldDtcclxuICAgIGRpcnR5QXhlcy5hZGQoYXhpcyk7XHJcbiAgICByZXR1cm4gdHJ1ZTtcclxuICB9O1xyXG4gIGNvbnN0IHN0b3BNb21lbnR1bSA9IChzZXR0bGU6IGJvb2xlYW4pID0+IHtcclxuICAgIGlmIChtb21lbnR1bUhhbmRsZSAhPT0gbnVsbCkgc2NoZWR1bGVyLmNhbmNlbEZyYW1lKG1vbWVudHVtSGFuZGxlKTtcclxuICAgIG1vbWVudHVtSGFuZGxlID0gbnVsbDtcclxuICAgIG1vbWVudHVtTGFzdFRpbWVzdGFtcCA9IDA7XHJcbiAgICBtb21lbnR1bVZlbG9jaXR5WCA9IDA7XHJcbiAgICBtb21lbnR1bVZlbG9jaXR5WSA9IDA7XHJcbiAgICBjb25zdCB3YXNBY3RpdmUgPSBzdGF0ZS5tb21lbnR1bTtcclxuICAgIHN0YXRlLm1vbWVudHVtID0gZmFsc2U7XHJcbiAgICBpZiAoc2V0dGxlKSB7XHJcbiAgICAgIHNldERpc3BsYXlPZmZzZXQoJ3gnLCBzdGF0ZS5vZmZzZXRYKTtcclxuICAgICAgc2V0RGlzcGxheU9mZnNldCgneScsIHN0YXRlLm9mZnNldFkpO1xyXG4gICAgfVxyXG4gICAgaWYgKHdhc0FjdGl2ZSkgY3R4LnRyYWNlPy4oJ3Njcm9sbC5tb21lbnR1bS5lbmQnLCB7IG9mZnNldFg6IHN0YXRlLm9mZnNldFgsIG9mZnNldFk6IHN0YXRlLm9mZnNldFkgfSk7XHJcbiAgfTtcclxuICBjb25zdCBzZXR0bGVBeGlzID0gKGF4aXM6IFNjcm9sbEF4aXMsIHZlbG9jaXR5OiBudW1iZXIsIGRlbHRhTXM6IG51bWJlcikgPT4ge1xyXG4gICAgY29uc3QgcmFuZ2UgPSBzY3JvbGxSYW5nZShtZXRyaWNzLCBheGlzKTtcclxuICAgIGNvbnN0IGRpc3BsYXkgPSBheGlzID09PSAneCcgPyBzdGF0ZS5kaXNwbGF5T2Zmc2V0WCA6IHN0YXRlLmRpc3BsYXlPZmZzZXRZO1xyXG4gICAgbGV0IG5leHREaXNwbGF5ID0gZGlzcGxheSArIHZlbG9jaXR5ICogZGVsdGFNcztcclxuICAgIGxldCBuZXh0VmVsb2NpdHkgPSB2ZWxvY2l0eTtcclxuICAgIGNvbnN0IGJvdW5kYXJ5ID0gbmV4dERpc3BsYXkgPCAwID8gMCA6IG5leHREaXNwbGF5ID4gcmFuZ2UgPyByYW5nZSA6IG51bGw7XHJcbiAgICBpZiAoYm91bmRhcnkgIT09IG51bGwpIHtcclxuICAgICAgbmV4dFZlbG9jaXR5ICs9IChib3VuZGFyeSAtIG5leHREaXNwbGF5KSAqIGJvdW5jZVNwcmluZyAqIGRlbHRhTXM7XHJcbiAgICAgIG5leHRWZWxvY2l0eSAqPSBNYXRoLmV4cCgtYm91bmNlRGFtcGluZyAqIGRlbHRhTXMpO1xyXG4gICAgICBjb25zdCB2aWV3cG9ydCA9IGF4aXMgPT09ICd4JyA/IG1ldHJpY3Mudmlld3BvcnRXaWR0aCA6IG1ldHJpY3Mudmlld3BvcnRIZWlnaHQ7XHJcbiAgICAgIGNvbnN0IG1heGltdW1PdmVyc2Nyb2xsID0gTWF0aC5tYXgoMSwgdmlld3BvcnQgKiBvdmVyc2Nyb2xsUmF0aW8pO1xyXG4gICAgICBuZXh0RGlzcGxheSA9IGNsYW1wKG5leHREaXNwbGF5LCAtbWF4aW11bU92ZXJzY3JvbGwsIHJhbmdlICsgbWF4aW11bU92ZXJzY3JvbGwpO1xyXG4gICAgICBjb25zdCBzZXR0bGVkID0gTWF0aC5hYnMoYm91bmRhcnkgLSBuZXh0RGlzcGxheSkgPCAwLjUgJiYgTWF0aC5hYnMobmV4dFZlbG9jaXR5KSA8IG1pbmltdW1WZWxvY2l0eTtcclxuICAgICAgcmV0dXJuIHNldHRsZWRcclxuICAgICAgICA/IHsgZGlzcGxheTogYm91bmRhcnksIHZlbG9jaXR5OiAwLCBzZXR0bGVkOiB0cnVlIH1cclxuICAgICAgICA6IHsgZGlzcGxheTogbmV4dERpc3BsYXksIHZlbG9jaXR5OiBuZXh0VmVsb2NpdHksIHNldHRsZWQ6IGZhbHNlIH07XHJcbiAgICB9XHJcbiAgICBuZXh0VmVsb2NpdHkgKj0gTWF0aC5leHAoLW1vbWVudHVtRnJpY3Rpb24gKiBkZWx0YU1zKTtcclxuICAgIHJldHVybiB7IGRpc3BsYXk6IG5leHREaXNwbGF5LCB2ZWxvY2l0eTogTWF0aC5hYnMobmV4dFZlbG9jaXR5KSA8IG1pbmltdW1WZWxvY2l0eSA/IDAgOiBuZXh0VmVsb2NpdHksIHNldHRsZWQ6IE1hdGguYWJzKG5leHRWZWxvY2l0eSkgPCBtaW5pbXVtVmVsb2NpdHkgfTtcclxuICB9O1xyXG4gIGNvbnN0IG1vbWVudHVtU3RlcCA9ICh0aW1lc3RhbXA6IG51bWJlcikgPT4ge1xyXG4gICAgaWYgKGRpc3Bvc2VkIHx8ICFzdGF0ZS5tb21lbnR1bSkgcmV0dXJuO1xyXG4gICAgbW9tZW50dW1IYW5kbGUgPSBudWxsO1xyXG4gICAgY29uc3QgZGVsdGFNcyA9IG1vbWVudHVtTGFzdFRpbWVzdGFtcCA9PT0gMCA/IDE2IDogY2xhbXAodGltZXN0YW1wIC0gbW9tZW50dW1MYXN0VGltZXN0YW1wLCA4LCAzMik7XHJcbiAgICBtb21lbnR1bUxhc3RUaW1lc3RhbXAgPSB0aW1lc3RhbXA7XHJcbiAgICBjb25zdCB4ID0gc2V0dGxlQXhpcygneCcsIG1vbWVudHVtVmVsb2NpdHlYLCBkZWx0YU1zKTtcclxuICAgIGNvbnN0IHkgPSBzZXR0bGVBeGlzKCd5JywgbW9tZW50dW1WZWxvY2l0eVksIGRlbHRhTXMpO1xyXG4gICAgbW9tZW50dW1WZWxvY2l0eVggPSB4LnZlbG9jaXR5O1xyXG4gICAgbW9tZW50dW1WZWxvY2l0eVkgPSB5LnZlbG9jaXR5O1xyXG4gICAgc2V0RGlzcGxheU9mZnNldCgneCcsIHguZGlzcGxheSk7XHJcbiAgICBzZXREaXNwbGF5T2Zmc2V0KCd5JywgeS5kaXNwbGF5KTtcclxuICAgIGlmIChkaXJ0eUF4ZXMuc2l6ZSA+IDApIHB1Ymxpc2goJ2NvbnRpbnVvdXMnKTtcclxuICAgIGlmICh4LnNldHRsZWQgJiYgeS5zZXR0bGVkKSB7XHJcbiAgICAgIHN0b3BNb21lbnR1bSh0cnVlKTtcclxuICAgICAgaWYgKGRpcnR5QXhlcy5zaXplID4gMCkgcHVibGlzaCgnY29udGludW91cycpO1xyXG4gICAgICBzY2hlZHVsZUhpZGUoKTtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgbW9tZW50dW1IYW5kbGUgPSBzY2hlZHVsZXIucmVxdWVzdEZyYW1lKG1vbWVudHVtU3RlcCk7XHJcbiAgfTtcclxuICBjb25zdCBzdGFydE1vbWVudHVtID0gKHZlbG9jaXR5WDogbnVtYmVyLCB2ZWxvY2l0eVk6IG51bWJlcikgPT4ge1xyXG4gICAgc3RvcE1vbWVudHVtKGZhbHNlKTtcclxuICAgIG1vbWVudHVtVmVsb2NpdHlYID0gYXhpc0VuYWJsZWQoZGlyZWN0aW9uLCAneCcpID8gZmluaXRlKHZlbG9jaXR5WCkgOiAwO1xyXG4gICAgbW9tZW50dW1WZWxvY2l0eVkgPSBheGlzRW5hYmxlZChkaXJlY3Rpb24sICd5JykgPyBmaW5pdGUodmVsb2NpdHlZKSA6IDA7XHJcbiAgICBjb25zdCBvdXRzaWRlQm91bmRzID0gc3RhdGUuZGlzcGxheU9mZnNldFggIT09IHN0YXRlLm9mZnNldFggfHwgc3RhdGUuZGlzcGxheU9mZnNldFkgIT09IHN0YXRlLm9mZnNldFk7XHJcbiAgICBpZiAob3B0aW9ucy5yZWR1Y2VkTW90aW9uIHx8ICghb3V0c2lkZUJvdW5kc1xyXG4gICAgICAmJiBNYXRoLmFicyhtb21lbnR1bVZlbG9jaXR5WCkgPCBtaW5pbXVtVmVsb2NpdHlcclxuICAgICAgJiYgTWF0aC5hYnMobW9tZW50dW1WZWxvY2l0eVkpIDwgbWluaW11bVZlbG9jaXR5KSkge1xyXG4gICAgICBzZXREaXNwbGF5T2Zmc2V0KCd4Jywgc3RhdGUub2Zmc2V0WCk7XHJcbiAgICAgIHNldERpc3BsYXlPZmZzZXQoJ3knLCBzdGF0ZS5vZmZzZXRZKTtcclxuICAgICAgaWYgKGRpcnR5QXhlcy5zaXplID4gMCkgcHVibGlzaCgnY29udGludW91cycpO1xyXG4gICAgICBzY2hlZHVsZUhpZGUoKTtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgc3RhdGUubW9tZW50dW0gPSB0cnVlO1xyXG4gICAgc2hvd0JhcnMoKTtcclxuICAgIGN0eC50cmFjZT8uKCdzY3JvbGwubW9tZW50dW0uc3RhcnQnLCB7IHZlbG9jaXR5WDogbW9tZW50dW1WZWxvY2l0eVgsIHZlbG9jaXR5WTogbW9tZW50dW1WZWxvY2l0eVkgfSk7XHJcbiAgICBtb21lbnR1bUhhbmRsZSA9IHNjaGVkdWxlci5yZXF1ZXN0RnJhbWUobW9tZW50dW1TdGVwKTtcclxuICB9O1xyXG5cclxuICBjb25zdCBjb250cm9sbGVyOiBTY3JvbGxDb250YWluZXJDb250cm9sbGVyID0ge1xyXG4gICAgc3RhdGUsXHJcbiAgICB1cGRhdGVNZXRyaWNzKG5leHRNZXRyaWNzKSB7XHJcbiAgICAgIGNvbnN0IHByZXZpb3VzT2Zmc2V0WCA9IHN0YXRlLm9mZnNldFg7XHJcbiAgICAgIGNvbnN0IHByZXZpb3VzT2Zmc2V0WSA9IHN0YXRlLm9mZnNldFk7XHJcbiAgICAgIGlmIChkcmFnPy5raW5kID09PSAndGh1bWInKSBjb250cm9sbGVyLmNhbmNlbFRodW1iRHJhZyhkcmFnLnBvaW50ZXJJZCk7XHJcbiAgICAgIGVsc2UgaWYgKGRyYWc/LmtpbmQgPT09ICdjb250ZW50JykgY29udHJvbGxlci5jYW5jZWxDb250ZW50RHJhZyhkcmFnLnBvaW50ZXJJZCk7XHJcbiAgICAgIHN0b3BNb21lbnR1bShmYWxzZSk7XHJcbiAgICAgIG1ldHJpY3MgPSBub3JtYWxpemVNZXRyaWNzKG5leHRNZXRyaWNzKTtcclxuICAgICAgc3RhdGUub2Zmc2V0WCA9IGNsYW1wKHN0YXRlLm9mZnNldFgsIDAsIHNjcm9sbFJhbmdlKG1ldHJpY3MsICd4JykpO1xyXG4gICAgICBzdGF0ZS5vZmZzZXRZID0gY2xhbXAoc3RhdGUub2Zmc2V0WSwgMCwgc2Nyb2xsUmFuZ2UobWV0cmljcywgJ3knKSk7XHJcbiAgICAgIHN0YXRlLmRpc3BsYXlPZmZzZXRYID0gc3RhdGUub2Zmc2V0WDtcclxuICAgICAgc3RhdGUuZGlzcGxheU9mZnNldFkgPSBzdGF0ZS5vZmZzZXRZO1xyXG4gICAgICBpZiAoc3RhdGUub2Zmc2V0WCAhPT0gcHJldmlvdXNPZmZzZXRYKSBkaXJ0eUF4ZXMuYWRkKCd4Jyk7XHJcbiAgICAgIGlmIChzdGF0ZS5vZmZzZXRZICE9PSBwcmV2aW91c09mZnNldFkpIGRpcnR5QXhlcy5hZGQoJ3knKTtcclxuICAgICAgaWYgKGRpcnR5QXhlcy5zaXplID4gMCkgcHVibGlzaCgnZGlzY3JldGUnKTtcclxuICAgIH0sXHJcbiAgICBzZXRIb3ZlcmVkKHZhbHVlKSB7XHJcbiAgICAgIHN0YXRlLmhvdmVyZWQgPSB2YWx1ZTtcclxuICAgICAgaWYgKHZhbHVlKSBzaG93QmFycygpO1xyXG4gICAgICBlbHNlIHNjaGVkdWxlSGlkZSgpO1xyXG4gICAgfSxcclxuICAgIHNldEZvY3VzZWQodmFsdWUpIHtcclxuICAgICAgc3RhdGUuZm9jdXNlZCA9IHZhbHVlO1xyXG4gICAgICBpZiAodmFsdWUpIHNob3dCYXJzKCk7XHJcbiAgICAgIGVsc2Ugc2NoZWR1bGVIaWRlKCk7XHJcbiAgICB9LFxyXG4gICAgd2hlZWwoZGVsdGFYLCBkZWx0YVkpIHtcclxuICAgICAgc3RvcE1vbWVudHVtKHRydWUpO1xyXG4gICAgICBzaG93QmFycygpO1xyXG4gICAgICBpZiAoYXhpc0VuYWJsZWQoZGlyZWN0aW9uLCAneCcpKSBzZXRPZmZzZXQoJ3gnLCBzdGF0ZS5vZmZzZXRYICsgZmluaXRlKGRlbHRhWCksICdjb250aW51b3VzJyk7XHJcbiAgICAgIGlmIChheGlzRW5hYmxlZChkaXJlY3Rpb24sICd5JykpIHNldE9mZnNldCgneScsIHN0YXRlLm9mZnNldFkgKyBmaW5pdGUoZGVsdGFZKSwgJ2NvbnRpbnVvdXMnKTtcclxuICAgICAgY3R4LnRyYWNlPy4oJ3Njcm9sbC53aGVlbCcsIHsgZGVsdGFYLCBkZWx0YVkgfSk7XHJcbiAgICAgIHNjaGVkdWxlSGlkZSgpO1xyXG4gICAgfSxcclxuICAgIGp1bXBUbyhheGlzLCB0cmFja0Nvb3JkaW5hdGUpIHtcclxuICAgICAgc3RvcE1vbWVudHVtKHRydWUpO1xyXG4gICAgICBzaG93QmFycygpO1xyXG4gICAgICBjb25zdCByYXRpbyA9IHRodW1iUmF0aW8obWV0cmljcywgYXhpcyk7XHJcbiAgICAgIGNvbnN0IHRodW1iTGVuZ3RoID0gdGh1bWJTaXplKG1ldHJpY3MsIGF4aXMpO1xyXG4gICAgICBjb25zdCBuZXh0ID0gKGZpbml0ZSh0cmFja0Nvb3JkaW5hdGUpIC0gdGh1bWJMZW5ndGggLyAyKSAqIHJhdGlvO1xyXG4gICAgICBjb25zdCBjaGFuZ2VkID0gc2V0T2Zmc2V0KGF4aXMsIG5leHQsICdkaXNjcmV0ZScpO1xyXG4gICAgICBpZiAoY2hhbmdlZCkgY3R4LnRyYWNlPy4oJ3Njcm9sbC50cmFjay1qdW1wJywgeyBheGlzLCBvZmZzZXQ6IGF4aXMgPT09ICd4JyA/IHN0YXRlLm9mZnNldFggOiBzdGF0ZS5vZmZzZXRZIH0pO1xyXG4gICAgICBzY2hlZHVsZUhpZGUoKTtcclxuICAgIH0sXHJcbiAgICBiZWdpblRodW1iRHJhZyhheGlzLCBwb2ludGVySWQsIHRyYWNrQ29vcmRpbmF0ZSwgcG9pbnRlclR5cGUgPSAnbW91c2UnKSB7XHJcbiAgICAgIGlmICghYXhpc0VuYWJsZWQoZGlyZWN0aW9uLCBheGlzKSB8fCBkcmFnKSByZXR1cm4gZmFsc2U7XHJcbiAgICAgIHN0b3BNb21lbnR1bSh0cnVlKTtcclxuICAgICAgZHJhZyA9IHtcclxuICAgICAgICBraW5kOiAndGh1bWInLFxyXG4gICAgICAgIGF4aXMsXHJcbiAgICAgICAgcG9pbnRlcklkLFxyXG4gICAgICAgIHN0YXJ0Q29vcmRpbmF0ZTogZmluaXRlKHRyYWNrQ29vcmRpbmF0ZSksXHJcbiAgICAgICAgc3RhcnRPZmZzZXQ6IGF4aXMgPT09ICd4JyA/IHN0YXRlLm9mZnNldFggOiBzdGF0ZS5vZmZzZXRZLFxyXG4gICAgICAgIHJhdGlvOiB0aHVtYlJhdGlvKG1ldHJpY3MsIGF4aXMpLFxyXG4gICAgICB9O1xyXG4gICAgICBzdGF0ZS5kcmFnZ2luZyA9IGF4aXM7XHJcbiAgICAgIHN0YXRlLnBvaW50ZXJJZCA9IHBvaW50ZXJJZDtcclxuICAgICAgc3RhdGUucG9pbnRlclR5cGUgPSBwb2ludGVyVHlwZTtcclxuICAgICAgc2hvd0JhcnMoKTtcclxuICAgICAgY3R4LnRyYWNlPy4oJ3Njcm9sbC50aHVtYi1kcmFnLnN0YXJ0JywgeyBheGlzLCBwb2ludGVySWQsIHBvaW50ZXJUeXBlIH0pO1xyXG4gICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH0sXHJcbiAgICBtb3ZlVGh1bWJEcmFnKHBvaW50ZXJJZCwgdHJhY2tDb29yZGluYXRlLCBidXR0b25zKSB7XHJcbiAgICAgIGlmIChkcmFnPy5raW5kICE9PSAndGh1bWInIHx8IGRyYWcucG9pbnRlcklkICE9PSBwb2ludGVySWQpIHJldHVybiBmYWxzZTtcclxuICAgICAgaWYgKHN0YXRlLnBvaW50ZXJUeXBlID09PSAnbW91c2UnICYmIGJ1dHRvbnMgPT09IDApIHJldHVybiBjb250cm9sbGVyLmNhbmNlbFRodW1iRHJhZyhwb2ludGVySWQpO1xyXG4gICAgICBjb25zdCBuZXh0ID0gZHJhZy5zdGFydE9mZnNldCArIChmaW5pdGUodHJhY2tDb29yZGluYXRlKSAtIGRyYWcuc3RhcnRDb29yZGluYXRlKSAqIGRyYWcucmF0aW87XHJcbiAgICAgIHJldHVybiBzZXRPZmZzZXQoZHJhZy5heGlzLCBuZXh0LCAnY29udGludW91cycpO1xyXG4gICAgfSxcclxuICAgIGVuZFRodW1iRHJhZyhwb2ludGVySWQpIHtcclxuICAgICAgaWYgKGRyYWc/LmtpbmQgIT09ICd0aHVtYicgfHwgZHJhZy5wb2ludGVySWQgIT09IHBvaW50ZXJJZCkgcmV0dXJuIGZhbHNlO1xyXG4gICAgICBjb25zdCBheGlzID0gZHJhZy5heGlzO1xyXG4gICAgICBkcmFnID0gbnVsbDtcclxuICAgICAgc3RhdGUuZHJhZ2dpbmcgPSBudWxsO1xyXG4gICAgICBzdGF0ZS5wb2ludGVySWQgPSBudWxsO1xyXG4gICAgICBzdGF0ZS5wb2ludGVyVHlwZSA9IG51bGw7XHJcbiAgICAgIHNjaGVkdWxlSGlkZSgpO1xyXG4gICAgICBjdHgudHJhY2U/Lignc2Nyb2xsLnRodW1iLWRyYWcuZW5kJywgeyBheGlzLCBwb2ludGVySWQgfSk7XHJcbiAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfSxcclxuICAgIGJlZ2luQ29udGVudERyYWcocG9pbnRlcklkLCBwb2ludFgsIHBvaW50WSwgdGltZXN0YW1wID0gc2NoZWR1bGVyLm5vdygpLCBwb2ludGVyVHlwZSA9ICd0b3VjaCcpIHtcclxuICAgICAgaWYgKGRyYWcpIHJldHVybiBmYWxzZTtcclxuICAgICAgc3RvcE1vbWVudHVtKHRydWUpO1xyXG4gICAgICBjb25zdCB4ID0gZmluaXRlKHBvaW50WCk7XHJcbiAgICAgIGNvbnN0IHkgPSBmaW5pdGUocG9pbnRZKTtcclxuICAgICAgZHJhZyA9IHtcclxuICAgICAgICBraW5kOiAnY29udGVudCcsXHJcbiAgICAgICAgcG9pbnRlcklkLFxyXG4gICAgICAgIHBvaW50ZXJUeXBlLFxyXG4gICAgICAgIHN0YXJ0WDogeCxcclxuICAgICAgICBzdGFydFk6IHksXHJcbiAgICAgICAgc3RhcnREaXNwbGF5WDogc3RhdGUuZGlzcGxheU9mZnNldFgsXHJcbiAgICAgICAgc3RhcnREaXNwbGF5WTogc3RhdGUuZGlzcGxheU9mZnNldFksXHJcbiAgICAgICAgbGFzdFg6IHgsXHJcbiAgICAgICAgbGFzdFk6IHksXHJcbiAgICAgICAgbGFzdFRpbWVzdGFtcDogZmluaXRlKHRpbWVzdGFtcCksXHJcbiAgICAgICAgdmVsb2NpdHlYOiAwLFxyXG4gICAgICAgIHZlbG9jaXR5WTogMCxcclxuICAgICAgfTtcclxuICAgICAgc3RhdGUuZHJhZ2dpbmcgPSBkaXJlY3Rpb247XHJcbiAgICAgIHN0YXRlLnBvaW50ZXJJZCA9IHBvaW50ZXJJZDtcclxuICAgICAgc3RhdGUucG9pbnRlclR5cGUgPSBwb2ludGVyVHlwZTtcclxuICAgICAgc2hvd0JhcnMoKTtcclxuICAgICAgY3R4LnRyYWNlPy4oJ3Njcm9sbC5jb250ZW50LWRyYWcuc3RhcnQnLCB7IHBvaW50ZXJJZCwgcG9pbnRlclR5cGUgfSk7XHJcbiAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfSxcclxuICAgIG1vdmVDb250ZW50RHJhZyhwb2ludGVySWQsIHBvaW50WCwgcG9pbnRZLCB0aW1lc3RhbXAgPSBzY2hlZHVsZXIubm93KCksIGJ1dHRvbnMpIHtcclxuICAgICAgaWYgKGRyYWc/LmtpbmQgIT09ICdjb250ZW50JyB8fCBkcmFnLnBvaW50ZXJJZCAhPT0gcG9pbnRlcklkKSByZXR1cm4gZmFsc2U7XHJcbiAgICAgIGlmIChkcmFnLnBvaW50ZXJUeXBlID09PSAnbW91c2UnICYmIGJ1dHRvbnMgPT09IDApIHJldHVybiBjb250cm9sbGVyLmNhbmNlbENvbnRlbnREcmFnKHBvaW50ZXJJZCk7XHJcbiAgICAgIGNvbnN0IHggPSBmaW5pdGUocG9pbnRYKTtcclxuICAgICAgY29uc3QgeSA9IGZpbml0ZShwb2ludFkpO1xyXG4gICAgICBjb25zdCB0aW1lID0gZmluaXRlKHRpbWVzdGFtcCk7XHJcbiAgICAgIGNvbnN0IGRlbHRhTXMgPSBNYXRoLm1heCgxLCB0aW1lIC0gZHJhZy5sYXN0VGltZXN0YW1wKTtcclxuICAgICAgY29uc3QgcHJldmlvdXNEaXNwbGF5WCA9IHN0YXRlLmRpc3BsYXlPZmZzZXRYO1xyXG4gICAgICBjb25zdCBwcmV2aW91c0Rpc3BsYXlZID0gc3RhdGUuZGlzcGxheU9mZnNldFk7XHJcbiAgICAgIGlmIChheGlzRW5hYmxlZChkaXJlY3Rpb24sICd4JykpIHtcclxuICAgICAgICBjb25zdCByYXdYID0gZHJhZy5zdGFydERpc3BsYXlYIC0gKHggLSBkcmFnLnN0YXJ0WCk7XHJcbiAgICAgICAgc2V0RGlzcGxheU9mZnNldCgneCcsIHJlc2lzdE92ZXJzY3JvbGwocmF3WCwgc2Nyb2xsUmFuZ2UobWV0cmljcywgJ3gnKSwgbWV0cmljcy52aWV3cG9ydFdpZHRoLCBvdmVyc2Nyb2xsUmF0aW8pKTtcclxuICAgICAgfVxyXG4gICAgICBpZiAoYXhpc0VuYWJsZWQoZGlyZWN0aW9uLCAneScpKSB7XHJcbiAgICAgICAgY29uc3QgcmF3WSA9IGRyYWcuc3RhcnREaXNwbGF5WSAtICh5IC0gZHJhZy5zdGFydFkpO1xyXG4gICAgICAgIHNldERpc3BsYXlPZmZzZXQoJ3knLCByZXNpc3RPdmVyc2Nyb2xsKHJhd1ksIHNjcm9sbFJhbmdlKG1ldHJpY3MsICd5JyksIG1ldHJpY3Mudmlld3BvcnRIZWlnaHQsIG92ZXJzY3JvbGxSYXRpbykpO1xyXG4gICAgICB9XHJcbiAgICAgIGNvbnN0IGluc3RhbnRWZWxvY2l0eVggPSAoc3RhdGUuZGlzcGxheU9mZnNldFggLSBwcmV2aW91c0Rpc3BsYXlYKSAvIGRlbHRhTXM7XHJcbiAgICAgIGNvbnN0IGluc3RhbnRWZWxvY2l0eVkgPSAoc3RhdGUuZGlzcGxheU9mZnNldFkgLSBwcmV2aW91c0Rpc3BsYXlZKSAvIGRlbHRhTXM7XHJcbiAgICAgIGRyYWcudmVsb2NpdHlYID0gZHJhZy52ZWxvY2l0eVggKiAwLjcyICsgaW5zdGFudFZlbG9jaXR5WCAqIDAuMjg7XHJcbiAgICAgIGRyYWcudmVsb2NpdHlZID0gZHJhZy52ZWxvY2l0eVkgKiAwLjcyICsgaW5zdGFudFZlbG9jaXR5WSAqIDAuMjg7XHJcbiAgICAgIGRyYWcubGFzdFggPSB4O1xyXG4gICAgICBkcmFnLmxhc3RZID0geTtcclxuICAgICAgZHJhZy5sYXN0VGltZXN0YW1wID0gdGltZTtcclxuICAgICAgaWYgKGRpcnR5QXhlcy5zaXplID4gMCkgc2NoZWR1bGVQdWJsaXNoKCk7XHJcbiAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfSxcclxuICAgIGVuZENvbnRlbnREcmFnKHBvaW50ZXJJZCwgdGltZXN0YW1wID0gc2NoZWR1bGVyLm5vdygpKSB7XHJcbiAgICAgIGlmIChkcmFnPy5raW5kICE9PSAnY29udGVudCcgfHwgZHJhZy5wb2ludGVySWQgIT09IHBvaW50ZXJJZCkgcmV0dXJuIGZhbHNlO1xyXG4gICAgICBjb25zdCByZWxlYXNlRGVsYXkgPSBNYXRoLm1heCgwLCBmaW5pdGUodGltZXN0YW1wKSAtIGRyYWcubGFzdFRpbWVzdGFtcCk7XHJcbiAgICAgIGNvbnN0IHN0YWxlRmFjdG9yID0gcmVsZWFzZURlbGF5ID4gODAgPyAwLjIgOiAxO1xyXG4gICAgICBjb25zdCB2ZWxvY2l0eVggPSBkcmFnLnZlbG9jaXR5WCAqIHN0YWxlRmFjdG9yO1xyXG4gICAgICBjb25zdCB2ZWxvY2l0eVkgPSBkcmFnLnZlbG9jaXR5WSAqIHN0YWxlRmFjdG9yO1xyXG4gICAgICBjb25zdCBwb2ludGVyVHlwZSA9IGRyYWcucG9pbnRlclR5cGU7XHJcbiAgICAgIGRyYWcgPSBudWxsO1xyXG4gICAgICBzdGF0ZS5kcmFnZ2luZyA9IG51bGw7XHJcbiAgICAgIHN0YXRlLnBvaW50ZXJJZCA9IG51bGw7XHJcbiAgICAgIHN0YXRlLnBvaW50ZXJUeXBlID0gbnVsbDtcclxuICAgICAgY3R4LnRyYWNlPy4oJ3Njcm9sbC5jb250ZW50LWRyYWcuZW5kJywgeyBwb2ludGVySWQsIHBvaW50ZXJUeXBlLCB2ZWxvY2l0eVgsIHZlbG9jaXR5WSB9KTtcclxuICAgICAgc3RhcnRNb21lbnR1bSh2ZWxvY2l0eVgsIHZlbG9jaXR5WSk7XHJcbiAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfSxcclxuICAgIGNhbmNlbFRodW1iRHJhZyhwb2ludGVySWQpIHtcclxuICAgICAgaWYgKGRyYWc/LmtpbmQgIT09ICd0aHVtYicgfHwgKHBvaW50ZXJJZCAhPT0gdW5kZWZpbmVkICYmIGRyYWcucG9pbnRlcklkICE9PSBwb2ludGVySWQpKSByZXR1cm4gZmFsc2U7XHJcbiAgICAgIGNvbnN0IGF4aXMgPSBkcmFnLmF4aXM7XHJcbiAgICAgIGNvbnN0IGNhbmNlbGxlZFBvaW50ZXJJZCA9IGRyYWcucG9pbnRlcklkO1xyXG4gICAgICBkcmFnID0gbnVsbDtcclxuICAgICAgc3RhdGUuZHJhZ2dpbmcgPSBudWxsO1xyXG4gICAgICBzdGF0ZS5wb2ludGVySWQgPSBudWxsO1xyXG4gICAgICBzdGF0ZS5wb2ludGVyVHlwZSA9IG51bGw7XHJcbiAgICAgIHNjaGVkdWxlZCA9IGZhbHNlO1xyXG4gICAgICBwdWJsaXNoKCdjYW5jZWwnKTtcclxuICAgICAgc2NoZWR1bGVIaWRlKCk7XHJcbiAgICAgIGN0eC50cmFjZT8uKCdzY3JvbGwudGh1bWItZHJhZy5jYW5jZWwnLCB7IGF4aXMsIHBvaW50ZXJJZDogY2FuY2VsbGVkUG9pbnRlcklkIH0pO1xyXG4gICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH0sXHJcbiAgICBjYW5jZWxDb250ZW50RHJhZyhwb2ludGVySWQpIHtcclxuICAgICAgaWYgKGRyYWc/LmtpbmQgIT09ICdjb250ZW50JyB8fCAocG9pbnRlcklkICE9PSB1bmRlZmluZWQgJiYgZHJhZy5wb2ludGVySWQgIT09IHBvaW50ZXJJZCkpIHJldHVybiBmYWxzZTtcclxuICAgICAgY29uc3QgY2FuY2VsbGVkUG9pbnRlcklkID0gZHJhZy5wb2ludGVySWQ7XHJcbiAgICAgIGRyYWcgPSBudWxsO1xyXG4gICAgICBzdGF0ZS5kcmFnZ2luZyA9IG51bGw7XHJcbiAgICAgIHN0YXRlLnBvaW50ZXJJZCA9IG51bGw7XHJcbiAgICAgIHN0YXRlLnBvaW50ZXJUeXBlID0gbnVsbDtcclxuICAgICAgc2NoZWR1bGVkID0gZmFsc2U7XHJcbiAgICAgIHNldERpc3BsYXlPZmZzZXQoJ3gnLCBzdGF0ZS5vZmZzZXRYKTtcclxuICAgICAgc2V0RGlzcGxheU9mZnNldCgneScsIHN0YXRlLm9mZnNldFkpO1xyXG4gICAgICBwdWJsaXNoKCdjYW5jZWwnKTtcclxuICAgICAgc2NoZWR1bGVIaWRlKCk7XHJcbiAgICAgIGN0eC50cmFjZT8uKCdzY3JvbGwuY29udGVudC1kcmFnLmNhbmNlbCcsIHsgcG9pbnRlcklkOiBjYW5jZWxsZWRQb2ludGVySWQgfSk7XHJcbiAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfSxcclxuICAgIGtleShrZXkpIHtcclxuICAgICAgc3RvcE1vbWVudHVtKHRydWUpO1xyXG4gICAgICBjb25zdCBsaW5lID0gTWF0aC5tYXgoMSwgb3B0aW9ucy5saW5lU3RlcCA/PyA0MCk7XHJcbiAgICAgIGNvbnN0IHBhZ2VYID0gTWF0aC5tYXgoMSwgbWV0cmljcy52aWV3cG9ydFdpZHRoICogKG9wdGlvbnMucGFnZVN0ZXAgPz8gMC45KSk7XHJcbiAgICAgIGNvbnN0IHBhZ2VZID0gTWF0aC5tYXgoMSwgbWV0cmljcy52aWV3cG9ydEhlaWdodCAqIChvcHRpb25zLnBhZ2VTdGVwID8/IDAuOSkpO1xyXG4gICAgICBjb25zdCBhY3Rpb25zOiBSZWNvcmQ8c3RyaW5nLCBbU2Nyb2xsQXhpcywgbnVtYmVyXT4gPSB7XHJcbiAgICAgICAgQXJyb3dMZWZ0OiBbJ3gnLCBzdGF0ZS5vZmZzZXRYIC0gbGluZV0sXHJcbiAgICAgICAgQXJyb3dSaWdodDogWyd4Jywgc3RhdGUub2Zmc2V0WCArIGxpbmVdLFxyXG4gICAgICAgIEFycm93VXA6IFsneScsIHN0YXRlLm9mZnNldFkgLSBsaW5lXSxcclxuICAgICAgICBBcnJvd0Rvd246IFsneScsIHN0YXRlLm9mZnNldFkgKyBsaW5lXSxcclxuICAgICAgICBQYWdlVXA6IFsneScsIHN0YXRlLm9mZnNldFkgLSBwYWdlWV0sXHJcbiAgICAgICAgUGFnZURvd246IFsneScsIHN0YXRlLm9mZnNldFkgKyBwYWdlWV0sXHJcbiAgICAgICAgSG9tZTogW2RpcmVjdGlvbiA9PT0gJ3gnID8gJ3gnIDogJ3knLCAwXSxcclxuICAgICAgICBFbmQ6IFtkaXJlY3Rpb24gPT09ICd4JyA/ICd4JyA6ICd5Jywgc2Nyb2xsUmFuZ2UobWV0cmljcywgZGlyZWN0aW9uID09PSAneCcgPyAneCcgOiAneScpXSxcclxuICAgICAgfTtcclxuICAgICAgaWYgKGtleSA9PT0gJ1BhZ2VMZWZ0JykgYWN0aW9uc1trZXldID0gWyd4Jywgc3RhdGUub2Zmc2V0WCAtIHBhZ2VYXTtcclxuICAgICAgaWYgKGtleSA9PT0gJ1BhZ2VSaWdodCcpIGFjdGlvbnNba2V5XSA9IFsneCcsIHN0YXRlLm9mZnNldFggKyBwYWdlWF07XHJcbiAgICAgIGNvbnN0IGFjdGlvbiA9IGFjdGlvbnNba2V5XTtcclxuICAgICAgaWYgKCFhY3Rpb24gfHwgIWF4aXNFbmFibGVkKGRpcmVjdGlvbiwgYWN0aW9uWzBdKSkgcmV0dXJuIGZhbHNlO1xyXG4gICAgICBzaG93QmFycygpO1xyXG4gICAgICBjb25zdCBjaGFuZ2VkID0gc2V0T2Zmc2V0KGFjdGlvblswXSwgYWN0aW9uWzFdLCAnZGlzY3JldGUnKTtcclxuICAgICAgaWYgKGNoYW5nZWQpIGN0eC50cmFjZT8uKCdzY3JvbGwua2V5Ym9hcmQnLCB7IGtleSwgYXhpczogYWN0aW9uWzBdIH0pO1xyXG4gICAgICBzY2hlZHVsZUhpZGUoKTtcclxuICAgICAgcmV0dXJuIGNoYW5nZWQ7XHJcbiAgICB9LFxyXG4gICAgYWNjZXNzaWJpbGl0eShheGlzLCBsYWJlbCkge1xyXG4gICAgICBpZiAoIWF4aXNFbmFibGVkKGRpcmVjdGlvbiwgYXhpcykpIHJldHVybiBudWxsO1xyXG4gICAgICBjb25zdCB2YWx1ZU1heCA9IHNjcm9sbFJhbmdlKG1ldHJpY3MsIGF4aXMpO1xyXG4gICAgICBjb25zdCB2YWx1ZU5vdyA9IGF4aXMgPT09ICd4JyA/IHN0YXRlLm9mZnNldFggOiBzdGF0ZS5vZmZzZXRZO1xyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIHJvbGU6ICdzY3JvbGxiYXInLFxyXG4gICAgICAgIHRhYkluZGV4OiAwLFxyXG4gICAgICAgIG9yaWVudGF0aW9uOiBheGlzID09PSAneCcgPyAnaG9yaXpvbnRhbCcgOiAndmVydGljYWwnLFxyXG4gICAgICAgIHZhbHVlTWluOiAwLFxyXG4gICAgICAgIHZhbHVlTWF4LFxyXG4gICAgICAgIHZhbHVlTm93LFxyXG4gICAgICAgIHZhbHVlVGV4dDogdmFsdWVNYXggPiAwID8gYCR7TWF0aC5yb3VuZCh2YWx1ZU5vdyAvIHZhbHVlTWF4ICogMTAwKX0lYCA6ICcwJScsXHJcbiAgICAgICAgLi4uKGxhYmVsID8geyBsYWJlbCB9IDoge30pLFxyXG4gICAgICB9O1xyXG4gICAgfSxcclxuICAgIGZsdXNoKCkge1xyXG4gICAgICBpZiAoc2NoZWR1bGVkKSBwdWJsaXNoKCdjb250aW51b3VzJyk7XHJcbiAgICB9LFxyXG4gICAgZGlzcG9zZSgpIHtcclxuICAgICAgZGlzcG9zZWQgPSB0cnVlO1xyXG4gICAgICBzY2hlZHVsZWQgPSBmYWxzZTtcclxuICAgICAgZGlydHlBeGVzLmNsZWFyKCk7XHJcbiAgICAgIGRyYWcgPSBudWxsO1xyXG4gICAgICBjbGVhckhpZGUoKTtcclxuICAgICAgc3RvcE1vbWVudHVtKGZhbHNlKTtcclxuICAgICAgc3RhdGUuZHJhZ2dpbmcgPSBudWxsO1xyXG4gICAgICBzdGF0ZS5wb2ludGVySWQgPSBudWxsO1xyXG4gICAgICBzdGF0ZS5wb2ludGVyVHlwZSA9IG51bGw7XHJcbiAgICB9LFxyXG4gIH07XHJcbiAgY3R4LmRpc3Bvc2UoKCkgPT4gY29udHJvbGxlci5kaXNwb3NlKCkpO1xyXG4gIHJldHVybiBjb250cm9sbGVyO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gc2Nyb2xsUmFuZ2UobWV0cmljczogU2Nyb2xsQ29udGFpbmVyTWV0cmljcywgYXhpczogU2Nyb2xsQXhpcyk6IG51bWJlciB7XHJcbiAgcmV0dXJuIE1hdGgubWF4KDAsIGF4aXMgPT09ICd4J1xyXG4gICAgPyBmaW5pdGUobWV0cmljcy5jb250ZW50V2lkdGgpIC0gZmluaXRlKG1ldHJpY3Mudmlld3BvcnRXaWR0aClcclxuICAgIDogZmluaXRlKG1ldHJpY3MuY29udGVudEhlaWdodCkgLSBmaW5pdGUobWV0cmljcy52aWV3cG9ydEhlaWdodCkpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gdGh1bWJSYXRpbyhtZXRyaWNzOiBTY3JvbGxDb250YWluZXJNZXRyaWNzLCBheGlzOiBTY3JvbGxBeGlzKTogbnVtYmVyIHtcclxuICBjb25zdCByYW5nZSA9IHNjcm9sbFJhbmdlKG1ldHJpY3MsIGF4aXMpO1xyXG4gIGNvbnN0IHRyYXZlbCA9IE1hdGgubWF4KDAsIHRyYWNrU2l6ZShtZXRyaWNzLCBheGlzKSAtIHRodW1iU2l6ZShtZXRyaWNzLCBheGlzKSk7XHJcbiAgcmV0dXJuIHRyYXZlbCA+IDAgPyByYW5nZSAvIHRyYXZlbCA6IDA7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHRyYWNrU2l6ZShtZXRyaWNzOiBTY3JvbGxDb250YWluZXJNZXRyaWNzLCBheGlzOiBTY3JvbGxBeGlzKTogbnVtYmVyIHtcclxuICByZXR1cm4gTWF0aC5tYXgoMCwgZmluaXRlKGF4aXMgPT09ICd4J1xyXG4gICAgPyBtZXRyaWNzLmhvcml6b250YWxUcmFja0xlbmd0aCA/PyBtZXRyaWNzLnZpZXdwb3J0V2lkdGhcclxuICAgIDogbWV0cmljcy52ZXJ0aWNhbFRyYWNrTGVuZ3RoID8/IG1ldHJpY3Mudmlld3BvcnRIZWlnaHQpKTtcclxufVxyXG5cclxuZnVuY3Rpb24gdGh1bWJTaXplKG1ldHJpY3M6IFNjcm9sbENvbnRhaW5lck1ldHJpY3MsIGF4aXM6IFNjcm9sbEF4aXMpOiBudW1iZXIge1xyXG4gIGNvbnN0IHZpZXdwb3J0ID0gYXhpcyA9PT0gJ3gnID8gbWV0cmljcy52aWV3cG9ydFdpZHRoIDogbWV0cmljcy52aWV3cG9ydEhlaWdodDtcclxuICBjb25zdCBjb250ZW50ID0gYXhpcyA9PT0gJ3gnID8gbWV0cmljcy5jb250ZW50V2lkdGggOiBtZXRyaWNzLmNvbnRlbnRIZWlnaHQ7XHJcbiAgY29uc3QgZXhwbGljaXQgPSBheGlzID09PSAneCcgPyBtZXRyaWNzLmhvcml6b250YWxUaHVtYkxlbmd0aCA6IG1ldHJpY3MudmVydGljYWxUaHVtYkxlbmd0aDtcclxuICBpZiAoZXhwbGljaXQgIT09IHVuZGVmaW5lZCkgcmV0dXJuIGNsYW1wKGZpbml0ZShleHBsaWNpdCksIDAsIHRyYWNrU2l6ZShtZXRyaWNzLCBheGlzKSk7XHJcbiAgcmV0dXJuIGNvbnRlbnQgPiAwID8gY2xhbXAodHJhY2tTaXplKG1ldHJpY3MsIGF4aXMpICogdmlld3BvcnQgLyBjb250ZW50LCAwLCB0cmFja1NpemUobWV0cmljcywgYXhpcykpIDogMDtcclxufVxyXG5cclxuZnVuY3Rpb24gYXhpc0VuYWJsZWQoZGlyZWN0aW9uOiBTY3JvbGxEaXJlY3Rpb24sIGF4aXM6IFNjcm9sbEF4aXMpOiBib29sZWFuIHtcclxuICByZXR1cm4gZGlyZWN0aW9uID09PSAnYm90aCcgfHwgZGlyZWN0aW9uID09PSBheGlzO1xyXG59XHJcblxyXG5mdW5jdGlvbiBub3JtYWxpemVNZXRyaWNzKG1ldHJpY3M6IFNjcm9sbENvbnRhaW5lck1ldHJpY3MpOiBTY3JvbGxDb250YWluZXJNZXRyaWNzIHtcclxuICByZXR1cm4ge1xyXG4gICAgLi4ubWV0cmljcyxcclxuICAgIHZpZXdwb3J0V2lkdGg6IE1hdGgubWF4KDAsIGZpbml0ZShtZXRyaWNzLnZpZXdwb3J0V2lkdGgpKSxcclxuICAgIHZpZXdwb3J0SGVpZ2h0OiBNYXRoLm1heCgwLCBmaW5pdGUobWV0cmljcy52aWV3cG9ydEhlaWdodCkpLFxyXG4gICAgY29udGVudFdpZHRoOiBNYXRoLm1heCgwLCBmaW5pdGUobWV0cmljcy5jb250ZW50V2lkdGgpKSxcclxuICAgIGNvbnRlbnRIZWlnaHQ6IE1hdGgubWF4KDAsIGZpbml0ZShtZXRyaWNzLmNvbnRlbnRIZWlnaHQpKSxcclxuICB9O1xyXG59XHJcblxyXG5mdW5jdGlvbiBmaW5pdGUodmFsdWU6IG51bWJlcik6IG51bWJlciB7XHJcbiAgcmV0dXJuIE51bWJlci5pc0Zpbml0ZSh2YWx1ZSkgPyB2YWx1ZSA6IDA7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHBvc2l0aXZlKHZhbHVlOiBudW1iZXIgfCB1bmRlZmluZWQsIGZhbGxiYWNrOiBudW1iZXIpOiBudW1iZXIge1xyXG4gIGNvbnN0IGNhbmRpZGF0ZSA9IGZpbml0ZSh2YWx1ZSA/PyBmYWxsYmFjayk7XHJcbiAgcmV0dXJuIGNhbmRpZGF0ZSA+IDAgPyBjYW5kaWRhdGUgOiBmYWxsYmFjaztcclxufVxyXG5cclxuZnVuY3Rpb24gcmVzaXN0T3ZlcnNjcm9sbCh2YWx1ZTogbnVtYmVyLCByYW5nZTogbnVtYmVyLCB2aWV3cG9ydDogbnVtYmVyLCByYXRpbzogbnVtYmVyKTogbnVtYmVyIHtcclxuICBpZiAodmFsdWUgPCAwKSByZXR1cm4gTWF0aC5tYXgoLU1hdGgubWF4KDEsIHZpZXdwb3J0ICogcmF0aW8pLCB2YWx1ZSAqIHJhdGlvKTtcclxuICBpZiAodmFsdWUgPiByYW5nZSkgcmV0dXJuIE1hdGgubWluKHJhbmdlICsgTWF0aC5tYXgoMSwgdmlld3BvcnQgKiByYXRpbyksIHJhbmdlICsgKHZhbHVlIC0gcmFuZ2UpICogcmF0aW8pO1xyXG4gIHJldHVybiB2YWx1ZTtcclxufVxyXG5cclxuZnVuY3Rpb24gcmVzb2x2ZVNjaGVkdWxlcihvdmVycmlkZXM6IFBhcnRpYWw8U2Nyb2xsQ29udGFpbmVyU2NoZWR1bGVyPiB8IHVuZGVmaW5lZCk6IFNjcm9sbENvbnRhaW5lclNjaGVkdWxlciB7XHJcbiAgY29uc3QgaGFzQW5pbWF0aW9uRnJhbWUgPSB0eXBlb2YgZ2xvYmFsVGhpcy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgPT09ICdmdW5jdGlvbic7XHJcbiAgcmV0dXJuIHtcclxuICAgIHJlcXVlc3RGcmFtZTogb3ZlcnJpZGVzPy5yZXF1ZXN0RnJhbWUgPz8gKGNhbGxiYWNrID0+IGhhc0FuaW1hdGlvbkZyYW1lXHJcbiAgICAgID8gZ2xvYmFsVGhpcy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUoY2FsbGJhY2spXHJcbiAgICAgIDogZ2xvYmFsVGhpcy5zZXRUaW1lb3V0KCgpID0+IGNhbGxiYWNrKERhdGUubm93KCkpLCAxNikpLFxyXG4gICAgY2FuY2VsRnJhbWU6IG92ZXJyaWRlcz8uY2FuY2VsRnJhbWUgPz8gKGhhbmRsZSA9PiB7XHJcbiAgICAgIGlmIChoYXNBbmltYXRpb25GcmFtZSkgZ2xvYmFsVGhpcy5jYW5jZWxBbmltYXRpb25GcmFtZShoYW5kbGUgYXMgbnVtYmVyKTtcclxuICAgICAgZWxzZSBnbG9iYWxUaGlzLmNsZWFyVGltZW91dChoYW5kbGUgYXMgUmV0dXJuVHlwZTx0eXBlb2Ygc2V0VGltZW91dD4pO1xyXG4gICAgfSksXHJcbiAgICBzZXREZWxheTogb3ZlcnJpZGVzPy5zZXREZWxheSA/PyAoKGNhbGxiYWNrLCBkZWxheU1zKSA9PiBnbG9iYWxUaGlzLnNldFRpbWVvdXQoY2FsbGJhY2ssIGRlbGF5TXMpKSxcclxuICAgIGNsZWFyRGVsYXk6IG92ZXJyaWRlcz8uY2xlYXJEZWxheSA/PyAoaGFuZGxlID0+IGdsb2JhbFRoaXMuY2xlYXJUaW1lb3V0KGhhbmRsZSBhcyBSZXR1cm5UeXBlPHR5cGVvZiBzZXRUaW1lb3V0PikpLFxyXG4gICAgbm93OiBvdmVycmlkZXM/Lm5vdyA/PyAoKCkgPT4gdHlwZW9mIGdsb2JhbFRoaXMucGVyZm9ybWFuY2U/Lm5vdyA9PT0gJ2Z1bmN0aW9uJyA/IGdsb2JhbFRoaXMucGVyZm9ybWFuY2Uubm93KCkgOiBEYXRlLm5vdygpKSxcclxuICB9O1xyXG59XHJcblxyXG5mdW5jdGlvbiBjbGFtcCh2YWx1ZTogbnVtYmVyLCBtaW46IG51bWJlciwgbWF4OiBudW1iZXIpOiBudW1iZXIge1xyXG4gIHJldHVybiBNYXRoLm1heChtaW4sIE1hdGgubWluKG1heCwgdmFsdWUpKTtcclxufVxyXG4iXX0=