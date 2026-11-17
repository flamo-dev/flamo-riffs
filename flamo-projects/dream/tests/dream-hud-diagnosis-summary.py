import json, math, statistics,hashlib
p='.flamo/reports/dream-hud-diagnosis/'
r=json.load(open(p+'raw.json'));w=r['witness'];s=w['samples'];out={'revision':r['revision'],'artifactSha256':r['sha256'],'errors':r['errors'],'browser':r['browser'],'contexts':list(set(w['contexts'])),'gesture':r['gesture'],'registrations':w['registrations'],'phases':{}}
for phase in dict.fromkeys(x['phase'] for x in s):
 a=[x for x in s if x['phase']==phase];b=[x['brand'] for x in a if x.get('brand')];d={'samples':len(a)}
 if b:d['brandRange']={k:[min(v[k] for v in b),max(v[k] for v in b)] for k in ['x','y','width','height']}
 d['nativeAsyncProjection']={}
 for id in ['24','34']:
  ns=[v['nodes'][id] for v in a if id in v.get('nodes',{})];
  if ns:d['nativeAsyncProjection'][id]={'count':len(ns),'x':[min(n['screen']['x'] for n in ns),max(n['screen']['x'] for n in ns)],'y':[min(n['screen']['y'] for n in ns),max(n['screen']['y'] for n in ns)],'screenWidth':[min(n['bounds']['width']*n['cameraAtResolve']['zoom'] for n in ns),max(n['bounds']['width']*n['cameraAtResolve']['zoom'] for n in ns)]}
 d['zoomRange']=[min(x['camera']['zoom'] for x in a),max(x['camera']['zoom'] for x in a)];out['phases'][phase]=d
c=[x for x in w['callbacks'] if x['name']=='draw'];dt=[b['t']-a['t'] for a,b in zip(c,c[1:])];out['drawIntervalsMs']={'median':statistics.median(dt),'p95':sorted(dt)[int(.95*len(dt))],'count':len(dt)}
out['nativeReadLatencyMs']={}
lat=[n['resolvedAt']-v['at'] for v in s for n in v.get('nodes',{}).values()];out['nativeReadLatencyMs']={'median':statistics.median(lat),'max':max(lat)}
out['traceActions']={k:sum(x.get('action')==k for x in w['trace']) for k in set(x.get('action') for x in w['trace'])}
out['artifactUnchanged']=hashlib.sha256(open('view/data/artifact.flamo.json','rb').read()).hexdigest()==r['sha256']
json.dump(out,open(p+'summary.json','w'),ensure_ascii=False,indent=2)
print(json.dumps(out,ensure_ascii=False,indent=2))
