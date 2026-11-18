import { MOTION_SHAPES, motionTransform, type MotionMaterial, type MotionPose, type MotionPoolSlot } from '@flamo/hmi';

export interface ShapeBatch {
  update(data: Float32Array, count: number): void;
  dispose(): void;
}
export interface ShapeBatchContext {
  createShapeBatch(options: { node: { readonly id: string }; polygon: readonly number[]; capacity: number }): ShapeBatch;
}

/** Preserve the original pool's item/material draw ordering, including transparent copies. */
export function createMotionBatches(ctx: ShapeBatchContext, node: { readonly id: string }, slots: MotionPoolSlot[], materials: MotionMaterial[]) {
  const counts = new Map<string, { material: MotionMaterial; count: number }>();
  for (const slot of slots) {
    const material = materials.find(m => m.id === slot.materialId)!;
    if (material.shape === 'image') continue;
    const key = `${slot.itemId}/${slot.materialId}`;
    const bucket = counts.get(key) ?? { material, count: 0 };
    bucket.count++; counts.set(key, bucket);
  }
  const batches: Array<{ key: string; material: MotionMaterial; data: Float32Array; handle: ShapeBatch }> = [];
  try {
    for (const [key, { material, count }] of counts) {
      const points = material.shape === 'dot'
        ? Array.from({ length: 64 }, (_, i) => ({ x: .5 + .5 * Math.cos(i * Math.PI / 32), y: .5 + .5 * Math.sin(i * Math.PI / 32) }))
        : MOTION_SHAPES[material.shape as keyof typeof MOTION_SHAPES];
      batches.push({ key, material, data: new Float32Array(count * 10), handle: ctx.createShapeBatch({ node, polygon: points.flatMap(p => [p.x, p.y]), capacity: count }) });
    }
  } catch (error) { for (const b of batches) b.handle.dispose(); throw error; }
  const colors = new Map<string, number[]>();
  return {
    size: batches.length,
    render(queues: Map<string, MotionPose[]>) {
      for (const b of batches) {
        const poses = queues.get(b.key) ?? [];
        if (poses.length * 10 > b.data.length) throw new RangeError('Motion batch exceeded authored capacity');
        for (let i = 0; i < poses.length; i++) {
          const p = poses[i], t = motionTransform(p, b.material.aspect), angle = p.rotation * Math.PI / 180;
          const c = Math.cos(angle), s = Math.sin(angle), o = i * 10;
          let rgb = colors.get(p.color);
          if (!rgb) { rgb = [1, 3, 5].map(start => parseInt(p.color.slice(start, start + 2), 16) / 255); colors.set(p.color, rgb); }
          b.data[o] = c * t.scaleX; b.data[o + 1] = s * t.scaleX;
          b.data[o + 2] = -s * t.scaleY; b.data[o + 3] = c * t.scaleY;
          b.data[o + 4] = t.x; b.data[o + 5] = t.y;
          b.data[o + 6] = rgb[0]; b.data[o + 7] = rgb[1]; b.data[o + 8] = rgb[2]; b.data[o + 9] = p.opacity;
        }
        b.handle.update(b.data, poses.length);
      }
    },
    dispose() { for (const b of batches) b.handle.dispose(); },
  };
}
