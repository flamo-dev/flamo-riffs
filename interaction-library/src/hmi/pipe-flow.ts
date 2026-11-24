import {
  createPipeFlowController,
  type PipeFlowRuntimePatch,
  type PipeFlowRuntimeSnapshot,
} from '@flamo/hmi';

export const HMI_PIPE_FLOW_BEHAVIOR_REF = 'hmi.pipe-flow';
export const HMI_PIPE_FLOW_BEHAVIOR_VERSION = '1.0.0';
export const HMI_PIPE_FLOW_BEHAVIOR_IDENTITY = `${HMI_PIPE_FLOW_BEHAVIOR_REF}@${HMI_PIPE_FLOW_BEHAVIOR_VERSION}`;
export const HMI_PIPE_FLOW_HOST_COMMAND_EVENT = 'flamo:hmi-pipe-flow:set';
export const HMI_PIPE_FLOW_HOST_STATE_EVENT = 'flamo:hmi-pipe-flow:state';

const PHASE_TRACE_INTERVAL_MS = 250;

export interface PipeFlowRoleHandle {
  readonly id: string;
  set(path: string, value: unknown): void;
  setVisible(value: boolean): void;
  setStrokeColor(value: { r: number; g: number; b: number; a: number }): void;
  setStrokeWidth(value: number): void;
}

export interface PipeFlowBehaviorBinding {
  readonly options?: Record<string, unknown>;
}

export interface PipeFlowBehaviorSelection {
  readonly binding: PipeFlowBehaviorBinding;
  role(name: string): PipeFlowRoleHandle | null;
}

export interface PipeFlowBehaviorContext {
  readonly instance: { readonly id: string };
  readonly sourceNodeId: string;
  readonly nodeId: string;
  behavior(identity: string): PipeFlowBehaviorSelection | null;
  expose(methods: Record<string, (...args: unknown[]) => unknown>): void;
  trace(action: string, detail?: unknown): void;
  dispose(cleanup: () => void): void;
}

export interface PipeFlowNodeScriptDefinition {
  setup(props: Readonly<Record<string, unknown>>, ctx: PipeFlowBehaviorContext): void;
}

const hmiPipeFlowBehavior: PipeFlowNodeScriptDefinition = {
  setup(_props, ctx) {
    const behavior = ctx.behavior(HMI_PIPE_FLOW_BEHAVIOR_IDENTITY);
    if (!behavior) {
      throw new Error(`Missing behavior binding ${HMI_PIPE_FLOW_BEHAVIOR_IDENTITY} on ${ctx.sourceNodeId}`);
    }

    const flow = behavior.role('flow');
    if (!flow) throw new Error(`Behavior ${HMI_PIPE_FLOW_BEHAVIOR_IDENTITY} cannot resolve its flow role`);

    let lastPhaseSampleAt = Number.NEGATIVE_INFINITY;
    const controller = createPipeFlowController({
      initial: readInitialPatch(behavior.binding.options?.initialState),
      target: {
        setVisible: value => flow.setVisible(value),
        setStrokeColor: color => flow.setStrokeColor(parseHexColor(color)),
        setStrokeWidth: width => flow.setStrokeWidth(width),
        setDashPattern: pattern => flow.set('StrokeStyleCpt.strokeDashArray', [...pattern]),
        setDashOffset: offset => {
          flow.set('StrokeStyleCpt.strokeDashOffset', offset);
          const now = globalThis.performance?.now?.() ?? Date.now();
          if (now - lastPhaseSampleAt >= PHASE_TRACE_INTERVAL_MS || offset === 0) {
            lastPhaseSampleAt = now;
            ctx.trace('pipe-flow.phase-sample', { flowNodeId: flow.id, offset });
          }
        },
      },
    });

    const hostEventTarget = typeof document === 'undefined' ? null : document;
    const publishState = (
      reason: string,
      state: PipeFlowRuntimeSnapshot,
      requestId?: string,
    ): PipeFlowRuntimeSnapshot => {
      ctx.trace('pipe-flow.state', { reason, flowNodeId: flow.id, state });
      dispatchHostState(hostEventTarget, {
        requestId,
        instanceId: ctx.instance.id,
        nodeId: ctx.sourceNodeId,
        reason,
        state,
      });
      return state;
    };

    const updateState = (patch: PipeFlowRuntimePatch, reason: string): PipeFlowRuntimeSnapshot => {
      return publishState(reason, controller.update(patch));
    };

    ctx.expose({
      setFlowState: (...args: unknown[]) => updateState(requirePatch(args[0]), 'business-update'),
      getFlowState: () => controller.snapshot(),
      startFlow: () => {
        controller.start();
        return publishState('start', controller.snapshot());
      },
      stopFlow: (...args: unknown[]) => {
        const resetOffset = args[0] === true || isRecord(args[0]) && args[0].resetOffset === true;
        controller.stop({ resetOffset });
        return publishState('stop', controller.snapshot());
      },
    });

    const onHostCommand = (event: Event): void => {
      const detail = (event as CustomEvent<unknown>).detail;
      if (!isRecord(detail) || !matchesHostTarget(detail, ctx.instance.id, ctx.sourceNodeId, ctx.nodeId)) return;
      const requestId = typeof detail.requestId === 'string' ? detail.requestId : undefined;
      try {
        publishState(
          'host-event',
          controller.update(requirePatch(detail.patch, 'host command patch')),
          requestId,
        );
      } catch (error) {
        dispatchHostState(hostEventTarget, {
          requestId,
          instanceId: ctx.instance.id,
          nodeId: ctx.sourceNodeId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    };

    hostEventTarget?.addEventListener(HMI_PIPE_FLOW_HOST_COMMAND_EVENT, onHostCommand);
    const initial = controller.snapshot();
    ctx.trace('pipe-flow.mounted', {
      behavior: HMI_PIPE_FLOW_BEHAVIOR_IDENTITY,
      rootNodeId: ctx.sourceNodeId,
      flowNodeId: flow.id,
      state: initial,
    });
    publishState('initial', initial);

    ctx.dispose(() => {
      hostEventTarget?.removeEventListener(HMI_PIPE_FLOW_HOST_COMMAND_EVENT, onHostCommand);
      controller.dispose();
      ctx.trace('pipe-flow.disposed', { rootNodeId: ctx.sourceNodeId, flowNodeId: flow.id });
    });
  },
};

export default hmiPipeFlowBehavior;

function readInitialPatch(value: unknown): PipeFlowRuntimePatch {
  if (value === undefined) return {};
  return requirePatch(value, 'behavior binding options.initialState');
}

function requirePatch(value: unknown, label = 'setFlowState'): PipeFlowRuntimePatch {
  if (!isRecord(value)) throw new TypeError(`${label} must be an object`);
  return value as PipeFlowRuntimePatch;
}

function parseHexColor(value: string): { r: number; g: number; b: number; a: number } {
  const match = /^#([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})$/.exec(value);
  if (!match) throw new TypeError('Pipe flow color must use #RRGGBB');
  return {
    r: Number.parseInt(match[1]!, 16) / 255,
    g: Number.parseInt(match[2]!, 16) / 255,
    b: Number.parseInt(match[3]!, 16) / 255,
    a: 1,
  };
}

function matchesHostTarget(
  detail: Record<string, unknown>,
  instanceId: string,
  sourceNodeId: string,
  runtimeNodeId: string,
): boolean {
  const hasInstance = typeof detail.instanceId === 'string';
  const hasNode = typeof detail.nodeId === 'string';
  if (!hasInstance && !hasNode) return false;
  if (hasInstance && detail.instanceId !== instanceId) return false;
  if (hasNode && detail.nodeId !== sourceNodeId && detail.nodeId !== runtimeNodeId) return false;
  return true;
}

function dispatchHostState(target: Document | null, detail: Record<string, unknown>): void {
  target?.dispatchEvent(new CustomEvent(HMI_PIPE_FLOW_HOST_STATE_EVENT, { detail }));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
