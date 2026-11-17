/** Project art: independent screen-space clock, no camera inputs or image sampling. */
export const nebulaWGSL = /* wgsl */ `
fn dreamHash(p: vec2<f32>) -> f32 {
  return fract(sin(dot(p, vec2<f32>(127.1, 311.7))) * 43758.5453);
}
fn dreamNoise(p: vec2<f32>) -> f32 {
  let i = floor(p); let f = fract(p); let u = f*f*(3.0-2.0*f);
  return mix(mix(dreamHash(i), dreamHash(i+vec2<f32>(1.0,0.0)), u.x),
             mix(dreamHash(i+vec2<f32>(0.0,1.0)), dreamHash(i+vec2<f32>(1.0,1.0)), u.x), u.y);
}
fn dreamFbm(p: vec2<f32>) -> f32 {
  var q = p; var sum = 0.0; var weight = 0.53;
  for (var i = 0; i < 5; i = i+1) {
    sum += weight*dreamNoise(q);
    q = vec2<f32>(0.8*q.x-0.6*q.y,0.6*q.x+0.8*q.y)*2.03+vec2<f32>(19.7,7.3);
    weight *= 0.48;
  }
  return sum;
}
fn flamoFragment(uv: vec2<f32>) -> vec4<f32> {

  let aspect = flamo.resolution.x/max(flamo.resolution.y,1.0);
  let p = (uv-vec2<f32>(0.5))*vec2<f32>(aspect,1.0);
  let t = flamo.time*0.025;
  let warp = vec2<f32>(dreamFbm(p*2.7+vec2<f32>(t*0.13,4.1)),dreamFbm(p*2.3+vec2<f32>(9.2,-t*0.11)))-vec2<f32>(0.5);
  let q = p*3.1+warp*1.7;
  let cloud = dreamFbm(q+vec2<f32>(-t*0.17,t*0.08));
  let fine = dreamFbm(q*3.8+vec2<f32>(t*0.09,5.2));
  let filament = pow(max(0.0,1.0-abs(fine*2.0-1.0)),9.0);
  let folds = sin(q.x*3.1+q.y*4.3+cloud*8.0+t*0.2);
  let ridge = pow(max(0.0,1.0-abs(folds)),3.0)*filament;
  let envelope = smoothstep(0.17,0.65,cloud);
  let dust = smoothstep(0.40,0.71,dreamFbm(q*1.65+vec2<f32>(3.7,t*0.09)));
  let warmth = smoothstep(0.26,0.72,cloud+sin(q.x*0.9+t*0.12)*0.14);
  let cool = mix(vec3<f32>(0.035,0.28,0.42),vec3<f32>(0.23,0.075,0.32),smoothstep(-0.5,0.7,sin(q.y*1.1+t*0.13)));
  let warm = mix(vec3<f32>(0.82,0.19,0.065),vec3<f32>(0.95,0.59,0.21),fine);
  let ink = mix(cool,warm,warmth);
  let safe = 0.28+0.72*smoothstep(0.10,0.35,uv.y)*(1.0-smoothstep(0.70,0.96,uv.y));
  let density = envelope*(0.24+1.20*ridge+0.28*filament)*(1.0-0.88*dust)*safe;
  let radiance = (ink*density+cool*envelope*0.16)*1.65;
  let base = vec3<f32>(0.006,0.012,0.025);
  return vec4<f32>(base+radiance/(vec3<f32>(1.0)+radiance*0.65),1.0);
}
`;
export const nebulaGLSL = /* glsl */ `
float dreamHash(vec2 p) {
  return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);
}
float dreamNoise(vec2 p) {
  vec2 i=floor(p), f=fract(p), u=f*f*(3.0-2.0*f);
  return mix(mix(dreamHash(i),dreamHash(i+vec2(1.0,0.0)),u.x),
             mix(dreamHash(i+vec2(0.0,1.0)),dreamHash(i+vec2(1.0,1.0)),u.x),u.y);
}
float dreamFbm(vec2 p) {
  vec2 q=p; float sum=0.0, weight=0.53;
  for(int i=0;i<5;i++) {
    sum+=weight*dreamNoise(q);
    q=vec2(0.8*q.x-0.6*q.y,0.6*q.x+0.8*q.y)*2.03+vec2(19.7,7.3);
    weight*=0.48;
  }
  return sum;
}
vec4 flamoFragment(vec2 uv) {

  float aspect=u_resolution.x/max(u_resolution.y,1.0);
  vec2 p=(uv-vec2(0.5))*vec2(aspect,1.0);
  float t=u_time*0.025;
  vec2 warp=vec2(dreamFbm(p*2.7+vec2(t*.13,4.1)),dreamFbm(p*2.3+vec2(9.2,-t*.11)))-vec2(.5);
  vec2 q=p*3.1+warp*1.7;
  float cloud=dreamFbm(q+vec2(-t*.17,t*.08));
  float fine=dreamFbm(q*3.8+vec2(t*.09,5.2));
  float filament=pow(max(0.0,1.0-abs(fine*2.0-1.0)),9.0);
  float folds=sin(q.x*3.1+q.y*4.3+cloud*8.0+t*.2);
  float ridge=pow(max(0.0,1.0-abs(folds)),3.0)*filament;
  float envelope=smoothstep(.17,.65,cloud);
  float dust=smoothstep(.40,.71,dreamFbm(q*1.65+vec2(3.7,t*.09)));
  float warmth=smoothstep(.26,.72,cloud+sin(q.x*.9+t*.12)*.14);
  vec3 cool=mix(vec3(.035,.28,.42),vec3(.23,.075,.32),smoothstep(-.5,.7,sin(q.y*1.1+t*.13)));
  vec3 warm=mix(vec3(.82,.19,.065),vec3(.95,.59,.21),fine);
  vec3 ink=mix(cool,warm,warmth);
  float safe=.28+.72*smoothstep(.10,.35,uv.y)*(1.0-smoothstep(.70,.96,uv.y));
  float density=envelope*(.24+1.20*ridge+.28*filament)*(1.0-.88*dust)*safe;
  vec3 radiance=(ink*density+cool*envelope*.16)*1.65;
  vec3 base=vec3(.006,.012,.025);
  return vec4(base+radiance/(vec3(1.0)+radiance*.65),1.0);
}
`;
