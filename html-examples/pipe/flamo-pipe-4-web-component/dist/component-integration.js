/** Host helper; only public Custom Element and RuntimeNode APIs are used. */
export function bindInteractionTarget(element, targetId, setup, options = {}) {
  let disposed = false, cleanup, binding;
  const clear = () => {
    const previous = cleanup;
    cleanup = undefined;
    binding?.abort();
    binding = undefined;
    previous?.();
  };
  const fail = error => {
    if (options.onError) options.onError(error);
    else element.dispatchEvent(new CustomEvent('flamo-integration-error', {detail: {targetId, message: String(error)}}));
  };
  const release = () => { try { clear(); } catch (error) { fail(error); } };
  const connect = () => {
    release();
    if (disposed || !element.isConnected || element.getAttribute('data-flamo-state') !== 'ready') return;
    try {
      const node = element.getInteractionTarget(targetId);
      if (!node) { options.onUnavailable?.({targetId, ...element.inspectInteractionTargets()}); return; }
      const currentBinding = new AbortController();
      binding = currentBinding;
      const result = setup(node, {signal: currentBinding.signal});
      if (result !== undefined && typeof result !== 'function') throw new TypeError('setup must return a synchronous disposer or undefined');
      // setup may synchronously disconnect the element or invalidate its target.
      if (binding !== currentBinding || currentBinding.signal.aborted) result?.();
      else cleanup = result;
    } catch (error) { release(); fail(error); }
  };
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    for (const name of ['flamo-ready', 'flamo-interaction-targets-change']) element.removeEventListener(name, connect);
    for (const name of ['flamo-loading', 'flamo-disconnected', 'flamo-destroyed', 'flamo-error']) element.removeEventListener(name, release);
    options.signal?.removeEventListener('abort', dispose);
    release();
  };
  if (options.signal?.aborted) return dispose;
  for (const name of ['flamo-ready', 'flamo-interaction-targets-change']) element.addEventListener(name, connect);
  for (const name of ['flamo-loading', 'flamo-disconnected', 'flamo-destroyed', 'flamo-error']) element.addEventListener(name, release);
  options.signal?.addEventListener('abort', dispose, {once: true});
  connect();
  return dispose;
}

/** A local observation, not independent proof that a business requirement passed. */
export function inspectComponentIntegration(element, manifest, targetIds = Object.keys(manifest.interactionTargets ?? {})) {
  if (targetIds.length > 50) throw new RangeError('Inspect at most 50 targets per observation');
  const status = element.inspectInteractionTargets();
  const descriptor = name => {
    for (let owner = element; owner; owner = Object.getPrototypeOf(owner)) {
      const result = Object.getOwnPropertyDescriptor(owner, name);
      if (result) return result;
    }
    return {};
  };
  return {
    schemaVersion: 1,
    identity: {
      projectId: manifest.projectId, contractId: manifest.integration?.contractId,
      tagName: manifest.tagName, artifactRevision: manifest.packaging.artifactRevision,
      componentRef: manifest.foundation.componentRef,
    },
    state: element.getAttribute('data-flamo-state') ?? 'unupgraded',
    generation: status.generation, destroyed: status.destroyed,
    publicSurface: {
      properties: Object.keys(manifest.surface?.parameters ?? {}).map(name => {
        const member = descriptor(name);
        // A plain own field can shadow the accessor without reaching Runtime.
        return {name, readable: typeof member.get === 'function', writable: typeof member.set === 'function'};
      }),
      methods: Object.keys(manifest.surface?.imperative ?? {}).map(name =>
        ({name, callable: typeof descriptor(name).value === 'function'})),
    },
    targets: targetIds.map(targetId => {
      const resolved = element.getInteractionTarget(targetId) !== null;
      return {targetId, resolved, ...(!resolved ? {diagnostic: element.inspectInteractionTargets().diagnostics[targetId] ?? 'target_not_ready'} : {})};
    }),
  };
}
