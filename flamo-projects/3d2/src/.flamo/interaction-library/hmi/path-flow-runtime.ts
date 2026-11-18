import {
  MOTION_SHAPES, MotionPath, motionPool, parseRuntimeMotionProjection,
  type MotionMaterial, type MotionProjection,
} from '@flamo/hmi';
import accelerated, { ACCELERATED_PATH_FLOW_IDENTITY } from './path-flow-accelerated';
import type { PipeFlowBehaviorContext, PipeFlowRoleHandle } from './pipe-flow';

export const RUNTIME_PATH_FLOW_IDENTITY = 'hmi.pipe-flow@2.2.0';
interface MotionHandle extends PipeFlowRoleHandle {
  setTransform(x: number, y: number, scaleX: number, scaleY: number, rotation: number): void;
  setOpacity(value: number): void;
  setFillColor(color: { r: number; g: number; b: number; a: number }): void;
}
export interface RuntimePathFlowContext extends PipeFlowBehaviorContext {
  scene: {
    create(kind: string, props: Record<string, unknown>): { readonly id: string };
    mount(node: { readonly id: string }, options: { parent: { readonly id: string } }): unknown;
    remove(node: { readonly id: string }): void;
    flush(): Promise<void>;
  };
  node(id: string): MotionHandle | null;
  mounted: { resolve(id: string): unknown | null };
}

/** Particle lifetime belongs to the running scene, never to the Figma document. */
export default {
  setup(props: Readonly<Record<string, unknown>>, ctx: RuntimePathFlowContext): void {
    const binding = ctx.behavior(RUNTIME_PATH_FLOW_IDENTITY);
    if (!binding) throw new Error(`Missing ${RUNTIME_PATH_FLOW_IDENTITY}`);
    const initial = binding.binding.options?.initialState as Record<string, unknown> | undefined;
    const input = initial?.motionProjection as { version?: number } | undefined;
    if (input?.version !== 2) {
      accelerated.setup(props, {
        ...ctx,
        behavior: identity => identity === ACCELERATED_PATH_FLOW_IDENTITY ? binding : ctx.behavior(identity),
      });
      return;
    }

    const compact = parseRuntimeMotionProjection(input);
    const frame = binding.role('motion');
    if (!frame) throw new Error('Missing motion role');
    const slots = motionPool(compact.motion, new MotionPath(compact.points).length);
    let poolRoot: { readonly id: string } | undefined;
    let unmounted: { readonly id: string } | undefined;
    const cleanups: Array<() => void> = [];
    let disposed = false;
    const cleanup = () => {
      if (disposed) return;
      disposed = true;
      try { for (const dispose of cleanups.reverse()) dispose(); }
      finally {
        // Remove the whole ephemeral subtree in one scene operation.
        try { if (unmounted) ctx.scene.remove(unmounted); }
        finally { if (poolRoot) ctx.scene.remove(poolRoot); }
      }
    };
    ctx.dispose(cleanup);
    try {
      poolRoot = ctx.scene.create('group', { name: 'Runtime Path Motion', lifecycle: 'ephemeral', interactive: false });
      ctx.scene.mount(poolRoot, { parent: frame });
      const handles = new Map<string, MotionHandle>();
      const projection: MotionProjection = { version: 1, points: compact.points, motion: compact.motion, slots: [] };
      for (const [i, slot] of slots.entries()) {
        const material = compact.motion.materials.find(m => m.id === slot.materialId)!;
        const node = ctx.scene.create(material.shape === 'image' ? 'image' : material.shape === 'dot' ? 'ellipse' : 'vector', {
          name: `${material.name} · ${slot.itemId}`,
          size: { width: 1, height: 1 }, visible: false,
          lifecycle: 'ephemeral', interactive: false,
          fill: '#FFFFFF', stroke: [],
          ...(material.shape === 'image' ? { assetId: material.imageHash, fit: 'FILL' }
            : material.shape === 'dot' ? {} : { vectorData: materialVector(material) }),
        });
        unmounted = node;
        ctx.scene.mount(node, { parent: poolRoot });
        unmounted = undefined;
        const handle = ctx.node(node.id);
        if (!handle) throw new Error(`Cannot resolve runtime particle ${node.id}`);
        handles.set(`motion:${i}`, handle);
        projection.slots.push({ ...slot, nodeId: node.id });
      }
      const runtimeBinding = {
        binding: { ...binding.binding, options: { ...binding.binding.options, initialState: { ...initial, motionProjection: projection } } },
        role: (name: string) => handles.get(name) ?? binding.role(name),
      };
      // Scene mounting is queued. Wait for ECS materialization before the first
      // visibility/color/transform write, otherwise the first frame is lost.
      void (async () => {
        const pending = new Set(projection.slots.map(slot => slot.nodeId));
        pending.add(poolRoot!.id);
        // A loading scene may span several frames. A frame boundary alone is
        // not evidence that its newly queued entities already exist.
        for (let attempt = 0; pending.size && !disposed; attempt++) {
          if (attempt >= 120) throw new Error('Runtime motion nodes did not finish mounting');
          await ctx.scene.flush();
          for (const id of pending) if (ctx.mounted.resolve(id)) pending.delete(id);
        }
        if (disposed) return;
        accelerated.setup(props, {
          ...ctx,
          behavior: identity => identity === ACCELERATED_PATH_FLOW_IDENTITY ? runtimeBinding : ctx.behavior(identity),
          dispose: callback => cleanups.push(callback),
        });
        ctx.trace('pipe-flow.runtime-pool', { behavior: RUNTIME_PATH_FLOW_IDENTITY, particles: slots.length });
      })().catch(error => {
        cleanup();
        ctx.trace('pipe-flow.error', { behavior: RUNTIME_PATH_FLOW_IDENTITY, error: String(error) });
      });
    } catch (error) { cleanup(); throw error; }
  },
};

function materialVector(material: MotionMaterial): Record<string, unknown> {
  const points = MOTION_SHAPES[material.shape as keyof typeof MOTION_SHAPES];
  return {
    normalizedSize: { x: 1, y: 1 },
    vectorNetwork: {
      vertices: points.map(p => ({ ...p, styleID: 0 })),
      segments: points.map((_, i) => ({ styleID: 0,
        start: { vertex: i, dx: 0, dy: 0 }, end: { vertex: (i + 1) % points.length, dx: 0, dy: 0 },
      })),
      regions: [{ styleID: 0, windingRule: 'NONZERO', loops: [{ segments: points.map((_, i) => i) }] }],
    },
  };
}
