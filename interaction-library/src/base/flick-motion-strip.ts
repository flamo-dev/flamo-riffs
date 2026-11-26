export interface FlickMotionStripOptions {
  frame: string;
  track: {
    sample(timeMs: number): readonly number[] | number;
    timeAtValue(value: number, options: { axis: number }): number | null;
  };
  motion: {
    getState(frame: string): { timeMs: number };
    seek(frame: string, timeMs: number): Promise<void>;
    subscribe(frame: string, listener: (state: { status: string; playbackKind: string | null }) => void): () => void;
  };
  onUpdate(callback: (seconds: number) => void): () => void;
}

/** SoftScrollX's short flick and two-axis wheel input on a horizontal authored track. */
export function createFlickMotionStrip({ frame, track, motion, onUpdate }: FlickMotionStripOptions) {
  let pointer: number | null = null;
  let start = 0;
  let position = 0;
  let lastMove = 0;
  let speed = 0;
  let endCoast: (() => void) | undefined;
  let disposed = false;

  function visibleX() {
    const sample = track.sample(motion.getState(frame).timeMs);
    return typeof sample === 'number' ? sample : sample[0];
  }
  function stopCoast() {
    endCoast?.();
    endCoast = undefined;
  }
  function seek(x: number) {
    if (!Number.isFinite(x)) return false;
    const time = track.timeAtValue(x, { axis: 0 });
    if (time === null || !Number.isFinite(time)) return false;
    void motion.seek(frame, time);
    return true;
  }
  function coast(seconds: number) {
    if (!(seconds > 0) || !Number.isFinite(seconds)) return;
    position += speed * seconds * 1000;
    if (!seek(position)) return stopCoast();
    speed *= Math.exp(-4.5 * seconds);
    if (Math.abs(speed) < 0.012) stopCoast();
  }
  const unsubscribe = motion.subscribe(frame, state => {
    if (state.playbackKind === 'full' && state.status === 'playing') stopCoast();
  });

  return {
    begin(pointerId: number) {
      if (disposed) return;
      stopCoast();
      pointer = pointerId;
      start = position = visibleX();
      lastMove = performance.now();
      speed = 0;
    },
    /** Total X displacement from pointer-down, expressed in the fixed frame's coordinates. */
    drag(pointerId: number, dx: number) {
      if (pointer !== pointerId) return;
      const next = start + dx;
      if (!seek(next)) return;
      const now = performance.now();
      const instantaneous = (next - position) / Math.max(1, now - lastMove);
      speed = speed * 0.65 + instantaneous * 0.35;
      lastMove = now;
      position = next;
    },
    release(pointerId: number) {
      if (pointer !== pointerId) return;
      pointer = null;
      if (performance.now() - lastMove <= 90 && Math.abs(speed) >= 0.015) {
        endCoast = onUpdate(coast);
      }
    },
    cancel(pointerId: number) {
      if (pointer !== pointerId) return;
      pointer = null;
      stopCoast();
    },
    /** A trackpad's X takes priority. A vertical-only mouse wheel moves the same strip. */
    wheel(dx: number, dy: number) {
      const delta = Math.abs(dx) > 0.001 ? dx : dy;
      if (disposed || !Number.isFinite(delta) || delta === 0) return false;
      stopCoast();
      seek(visibleX() - delta);
      return true;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      pointer = null;
      stopCoast();
      unsubscribe();
    },
  };
}
