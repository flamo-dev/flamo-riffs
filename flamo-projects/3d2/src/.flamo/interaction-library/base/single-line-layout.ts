export interface SingleLineLayoutOptions {
  bodyWidth: number;
  contentX?: number;
  cursorWidth?: number;
  focused?: boolean;
}

export interface SingleLineLayout {
  contentX: number;
  cursorX: number;
  overflowX: number;
}

export function getSingleLineLayout(
  text: string,
  measureText: (text: string) => number,
  options: SingleLineLayoutOptions,
): SingleLineLayout {
  const contentX = options.contentX ?? 0;
  const cursorWidth = options.cursorWidth ?? 0;
  const textWidth = measureText(text);
  const visibleWidth = Math.max(0, options.bodyWidth - contentX - cursorWidth);
  const overflowX = options.focused ? Math.max(0, textWidth - visibleWidth) : 0;

  return {
    contentX: round(contentX - overflowX),
    cursorX: round(contentX + textWidth - overflowX),
    overflowX: round(overflowX),
  };
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
