interface MotionDragOptions {
  frame: string;
  axis: 'x' | 'y';
  track: {
    startMs: number;
    endMs: number;
    sample(timeMs: number): readonly number[];
    timeAtValue(value: number, options: { axis: number }): number | null;
  };
  motion: {
    getState(frame: string): { timeMs: number; status: string };
    pause(frame: string): void;
    seek(frame: string, timeMs: number): Promise<void>;
    subscribe(frame: string, listener: (state: { status: string }) => void): () => void;
  };
  /** Flamo supplies elapsed seconds and returns an unsubscribe function. */
  onUpdate(callback: (seconds: number) => void): () => void;
}

/** Drive a frame's authored time by dragging a monotonic local translation track. */
export function createMotionDragScrubber({ frame, axis, track, motion, onUpdate }: MotionDragOptions) {
  const component = axis === 'x' ? 0 : 1;
  const first = track.sample(track.startMs)[component];
  const last = track.sample(track.endMs)[component];
  if (!Number.isFinite(first) || !Number.isFinite(last) || first === last) {
    throw new RangeError('Expected distinct finite endpoints on the selected translation axis');
  }
  const lower = Math.min(first, last);
  const upper = Math.max(first, last);
  const readPosition = () => track.sample(motion.getState(frame).timeMs)[component];
  let position = readPosition();
  let start = position;
  let velocity = 0;
  let lastMove = 0;
  let pointer: number | null = null;
  let endCoast: (() => void) | undefined;
  let pendingSeek: Promise<void> | undefined;
  let disposed = false;

  function stop() {
    endCoast?.();
    endCoast = undefined;
    velocity = 0;
    pointer = null;
  }

  function seek(value: number) {
    const bounded = Math.max(lower, Math.min(upper, value));
    const time = track.timeAtValue(bounded, { axis: component });
    if (time === null || !Number.isFinite(time)) return false;
    position = bounded;
    const request = motion.seek(frame, time);
    pendingSeek = request;
    void request.finally(() => {
      if (pendingSeek === request) pendingSeek = undefined;
    });
    return bounded === value;
  }

  function coast(seconds: number) {
    if (!(seconds > 0) || !Number.isFinite(seconds)) return;
    const elapsed = Math.min(64, seconds * 1000);
    velocity *= Math.exp(-0.0012 * elapsed);
    if (Math.abs(velocity) < 0.004 || !seek(position + velocity * elapsed)) stop();
  }

  const unsubscribe = motion.subscribe(frame, state => {
    if (state.status === 'playing') {
      pendingSeek = undefined;
      stop();
    }
  });

  return {
    begin(pointerId: number) {
      if (disposed || (pointer !== null && pointer !== pointerId)) return;
      stop();
      motion.pause(frame);
      start = position = readPosition();
      pointer = pointerId;
      lastMove = performance.now();
    },
    /** Total local displacement since pointer-down. */
    drag(pointerId: number, displacement: number) {
      if (pointerId !== pointer || !Number.isFinite(displacement)) return;
      const previous = position;
      const now = performance.now();
      seek(start + displacement);
      velocity = 0.7 * velocity + 0.3 * (position - previous) / Math.max(1, now - lastMove);
      lastMove = now;
    },
    release(pointerId: number) {
      if (pointerId !== pointer) return;
      pointer = null;
      if (performance.now() - lastMove < 250 && Math.abs(velocity) >= 0.004) {
        endCoast = onUpdate(coast);
      }
    },
    cancel(pointerId: number) {
      if (pointerId === pointer) stop();
    },
    /** Signed incremental wheel delta in the fixed frame's local coordinates. */
    wheel(delta: number) {
      if (disposed || !Number.isFinite(delta) || delta === 0) return;
      stop();
      // A burst of wheel events can arrive before the previous seek has committed.
      const from = pendingSeek ? position : readPosition();
      if (motion.getState(frame).status === 'playing') motion.pause(frame);
      seek(from - delta);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      stop();
      unsubscribe();
    },
  };
}
