type Matrix = { m00: number; m01: number; m02: number; m10: number; m11: number; m12: number };
type Playback = { timeMs: number; status: string; playbackKind: 'full' | 'range' | null };

interface FolderContext {
  sourceNodeId: string;
  figmaMotion: {
    getState(frame: string): Playback;
    playRange(frame: string, from: number, to: number): Promise<void>;
    seek(frame: string, timeMs: number): Promise<void>;
    pause(frame: string): void;
    subscribe(frame: string, callback: (state: Playback) => void): () => void;
  };
  node(id: string): {
    set(path: string, value: unknown): void;
    setOpacity(value: number): void;
    setVisible(value: boolean): void;
  } | null;
  probe(id: string): { transform: Matrix; opacity?: number; visible?: boolean } | null;
  onNode(id: string, event: string, callback: () => void): () => void;
  onActivate(id: string, callback: () => void): () => void;
  onUpdate(callback: () => void): () => void;
  dispose(callback: () => void): void;
}

export interface MotionFolderOptions {
  hit: string;
  hover: readonly [startMs: number, endMs: number];
  expand: readonly [startMs: number, endMs: number];
  items: ReadonlyArray<{ id: string; dx: number; dy: number }>;
  flyoutMs: number;
}

/** Drive two authored motion ranges, then fly each item out from its rendered pose. */
export function bindMotionFolder(ctx: FolderContext, options: MotionFolderOptions): void {
  const { hit, hover, expand, items, flyoutMs } = options;
  const [rest, lifted] = hover;
  const [spreadStart, spreadEnd] = expand;
  if (![...hover, ...expand, flyoutMs].every(Number.isFinite) ||
      !(0 <= rest && rest < lifted && lifted <= spreadStart && spreadStart < spreadEnd && flyoutMs > 0)) {
    throw new RangeError('Expected two ordered motion ranges and a positive flyout duration');
  }

  const motion = ctx.figmaMotion;
  const frame = ctx.sourceNodeId;
  let inside = false;
  let goal: 'rest' | 'hover' | 'expanded' | 'away' = 'rest';
  let pendingEnd: number | undefined;
  let full = motion.getState(frame).playbackKind === 'full' && motion.getState(frame).status === 'playing';
  let restoreItems: (() => void) | undefined;

  function range(from: number, to: number) {
    pendingEnd = to;
    void motion.playRange(frame, from, to);
  }

  function followGoal() {
    const t = motion.getState(frame).timeMs;
    pendingEnd = undefined;
    if (goal === 'expanded') {
      if (t < lifted) range(Math.max(rest, t), lifted);
      else if (t < spreadEnd) range(Math.max(spreadStart, t), spreadEnd);
    } else if (t > spreadStart) {
      range(Math.min(spreadEnd, t), spreadStart);
    } else {
      const end = goal === 'hover' ? lifted : rest;
      const from = Math.max(rest, Math.min(lifted, t));
      if (from !== end) range(from, end);
      else void motion.seek(frame, end);
    }
  }

  function resetFlight() {
    restoreItems?.();
    restoreItems = undefined;
  }

  function flyOut() {
    goal = 'away';
    pendingEnd = undefined;
    motion.pause(frame);
    const poses = items.flatMap(({ id, dx, dy }) => {
      const node = ctx.node(id);
      const pose = ctx.probe(id);
      return node && pose ? [{ node, pose, dx, dy }] : [];
    });
    const start = performance.now();
    const stop = ctx.onUpdate(() => {
      const t = Math.min(1, (performance.now() - start) / flyoutMs);
      const ease = 1 - (1 - t) ** 3;
      for (const { node, pose, dx, dy } of poses) {
        const m = pose.transform;
        node.set('TransformCpt.transform', { ...m, m02: m.m02 + dx * ease, m12: m.m12 + dy * ease });
        node.setOpacity((pose.opacity ?? 1) * (1 - ease));
        if (t === 1) node.setVisible(false);
      }
      if (t === 1) stop();
    });
    restoreItems = () => {
      stop();
      for (const { node, pose } of poses) {
        node.set('TransformCpt.transform', pose.transform);
        node.setOpacity(pose.opacity ?? 1);
        node.setVisible(pose.visible ?? true);
      }
    };
  }

  const enter = ctx.onNode(hit, 'pointerenter', () => {
    if (inside) return;
    inside = true;
    if (full) return;
    goal = 'hover';
    followGoal();
  });
  const leave = ctx.onNode(hit, 'pointerleave', () => {
    if (!inside) return;
    inside = false;
    if (full) return;
    const wasAway = goal === 'away';
    goal = 'rest';
    if (wasAway) {
      resetFlight();
      void motion.seek(frame, rest);
    } else followGoal();
  });
  const activate = ctx.onActivate(hit, () => {
    if (full || goal === 'away') return;
    if (goal === 'expanded') flyOut();
    else {
      goal = 'expanded';
      followGoal();
    }
  });
  const unsubscribe = motion.subscribe(frame, state => {
    if (state.playbackKind === 'full') {
      if (state.status === 'playing' && !full) {
        full = true;
        goal = 'rest';
        pendingEnd = undefined;
        resetFlight();
      } else if (full && (state.status === 'ended' || state.status === 'paused')) {
        full = false;
        goal = inside ? 'hover' : 'rest';
        if (inside) range(rest, lifted);
        else void motion.seek(frame, rest);
      }
    } else if (state.playbackKind === 'range' && state.status === 'paused' &&
               pendingEnd !== undefined && Math.abs(state.timeMs - pendingEnd) < 0.001) {
      const end = pendingEnd;
      pendingEnd = undefined;
      if ((goal === 'expanded' && end === lifted) ||
          ((goal === 'rest' || goal === 'hover') && end === spreadStart)) followGoal();
    }
  });

  ctx.dispose(() => {
    enter();
    leave();
    activate();
    unsubscribe();
    resetFlight();
  });
}
