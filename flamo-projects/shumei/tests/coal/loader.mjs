// Source-only test loader: real project modules, fake defineNodeScript host.
import {readFile} from 'node:fs/promises';
import ts from 'typescript';
export async function resolve(s,c,next){
 if(s==='/vendor/flamo-runtime/index.js')return {url:'data:text/javascript,export const defineNodeScript = x => x',shortCircuit:true};
 if(s==='@flamo/interaction-library/base')return {url:new URL('../../src/.flamo/interaction-library/base/bind-number.ts',import.meta.url).href,shortCircuit:true};
 if(s.startsWith('.') && c.parentURL?.endsWith('.ts') && !/\.[a-z]+$/.test(s))return {url:new URL(s+'.ts',c.parentURL).href,shortCircuit:true};
 return next(s,c);
}
export async function load(url,c,next){
 if(url.endsWith('.ts')) {
  let source=await readFile(new URL(url),'utf8');
  // Test-only opt-in; production has exactly one source constant, no env override.
  if(url.endsWith('/src/components/coal/device.ts')&&process.env.FLAMO_TEST_FEEDER_DIAGNOSTICS==='1') {
   const flag='const FEEDER_DIAGNOSTICS_ENABLED: boolean = false;';
   if(!source.includes(flag))throw new Error('Expected default-off feeder diagnostic constant');
   source=source.replace(flag,'const FEEDER_DIAGNOSTICS_ENABLED: boolean = true;');
  }
  return {format:'module',source:ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText,shortCircuit:true};
 }
 return next(url,c);
}
