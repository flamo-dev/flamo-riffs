export const depthVertex=`#version 300 es
layout(location=0) in vec3 p;
layout(location=4) in vec4 motion;
uniform float exploded, selected;
uniform mat4 lightMatrix;
void main(){
  gl_Position=selected>0. && motion.w!=selected ? vec4(2.,2.,2.,1.) :
    lightMatrix*vec4(p+motion.xyz*exploded,1.);
}
`;
export const depthFragment=`#version 300 es
precision highp float;
void main(){}
`;
export const vertex=`#version 300 es
layout(location=0) in vec3 p;
layout(location=1) in vec3 n;
layout(location=2) in vec3 albedo;
layout(location=3) in vec4 finish;
layout(location=4) in vec4 motion;
uniform float exploded, selected;
uniform mat4 vp;
out vec3 materialPoint;
out vec3 pos,norm,base;
out vec4 surface;
void main(){
  materialPoint=p;pos=p+motion.xyz*exploded;norm=n;base=albedo;surface=finish;
  gl_Position=selected>0. && motion.w>0. && motion.w!=selected ? vec4(2.,2.,2.,1.) : vp*vec4(pos,1.);
}
`;
export const fragment=`#version 300 es
precision highp float;
in vec3 pos,norm,base,materialPoint;
uniform float selected;
in vec4 surface;
uniform vec3 eye;uniform sampler2D patina,roofMap;
uniform mat4 light0,light1;
precision highp sampler2DShadow;
uniform sampler2DShadow shadow0,shadow1;
layout(location=0) out vec4 color;
layout(location=1) out vec4 geometry;
const vec3 key=vec3(-.527,.767,.365);
const vec3 fill=vec3(.359,.801,-.479);
float hash(vec3 p){p=fract(p*.1031);p+=dot(p,p.yzx+33.33);return fract((p.x+p.y)*p.z);}
float noise(vec3 p){
 vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
 return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
 mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+1.),f.x),f.y),f.z);}
float filteredWave(float t){return cos(t)*exp(-.19*pow(min(fwidth(t),12.),2.));}
float shadow(sampler2DShadow map,mat4 m,vec3 p,vec3 n,float rad){
 vec4 clip=m*vec4(p+n*.010,1.);vec3 uv=clip.xyz*.5+.5;
 if(any(lessThan(uv,vec3(0)))||any(greaterThan(uv,vec3(1))))return 1.;
 float total=0.;
 for(int i=0;i<20;i++){float fi=float(i)+.5;float a=fi*2.39996;vec2 offset=vec2(cos(a),sin(a))*sqrt(fi/20.)*rad;total+=texture(map,vec3(uv.xy+offset,uv.z-.00020));}
 return total*.05;
}
// Rectangular roof lights, high clerestory windows and a warmer strip to the aisle.
// Their changing solid angles keep glossy reflections coherent as the camera moves.
vec3 room(vec3 r, float rough){
 float k=rough*rough;
 vec3 c=mix(vec3(.055,.054,.053),vec3(.25,.36,.48),smoothstep(-.20,.72,r.y));
 c*=1.-.80*exp(-pow((r.y-.06)/(.12+.17*k),2.));
 float az=atan(r.x,r.z);
 float window=exp(-pow((r.y-.32)/(.075+.29*k),4.));
 float side=smoothstep(-.36,.32,r.z);
 float mullion=mix(.68,1.,smoothstep(.06,.24,abs(sin(az*15.+.2)) + k*1.6));
 c+=mix(vec3(.62,.90,1.12),vec3(2.25,1.96,1.64),side)*window*mullion*(1.-.69*k);
 float roof=exp(-pow((r.y-.80)/(.09+.35*k),2.));
 float strips=mix(.20,1.,smoothstep(.34,.75,abs(sin(az*4.+1.2))+k*.9));
 c*=.55+.45*smoothstep(-.18,.34,sin(az*3.+r.y*11.));
 c+=vec3(2.85,3.20,3.55)*roof*strips*(1.-.66*k);
 float end=pow(max(dot(r,normalize(vec3(-.85,.35,.32))),0.),mix(135.,9.,k));
 c+=vec3(5.1,3.45,1.98)*end;
 vec2 siteUV=vec2(az/2.45+.85,1.08-r.y*1.42);
 float site=textureLod(roofMap,siteUV,rough*rough*5.).r;
 float reflectance=.25+3.4*pow(site,3.5);
 c*=mix(1.,reflectance,smoothstep(-.4,.12,r.y)*(.94-.3*rough));
 return c;
}
float specTerm(vec3 n,vec3 v,vec3 l,float rough){
 vec3 h=normalize(v+l);float ndh=max(dot(n,h),0.);float a=max(.045,rough*rough);
 float t=ndh*ndh*(a*a-1.)+1.;return min(3.,a*a/(3.14159*t*t+.0001));
}
void main(){
 vec3 n=normalize(norm),v=normalize(eye-pos);
 float rough=surface.x,metal=surface.y,id=surface.z;
 vec3 albedo=pow(base,vec3(2.2))*surface.w;
 float mott=noise(pos*vec3(3.5,2.,4.1)),broad=noise(pos*.86),grain=noise(pos*vec3(38.,55.,41.));
 float keyVis=shadow(shadow0,light0,pos,n,id>8.?(.0035+.00055*min(8.,abs(pos.z))):.00105);
 float skyVis=shadow(shadow1,light1,pos,n,id>8.?.0036:.0016);
 vec3 c;
 if(id>8.){
   float patches=.57*broad+.30*mott+.13*grain;
   vec3 concrete=mix(vec3(.041,.049,.055),vec3(.063,.074,.081),patches);
   float dust=noise(pos*vec3(42.,1.,42.));concrete*=.95+.10*dust;
   float pool=exp(-dot(pos.xz*vec2(.061,.13),pos.xz*vec2(.061,.13)));
   float distanceFromPot=length(max(abs(pos.xz)-vec2(10.85,1.88),vec2(0.)));
   float contact=selected>0.?1.:1.-.59*exp(-distanceFromPot*2.1);
   c=concrete*(vec3(.48,.57,.65)+vec3(.93,.79,.61)*keyVis+vec3(.29,.37,.47)*skyVis)*(.50+.63*pool)*contact;
   c+=vec3(.018,.019,.018)*pow(max(dot(reflect(-key,n),v),0.),7.)*keyVis;
   c=mix(vec3(.032,.043,.055),c,exp(-max(length(pos.xz)-18.,0.)*.025));
 }else{
   float brushed=0.,delta=0.;
   vec2 grainUV=abs(n.x)>.70?vec2(materialPoint.z,materialPoint.y):vec2(materialPoint.x,materialPoint.y+abs(materialPoint.z)*.37);
   float scuff=texture(patina,grainUV/vec2(.37,.66)+floor(materialPoint.x*1.29)*.234).r-.50;
   float sheetWarp=noise(materialPoint*vec3(3.6,1.8,1.5))-.5;
   float tooling=noise(materialPoint*vec3(1.2,.53,4.))-.5;
   float scale=length(fwidth(materialPoint));float micro=1.-smoothstep(.009,.065,scale);
   if(id>1.5&&id<4.5){
     vec3 axis=abs(n.x)>.75?vec3(0.,.87,.49):vec3(.13,.93,.35);
     float line=dot(materialPoint,axis);
     float satin=(noise(materialPoint*vec3(5.,38.,32.))-.5);
     brushed=filteredWave(line*1020.+satin*2.8)*micro;
     delta=(mott-.5)*.14+(broad-.5)*.13+satin*.048+brushed*.021;
     if(id<2.5){
       float t=materialPoint.y*300.+materialPoint.z*sign(materialPoint.z)*43.;
       delta+=.042*filteredWave(t);
       n=normalize(n+vec3(.006,.031,.014)*filteredWave(t));
     }
     float flex=id<2.5?1.0:(id>3.5?.41:.23);
     n=normalize(n+flex*vec3(.13*sheetWarp+.035*satin,.16*tooling+.078*sheetWarp,.06*tooling)+vec3(scuff*.042,scuff*.045,0.));
     delta+=scuff*.45;
     if(id<2.5){float bay=fract(materialPoint.x/.774+.5);float edge=min(bay,1.-bay);
       albedo*=.84+.16*smoothstep(.015,.17,edge);
       rough+=.009*noise(materialPoint*vec3(8.,.7,1.))+.13*scuff;}
     else if(id<3.5){rough+=.08*scuff;}
   }else if(id>.5){delta=(mott-.5)*.11+(broad-.5)*.10+(grain-.5)*.05;}
   if(id==6.){
     float grit=noise(materialPoint*91.)-.5;
     delta+=(grain-.5)*.15+grit*.22;
     n=normalize(n+vec3(grit*.085,.028*(grain-.5),.046*(mott-.5)));
   }
   if(id==8.||id==7.){
     float wave=sin(materialPoint.x*7.3+1.9*sin(materialPoint.z*5.2));
     n=normalize(n+vec3(.042*wave,.007,.045*cos(materialPoint.z*9.+wave)));
   }
   rough=clamp(rough+delta*.47,.16,.97);albedo*=1.+delta;
   float ndv=max(dot(n,v),.005),nk=max(dot(n,key),0.),nf=max(dot(n,fill),0.);
   vec3 fres=mix(vec3(.043),albedo,metal);
   vec3 f=fres+(max(vec3(1.-rough*.52),fres)-fres)*pow(1.-ndv,5.);
   float hemi=.45+.55*(n.y*.5+.5);
   c=albedo*(1.-metal*.98)*(vec3(.48,.55,.60)*hemi +
       vec3(2.15,1.77,1.36)*nk*keyVis+vec3(.90,1.11,1.37)*nf*skyVis);
   vec3 r=reflect(-v,n);
   float ambientVisibility=.60+.24*skyVis+.16*keyVis;
   c+=room(r,rough)*f*ambientVisibility*(1.-rough*.29);
   c+=f*specTerm(n,v,key,rough)*nk*keyVis*vec3(1.95,1.67,1.28);
   c+=f*specTerm(n,v,fill,rough)*nf*skyVis*vec3(.82,.95,1.18);
   if(id==6. && base.r<.43){
     float pores=noise(materialPoint*83.)*.55+noise(materialPoint*29.)*.45;
     float pits=smoothstep(.66,.84,pores);
     c=albedo*(vec3(.32,.36,.39)+nk*keyVis*vec3(.86,.77,.68)+nf*skyVis*vec3(.43,.51,.57))*(.82+.25*pores-.39*pits);
     c+=vec3(.012)*hemi*ambientVisibility;
   }
   if(id==7.)c+=vec3(.89,.120,.013)*(.67+.33*noise(materialPoint*2.3));
 }
 color=vec4(clamp(c/(c+vec3(1.08)),0.,1.),1.);geometry=vec4(n*.5+.5,1.);
}
`;
export const fullVertex=`#version 300 es
out vec2 uv;
void main(){vec2 p=vec2((gl_VertexID<<1)&2,gl_VertexID&2);uv=p;gl_Position=vec4(p*2.-1.,0.,1.);}
`;
export const composite=`#version 300 es
precision highp float;
in vec2 uv;out vec4 fragment;
uniform sampler2D lit,normals,depth;
uniform vec2 pixels;uniform mat4 invVP;
vec3 point(vec2 st,float d){vec4 p=invVP*vec4(st*2.-1.,d*2.-1.,1.);return p.xyz/p.w;}
float hash(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.54);}
void main(){
 vec3 linear=texture(lit,uv).rgb;float d=texture(depth,uv).r;
 if(d<.99999){
 vec3 n=normalize(texture(normals,uv).xyz*2.-1.);vec3 p=point(uv,d);
 float obstruction=0.;float rotation=hash(floor(gl_FragCoord.xy*.5))*6.283;
 for(int i=0;i<20;i++){float j=float(i)+.5;float a=rotation+j*2.39996;float radius=.9+j*1.18;
   vec2 sampleUV=uv+vec2(cos(a),sin(a))*radius*pixels;float sampleD=texture(depth,sampleUV).r;
   vec3 off=point(sampleUV,sampleD)-p;float len=length(off);
   obstruction+=max(dot(n,off/max(len,.0001))-.10,0.)*(1.-smoothstep(.10,1.03,len))*smoothstep(.008,.045,len);
 }
 linear*=clamp(1.-obstruction*.098,.45,1.);
 }
 vec3 lum=linear/(max(vec3(.018),1.-linear))*1.08;
 lum*=1.15;
 vec3 film=clamp((lum*(2.51*lum+.03))/(lum*(2.43*lum+.59)+.14),0.,1.);
 vec3 display=pow(film,vec3(1./2.2));float vignette=1.-.09*dot((uv-.5)*1.4,(uv-.5)*1.4);
 fragment=vec4(display*vignette+(hash(gl_FragCoord.xy)-.5)/255.,1.);
}
`;
