export const interactionModules = [
  {
    "scriptId": "managed:hmi.pipe-flow@2.6.0",
    "compiled": ".flamo/interaction-library/managed/behaviors/hmi.pipe-flow/2.6.0.js",
    "entry": "./managed/behaviors/hmi.pipe-flow/2.6.0.js"
  }
];

// Browser ESM caching avoids transfers, but repeated import() still schedules
// asynchronous work. Reuse in-flight and resolved loads across remounts.
// Cache modules only: Runtime must still register/dispose each instance.
const moduleLoads = new Map();
let bundleLoad;
function loadBundle() {
  return bundleLoad ??= import('./bundle.js').catch(error => {
    bundleLoad = undefined;
    throw error;
  });
}
function loadModule(entry) {
  let pending = moduleLoads.get(entry);
  if (!pending) {
    pending = loadBundle().then(bundle => bundle.modules[entry]());
    pending = pending.catch(error => {
      moduleLoads.delete(entry);
      throw error;
    });
    moduleLoads.set(entry, pending);
  }
  return pending;
}

// Preload only the lazy bundle container. Native modules may have side
// effects, so the native fallback must keep its original evaluation time.
export async function preload() {
  await loadBundle();
}

export async function resolveNodeScript(script = {}) {
  const scriptId = String(script?.id ?? '');
  const compiled = String(script?.compiled ?? (scriptId ? '.flamo/generated/interactions/scripts/' + scriptId + '/register.js' : ''))
    .replace(/\\/g, '/').replace(/^\/+/, '');
  const match = interactionModules.find(module => module.scriptId === scriptId || module.compiled === compiled);
  return match ? loadModule(match.entry) : null;
}

// Runtime mounts nodeArtifact scripts through resolveNodeScript.
// Keep the legacy entry inert so reloadInteractions() cannot double-mount them.
export function activateLatest() {
  return undefined;
}

export const latestTaskId = null;
