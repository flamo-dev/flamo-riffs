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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NyaXB0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsic2NyaXB0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLHVGQUF1RjtBQUN2RixNQUFNLENBQUMsTUFBTSxVQUFVLEdBQUcsVUFBVSxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0EwQ3BDLENBQUM7QUFDRixNQUFNLENBQUMsTUFBTSxVQUFVLEdBQUcsVUFBVSxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0EwQ3BDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiogUHJvamVjdCBhcnQ6IGluZGVwZW5kZW50IHNjcmVlbi1zcGFjZSBjbG9jaywgbm8gY2FtZXJhIGlucHV0cyBvciBpbWFnZSBzYW1wbGluZy4gKi9cbmV4cG9ydCBjb25zdCBuZWJ1bGFXR1NMID0gLyogd2dzbCAqLyBgXG5mbiBkcmVhbUhhc2gocDogdmVjMjxmMzI+KSAtPiBmMzIge1xuICByZXR1cm4gZnJhY3Qoc2luKGRvdChwLCB2ZWMyPGYzMj4oMTI3LjEsIDMxMS43KSkpICogNDM3NTguNTQ1Myk7XG59XG5mbiBkcmVhbU5vaXNlKHA6IHZlYzI8ZjMyPikgLT4gZjMyIHtcbiAgbGV0IGkgPSBmbG9vcihwKTsgbGV0IGYgPSBmcmFjdChwKTsgbGV0IHUgPSBmKmYqKDMuMC0yLjAqZik7XG4gIHJldHVybiBtaXgobWl4KGRyZWFtSGFzaChpKSwgZHJlYW1IYXNoKGkrdmVjMjxmMzI+KDEuMCwwLjApKSwgdS54KSxcbiAgICAgICAgICAgICBtaXgoZHJlYW1IYXNoKGkrdmVjMjxmMzI+KDAuMCwxLjApKSwgZHJlYW1IYXNoKGkrdmVjMjxmMzI+KDEuMCwxLjApKSwgdS54KSwgdS55KTtcbn1cbmZuIGRyZWFtRmJtKHA6IHZlYzI8ZjMyPikgLT4gZjMyIHtcbiAgdmFyIHEgPSBwOyB2YXIgc3VtID0gMC4wOyB2YXIgd2VpZ2h0ID0gMC41MztcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCA1OyBpID0gaSsxKSB7XG4gICAgc3VtICs9IHdlaWdodCpkcmVhbU5vaXNlKHEpO1xuICAgIHEgPSB2ZWMyPGYzMj4oMC44KnEueC0wLjYqcS55LDAuNipxLngrMC44KnEueSkqMi4wMyt2ZWMyPGYzMj4oMTkuNyw3LjMpO1xuICAgIHdlaWdodCAqPSAwLjQ4O1xuICB9XG4gIHJldHVybiBzdW07XG59XG5mbiBmbGFtb0ZyYWdtZW50KHV2OiB2ZWMyPGYzMj4pIC0+IHZlYzQ8ZjMyPiB7XG5cbiAgbGV0IGFzcGVjdCA9IGZsYW1vLnJlc29sdXRpb24ueC9tYXgoZmxhbW8ucmVzb2x1dGlvbi55LDEuMCk7XG4gIGxldCBwID0gKHV2LXZlYzI8ZjMyPigwLjUpKSp2ZWMyPGYzMj4oYXNwZWN0LDEuMCk7XG4gIGxldCB0ID0gZmxhbW8udGltZSowLjAyNTtcbiAgbGV0IHdhcnAgPSB2ZWMyPGYzMj4oZHJlYW1GYm0ocCoyLjcrdmVjMjxmMzI+KHQqMC4xMyw0LjEpKSxkcmVhbUZibShwKjIuMyt2ZWMyPGYzMj4oOS4yLC10KjAuMTEpKSktdmVjMjxmMzI+KDAuNSk7XG4gIGxldCBxID0gcCozLjErd2FycCoxLjc7XG4gIGxldCBjbG91ZCA9IGRyZWFtRmJtKHErdmVjMjxmMzI+KC10KjAuMTcsdCowLjA4KSk7XG4gIGxldCBmaW5lID0gZHJlYW1GYm0ocSozLjgrdmVjMjxmMzI+KHQqMC4wOSw1LjIpKTtcbiAgbGV0IGZpbGFtZW50ID0gcG93KG1heCgwLjAsMS4wLWFicyhmaW5lKjIuMC0xLjApKSw5LjApO1xuICBsZXQgZm9sZHMgPSBzaW4ocS54KjMuMStxLnkqNC4zK2Nsb3VkKjguMCt0KjAuMik7XG4gIGxldCByaWRnZSA9IHBvdyhtYXgoMC4wLDEuMC1hYnMoZm9sZHMpKSwzLjApKmZpbGFtZW50O1xuICBsZXQgZW52ZWxvcGUgPSBzbW9vdGhzdGVwKDAuMTcsMC42NSxjbG91ZCk7XG4gIGxldCBkdXN0ID0gc21vb3Roc3RlcCgwLjQwLDAuNzEsZHJlYW1GYm0ocSoxLjY1K3ZlYzI8ZjMyPigzLjcsdCowLjA5KSkpO1xuICBsZXQgd2FybXRoID0gc21vb3Roc3RlcCgwLjI2LDAuNzIsY2xvdWQrc2luKHEueCowLjkrdCowLjEyKSowLjE0KTtcbiAgbGV0IGNvb2wgPSBtaXgodmVjMzxmMzI+KDAuMDM1LDAuMjgsMC40MiksdmVjMzxmMzI+KDAuMjMsMC4wNzUsMC4zMiksc21vb3Roc3RlcCgtMC41LDAuNyxzaW4ocS55KjEuMSt0KjAuMTMpKSk7XG4gIGxldCB3YXJtID0gbWl4KHZlYzM8ZjMyPigwLjgyLDAuMTksMC4wNjUpLHZlYzM8ZjMyPigwLjk1LDAuNTksMC4yMSksZmluZSk7XG4gIGxldCBpbmsgPSBtaXgoY29vbCx3YXJtLHdhcm10aCk7XG4gIGxldCBzYWZlID0gMC4yOCswLjcyKnNtb290aHN0ZXAoMC4xMCwwLjM1LHV2LnkpKigxLjAtc21vb3Roc3RlcCgwLjcwLDAuOTYsdXYueSkpO1xuICBsZXQgZGVuc2l0eSA9IGVudmVsb3BlKigwLjI0KzEuMjAqcmlkZ2UrMC4yOCpmaWxhbWVudCkqKDEuMC0wLjg4KmR1c3QpKnNhZmU7XG4gIGxldCByYWRpYW5jZSA9IChpbmsqZGVuc2l0eStjb29sKmVudmVsb3BlKjAuMTYpKjEuNjU7XG4gIGxldCBiYXNlID0gdmVjMzxmMzI+KDAuMDA2LDAuMDEyLDAuMDI1KTtcbiAgcmV0dXJuIHZlYzQ8ZjMyPihiYXNlK3JhZGlhbmNlLyh2ZWMzPGYzMj4oMS4wKStyYWRpYW5jZSowLjY1KSwxLjApO1xufVxuYDtcbmV4cG9ydCBjb25zdCBuZWJ1bGFHTFNMID0gLyogZ2xzbCAqLyBgXG5mbG9hdCBkcmVhbUhhc2godmVjMiBwKSB7XG4gIHJldHVybiBmcmFjdChzaW4oZG90KHAsdmVjMigxMjcuMSwzMTEuNykpKSo0Mzc1OC41NDUzKTtcbn1cbmZsb2F0IGRyZWFtTm9pc2UodmVjMiBwKSB7XG4gIHZlYzIgaT1mbG9vcihwKSwgZj1mcmFjdChwKSwgdT1mKmYqKDMuMC0yLjAqZik7XG4gIHJldHVybiBtaXgobWl4KGRyZWFtSGFzaChpKSxkcmVhbUhhc2goaSt2ZWMyKDEuMCwwLjApKSx1LngpLFxuICAgICAgICAgICAgIG1peChkcmVhbUhhc2goaSt2ZWMyKDAuMCwxLjApKSxkcmVhbUhhc2goaSt2ZWMyKDEuMCwxLjApKSx1LngpLHUueSk7XG59XG5mbG9hdCBkcmVhbUZibSh2ZWMyIHApIHtcbiAgdmVjMiBxPXA7IGZsb2F0IHN1bT0wLjAsIHdlaWdodD0wLjUzO1xuICBmb3IoaW50IGk9MDtpPDU7aSsrKSB7XG4gICAgc3VtKz13ZWlnaHQqZHJlYW1Ob2lzZShxKTtcbiAgICBxPXZlYzIoMC44KnEueC0wLjYqcS55LDAuNipxLngrMC44KnEueSkqMi4wMyt2ZWMyKDE5LjcsNy4zKTtcbiAgICB3ZWlnaHQqPTAuNDg7XG4gIH1cbiAgcmV0dXJuIHN1bTtcbn1cbnZlYzQgZmxhbW9GcmFnbWVudCh2ZWMyIHV2KSB7XG5cbiAgZmxvYXQgYXNwZWN0PXVfcmVzb2x1dGlvbi54L21heCh1X3Jlc29sdXRpb24ueSwxLjApO1xuICB2ZWMyIHA9KHV2LXZlYzIoMC41KSkqdmVjMihhc3BlY3QsMS4wKTtcbiAgZmxvYXQgdD11X3RpbWUqMC4wMjU7XG4gIHZlYzIgd2FycD12ZWMyKGRyZWFtRmJtKHAqMi43K3ZlYzIodCouMTMsNC4xKSksZHJlYW1GYm0ocCoyLjMrdmVjMig5LjIsLXQqLjExKSkpLXZlYzIoLjUpO1xuICB2ZWMyIHE9cCozLjErd2FycCoxLjc7XG4gIGZsb2F0IGNsb3VkPWRyZWFtRmJtKHErdmVjMigtdCouMTcsdCouMDgpKTtcbiAgZmxvYXQgZmluZT1kcmVhbUZibShxKjMuOCt2ZWMyKHQqLjA5LDUuMikpO1xuICBmbG9hdCBmaWxhbWVudD1wb3cobWF4KDAuMCwxLjAtYWJzKGZpbmUqMi4wLTEuMCkpLDkuMCk7XG4gIGZsb2F0IGZvbGRzPXNpbihxLngqMy4xK3EueSo0LjMrY2xvdWQqOC4wK3QqLjIpO1xuICBmbG9hdCByaWRnZT1wb3cobWF4KDAuMCwxLjAtYWJzKGZvbGRzKSksMy4wKSpmaWxhbWVudDtcbiAgZmxvYXQgZW52ZWxvcGU9c21vb3Roc3RlcCguMTcsLjY1LGNsb3VkKTtcbiAgZmxvYXQgZHVzdD1zbW9vdGhzdGVwKC40MCwuNzEsZHJlYW1GYm0ocSoxLjY1K3ZlYzIoMy43LHQqLjA5KSkpO1xuICBmbG9hdCB3YXJtdGg9c21vb3Roc3RlcCguMjYsLjcyLGNsb3VkK3NpbihxLngqLjkrdCouMTIpKi4xNCk7XG4gIHZlYzMgY29vbD1taXgodmVjMyguMDM1LC4yOCwuNDIpLHZlYzMoLjIzLC4wNzUsLjMyKSxzbW9vdGhzdGVwKC0uNSwuNyxzaW4ocS55KjEuMSt0Ki4xMykpKTtcbiAgdmVjMyB3YXJtPW1peCh2ZWMzKC44MiwuMTksLjA2NSksdmVjMyguOTUsLjU5LC4yMSksZmluZSk7XG4gIHZlYzMgaW5rPW1peChjb29sLHdhcm0sd2FybXRoKTtcbiAgZmxvYXQgc2FmZT0uMjgrLjcyKnNtb290aHN0ZXAoLjEwLC4zNSx1di55KSooMS4wLXNtb290aHN0ZXAoLjcwLC45Nix1di55KSk7XG4gIGZsb2F0IGRlbnNpdHk9ZW52ZWxvcGUqKC4yNCsxLjIwKnJpZGdlKy4yOCpmaWxhbWVudCkqKDEuMC0uODgqZHVzdCkqc2FmZTtcbiAgdmVjMyByYWRpYW5jZT0oaW5rKmRlbnNpdHkrY29vbCplbnZlbG9wZSouMTYpKjEuNjU7XG4gIHZlYzMgYmFzZT12ZWMzKC4wMDYsLjAxMiwuMDI1KTtcbiAgcmV0dXJuIHZlYzQoYmFzZStyYWRpYW5jZS8odmVjMygxLjApK3JhZGlhbmNlKi42NSksMS4wKTtcbn1cbmA7XG4iXX0=