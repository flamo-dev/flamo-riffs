export type ViewportPolicy = 'preserve' | 'reveal-caret' | 'reset-start';

export interface SingleLineViewportOptions {
  viewportWidth: number;
  contentStartX?: number;
  cursorWidth?: number;
}

export interface SingleLineViewportSnapshot {
  scrollX: number;
  contentX: number;
  caretX: number;
  naturalCaretX: number;
  visibleLeft: number;
  visibleRight: number;
  policy: ViewportPolicy;
}

export interface SingleLineViewportController {
  readonly scrollX: number;
  apply(naturalCaretX: number, policy: ViewportPolicy): SingleLineViewportSnapshot;
  snapshot(naturalCaretX: number, policy?: ViewportPolicy): SingleLineViewportSnapshot;
}

export function createSingleLineViewport(options: SingleLineViewportOptions): SingleLineViewportController {
  const contentStartX = options.contentStartX ?? 0;
  const visibleLeft = contentStartX;
  const visibleRight = Math.max(visibleLeft, options.viewportWidth - (options.cursorWidth ?? 0));
  let scrollX = 0;

  const snapshot = (naturalCaretX: number, policy: ViewportPolicy = 'preserve'): SingleLineViewportSnapshot => ({
    scrollX,
    contentX: contentStartX - scrollX,
    caretX: naturalCaretX - scrollX,
    naturalCaretX,
    visibleLeft,
    visibleRight,
    policy,
  });

  return {
    get scrollX() { return scrollX; },
    apply(naturalCaretX, policy) {
      if (policy === 'reset-start') {
        scrollX = 0;
      } else if (policy === 'reveal-caret') {
        const visibleCaretX = naturalCaretX - scrollX;
        if (visibleCaretX < visibleLeft) scrollX = Math.max(0, naturalCaretX - visibleLeft);
        else if (visibleCaretX > visibleRight) scrollX = Math.max(0, naturalCaretX - visibleRight);
      }
      return snapshot(naturalCaretX, policy);
    },
    snapshot,
  };
}
