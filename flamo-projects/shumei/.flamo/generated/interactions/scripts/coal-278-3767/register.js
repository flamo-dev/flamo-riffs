import { mountCompiledNodeScript } from '/vendor/flamo-runtime/index.es.js';
import * as definitionModule from "./register.definition.js";

export function register(flamo = globalThis.__flamo_api, meta = {}) {
  return mountCompiledNodeScript({ flamo, meta, definition: definitionModule });
}

export default { register };
