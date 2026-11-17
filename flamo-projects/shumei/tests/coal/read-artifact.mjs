import fs from 'node:fs';

// Studio may persist a resource-backed head. Tests accept a hydrated export from
// the official Artifact reader without changing the project's stored document.
export function readArtifact() {
  const path = process.env.FLAMO_ARTIFACT_JSON || 'view/data/artifact.flamo.json';
  const value = JSON.parse(fs.readFileSync(path, 'utf8'));
  if (value.kind === 'flamo.artifact.storage') throw new Error('Set FLAMO_ARTIFACT_JSON to a semantic export produced by the official Artifact reader.');
  return value;
}
