import { createCursorBlink } from '../base/use-cursor-blink';
import { createSingleLineViewport, type SingleLineViewportSnapshot, type ViewportPolicy } from '../base/single-line-viewport';
import type { InteractionContext } from '../types';
import { useTextInput, type TextInputController, type TextInputState } from './use-text-input';

export interface SingleLineTextEditorSnapshot extends SingleLineViewportSnapshot {
  value: string;
  caretIndex: number;
  selectionStart: number;
  selectionEnd: number;
  selectionCollapsed: boolean;
  selectionLeftX: number;
  selectionRightX: number;
  selectionWidth: number;
  textBeforeSelectionWidth: number;
  selectedTextWidth: number;
  textBeforeCaretWidth: number;
  textWidth: number;
  /** Width that should be assigned to the rendered TEXT node to avoid runtime text texture compression. */
  contentWidth: number;
  focused: boolean;
  cursorLit: boolean;
}

export interface SingleLineTextEditorOptions {
  initialValue?: unknown;
  viewportWidth: number;
  contentStartX?: number;
  cursorWidth?: number;
  blinkMs?: number;
  measureText: (text: string) => number;
  onRender: (snapshot: SingleLineTextEditorSnapshot) => void;
  onCommit?: (value: string) => void;
  inputFactory?: () => HTMLInputElement | null;
}

export interface SingleLineTextEditorController {
  readonly input: TextInputController;
  readonly snapshot: SingleLineTextEditorSnapshot;
  /** Call from pointerdown, before a hidden DOM input can blur. The text offset is local to the rendered content node. */
  placeCaretFromPointer(textOffsetX: number): void;
  indexFromPointer(textOffsetX: number): number;
  moveCaret(delta: number): void;
  moveCaretTo(index: number, policy?: ViewportPolicy): void;
  setSelection(selectionStart: number, selectionEnd?: number, policy?: ViewportPolicy, focusIndex?: number): void;
  selectAll(policy?: ViewportPolicy): void;
  focus(selectionStart?: number, selectionEnd?: number): void;
  blur(): void;
  dispose(): void;
}

export function useSingleLineTextEditor(ctx: InteractionContext, options: SingleLineTextEditorOptions): SingleLineTextEditorController {
  const viewport = createSingleLineViewport(options);
  let suppressNextBlur = false;
  let cursorLit = false;
  let latest!: SingleLineTextEditorSnapshot;
  let input!: TextInputController;
  let selectionFocusIndex = 0;
  const schedule = (fn: () => void) => {
    if (ctx.schedule) {
      ctx.schedule(fn);
      return;
    }
    if (typeof queueMicrotask === 'function') {
      queueMicrotask(fn);
      return;
    }
    Promise.resolve().then(fn);
  };

  const measure = (text: string) => normalizeMeasuredWidth(options.measureText(text));
  const resolveSelectionBounds = (state: TextInputState) => ({
    start: Math.min(state.selectionStart, state.selectionEnd),
    end: Math.max(state.selectionStart, state.selectionEnd),
  });
  const resolveFocusIndex = (state: TextInputState, focusIndex: number = selectionFocusIndex) => {
    const { start, end } = resolveSelectionBounds(state);
    if (start === end) return end;
    return clamp(focusIndex, start, end);
  };
  const naturalTextX = (index: number, state: TextInputState) => (options.contentStartX ?? 0) + measure(state.value.slice(0, index));
  const render = (policy: ViewportPolicy, state: TextInputState = input.state, focusIndex: number = selectionFocusIndex) => {
    const { start, end } = resolveSelectionBounds(state);
    const collapsed = start === end;
    const caretIndex = resolveFocusIndex(state, focusIndex);
    selectionFocusIndex = caretIndex;
    const beforeSelectionWidth = measure(state.value.slice(0, start));
    const beforeWidth = measure(state.value.slice(0, caretIndex));
    const selectedTextWidth = measure(state.value.slice(start, end));
    const fullWidth = measure(state.value);
    const contentWidth = textNodeContentWidth(fullWidth);
    const selectionLeftX = naturalTextX(start, state);
    latest = {
      ...viewport.apply(naturalTextX(caretIndex, state), policy),
      value: state.value,
      caretIndex,
      selectionStart: start,
      selectionEnd: end,
      selectionCollapsed: collapsed,
      selectionLeftX: selectionLeftX - viewport.scrollX,
      selectionRightX: selectionLeftX + selectedTextWidth - viewport.scrollX,
      selectionWidth: selectedTextWidth,
      textBeforeSelectionWidth: beforeSelectionWidth,
      selectedTextWidth,
      textBeforeCaretWidth: beforeWidth,
      textWidth: fullWidth,
      contentWidth,
      focused: state.focused,
      cursorLit,
    };
    ctx.trace?.('single-line-editor.render', {
      policy,
      caretIndex: latest.caretIndex,
      selectionStart: latest.selectionStart,
      selectionEnd: latest.selectionEnd,
      selectionCollapsed: latest.selectionCollapsed,
      scrollX: latest.scrollX,
      caretX: latest.caretX,
      contentX: latest.contentX,
      selectionLeftX: latest.selectionLeftX,
      selectionWidth: latest.selectionWidth,
      textBeforeCaretWidth: latest.textBeforeCaretWidth,
      textWidth: latest.textWidth,
      contentWidth: latest.contentWidth,
      visibleLeft: latest.visibleLeft,
      visibleRight: latest.visibleRight,
      focused: latest.focused,
    });
    options.onRender(latest);
  };
  const blink = createCursorBlink({
    intervalMs: options.blinkMs,
    onChange(lit) {
      cursorLit = lit;
      if (input) render('preserve');
    },
  });

  input = useTextInput(ctx, {
    initialValue: options.initialValue,
    inputFactory: options.inputFactory,
    onValue(_value, state) {
      selectionFocusIndex = state.selectionEnd;
      render('reveal-caret', state, selectionFocusIndex);
    },
    onFocus(focused, state) {
      ctx.trace?.(focused ? 'single-line-editor.focus' : 'single-line-editor.blur', { suppressNextBlur });
      if (focused) {
        suppressNextBlur = false;
        blink.start();
        render('preserve', state, selectionFocusIndex);
      } else if (suppressNextBlur) {
        ctx.trace?.('single-line-editor.blur-suppressed', { reason: 'internal-pointer-refocus' });
      } else {
        blink.stop();
        render('reset-start', state, selectionFocusIndex);
      }
    },
    onCommit(value) { options.onCommit?.(value); },
    onKeyDown(event, state) {
      if (event.shiftKey || event.altKey || event.ctrlKey || event.metaKey) return;
      const target = keyTarget(event.key, state.selectionStart, state.selectionEnd, state.value.length);
      if (target === null) return;
      ctx.trace?.('single-line-editor.key-move', {
        key: event.key,
        from: state.selectionStart,
        to: target,
        selectionEnd: state.selectionEnd,
      });
      event.preventDefault();
      input.setSelection(target);
      selectionFocusIndex = target;
      blink.reset();
      render('reveal-caret', input.state, selectionFocusIndex);
    },
  });

  selectionFocusIndex = input.state.selectionEnd;
  render('reset-start');

  const controller: SingleLineTextEditorController = {
    input,
    get snapshot() { return latest; },
    placeCaretFromPointer(textOffsetX) {
      suppressNextBlur = true;
      const caretIndex = controller.indexFromPointer(textOffsetX);
      ctx.trace?.('single-line-editor.pointer-place', { textOffsetX, caretIndex, scrollX: viewport.scrollX });
      input.setSelection(caretIndex);
      selectionFocusIndex = caretIndex;
      render('preserve', input.state, caretIndex);
      schedule(() => {
        input.focus(caretIndex, caretIndex);
        suppressNextBlur = false;
      });
    },
    indexFromPointer(textOffsetX) {
      return textOffsetToCaret(textOffsetX, input.state.value, measure);
    },
    moveCaret(delta) {
      controller.moveCaretTo(selectionFocusIndex + delta, 'reveal-caret');
    },
    moveCaretTo(index, policy = 'reveal-caret') {
      controller.setSelection(index, index, policy, index);
    },
    setSelection(selectionStart, selectionEnd = selectionStart, policy = 'reveal-caret', focusIndex = selectionEnd) {
      input.setSelection(selectionStart, selectionEnd);
      selectionFocusIndex = resolveFocusIndex(input.state, focusIndex);
      ctx.trace?.('single-line-editor.selection', {
        selectionStart: input.state.selectionStart,
        selectionEnd: input.state.selectionEnd,
        focusIndex: selectionFocusIndex,
        policy,
      });
      render(policy, input.state, selectionFocusIndex);
    },
    selectAll(policy = 'reveal-caret') {
      const end = input.state.value.length;
      suppressNextBlur = true;
      controller.setSelection(0, end, policy, end);
      ctx.trace?.('single-line-editor.select-all', { length: end, policy });
      schedule(() => {
        input.focus(0, end);
        suppressNextBlur = false;
      });
    },
    focus(selectionStart = selectionFocusIndex, selectionEnd = selectionStart) {
      input.focus(selectionStart, selectionEnd);
    },
    blur() { input.blur(); },
    dispose() {
      blink.dispose();
      input.dispose();
    },
  };
  return controller;
}

function keyTarget(key: string, selectionStart: number, selectionEnd: number, length: number): number | null {
  const start = Math.min(selectionStart, selectionEnd);
  const end = Math.max(selectionStart, selectionEnd);
  const collapsed = start === end;
  if (key === 'ArrowLeft') return collapsed ? Math.max(0, start - 1) : start;
  if (key === 'ArrowRight') return collapsed ? Math.min(length, end + 1) : end;
  if (key === 'Home') return 0;
  if (key === 'End') return length;
  return null;
}

export function textOffsetToCaret(offsetX: number, text: string, measureText: (text: string) => number): number {
  if (offsetX <= 0) return 0;
  for (let index = 0; index < text.length; index += 1) {
    const left = measureText(text.slice(0, index));
    const right = measureText(text.slice(0, index + 1));
    if (offsetX < (left + right) / 2) return index;
  }
  return text.length;
}

function normalizeMeasuredWidth(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function textNodeContentWidth(textWidth: number): number {
  // Flamo runtime's Canvas text path intentionally rasterizes text into a
  // `ceil(measuredTextWidth) + 1` texture to avoid edge clipping. The TEXT node
  // box used by dynamic editors must be at least that wide; otherwise the
  // renderer maps the wider texture back into a smaller box and visually
  // compresses the text while the caret still follows the natural measurement.
  return Math.max(1, Math.ceil(textWidth) + 1);
}
