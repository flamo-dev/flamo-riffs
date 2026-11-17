import { defineNodeScript } from '/vendor/flamo-runtime/index.js';
import { mapping } from './mapping';
import { snapshot, stateFor, robotState, type PointValues, type DeviceState } from './model';
import { UPDATE, READY, ACK } from './device';

export default defineNodeScript({ setup(props, ctx) {
 let values:PointValues = snapshot({}), epoch = 0, disposed = false;
 const applied:Record<string, unknown> = Object.create(null);
 // Cache per mounted instance. A reading must not restart unrelated animations
 // or trigger all devices' expensive mounted-subtree/probe work.
 const targets = mapping.map(m => ({
  mapping:m, id:ctx.node(m.node)?.id, key:undefined as string|undefined,
  state:undefined as DeviceState|undefined, epoch:0,
 }));
 const byId = new Map(targets.filter(t => t.id).map(t => [t.id!, t]));
 function send(t:typeof targets[number], force = false) {
  if (!t.id) return;
  const state = stateFor(t.mapping, values), key = JSON.stringify(state);
  if (!force && key === t.key) return;
  t.key = key; t.state = state; t.epoch = epoch;
  delete applied[t.id];
  ctx.bus.emit(UPDATE, {target:t.id, owner:ctx.nodeId, epoch, state});
 }
 ctx.bus.on<{target:string}>(READY, m => {
  const target = byId.get(m.target);
  // A new/re-materialized device needs the current state even when unchanged.
  if (!disposed && target) send(target, true);
 });
 ctx.bus.on<{owner:string;target:string;epoch:number;state:unknown;errors:string[];visual:unknown}>(ACK, m => {
  // An unchanged device can finish its previous frame after a newer snapshot.
  // Accept that receipt only while it is still this device's latest submission.
  if (!disposed && m.owner === ctx.nodeId && byId.get(m.target)?.epoch === m.epoch) {
   applied[m.target] = {state:m.state, errors:m.errors, visual:m.visual};
  }
 });
 let consumed:string|undefined;
 function consume(input:unknown) {
  if (disposed) return;
  const next = snapshot(input), key = JSON.stringify(next);
  if (key === consumed) return;
  consumed = key; values = next; epoch++;
  for (const target of targets) send(target);
  ctx.emit('coalStateChange', {
   epoch, values, robot:robotState(values),
   devices:targets.map(t => ({node:t.mapping.node, slots:'slots' in t.mapping?t.mapping.slots:[], ...stateFor(t.mapping, values)})),
  });
 }
 ctx.watch(() => JSON.stringify(props.uiBindIds ?? []), () => consume(props.uiBindIds));
 consume(props.uiBindIds);
 ctx.expose({
  applyPointValues(valuesInput:unknown):void {
   const next = snapshot(valuesInput);
   ctx.instance.setProps({uiBindIds:next});
   consume(next);
  },
  getCoalState():unknown {
   return JSON.parse(JSON.stringify({
    epoch, values, robot:robotState(values),
    devices:targets.map(t => ({
     node:t.mapping.node, slots:'slots' in t.mapping?t.mapping.slots:[],
     runtimeNode:t.id??null, ...stateFor(t.mapping, values),
     receipt:t.id?applied[t.id]??null:null,
    })),
   }));
  },
 });
 ctx.dispose(() => {
  values = snapshot({});
  for (const target of targets) send(target);
  disposed = true;
  for (const key of Object.keys(applied)) delete applied[key];
 });
}});
