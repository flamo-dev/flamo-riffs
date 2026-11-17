/** Public input extension: ST_* accepts a pair; no host tag evaluation here. */
export type PointValue = number | boolean | null | {left: boolean | null; right: boolean | null};
export type PointValues = Record<string, PointValue>;
/** Annotation uiBindIds: notes is host metadata, never interpreted as behavior. */
export interface UiBindEntry { id: string; notes?: string; value: PointValue }
export type UiBindIds = UiBindEntry[] | PointValues;
export type Tri = boolean | null;
export interface DeviceState {kind:string; run?:Tri; left?:Tri; right?:Tri; top?:Tri; lower?:Tri; upper?:Tri; middle?:Tri; values?:Array<number|Tri>; ratio?:number|null; text?:string; raw?:number|null; alarms?:Record<string,Tri>}
export const tri = (v:unknown):Tri => typeof v === 'boolean' ? v : null;
export const numeric = (v:unknown):number|null => typeof v === 'number' && Number.isFinite(v) ? v : null;
export const or = (l:Tri,r:Tri):Tri => l===true||r===true ? true : l===false&&r===false ? false : null;
export function snapshot(input:unknown):PointValues {
 const out:PointValues=Object.create(null);
 if (!input || typeof input!=='object') return out;
 // Arrays are keyed by business id, never their positional index. Last duplicate wins.
 const entries:Array<[string,unknown]>=Array.isArray(input)
  ? input.filter((row):row is UiBindEntry=>!!row && typeof row==='object' &&
      typeof row.id==='string' && row.id.length>0).map(row=>[row.id,row.value])
  : Object.entries(input);
 for(const [k,v] of entries) {
  if (k.startsWith('ST_') && v && typeof v==='object' && !Array.isArray(v)) {
   const pair=v as {left?:unknown;right?:unknown};out[k]={left:tri(pair.left),right:tri(pair.right)};
  }
  else out[k]=typeof v==='boolean'?v:numeric(v);
 }
 // Alarm config uses #belt-first IDs; accept legacy IDs without # too.
 // Explicit canonical presence wins, including false/null (independent of input order).
 for(const k of Object.keys(out)) {
  const m=/^#?(\d[ABCD]PDBJ)_(PDSLBJ|PDDMBJ|PDPPBJ|PDYHBJ|RYRQBJ)$/.exec(k);
  if(m && !Object.prototype.hasOwnProperty.call(out,m[2]+'_'+m[1]))out[m[2]+'_'+m[1]]=out[k];
 }
 return out;
}
export function stateFor(m:{kind:string; keys:readonly string[];max?:number}, values:PointValues):DeviceState {
 const v=m.keys.map(k=>Object.prototype.hasOwnProperty.call(values,k)?values[k]:null); const kind=m.kind;
 if(kind==='tee') { const p=v[0] && typeof v[0]==='object'?v[0]:{left:null,right:null}; return {kind,...p,top:or(p.left,p.right)}; }
 if(kind==='plough') {const lower=tri(v[0]),upper=tri(v[1]);return {kind,lower,upper,middle:lower===false&&upper===false?true:lower===null||upper===null?null:false};}
 if(kind==='feeder')return {kind,values:v.map((x,i)=>i%2?tri(x):numeric(x))};
 if(kind==='alarm') {const alarms=Object.fromEntries(m.keys.map((k,i)=>[k,tri(v[i])]));return {kind,alarms,run:Object.values(alarms).reduce<Tri>(or,false)};}
 if(kind==='level'||kind==='number') {const raw=numeric(v[0]),clamped=raw===null?null:Math.min(m.max??Infinity,Math.max(0,raw));return {kind,raw,ratio:clamped===null||!m.max?null:clamped/m.max,text:clamped===null?'--':clamped.toFixed(2)};}
 return {kind,run:tri(v[0])};
}

export const robotKeys=['YXZT','CWBJ','GZBJ','DCDL','DCWD','DL','DY','DJ1WD','DJ2WD','LJLC','HJWD','HJSD','PM2.5Z','PM10Z','PM100Z','JWND','YQND','AQND','LHQND','EYHTND','YYHTND'] as const;
export function robotState(values:PointValues) {
 const fields=Object.fromEntries(robotKeys.map(k=>{const id='JQR_'+k;const raw=numeric(values[id]);return [id,{raw,text:raw===null?'--':raw.toFixed(2)}];}));
 const running=tri(values.JQR_YXZT),alarm=or(tri(values.JQR_CWBJ),tri(values.JQR_GZBJ));
 return {slot:'Robot',running,alarm,animation:running===true?'running':running===false?'stopped':'unknown',fields};
}
