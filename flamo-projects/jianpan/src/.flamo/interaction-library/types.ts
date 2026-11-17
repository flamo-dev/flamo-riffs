export interface InteractionEntityHandle {
  set(path: string, value: unknown): void;
  setText?(value: string, options?: { preserveStyle?: boolean }): void;
  setVisible?(visible: boolean): void;
  setOpacity?(opacity: number): void;
}

export interface InteractionContext {
  reactive<T extends object>(value: T): T;
  /** Schedule work after the current event turn using the host runtime scheduler. */
  schedule?(fn: () => void): void;
  dispose(cleanup: () => void): void;
  trace?(action: string, detail?: unknown): void;
}
