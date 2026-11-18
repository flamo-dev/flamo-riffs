import type { InteractionContext } from '../types';

export interface TextInputState {
  value: string;
  focused: boolean;
  composing: boolean;
  selectionStart: number;
  selectionEnd: number;
}

export interface TextInputOptions {
  initialValue?: unknown;
  commitKeys?: readonly string[];
  blurOnCommit?: boolean;
  ariaLabel?: string;
  inputFactory?: () => HTMLInputElement | null;
  onValue?: (value: string, state: TextInputState) => void;
  onFocus?: (focused: boolean, state: TextInputState) => void;
  onCommit?: (value: string, state: TextInputState) => void;
  onKeyDown?: (event: KeyboardEvent, state: TextInputState) => void;
}

export interface TextInputController {
  state: TextInputState;
  focus(selectionStart?: number, selectionEnd?: number): void;
  blur(): void;
  setSelection(selectionStart: number, selectionEnd?: number): void;
  setValue(value: unknown): void;
  getValue(): string;
  dispose(): void;
}

export function useTextInput(ctx: InteractionContext, options: TextInputOptions = {}): TextInputController {
  const initialValue = toText(options.initialValue);
  const state = ctx.reactive<TextInputState>({
    value: initialValue,
    focused: false,
    composing: false,
    selectionStart: initialValue.length,
    selectionEnd: initialValue.length,
  });
  const input = options.inputFactory?.() ?? createHiddenTextInput(options.ariaLabel);
  const commitKeys = new Set(options.commitKeys ?? ['Enter']);
  let disposed = false;
  let pendingBlur: ReturnType<typeof globalThis.setTimeout> | null = null;

  const publishValue = () => options.onValue?.(state.value, state);
  const cancelPendingBlur = () => {
    if (pendingBlur === null) return;
    globalThis.clearTimeout(pendingBlur);
    pendingBlur = null;
  };
  const setFocused = (focused: boolean) => {
    if (state.focused === focused) return;
    state.focused = focused;
    options.onFocus?.(focused, state);
  };
  const syncFromInput = () => {
    if (!input) return;
    state.value = input.value;
    syncSelectionFromInput();
    ctx.trace?.('text-input.input', {
      valueLength: state.value.length,
      selectionStart: state.selectionStart,
      selectionEnd: state.selectionEnd,
    });
    publishValue();
  };
  const onFocus = () => {
    cancelPendingBlur();
    syncSelectionFromInput();
    ctx.trace?.('text-input.focus');
    setFocused(true);
  };
  const onBlur = () => {
    cancelPendingBlur();
    ctx.trace?.('text-input.blur.pending');
    pendingBlur = globalThis.setTimeout(() => {
      pendingBlur = null;
      ctx.trace?.('text-input.blur');
      setFocused(false);
    }, 0);
  };
  const onCompositionStart = () => { state.composing = true; ctx.trace?.('text-input.compositionstart'); };
  const onCompositionEnd = () => {
    state.composing = false;
    ctx.trace?.('text-input.compositionend');
    syncFromInput();
  };
  const onKeyDown = (event: KeyboardEvent) => {
    syncSelectionFromInput();
    ctx.trace?.('text-input.keydown', {
      key: event.key,
      selectionStart: state.selectionStart,
      selectionEnd: state.selectionEnd,
      composing: state.composing || event.isComposing,
    });
    options.onKeyDown?.(event, state);
    if (event.defaultPrevented) return;
    if (state.composing || event.isComposing) return;
    if (event.key === 'Escape') {
      input?.blur();
      return;
    }
    if (commitKeys.has(event.key)) {
      options.onCommit?.(state.value, state);
      if (options.blurOnCommit ?? true) input?.blur();
      return;
    }
  };

  input?.addEventListener('input', syncFromInput);
  input?.addEventListener('focus', onFocus);
  input?.addEventListener('blur', onBlur);
  input?.addEventListener('select', syncSelectionFromInput);
  input?.addEventListener('compositionstart', onCompositionStart);
  input?.addEventListener('compositionend', onCompositionEnd);
  input?.addEventListener('keydown', onKeyDown);
  input?.addEventListener('keyup', syncSelectionFromInput);
  if (input) input.value = state.value;

  const dispose = () => {
    if (disposed) return;
    disposed = true;
    cancelPendingBlur();
    input?.removeEventListener('input', syncFromInput);
    input?.removeEventListener('focus', onFocus);
    input?.removeEventListener('blur', onBlur);
    input?.removeEventListener('select', syncSelectionFromInput);
    input?.removeEventListener('compositionstart', onCompositionStart);
    input?.removeEventListener('compositionend', onCompositionEnd);
    input?.removeEventListener('keydown', onKeyDown);
    input?.removeEventListener('keyup', syncSelectionFromInput);
    input?.remove();
  };
  ctx.dispose(dispose);

  return {
    state,
    focus(selectionStart = state.selectionEnd, selectionEnd = selectionStart) {
      if (!input || disposed) return;
      cancelPendingBlur();
      input.value = state.value;
      input.focus({ preventScroll: true });
      setSelection(selectionStart, selectionEnd);
    },
    blur: () => input?.blur(),
    setSelection,
    setValue(value: unknown) {
      state.value = toText(value);
      if (input) {
        input.value = state.value;
        setSelection(
          Math.min(state.selectionStart, state.value.length),
          Math.min(state.selectionEnd, state.value.length),
        );
      }
      publishValue();
    },
    getValue: () => state.value,
    dispose,
  };

  function setSelection(selectionStart: number, selectionEnd: number = selectionStart): void {
    const nextStart = clamp(Math.min(selectionStart, selectionEnd), 0, state.value.length);
    const nextEnd = clamp(Math.max(selectionStart, selectionEnd), 0, state.value.length);
    state.selectionStart = nextStart;
    state.selectionEnd = nextEnd;
    input?.setSelectionRange(nextStart, nextEnd);
  }

  function syncSelectionFromInput(): void {
    if (!input) return;
    const fallback = state.value.length;
    const start = clamp(input.selectionStart ?? fallback, 0, state.value.length);
    const end = clamp(input.selectionEnd ?? start, 0, state.value.length);
    state.selectionStart = Math.min(start, end);
    state.selectionEnd = Math.max(start, end);
  }
}

function createHiddenTextInput(ariaLabel?: string): HTMLInputElement | null {
  if (typeof document === 'undefined') return null;
  const input = document.createElement('input');
  input.type = 'text';
  input.autocomplete = 'off';
  input.spellcheck = false;
  input.setAttribute('aria-label', ariaLabel ?? 'Canvas text input');
  Object.assign(input.style, {
    position: 'fixed', left: '0', top: '0', width: '1px', height: '1px', opacity: '0',
    pointerEvents: 'none', border: '0', outline: '0', background: 'transparent', color: 'transparent',
    caretColor: 'transparent',
  });
  document.body.appendChild(input);
  return input;
}

function toText(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
