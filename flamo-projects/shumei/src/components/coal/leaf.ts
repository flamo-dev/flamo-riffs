import { defineNodeScript } from '/vendor/flamo-runtime/index.js';
import { mapping } from './mapping';
import { mountDevice } from './device';
export default defineNodeScript({ setup(props, ctx) {
 const m=mapping.find(m=>m.node===ctx.sourceNodeId);
 if(!m)throw new Error('Unknown coal local target '+ctx.sourceNodeId);
 mountDevice(ctx,props,{kind:m.kind,flowTargets:'flowTargets' in m?m.flowTargets:undefined});
} });
