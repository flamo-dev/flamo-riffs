export interface FlamoColor { r: number; g: number; b: number; a: number }
export interface FlamoPaint {
  kind: 'solid' | 'linear-gradient' | 'radial-gradient' | 'angular-gradient' | 'diamond-gradient' | 'image' | 'unknown';
  visible: boolean; opacity: number; blendMode: string; color?: FlamoColor;
  stops?: Array<{position: number; color: FlamoColor}>;
  assetId?: string; fit?: 'fill' | 'fit' | 'crop' | 'tile' | 'stretch';
}
export interface FlamoInteractionTargetStatus { generation: number; destroyed: boolean; diagnostics: Record<string, string> }
export interface FlamoInteractionEvent { type: string; coordinates: { world: {x:number;y:number}; local?: {x:number;y:number} }; preventDefault(): void; stopPropagation(): void }
export interface FlamoInteractionSnapshot {
  geometry: { size: { width: number; height: number }; [key:string]: unknown };
  appearance?: { fills: FlamoPaint[]; strokes: FlamoPaint[]; [key:string]: unknown };
  [key:string]: unknown;
}
export interface FlamoInteractionTarget {
  readonly id: string; readonly name: string;
  get(path: string): unknown; set(path: string, value: unknown): this; patch(value: Record<string, unknown>): this;
  design(): FlamoInteractionSnapshot; current(): Promise<FlamoInteractionSnapshot>;
  setFillColor(color: {r:number;g:number;b:number;a?:number}): this;
  setText(text:string): this; setVisible(visible:boolean): this; setOpacity(value:number): this;
  worldToLocal(point:{x:number;y:number}): {x:number;y:number} | null;
  on(event: string, handler: (event: FlamoInteractionEvent) => void, options?: {capture?:boolean;once?:boolean;passive?:boolean}): () => void;
}

export interface FlamoSaltlineElementProps {

}

export interface FlamoSaltlineElementEventMap {
  "flamo-interaction-targets-change": CustomEvent<{generation:number;targetIds:string[]}>;
  "flamo-disconnected": CustomEvent<null>;
  "flamo-destroyed": CustomEvent<null>;
  "flamo-integration-error": CustomEvent<{targetId:string;message:string}>;
}

export declare class FlamoSaltlineElement extends HTMLElement {
  ready: Promise<this> | null;
  runtime: unknown;
  instance: unknown;
  app: unknown;
  flamo: unknown;


  getInteractionTarget(targetId: string): FlamoInteractionTarget | null;
  inspectInteractionTargets(): FlamoInteractionTargetStatus;
  slotStyles: string;
  reloadInteractions(): Promise<unknown>;
  syncSlots(): void;
  destroy(): Promise<void>;
  addEventListener<K extends keyof FlamoSaltlineElementEventMap>(type: K, listener: (this: FlamoSaltlineElement, event: FlamoSaltlineElementEventMap[K]) => unknown, options?: boolean | AddEventListenerOptions): void;
  addEventListener(type: string, listener: EventListenerOrEventListenerObject | null, options?: boolean | AddEventListenerOptions): void;
}

declare global {
  interface HTMLElementTagNameMap {
    'flamo-saltline': FlamoSaltlineElement;
  }
}

export declare const componentRef: string;
export declare const runtimeAbi: string;
export declare const componentAbi: string;
export declare const tagName: 'flamo-saltline';
export declare function registerFlamoComponent(): void;
export declare const flamoComponentManifest: unknown;
export default FlamoSaltlineElement;
