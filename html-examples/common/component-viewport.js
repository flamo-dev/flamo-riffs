/** Web Component host policy. Uses only DOM and public FlamoApp camera APIs. */
export function computeComponentViewport(bounds, width, height, fit = 'contain') {
  if (![bounds?.x, bounds?.y, bounds?.width, bounds?.height, width, height].every(Number.isFinite)
    || bounds.width <= 0 || bounds.height <= 0 || width <= 0 || height <= 0) return null;
  const zoom = fit === 'width' ? width / bounds.width
    : fit === 'height' ? height / bounds.height
      : Math.min(width / bounds.width, height / bounds.height);
  const contentWidth = bounds.width * zoom;
  const contentHeight = bounds.height * zoom;
  return {
    zoom,
    width: fit === 'height' ? Math.max(width, contentWidth) : width,
    height: fit === 'width' ? Math.max(height, contentHeight) : height,
    positionX: bounds.x * zoom - Math.max(0, (width - contentWidth) / 2),
    positionY: bounds.y * zoom - Math.max(0, (height - contentHeight) / 2),
    rotation: 0,
  };
}

export function attachComponentViewport(host, app, getBounds, options) {
  const viewport = host.shadowRoot.querySelector('.viewport');
  const extent = host.shadowRoot.querySelector('.extent');
  const canvas = host.canvas;
  const fit = options.fit;
  viewport.style.overflowX = fit === 'height' ? 'auto' : 'hidden';
  viewport.style.overflowY = fit === 'width' ? 'auto' : 'hidden';
  // EventManager installs touch-action:none; native host scrolling is opt-in.
  canvas.style.touchAction = fit === 'width' ? 'pan-y' : fit === 'height' ? 'pan-x' : 'none';
  let lastSize = '';
  let scrollX = viewport.scrollLeft;
  let scrollY = viewport.scrollTop;
  let disposed = false;
  const resize = () => {
    if (disposed) return;
    const bounds = getBounds();
    const size = [viewport.clientWidth, viewport.clientHeight, bounds?.x, bounds?.y, bounds?.width, bounds?.height].join(':');
    if (size === lastSize) return;
    let layout;
    // A newly visible scrollbar changes the available client size. Converge now.
    for (let pass = 0; pass < 3; pass++) {
      const width = viewport.clientWidth;
      const height = viewport.clientHeight;
      layout = computeComponentViewport(bounds, width, height, fit);
      if (!layout) { lastSize = ''; return; }
      extent.style.width = layout.width + 'px';
      extent.style.height = layout.height + 'px';
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      if (width === viewport.clientWidth && height === viewport.clientHeight) break;
    }
    scrollX = viewport.scrollLeft;
    scrollY = viewport.scrollTop;
    app.setCamera({ zoom: layout.zoom, rotation: 0,
      positionX: layout.positionX + scrollX, positionY: layout.positionY + scrollY });
    lastSize = [viewport.clientWidth, viewport.clientHeight, bounds.x, bounds.y, bounds.width, bounds.height].join(':');
  };
  const scroll = () => {
    const current = app.getCamera();
    app.setCamera({ positionX: current.positionX + viewport.scrollLeft - scrollX,
      positionY: current.positionY + viewport.scrollTop - scrollY });
    scrollX = viewport.scrollLeft;
    scrollY = viewport.scrollTop;
  };
  const observer = new ResizeObserver(resize);
  observer.observe(viewport);
  viewport.addEventListener('scroll', scroll, { passive: true });
  resize();
  return () => {
    disposed = true;
    observer.disconnect();
    viewport.removeEventListener('scroll', scroll);
  };
}
