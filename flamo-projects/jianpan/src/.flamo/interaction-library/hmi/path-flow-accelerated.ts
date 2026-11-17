import {
  MotionPath,
  MotionTrack,
  motionTransform,
  motionPool,
  motionPhaseSpeed,
  samplePathMotion,
  parseMotionProjection,
  type MotionProjection,
  type MotionPose,
} from '@flamo/hmi';
import legacyBehavior, { type PipeFlowBehaviorContext, type PipeFlowRoleHandle } from './pipe-flow';
export const ACCELERATED_PATH_FLOW_IDENTITY = 'hmi.pipe-flow@2.1.0';
interface MotionHandle extends PipeFlowRoleHandle {
  setTransform(x: number, y: number, scaleX: number, scaleY: number, rotation: number): void;
  setOpacity(value: number): void;
  setFillColor(color: { r: number; g: number; b: number; a: number }): void;
}
type State = {
  enabled: boolean;
  speed: number;
  acceleration: number;
  direction: 'forward' | 'reverse';
  offset: number;
};
const isRecord = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v);
/** Domain strategy over public scoped handles; no engine or command queue access. */
export default {
  setup(props: Readonly<Record<string, unknown>>, ctx: PipeFlowBehaviorContext): void {
    const binding = ctx.behavior(ACCELERATED_PATH_FLOW_IDENTITY);
    if (!binding) throw new Error(`Missing ${ACCELERATED_PATH_FLOW_IDENTITY}`);
    const initial = binding.binding.options?.initialState as Record<string, unknown> | undefined;
    const projection = initial?.motionProjection as MotionProjection | undefined;
    if (!projection) {
      legacyBehavior.setup(props, {
        ...ctx,
        behavior: (identity) => (identity === 'hmi.pipe-flow@1.0.0' ? binding : ctx.behavior(identity)),
      });
      return;
    }
    const validated = parseMotionProjection(projection),
      motion = validated.motion,
      path = new MotionPath(validated.points),
      track = new MotionTrack(motion);
    const frame = binding.role('motion');
    if (!frame) throw new Error('Missing motion role');
    const slots = projection.slots.map((slot, i) => {
      const handle = binding.role(`motion:${i}`) as MotionHandle | null;
      if (!handle) throw new Error(`Missing motion:${i}`);
      return { slot, handle, key: '', color: '', visible: undefined as boolean | undefined };
    });
    let state: State = { enabled: false, speed: 24, acceleration: motion.acceleration ?? 0, direction: 'forward', offset: 0 },
      request: number | null = null,
      previous = 0,
      disposed = false,
      paused = false,
      lastTrace = -Infinity;
    const snapshot = () => ({ ...state, running: request !== null });
    function validate(value: unknown): State {
      if (!isRecord(value)) throw new TypeError('Flow state must be an object');
      const next = { ...state };
      for (const [key, v] of Object.entries(value)) {
        if (!['enabled', 'speed', 'acceleration', 'direction', 'offset'].includes(key))
          throw new TypeError(`循环组不支持运行时属性 ${key}`);
        if (key === 'enabled') {
          if (typeof v !== 'boolean') throw new TypeError('enabled must be boolean');
          next.enabled = v;
        }
        if (key === 'direction') {
          if (v !== 'forward' && v !== 'reverse') throw new TypeError('direction must be forward/reverse');
          next.direction = v;
        }
        if (key === 'speed' || key === 'offset' || key === 'acceleration') {
          if (typeof v !== 'number' || !Number.isFinite(v) || (key === 'speed' && (v < 0 || v > 100000)) || (key === 'acceleration' && (v < 0 || v > 10000)))
            throw new TypeError(`${key} is invalid`);
          next[key] = v;
        }
      }
      if (next.acceleration !== state.acceleration) {
        const required = motionPool({ ...motion, acceleration: next.acceleration }, path.length);
        // Every bucket grows by the same group count. Refuse changes that need
        // a larger authored pool instead of silently losing objects.
        if (required.length > slots.length)
          throw new RangeError('加速度需要更多素材节点，请在插件中修改并重新生成');
      }
      return next;
    }
    function render(): void {
      frame!.setVisible(state.enabled);
      const queues = new Map<string, MotionPose[]>();
      if (state.enabled)
        for (const p of samplePathMotion(track, path.length, state.offset, state.speed, state.direction === 'reverse', state.acceleration)) {
          const pose = path.pose(p, state.direction === 'reverse'),
            key = `${pose.itemId}/${pose.materialId}`,
            q = queues.get(key) ?? [];
          q.push(pose);
          queues.set(key, q);
        }
      for (const entry of slots) {
        const key = `${entry.slot.itemId}/${entry.slot.materialId}`,
          pose = queues.get(key)?.shift();
        if (entry.visible !== !!pose) {
          entry.handle.setVisible(!!pose);
          entry.visible = !!pose;
        }
        if (!pose) continue;
        const material = motion.materials.find((m) => m.id === pose.materialId)!,
          t = motionTransform(pose, material.aspect);
        entry.handle.setTransform(t.x, t.y, t.scaleX, t.scaleY, pose.rotation);
        if (entry.key !== pose.key) {
          entry.handle.setOpacity(pose.opacity);
          entry.key = pose.key;
        }
        if (material.shape !== 'image' && entry.color !== pose.color) {
          entry.handle.setFillColor({
            r: parseInt(pose.color.slice(1, 3), 16) / 255,
            g: parseInt(pose.color.slice(3, 5), 16) / 255,
            b: parseInt(pose.color.slice(5, 7), 16) / 255,
            a: 1,
          });
          entry.color = pose.color;
        }
      }
    }
    function schedule(): void {
      if (!disposed && !paused && state.enabled && (state.speed > 0 || state.acceleration > 0) && request === null) {
        previous = performance.now();
        request = requestAnimationFrame(tick);
      }
    }
    function tick(now: number): void {
      request = null;
      if (disposed || paused || !state.enabled) return;
      const delta = Math.max(0, Math.min(250, now - previous)) / 1000;
      previous = now;
      state.offset += delta * motionPhaseSpeed(motion, state.speed, state.acceleration) * (state.direction === 'reverse' ? -1 : 1);
      render();
      if (now - lastTrace >= 250) {
        ctx.trace('pipe-flow.phase-sample', { offset: state.offset });
        lastTrace = now;
      }
      if (state.speed > 0 || state.acceleration > 0) request = requestAnimationFrame(tick);
    }
    function cancel(): void {
      if (request !== null) {
        cancelAnimationFrame(request);
        request = null;
      }
    }
    function publish(reason: string, requestId?: string): ReturnType<typeof snapshot> {
      const result = snapshot();
      ctx.trace('pipe-flow.state', { reason, state: result });
      if (typeof document !== 'undefined')
        document.dispatchEvent(
          new CustomEvent('flamo:hmi-pipe-flow:state', {
            detail: {
              requestId,
              instanceId: ctx.instance.id,
              nodeId: ctx.sourceNodeId,
              reason,
              state: result,
            },
          }),
        );
      return result;
    }
    function update(patch: unknown): ReturnType<typeof snapshot> {
      if (disposed) throw new Error('Path motion disposed');
      const next = validate(patch);
      // Probe against an isolated track before committing a requested seek.
      samplePathMotion(new MotionTrack(motion), path.length, next.offset, next.speed, next.direction === 'reverse', next.acceleration);
      state = next;
      cancel();
      render();
      schedule();
      return publish('business-update');
    }
    state = validate({
      enabled: initial?.enabled ?? false,
      speed: initial?.speed ?? 24,
      acceleration: motion.acceleration ?? 0,
      direction: initial?.direction ?? 'forward',
      offset: initial?.offset ?? 0,
    });
    const onCommand = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      if (!isRecord(detail)) return;
      const hasInstance = typeof detail.instanceId === 'string',
        hasNode = typeof detail.nodeId === 'string';
      if (
        (!hasInstance && !hasNode) ||
        (hasInstance && detail.instanceId !== ctx.instance.id) ||
        (hasNode && detail.nodeId !== ctx.sourceNodeId && detail.nodeId !== ctx.nodeId)
      )
        return;
      try {
        update(detail.patch);
        publish('host-event', typeof detail.requestId === 'string' ? detail.requestId : undefined);
      } catch (error) {
        document.dispatchEvent(
          new CustomEvent('flamo:hmi-pipe-flow:state', {
            detail: {
              requestId: detail.requestId,
              instanceId: ctx.instance.id,
              nodeId: ctx.sourceNodeId,
              error: String(error),
            },
          }),
        );
      }
    };
    ctx.expose({
      setFlowState: (...args) => update(args[0]),
      getFlowState: () => snapshot(),
      startFlow: () => {
        paused = false;
        schedule();
        return publish('start');
      },
      stopFlow: (...args) => {
        paused = true;
        cancel();
        if (args[0] === true || (isRecord(args[0]) && args[0].resetOffset === true)) {
          state.offset = 0;
          render();
        }
        return publish('stop');
      },
    });
    if (typeof document !== 'undefined') document.addEventListener('flamo:hmi-pipe-flow:set', onCommand);
    render();
    schedule();
    ctx.trace('pipe-flow.mounted', {
      behavior: ACCELERATED_PATH_FLOW_IDENTITY,
      rootNodeId: ctx.sourceNodeId,
      particles: slots.length,
    });
    publish('initial');
    ctx.dispose(() => {
      disposed = true;
      cancel();
      if (typeof document !== 'undefined') document.removeEventListener('flamo:hmi-pipe-flow:set', onCommand);
      ctx.trace('pipe-flow.disposed', { rootNodeId: ctx.sourceNodeId });
    });
  },
};
