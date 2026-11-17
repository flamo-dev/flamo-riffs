export type NumberBindingAxis = 'width' | 'height';

/** Structural subset of the public Runtime layout contract, not an engine dependency. */
export interface NumberBindingLayoutSnapshot {
  source: 'design' | 'runtime';
  owners: Record<NumberBindingAxis, { owner: 'input' | 'parent-layout' | 'content' }>;
  contentBox: { width: number; height: number };
  borderBox: { width: number; height: number };
}

export interface NumberBindingLayoutHandle {
  readonly id: string;
  layout(): NumberBindingLayoutSnapshot | null;
}

export interface NumberBindingSizeHandle extends NumberBindingLayoutHandle {
  setWidth(value: number): void;
  setHeight(value: number): void;
  setVisible(value: boolean): void;
}

export interface NumberBindingContext {
  watch<T>(read: () => T, callback: (value: T, oldValue?: T) => void): () => void;
  /** Immediately reports current layout, then changed snapshots; owned by the script. */
  observeLayout(ref: string, callback: (layout: NumberBindingLayoutSnapshot | null) => void): () => void;
  assertLayoutWritable(ref: string, properties: readonly string[]): void;
  dispose(cleanup: () => void): void;
  trace?(action: string, detail?: unknown): void;
}

export interface NumberBindingOptions {
  range: readonly [number, number];
  size?: { target: NumberBindingSizeHandle; axis: NumberBindingAxis; reference: NumberBindingLayoutHandle; box: 'content' | 'border'; hideAtMinimum?: boolean };
  text?: { target: { readonly id: string; setText(value: string): void }; fractionDigits: number };
}

/** Linear size projection and decimal display policy. Uses only public script capabilities. */
export function bindNumber(ctx: NumberBindingContext, readValue: () => number, options: NumberBindingOptions): () => void {
  const [minimum, maximum] = options.range;
  if (!Number.isFinite(minimum) || !Number.isFinite(maximum) || maximum <= minimum) throw new RangeError('Number binding requires a finite increasing range');
  if (!options.size && !options.text) throw new TypeError('Number binding requires a size or text target');
  const digits = options.text?.fractionDigits;
  if (digits !== undefined && (!Number.isInteger(digits) || digits < 0 || digits > 20)) throw new RangeError('fractionDigits must be an integer from 0 to 20');
  if (options.size && !['width', 'height'].includes(options.size.axis)) throw new TypeError('Unknown number binding axis');
  if (options.size && !['content', 'border'].includes(options.size.box)) throw new TypeError('Number binding requires an explicit reference box');
  if (options.size && options.size.target.id === options.size.reference.id) throw new TypeError('Number binding cannot measure its own target');
  let stopped = false;
  let previous = '';
  let stopWatch = () => {};
  let stopLayout = () => {};
  const update = () => {
    if (stopped) return;
    const value = readValue();
    if (!Number.isFinite(value) || value < minimum || value > maximum) return;
    const size = options.size;
    const layout = size?.reference.layout();
    if (size && (!layout || layout.source !== 'runtime')) return;
    if (size && layout!.owners[size.axis].owner === 'content') throw new Error('Number binding reference must not derive its measured dimension from target content');
    const extent = size ? (size.box === 'content' ? layout!.contentBox : layout!.borderBox)[size.axis] : 0;
    const projected = extent * (value - minimum) / (maximum - minimum);
    const text = options.text ? value.toFixed(options.text.fractionDigits) : undefined;
    const signature = JSON.stringify([value, extent]);
    if (signature === previous) return;
    // Framework preflight occurs before either geometry or text is submitted.
    if (size) ctx.assertLayoutWritable(size.target.id, [size.axis]);
    if (size?.axis === 'height') size.target.setHeight(projected);
    if (size?.axis === 'width') size.target.setWidth(projected);
    if (size?.hideAtMinimum) size.target.setVisible(value > minimum);
    if (options.text) options.text.target.setText(text!);
    previous = signature;
    ctx.trace?.('binding.number.applied', { value, minimum, maximum, extent, projected, text,
      targetNodeId: size?.target.id, referenceNodeId: size?.reference.id, textNodeId: options.text?.target.id,
      axis: size?.axis, box: size?.box });
  };
  const stop = () => {
    if (stopped) return;
    stopped = true;
    stopWatch();
    stopLayout();
  };
  ctx.dispose(stop);
  try {
    stopWatch = ctx.watch(readValue, update);
    if (options.size) stopLayout = ctx.observeLayout(options.size.reference.id, update);
    else update();
  } catch (error) { stop(); throw error; }
  return stop;
}
