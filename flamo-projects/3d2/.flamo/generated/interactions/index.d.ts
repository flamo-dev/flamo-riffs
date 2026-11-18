export interface InteractionModuleEntry {
  taskId: string;
  entry: string;
}

export const interactionModules: InteractionModuleEntry[];
export function activateLatest(runtime?: any): Promise<any> | any;
export const latestTaskId: string | null;
