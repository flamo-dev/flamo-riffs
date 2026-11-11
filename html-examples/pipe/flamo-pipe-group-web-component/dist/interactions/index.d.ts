export interface PackagedInteractionModuleEntry {
  scriptId: string;
  compiled: string;
  entry: string;
}

export const interactionModules: PackagedInteractionModuleEntry[];
export function preload(): Promise<void>;
export function resolveNodeScript(script?: any): Promise<any> | any;
export function activateLatest(runtime?: any): Promise<any> | any;
export const latestTaskId: null;
