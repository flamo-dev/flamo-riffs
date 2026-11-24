import {
  MotionPath, MotionTrack, MOTION_SHAPES, motionPool, motionPhaseSpeed, motionTransform,
  samplePathMotion, parseRuntimeMotionProjection, parsePipeScriptContract, resolvePipeFlowRange,
  slicePipePath, normalizePipeDashPattern, type MotionMaterial, type MotionPose, type ResolvedPipeFlowRange,
} from '@flamo/hmi';
import type { PipeFlowBehaviorContext, PipeFlowRoleHandle } from './pipe-flow';

export const APPEARANCE_PATH_FLOW_IDENTITY = 'hmi.pipe-flow@2.4.0';
interface Handle extends PipeFlowRoleHandle {
  setTransform(x: number, y: number, sx: number, sy: number, rotation: number): void;
  setOpacity(value: number): void;
  setFillColor(value: { r: number; g: number; b: number; a: number }): void;
}
export interface RangePathFlowContext extends PipeFlowBehaviorContext {
  scene: {
    create(kind: string, props: Record<string, unknown>): { readonly id: string };
    mount(node: { readonly id: string }, options: { parent: { readonly id: string } }): unknown;
    remove(node: { readonly id: string }): void;
    flush(): Promise<void>;
  };
  node(id: string): Handle | null;
  mounted: { resolve(id: string): { entity: PipeFlowRoleHandle } | null };
}
interface State {
  enabled: boolean; speed: number; acceleration: number; direction: 'forward' | 'reverse';
  offset: number; color: string; width: number; dashPattern: number[];
}
const record = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const copy = <T>(v: T): T => JSON.parse(JSON.stringify(v));
const color = (v: string) => ({ r: parseInt(v.slice(1, 3), 16) / 255, g: parseInt(v.slice(3, 5), 16) / 255, b: parseInt(v.slice(5, 7), 16) / 255, a: 1 });

/** Versioned domain behavior. The imported design and published older behaviors stay untouched. */
export default {
  setup(_props: Readonly<Record<string, unknown>>, ctx: RangePathFlowContext): void {
    const binding = ctx.behavior(APPEARANCE_PATH_FLOW_IDENTITY);
    if (!binding) throw new Error(`Missing ${APPEARANCE_PATH_FLOW_IDENTITY}`);
    const initial = binding.binding.options?.initialState as Record<string, unknown> | undefined;
    const contract = parsePipeScriptContract(initial?.scriptContract), path = new MotionPath(contract.points);
    const projection = initial?.motionProjection ? parseRuntimeMotionProjection(initial.motionProjection) : undefined;
    if (projection && JSON.stringify(projection.points) !== JSON.stringify(contract.points)) throw new TypeError('Motion/script path mismatch');
    const motion = projection?.motion, track = motion ? new MotionTrack(motion) : undefined;
    const carrier = binding.role('motion');
    if (!carrier) throw new Error('Missing runtime carrier role: motion');
    const appearance = initial?.appearance;
    if (!record(appearance) || typeof appearance.wallVisible !== 'boolean' || typeof appearance.mediumVisible !== 'boolean' || typeof appearance.hollow !== 'boolean')
      throw new TypeError('Missing runtime pipe appearance');
    const appearances = [
      { role: 'wall', visible: !appearance.hollow && appearance.wallVisible, designVisible: !appearance.hollow },
      { role: 'medium', visible: appearance.mediumVisible, designVisible: true },
      ...(appearance.hollow ? [{ role: 'wallOutline', visible: appearance.wallVisible, designVisible: true }] : []),
    ].map(setting => {
      const handle = binding.role(setting.role);
      if (!handle) throw new Error(`Missing pipe appearance role: ${setting.role}`);
      return { ...setting, handle, mounted: undefined as PipeFlowRoleHandle | undefined };
    });
    let appearanceApplied = false;
    const authoredFlow = binding.role('flow');
    if (!authoredFlow) throw new Error('Missing authored flow role');
    let mountedCarrier: PipeFlowRoleHandle | undefined, mountedFlow: PipeFlowRoleHandle | undefined;
    const slots = motion ? motionPool(motion, path.length) : [];
    const particles: Array<{ handle: Handle; itemId: string; materialId: string }> = [];
    let root: { readonly id: string } | undefined, unmounted: { readonly id: string } | undefined;
    let dash: Handle | undefined, ready = false, disposed = false, paused = false, failure: string | null = null;
    let frame: number | null = null, previous = 0, lastTrace = -Infinity;
    let range: ResolvedPipeFlowRange = { start: 0, end: path.length, unit: 'distance' };
    let state: State = { enabled: false, speed: 24, acceleration: motion?.acceleration ?? 0,
      direction: 'forward', offset: 0, color: '#F8FAFC', width: 2, dashPattern: [10, 10] };
    const snapshot = () => ({ ...state, dashPattern: [...state.dashPattern], range: { ...range }, ready,
      paused, running: frame !== null, error: failure });
    const assertLive = () => { if (disposed) throw new Error(failure ?? 'Pipe flow disposed'); };
    function validate(patch: unknown): State {
      if (!record(patch)) throw new TypeError('Flow state must be an object');
      const next = { ...state, dashPattern: [...state.dashPattern] };
      for (const [key, value] of Object.entries(patch)) {
        if (!(key in next) || !Object.hasOwn(next, key)) throw new TypeError(`Unsupported flow state: ${key}`);
        if (key === 'enabled') { if (typeof value !== 'boolean') throw new TypeError('enabled must be boolean'); next.enabled = value; }
        else if (key === 'direction') { if (value !== 'forward' && value !== 'reverse') throw new TypeError('Invalid direction'); next.direction = value; }
        else if (key === 'color') { if (typeof value !== 'string' || !/^#[0-9a-f]{6}$/i.test(value)) throw new TypeError('Invalid flow color'); next.color = value; }
        else if (key === 'dashPattern') {
          const pattern = normalizePipeDashPattern(value); if (!pattern) throw new TypeError('Invalid dash pattern');
          next.dashPattern = pattern;
        }
        else {
          if (typeof value !== 'number' || !Number.isFinite(value) || (key !== 'offset' && value < 0)
            || (key === 'acceleration' && value > 10000) || (key === 'speed' && value > 100000)
            || (key === 'width' && value > 10000)) throw new TypeError(`Invalid ${key}`);
          next[key as 'speed' | 'offset' | 'width' | 'acceleration'] = value;
        }
      }
      if (!motion && next.acceleration !== 0) throw new TypeError('Acceleration requires cycle-group motion');
      if (motion) {
        if (motionPool({ ...motion, acceleration: next.acceleration }, path.length).length > slots.length)
          throw new RangeError('Acceleration exceeds authored particle budget; regenerate in Figma');
        samplePathMotion(new MotionTrack(motion), path.length, next.offset, next.speed, next.direction === 'reverse', next.acceleration);
      }
      return next;
    }
    function publish(reason: string, requestId?: string) {
      const result = snapshot(); ctx.trace('pipe-flow.state', { reason, state: result });
      if (typeof document !== 'undefined') document.dispatchEvent(new CustomEvent('flamo:hmi-pipe-flow:state', {
        detail: { instanceId: ctx.instance.id, nodeId: ctx.nodeId, requestId, reason, state: result },
      }));
      return result;
    }
    function render(): void {
      if (!ready || disposed) return;
      // The original dashed layer is the Figma fallback, not a second Runtime flow.
      mountedFlow!.setVisible(false);
      mountedCarrier!.setVisible(state.enabled);
      if (dash) {
        dash.setVisible(state.enabled && range.start < range.end);
        // Offset is measured on the original path, so changing range preserves phase.
        dash.set('StrokeStyleCpt.strokeDashOffset', state.offset - range.start);
      }
      if (!motion || !track) return;
      const queues = new Map<string, MotionPose[]>();
      if (state.enabled && range.start < range.end) {
        for (const p of samplePathMotion(track, path.length, state.offset, state.speed, state.direction === 'reverse', state.acceleration)) {
          const material = motion.materials.find(m => m.id === p.materialId)!;
          const margin = Math.hypot(p.size, p.size / material.aspect) / 2;
          if (p.distance - margin < range.start || p.distance + margin > range.end) continue;
          const key = `${p.itemId}/${p.materialId}`, q = queues.get(key) ?? [];
          q.push(path.pose(p, state.direction === 'reverse')); queues.set(key, q);
        }
      }
      for (const particle of particles) {
        const pose = queues.get(`${particle.itemId}/${particle.materialId}`)?.shift();
        particle.handle.setVisible(!!pose);
        if (!pose) continue;
        const material = motion.materials.find(m => m.id === pose.materialId)!;
        const t = motionTransform(pose, material.aspect);
        particle.handle.setTransform(t.x, t.y, t.scaleX, t.scaleY, pose.rotation);
        particle.handle.setOpacity(pose.opacity);
        if (material.shape !== 'image') particle.handle.setFillColor(color(pose.color));
      }
    }
    function updateDash(): void {
      if (!dash || !ready) return;
      const points = slicePipePath(path, range);
      if (points.length) dash.set('VectorCpt.vectorData', pathVector(points));
      dash.setStrokeColor(color(state.color)); dash.setStrokeWidth(state.width);
      dash.set('StrokeStyleCpt.strokeDashArray', [...state.dashPattern]);
    }
    function cancel(): void { if (frame !== null) cancelAnimationFrame(frame); frame = null; }
    function schedule(): void {
      if (!disposed && ready && !paused && state.enabled && (state.speed > 0 || state.acceleration > 0) && frame === null) {
        previous = performance.now(); frame = requestAnimationFrame(tick);
      }
    }
    function tick(now: number): void {
      frame = null; if (disposed || paused || !state.enabled) return;
      const dt = Math.max(0, Math.min(250, now - previous)) / 1000; previous = now;
      state.offset += dt * (motion ? motionPhaseSpeed(motion, state.speed, state.acceleration) : state.speed) * (state.direction === 'reverse' ? -1 : 1);
      render();
      if (now - lastTrace >= 250) { ctx.trace('pipe-flow.phase-sample', { offset: state.offset, range: { ...range } }); lastTrace = now; }
      frame = requestAnimationFrame(tick);
    }
    function update(patch: unknown) {
      assertLive(); const next = validate(patch); state = next;
      cancel(); updateDash(); render(); schedule(); return publish('business-update');
    }
    function setRange(value: unknown) {
      assertLive(); const next = resolvePipeFlowRange(value, path.length); range = next;
      updateDash(); render(); ctx.trace('pipe-flow.range', { range: { ...range }, pathLength: path.length });
      return publish('range');
    }
    const onCommand = (event: Event) => {
      const d = (event as CustomEvent).detail;
      // Require both identities: a template source ID alone is not an instance address.
      if (!record(d) || d.instanceId !== ctx.instance.id || d.nodeId !== ctx.nodeId) return;
      try {
        if (d.range !== undefined) {
          if (d.patch !== undefined) throw new TypeError('Send either range or patch');
          setRange(d.range);
        } else update(d.patch);
        publish('host-event', typeof d.requestId === 'string' ? d.requestId : undefined);
      } catch (error) {
        ctx.trace('pipe-flow.command-error', { error: String(error) });
        document.dispatchEvent(new CustomEvent('flamo:hmi-pipe-flow:state', { detail: {
          instanceId: ctx.instance.id, nodeId: ctx.nodeId, requestId: d.requestId, error: String(error),
        } }));
      }
    };
    const cleanup = () => {
      if (disposed) return; disposed = true; ready = false; cancel();
      if (typeof document !== 'undefined') document.removeEventListener('flamo:hmi-pipe-flow:set', onCommand);
      try { if (unmounted && unmounted !== root) ctx.scene.remove(unmounted); }
      finally { if (root) ctx.scene.remove(root); }
      if (appearanceApplied) for (const setting of appearances) {
        const entity = ctx.mounted.resolve(setting.handle.id)?.entity;
        if (entity) entity.setVisible(setting.designVisible);
      }
      ctx.trace('pipe-flow.disposed', { rootNodeId: ctx.nodeId });
    };
    ctx.dispose(cleanup);
    try {
      state = validate({ enabled: initial?.enabled ?? false, speed: initial?.speed ?? 24,
        direction: initial?.direction ?? 'forward', offset: initial?.offset ?? 0,
        color: initial?.color ?? '#F8FAFC', width: initial?.width ?? 2, dashPattern: initial?.dashPattern ?? [10, 10] });
      ctx.expose({
        getFlowPath: () => copy(contract), getFlowState: snapshot, setFlowState: (...args) => update(args[0]),
        setFlowRange: (...args) => setRange(args[0]),
        reverseFlow: () => update({ direction: state.direction === 'forward' ? 'reverse' : 'forward' }),
        startFlow: () => { assertLive(); paused = false; schedule(); return publish('start'); },
        stopFlow: (...args) => {
          assertLive(); paused = true; cancel();
          if (args[0] === true || (record(args[0]) && args[0].resetOffset === true)) { state.offset = 0; render(); }
          return publish('stop');
        },
      });
      if (typeof document !== 'undefined') document.addEventListener('flamo:hmi-pipe-flow:set', onCommand);
      void (async () => {
        // Wait for physical materialization before queueing a parent command.
        // Scene owns semantic hierarchy; writes use the mounted entity handle.
        for (let attempt = 0; !disposed; attempt++) {
          mountedCarrier = ctx.mounted.resolve(carrier.id)?.entity;
          mountedFlow = ctx.mounted.resolve(authoredFlow.id)?.entity;
          for (const setting of appearances) setting.mounted = ctx.mounted.resolve(setting.handle.id)?.entity;
          if (mountedCarrier && mountedFlow && appearances.every(setting => setting.mounted)) break;
          if (attempt >= 120) throw new Error('Runtime pipe roles did not finish mounting');
          await ctx.scene.flush();
        }
        if (disposed) return;
        appearanceApplied = true;
        for (const setting of appearances) setting.mounted!.setVisible(setting.visible);
        root = ctx.scene.create('group', { name: 'Runtime Pipe Flow', lifecycle: 'ephemeral', interactive: false });
        unmounted = root; ctx.scene.mount(root, { parent: carrier }); unmounted = undefined;
        const create = (kind: string, props: Record<string, unknown>): Handle => {
          const node = ctx.scene.create(kind, { ...props, lifecycle: 'ephemeral', interactive: false, visible: false });
          unmounted = node; ctx.scene.mount(node, { parent: root! }); unmounted = undefined;
          const handle = ctx.node(node.id); if (!handle) throw new Error(`Cannot resolve ${node.id}`); return handle;
        };
        if (!motion) dash = create('vector', { name: 'Runtime Flow Range', size: { width: 1, height: 1 },
          fill: [], stroke: state.color, strokeWidth: state.width, vectorData: pathVector(path.points) });
        for (const slot of slots) {
          const material = motion!.materials.find(m => m.id === slot.materialId)!;
          const handle = create(material.shape === 'image' ? 'image' : material.shape === 'dot' ? 'ellipse' : 'vector', {
            name: `${material.name} · ${slot.itemId}`, size: { width: 1, height: 1 }, fill: '#FFFFFF', stroke: [],
            ...(material.shape === 'image' ? { assetId: material.imageHash, fit: 'FILL' }
              : material.shape === 'dot' ? {} : { vectorData: materialVector(material) }),
          });
          particles.push({ handle, ...slot });
        }
        const pending = new Set([root!.id, ...(dash ? [dash.id] : []), ...particles.map(p => p.handle.id)]);
        for (let attempt = 0; pending.size && !disposed; attempt++) {
          if (attempt >= 120) throw new Error('Runtime flow resources did not finish mounting');
          await ctx.scene.flush(); for (const id of pending) if (ctx.mounted.resolve(id)) pending.delete(id);
        }
        if (disposed) return; ready = true; updateDash(); render(); schedule();
        ctx.trace('pipe-flow.mounted', { behavior: APPEARANCE_PATH_FLOW_IDENTITY, rootNodeId: ctx.nodeId, particles: particles.length });
        publish('ready');
      })().catch(error => { failure = String(error); cleanup(); ctx.trace('pipe-flow.error', { error: failure }); publish('error'); });
    } catch (error) { failure = String(error); cleanup(); throw error; }
  },
};

function pathVector(points: readonly { x: number; y: number }[]): Record<string, unknown> {
  return { normalizedSize: { x: 1, y: 1 }, vectorNetwork: {
    vertices: points.map(p => ({ ...p, styleID: 0 })),
    segments: points.slice(1).map((_, i) => ({ styleID: 0, start: { vertex: i, dx: 0, dy: 0 }, end: { vertex: i + 1, dx: 0, dy: 0 } })), regions: [],
  } };
}
function materialVector(material: MotionMaterial): Record<string, unknown> {
  const points = MOTION_SHAPES[material.shape as keyof typeof MOTION_SHAPES];
  return { normalizedSize: { x: 1, y: 1 }, vectorNetwork: {
    vertices: points.map(p => ({ ...p, styleID: 0 })),
    segments: points.map((_, i) => ({ styleID: 0, start: { vertex: i, dx: 0, dy: 0 }, end: { vertex: (i + 1) % points.length, dx: 0, dy: 0 } })),
    regions: [{ styleID: 0, windingRule: 'NONZERO', loops: [{ segments: points.map((_, i) => i) }] }],
  } };
}
