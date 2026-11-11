// The pinned ZIPs use absolute loopback URLs for module imports AND the worker asset base.
export function isExportEntry(path) {
  return /(?:^|\/)pipe\/flamo-pipe-(1|2|3|4|group)-web-component\/dist\/(?:cdn-config|flamo-pipe-\1)\.js$/.test(path);
}
export function relocateExport(path, text) {
  if (!isExportEntry(path)) return text;
  return text.replaceAll('http://localhost:8080/common/', '/common/');
}

