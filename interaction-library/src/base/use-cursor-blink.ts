export interface CursorBlinkOptions {
  intervalMs?: number;
  initiallyLit?: boolean;
  onChange?: (lit: boolean) => void;
}

export interface CursorBlinkController {
  readonly lit: boolean;
  readonly running: boolean;
  start(): void;
  stop(): void;
  reset(): void;
  dispose(): void;
}

export function createCursorBlink(options: CursorBlinkOptions = {}): CursorBlinkController {
  const intervalMs = options.intervalMs ?? 530;
  let lit = options.initiallyLit ?? false;
  let timer: ReturnType<typeof globalThis.setInterval> | null = null;

  const publish = (next: boolean) => {
    lit = next;
    options.onChange?.(lit);
  };

  const stop = () => {
    if (timer !== null) {
      globalThis.clearInterval(timer);
      timer = null;
    }
    publish(false);
  };

  const start = () => {
    if (timer !== null || typeof globalThis.setInterval !== 'function') return;
    publish(true);
    timer = globalThis.setInterval(() => publish(!lit), intervalMs);
  };

  return {
    get lit() { return lit; },
    get running() { return timer !== null; },
    start,
    stop,
    reset() {
      stop();
      start();
    },
    dispose: stop,
  };
}
