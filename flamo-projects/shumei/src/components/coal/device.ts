import { bindNumber } from '@flamo/interaction-library/base';
import type { NodeScriptContext, NodeScriptMountedNodeSnapshot } from '/vendor/flamo-runtime/index.js';
import { type DeviceState, type Tri, tri, or } from './model';
// Temporary feeder diagnostics only. Enable here and recompile; never a public prop.
const FEEDER_DIAGNOSTICS_ENABLED: boolean = false;
export const UPDATE='coal:device:update', READY='coal:device:ready', ACK='coal:device:ack';
interface Config {kind:string;on?:string[];off?:string[];parts?:string[];bars?:string[];references?:string[];flowTargets?:readonly string[]}
export interface Message {target:string; state:DeviceState; epoch:number; owner:string}
/** All mutable state is per mounted script; bus targeting uses resolved runtime identity. */
export function mountDevice(ctx:NodeScriptContext, props:Readonly<Record<string,unknown>>, config:Config) {
 let disposed=false, current:DeviceState={kind:config.kind};
 let controlledByBus=false, application=0;
 const errors:string[]=[];
 const feederPositions=config.kind==='feeder'?ctx.ref<readonly number[]>([NaN,NaN]):null;
 let request:Message|undefined;
 const expected=new Map<string,{visible?:boolean;width?:number}>();
 // Feeder-only, immutable console evidence; ctx.trace alone is not a console sink.
 let diagnosticSequence=0, propsWatchSequence=0;
 function feederTrace(action:string, detail:unknown={}) {
  if(config.kind!=='feeder')return;
  if(!FEEDER_DIAGNOSTICS_ENABLED) {
   if(action.endsWith('-error')||action==='coal.feeder.layout-blocked')ctx.trace(action,detail);
   return;
  }
  const record={diagnosticVersion:'feeder-console-v3-reflow',sequence:++diagnosticSequence,
   instanceId:ctx.instance.id,nodeId:ctx.nodeId,action,detail};
  try { console.debug('[coal.feeder]',JSON.stringify(record,(_key,value)=>
   typeof value==='number'&&!Number.isFinite(value)?String(value):value)); } catch { /* diagnostics never owns behavior */ }
  ctx.trace(action,detail);
 }
 if(FEEDER_DIAGNOSTICS_ENABLED)feederTrace('coal.feeder.setup',{state:fromProps()});
 // Read the physical subtree, not the global definition alias. Handles are
 // transient: resolve afresh per application and again after nextFrame.
 function subtree(mounted?:NodeScriptMountedNodeSnapshot|null) {
  if(!mounted){const root=ctx.node();mounted=root&&ctx.mounted.resolve(root);}
  if(!mounted)throw new Error('Device is not materialized: '+ctx.nodeId);
  const rows:{node:NodeScriptMountedNodeSnapshot;parent:string|null}[]=[{node:mounted,parent:null}];
  const seen=new Set([mounted.entity.id]);let truncated=false;
  for(let i=0;i<rows.length;i++) {
   for(const child of ctx.mounted.children(rows[i].node.entity)?.children??[]) {
    if(seen.has(child.entity.id))continue;
    if(rows.length>=1024){truncated=true;break;}
    seen.add(child.entity.id);rows.push({node:child,parent:rows[i].node.entity.id});
   }
  }
  return {rows,truncated};
 }
 // Share only topology lookup within the current synchronous turn. Reads below
 // still resolve a fresh mounted snapshot; mutations/reloads and the next
 // microtask invalidate the tree, so state and geometry are never cached.
 let lookupTree:ReturnType<typeof subtree>|undefined;
 let lookupRevision=-1;
 function physical(ref?:string):NodeScriptMountedNodeSnapshot {
  const root=ctx.node(), mounted=root&&ctx.mounted.resolve(root);
  if(!mounted)throw new Error('Device is not materialized: '+ctx.nodeId);
  if(ref===undefined)return mounted;
  if(!lookupTree||lookupRevision!==mounted.revision){
   lookupTree=subtree(mounted);lookupRevision=mounted.revision;
   const currentTree=lookupTree;
   queueMicrotask(()=>{if(lookupTree===currentTree)lookupTree=undefined;});
  }
  const tree=lookupTree;
  if(tree.truncated)throw new Error('Device subtree exceeds role lookup budget');
  if(ref===undefined)return tree.rows[0].node;
  const descendants=tree.rows.slice(1).map(r=>r.node);
  const handle=ctx.node(ref);
  // Qualified IDs keep their namespace. Only the public scoped handle supplies
  // a remapped qualified identity; never manufacture a session offset.
  const aliases=new Set([ref,...(handle?[handle.id]:[])]);
  const local=/^\d+:(\d+)$/.exec(ref)?.[1];
  const matches=descendants.filter(child=>{
   if(aliases.has(child.sourceNodeId??'')||aliases.has(child.semanticRef??'')||aliases.has(child.entity.id))return true;
   // Figma inherited overrides sometimes retain ONLY localID. Accept this form
   // only with a matching instance semantic path and a root inside our subtree.
   // A qualified foreign session with the same suffix is never a localID.
   const semantic=child.semanticRef?.split(';');
   const owner=child.instanceRootId;
   const localSource=child.sourceNodeId;
   const localPath=semantic?.[semantic.length-1];
   return !!local && !!owner && tree.rows.some(r=>r.node.entity.id===owner)
    && semantic?.[0]==='I'+owner
    && (localSource===local || (localSource===null && localPath===local))
    && localPath===local;
  });
  const resolved=[ctx.mounted.resolve(ref),handle?ctx.mounted.resolve(handle):null];
  const candidates=descendants.filter(n=>matches.includes(n)||resolved.some(r=>r?.entity.id===n.entity.id));
  if(candidates.length!==1)throw new Error('Expected one mounted local role '+ref+' in '+ctx.nodeId+', found '+matches.length+'; scoped candidates '+candidates.length);
  const fresh=ctx.mounted.resolve(candidates[0].entity);
  if(!fresh)throw new Error('Device role is no longer mounted: '+ref);
  return fresh;
 }
 // Read-only bounded reflow evidence. Never feed snapshot coordinates into writes.
 function reflowSnapshot(index:number, submission:number, frame:number, requestedWidth:number) {
  if(!FEEDER_DIAGNOSTICS_ENABLED)return;
  try {
   const bar=physical(config.bars![index]);
   const tree=subtree();
   if(tree.truncated)throw new Error('Reflow subtree exceeds diagnostic budget');
   const parentId=tree.rows.find(r=>r.node.entity.id===bar.entity.id)?.parent;
   const included=new Set([tree.rows[0].node.entity.id,bar.entity.id]);
   if(parentId)included.add(parentId);
   // Include actual icon containers and both image children, not guessed clone IDs.
   const descendants=new Set([bar.entity.id]);
   for(const row of tree.rows)if(row.parent&&descendants.has(row.parent))descendants.add(row.node.entity.id);
   for(const id of descendants)included.add(id);
   const nodes=tree.rows.filter(r=>included.has(r.node.entity.id)).map(({node,parent})=>{
    const h=node.entity, probe=ctx.mounted.probe(h), layout=h.layout();
    const design=h.design();
    return {id:h.id,name:h.name,sourceNodeId:node.sourceNodeId,semanticRef:node.semanticRef,
     instanceRootId:node.instanceRootId,parent,probe,layout,
     design:{state:design.state,geometry:design.geometry,layout:design.layout,constraints:design.constraints}};
   });
   feederTrace('coal.feeder.reflow-snapshot',{index,submission,frame,requestedWidth,
    phase:frame===0?'before-submit':'after-nextFrame',nodes,
    evidence:'read-only samples; compare frames, not a commit receipt or visual verdict'});
  } catch(error) {
   feederTrace('coal.feeder.reflow-snapshot-error',{index,submission,frame,error:String(error)});
  }
 }
 function diagnostics(refs:string[]) {
  if(config.kind==='feeder'&&!FEEDER_DIAGNOSTICS_ENABLED)return {};
  const describe=(n:NodeScriptMountedNodeSnapshot|null)=>n?{id:n.entity.id,sourceNodeId:n.sourceNodeId,semanticRef:n.semanticRef,instanceRootId:n.instanceRootId,revision:n.revision}:null;
  const attempt=(read:()=>unknown)=>{try{return read();}catch(e){return {error:String(e)};}};
  return {
   subtree:attempt(()=>{const tree=subtree();return {limit:1024,truncated:tree.truncated,nodes:tree.rows.map(r=>({...describe(r.node),parent:r.parent,name:r.node.entity.name}))};}),
   mappings:refs.filter(Boolean).map(ref=>({ref,
    node:attempt(()=>{const h=ctx.node(ref);return h?{id:h.id,name:h.name}:null;}),
    resolveRef:attempt(()=>describe(ctx.mounted.resolve(ref))),
    resolveNode:attempt(()=>{const h=ctx.node(ref);return h?describe(ctx.mounted.resolve(h)):null;})
   }))
  };
 }
 function acknowledge(visual:unknown) {
  if(request&&!disposed)ctx.bus.emit(ACK,{target:ctx.nodeId,owner:request.owner,epoch:request.epoch,state:current,errors:[...errors],visual});
 }

 const attemptWrite=(write:()=>void)=>{try{write();}catch(e){errors.push(String(e));}};
 const visible=(ref:string,on:boolean)=>{
  expected.set(ref,{...expected.get(ref),visible:on});
  attemptWrite(()=>physical(ref).entity.setVisible(on));
 };
 const pair=(i:number,run:Tri|undefined)=>{visible(config.on![i],run===true);visible(config.off![i],run===false);};
 function apply(s:DeviceState) {
  feederTrace('coal.feeder.apply',{state:s,controlledByBus,propsWatchSequence});
  current=s;errors.length=0;expected.clear();const version=++application;
  try {
   if(config.on && config.kind!=='tee' && config.kind!=='feeder')pair(0,s.run);
   if(config.kind==='tee') [s.left,s.right,s.top].forEach((v,i)=>{
    // Unknown has no running highlight but retains the normal pipe body.
    visible(config.on![i],v===true);visible(config.off![i],v!==true);

   });
   if(config.kind==='plough') [s.lower,s.upper,s.middle].forEach((v,i)=>visible(config.parts![i],v===true));
   if(config.kind==='feeder') {
    for(let i=0;i<2;i++) {
     // Missing input is stopped. Position validity must never hide the images' parent.
     const running=s.values?.[i*2+1]===true;
     visible(config.on![i],running);visible(config.off![i],!running);
    }
    feederPositions!.value=[0,2].map(i=>typeof s.values?.[i]==='number'?s.values[i] as number:NaN);
   }
   if(config.kind==='alarm'||config.kind==='fall'||config.kind==='flow'||config.kind==='extension'){expected.set('',{visible:s.run===true});physical().entity.setVisible(s.run===true);}
   if(config.kind==='flow' && typeof document!=='undefined') document.dispatchEvent(new CustomEvent('flamo:hmi-pipe-flow:set',{detail:{instanceId:ctx.instance.id,nodeId:ctx.nodeId,patch:{enabled:s.run===true}}}));
   // The authored falling-coal carrier now contains a managed flow instance.
   // Address its live scoped identity; never toggle the shared definition.
   if(typeof document!=='undefined')for(const ref of config.flowTargets??[]) {
    const target=physical(ref).entity;
    document.dispatchEvent(new CustomEvent('flamo:hmi-pipe-flow:set',{detail:{instanceId:ctx.instance.id,nodeId:target.id,patch:{enabled:s.run===true}}}));
   }
  } catch(e) {errors.push(String(e));feederTrace('coal.feeder.apply-error',{error:String(e)});}
  // Every receipt is pending until a fresh physical read; no computed width is
  // presented as measured geometry. Null probes and mismatches are failures.
  acknowledge({status:'pending',application:version,nodes:[]});
  const refs=[...new Set(['',...(config.on??[]),...(config.off??[]),...(config.parts??[]),...(config.bars??[]),...(config.references??[])])];
  void ctx.nextFrame().then(async ()=>{
   if(disposed||version!==application)return;
   const probeErrors:string[]=[];
   const nodes=await Promise.all(refs.map(async ref=>{
    try {
     const target=physical(ref||undefined);
     const probe=ctx.mounted.probe(target.entity);
     const sourceProbe=ctx.probe(ref||undefined);
     const want=expected.get(ref)??{};
     if(!probe)throw new Error('Missing committed probe for '+(ref||ctx.nodeId));
     if(want.visible!==undefined&&probe.visible!==want.visible)probeErrors.push('Visible mismatch '+(ref||ctx.nodeId)+': expected '+want.visible+', observed '+probe.visible);
     if(want.width!==undefined&&(!Number.isFinite(probe.size?.x)||Math.abs(probe.size.x-want.width)>0.01))probeErrors.push('Width mismatch '+ref+': expected '+want.width+', observed '+probe.size?.x);
     const measurement:Record<string,unknown>={};
     if(config.kind==='wheel'){
      const t=probe.transform;
      measurement.rotationDegrees=t?Math.atan2(t.m10,t.m00)*180/Math.PI:null;
      measurement.transform=t??null;
     }
     if(config.kind==='tee'&&ref){
      const semantic=await target.entity.current();
      measurement.appearance=semantic.appearance;
      // Appearance is diagnostic only; vector shapes may expose empty fills.
      measurement.compositing=semantic.compositing;
      measurement.layerProbe={visible:probe.visible,opacity:probe.opacity,bounds:probe.bounds};
     }
     if(config.kind==='feeder'&&ref&&FEEDER_DIAGNOSTICS_ENABLED){
      measurement.layout=target.entity.layout();
      const semantic=await target.entity.current();
      measurement.geometry=semantic.geometry??null;
      measurement.constraints=semantic.constraints??null;
      measurement.nativeFollowAcceptance='requires-cross-snapshot-child-world-transform-and-browser-verification';
      // Observe native child follow only; never set positions or infer them
      // from the desired bar width. Missing child probes remain explicit.
      measurement.children=await Promise.all((ctx.mounted.children(target.entity)?.children??[]).map(async child=>{
       const currentChild=await child.entity.current();
       return {targetNodeId:child.entity.id,sourceNodeId:child.sourceNodeId,
        probe:ctx.mounted.probe(child.entity),layout:child.entity.layout(),
        geometry:currentChild.geometry??null,constraints:currentChild.constraints??null};
      }));
     }
     return {measurement,ref:ref||null,targetNodeId:target.entity.id,sourceNodeId:target.sourceNodeId,instanceRootId:target.instanceRootId,revision:target.revision,expected:want,sourceProbe,probe};
    } catch(e) {const error=String(e);probeErrors.push(error);return {ref:ref||null,probe:null,error};}
   }));
   if(disposed||version!==application)return;
   errors.push(...probeErrors);
   const visual={status:errors.length?'failed':'observed',application:version,nodes,...(errors.length?{diagnostics:diagnostics(refs)}:{})};
   acknowledge(visual);
   ctx.trace('coal.device.visual',{nodeId:ctx.nodeId,kind:config.kind,state:current,errors:[...errors],...visual});
  }).catch(e=>{
   if(disposed||version!==application)return;
   errors.push('Committed probe failed: '+String(e));
   acknowledge({status:'failed',application:version,nodes:[],diagnostics:diagnostics(refs)});
   ctx.trace('coal.device.probe-error',{nodeId:ctx.nodeId,error:String(e)});
  });
 }

 function fromProps():DeviceState {
  if(config.kind!=='feeder' && props.coalInput && typeof props.coalInput==='object' && Object.keys(props.coalInput).length>0)return {...props.coalInput as DeviceState,kind:config.kind};
  const asTri=(v:unknown):Tri=>v===1?true:v===0?false:tri(v);
  if(config.kind==='tee'){const left=tri(props.leftRun),right=tri(props.rightRun);return {kind:config.kind,left,right,top:or(left,right)};}
  if(config.kind==='plough')return {kind:config.kind,lower:tri(props.luoxiaRun),upper:tri(props.taiqiRun),middle:tri(props.zhongjianRun)};
  if(config.kind==='feeder')return {kind:config.kind,values:[typeof props.gmjPosition1==='number'?props.gmjPosition1:null,props.gmjRun1===true,typeof props.gmjPosition2==='number'?props.gmjPosition2:null,props.gmjRun2===true]};
  return {kind:config.kind,run:asTri(props.djRun??props.gzRun??props.smjRun)};
 }
 apply(fromProps());
 if(config.kind==='feeder') for(let i=0;i<2;i++) {
  try {
   const target=physical(config.bars![i]).entity;
   // ctx.node() resolves this mounted boundary, not the shared definition.
   // HUG intermediate frames follow the bar; never measure their feedback width.
   const reference=physical().entity;
   let submission=0;
   // Keep the installed helper unchanged. Distinguish a real setter call from
   // prop acceptance, and a setter return from a committed geometry readback.
   const measuredReference={id:reference.id,layout:()=>{
    const layout=reference.layout();
    feederTrace('coal.feeder.reference',{index:i,nodeId:ctx.nodeId,referenceNodeId:reference.id,
     targetNodeId:target.id,value:feederPositions!.value[i],layout,
     status:layout?.source==='runtime'?'runtime-measured':'waiting-runtime-layout'});
    return layout;
   }};
   const observedTarget={id:target.id,layout:()=>target.layout(),
    setHeight:(v:number)=>target.setHeight(v),setVisible:(v:boolean)=>target.setVisible(v),
    setWidth:(width:number)=>{
     const sequence=++submission;
     if(FEEDER_DIAGNOSTICS_ENABLED)feederTrace('coal.feeder.width-submit',{index:i,nodeId:ctx.nodeId,targetNodeId:target.id,
      referenceNodeId:reference.id,width,sequence,layout:target.layout()});
     if(FEEDER_DIAGNOSTICS_ENABLED)reflowSnapshot(i,sequence,0,width);
     try { target.setWidth(width); }
     catch(error) { feederTrace('coal.feeder.setter-error',{index:i,sequence,error:String(error)});throw error; }
     feederTrace('coal.feeder.setter-return',{index:i,sequence,width,status:'returned-not-commit'});
     expected.set(config.bars![i],{width});
     if(FEEDER_DIAGNOSTICS_ENABLED)void (async()=>{
      for(let frame=1;frame<=16;frame++) {
       await ctx.nextFrame();
       if(disposed||sequence!==submission)return;
       if(![1,2,4,8,16].includes(frame))continue;
       reflowSnapshot(i,sequence,frame,width);
       const fresh=physical(config.bars![i]);
       const probe=ctx.mounted.probe(fresh.entity);
       const actual=probe?.size?.x;
       feederTrace('coal.feeder.width-readback',{index:i,nodeId:ctx.nodeId,targetNodeId:fresh.entity.id,
        width,actual,sequence,frame,status:typeof actual==='number'&&Math.abs(actual-width)<0.01?'matched':'unverified-or-mismatch',
        layout:fresh.entity.layout(),probe});
      }
     })().catch(error=>{if(!disposed)feederTrace('coal.feeder.width-readback-error',{index:i,error:String(error)});});
    }};
   // Forward the exact installed library contract, including observer notifications
   // and ownership preflight. No substitute helper, fallback, or extra writes.
   const bindingContext:Parameters<typeof bindNumber>[0]={
    watch: <T>(read:()=>T, callback:(value:T,oldValue?:T)=>void)=>ctx.watch(read,(value,oldValue)=>{
     feederTrace('coal.feeder.helper-watch',{index:i,value,oldValue});
     try {callback(value,oldValue);} catch(error) {feederTrace('coal.feeder.helper-watch-error',{index:i,error:String(error)});throw error;}
    }),
    // bindNumber's structural API passes .id strings back here. Mounted IDs
    // are NOT semantic refs: retain the original public handle at this boundary.
    observeLayout:(ref,callback)=>{
     if(ref!==reference.id)throw new Error('Unexpected feeder measurement reference');
     feederTrace('coal.feeder.layout-subscribe',{index:i,ref,referenceKind:'EntityHandle'});
     return ctx.observeLayout(reference,layout=>{
     feederTrace('coal.feeder.layout-notification',{index:i,ref,layout});
     try {callback(layout);} catch(error) {feederTrace('coal.feeder.layout-notification-error',{index:i,error:String(error)});throw error;}
    });
    },
    assertLayoutWritable:(ref:string,properties:readonly string[])=>{
     feederTrace('coal.feeder.preflight',{index:i,ref,properties,referenceKind:'EntityHandle'});
     if(ref!==target.id)throw new Error('Unexpected feeder write reference');
     try { ctx.assertLayoutWritable(target,properties); }
     catch(error) {feederTrace('coal.feeder.preflight-error',{index:i,ref,error:String(error)});throw error;}
     feederTrace('coal.feeder.preflight-return',{index:i,ref});
    },
    dispose:(cleanup:()=>void)=>ctx.dispose(cleanup),
    trace:(action:string,detail?:unknown)=>feederTrace(action,detail)
   };
   bindNumber(bindingContext,()=>{
    const value=feederPositions!.value[i];
    feederTrace('coal.feeder.helper-read',{index:i,value,valid:Number.isFinite(value)&&value>=0&&value<=53});
    return value;
   },{
    range:[0,53],size:{target:observedTarget,axis:'width',reference:measuredReference,box:'content',hideAtMinimum:false}
   });
   feederTrace('coal.feeder.binding-installed',{nodeId:ctx.nodeId,index:i,targetNodeId:target.id,referenceNodeId:reference.id});
  } catch(error) {
   errors.push(String(error));
   feederTrace('coal.feeder.layout-blocked',{reference:ctx.nodeId,error:String(error)});
  }
 }

 // A boundary snapshot owns the device until this mount is disposed. Imported
 // default props (or unrelated prop updates) must not undo that bus snapshot.
 ctx.watch(()=>JSON.stringify(fromProps()),()=>{
  if(config.kind==='feeder'&&FEEDER_DIAGNOSTICS_ENABLED)++propsWatchSequence;
  if(config.kind==='feeder'&&FEEDER_DIAGNOSTICS_ENABLED)feederTrace('coal.feeder.props',{nodeId:ctx.nodeId,state:fromProps(),controlledByBus,propsWatchSequence});
  if(!controlledByBus)apply(fromProps());
 });
 if(config.kind==='feeder'&&FEEDER_DIAGNOSTICS_ENABLED) {
  let samples=0, previous='';
  const sample=()=>{
   const state=fromProps(), signature=JSON.stringify([state,controlledByBus,propsWatchSequence]);
   if(signature!==previous){previous=signature;feederTrace('coal.feeder.props-sample',{state,controlledByBus,propsWatchSequence});}
  };
  sample();
  const sampleTimer=setInterval(()=>{
   if(disposed||++samples>=90){clearInterval(sampleTimer);return;}
   sample();
  },1000);
  ctx.dispose(()=>{clearInterval(sampleTimer);feederTrace('coal.feeder.dispose');});
 }
 ctx.bus.on<Message>(UPDATE,m=>{if(m.target!==ctx.nodeId||disposed)return;controlledByBus=true;request=m;feederTrace('coal.feeder.bus-update',{owner:m.owner,epoch:m.epoch,state:m.state});apply(m.state);});
 ctx.bus.emit(READY,{target:ctx.nodeId});
 // Re-send readiness after managed flow listeners have mounted, without a permanent timer.
 const timer=setTimeout(()=>{if(!disposed)ctx.bus.emit(READY,{target:ctx.nodeId});},0);
 ctx.dispose(()=>{request=undefined;if(config.kind!=='feeder')apply({kind:config.kind,run:null});disposed=true;clearTimeout(timer);});
}
