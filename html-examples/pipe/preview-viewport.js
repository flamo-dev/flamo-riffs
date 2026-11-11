// Demo-owned framing policy. Exported contain fitting uses the root's path
// bounds, which exclude centered strokes and caps. Fit the painted footprint
// with a screen-space gutter through public camera APIs; keep exports intact.
export function attachPipePreview(element, flowRootIds) {
  const instance = element.instance;
  const app = element.app;
  let frame = 0;
  let disposed = false;
  let strokeOutset = 0;

  for (const id of flowRootIds) {
    const roles = instance.artifact.nodeArtifacts[id]?.roles ?? {};
    for (const role of ['wall', 'medium', 'flow']) {
      const nodeId = roles[role];
      if (!nodeId) continue;
      const stroke = instance.scene.get(nodeId)?.design().appearance?.stroke;
      const probe = app.getNodeProbeSnapshot(nodeId);
      if (!stroke || !probe) continue;
      const transform = probe.worldTransform;
      const scale = transform
        ? Math.max(Math.hypot(transform.m00, transform.m10), Math.hypot(transform.m01, transform.m11)) : 1;
      // Reserve a conservative four half-widths for sharp miter joins.
      const joinFactor = stroke.join === 'MITER' ? 4 : 1;
      strokeOutset = Math.max(strokeOutset, stroke.width * scale * joinFactor / 2);
    }
  }

  function fit() {
    frame = 0;
    if (disposed || !element.isConnected || element.instance !== instance) return;
    const bounds = app.getNodeProbeSnapshot(instance.root.id)?.bounds;
    const width = element.clientWidth;
    const height = element.clientHeight;
    if (!bounds || !width || !height) return;
    const gutter = 12;
    const paintedWidth = bounds.width + strokeOutset * 2;
    const paintedHeight = bounds.height + strokeOutset * 2;
    const zoom = Math.min((width - gutter * 2) / paintedWidth, (height - gutter * 2) / paintedHeight);
    if (!Number.isFinite(zoom) || zoom <= 0) return;
    app.setCamera({
      zoom,
      rotation: 0,
      positionX: (bounds.x + bounds.width / 2) * zoom - width / 2,
      positionY: (bounds.y + bounds.height / 2) * zoom - height / 2,
    });
  }

  // Apply after the export's own ResizeObserver has updated its canvas size.
  // Recompute from original bounds every time, never from the previous zoom.
  const schedule = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(fit);
  };
  const observer = new ResizeObserver(schedule);
  observer.observe(element);
  fit();
  schedule();
  return () => {
    disposed = true;
    observer.disconnect();
    cancelAnimationFrame(frame);
  };
}
