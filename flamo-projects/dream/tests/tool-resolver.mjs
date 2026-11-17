// Test-only compiler dependency resolution; official scripts remain byte-identical.
export async function resolve(specifier, context, next) {
 if(specifier==='typescript')return {url:new URL('../.flamo/tools/node_modules/typescript/lib/typescript.js',import.meta.url).href,shortCircuit:true};
 return next(specifier,context);
}
