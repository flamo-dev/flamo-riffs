import json, math, statistics
from pathlib import Path
out=Path('.flamo/reports/dream-frame-meteor');r=json.loads((out/'raw.json').read_text());w=r.get('witness',{});samples=w.get('samples',[])
phases=['drag','ctrl-wheel-in','ctrl-wheel-out']
base=next((s for s in samples if s.get('phase')=='baseline' and s.get('brand')),None)
result={'revision':r['revision'],'artifactSha256':r['sha256'],'errors':r['errors'],'traceVerification':r.get('traceVerification'),'hud':{},'native':{},'shots':r['shots']}
for phase in phases:
 ss=[s for s in samples if s['phase']==phase and s['kind']=='before' and s.get('brand')]
 result['hud'][phase]={'samples':len(ss),'distinctRafTimestamps':len(set(s['frame'] for s in ss)),'maxBrandErrorCssPx':{k:max([abs(s['brand'][k]-base['brand'][k]) for s in ss],default=None) for k in ['x','y','width','height']},'zoomRange':[min([s['camera']['zoom'] for s in ss],default=None),max([s['camera']['zoom'] for s in ss],default=None)]}
 for id in ['24','27','28','34']:
  ref=next((s['nodes'][id] for s in samples if s['phase']=='baseline' and id in s.get('nodes',{})),None)
  ns=[s['nodes'][id] for s in samples if s['phase']==phase and id in s.get('nodes',{})]
  if ref:
   z=ref['cameraAtResolve']['zoom'];width=ref['bounds']['width']*z;height=ref['bounds']['height']*z
   result['native'][phase+'/'+id]={'samples':len(ns),'maxPositionError':max([math.hypot(n['screen']['x']-ref['screen']['x'],n['screen']['y']-ref['screen']['y']) for n in ns],default=None),'maxWidthError':max([abs(n['bounds']['width']*n['cameraAtResolve']['zoom']-width) for n in ns],default=None),'maxHeightError':max([abs(n['bounds']['height']*n['cameraAtResolve']['zoom']-height) for n in ns],default=None)}
frames=w.get('frames',[]);intervals=[b['wallTime']-a['wallTime'] for a,b in zip(frames,frames[1:]) if b['wallTime']>a['wallTime']]
result['frameIntervalsMs']={'count':len(intervals),'median':statistics.median(intervals) if intervals else None,'p95':sorted(intervals)[int(len(intervals)*.95)] if intervals else None}
result['contacts']=[t for t in w.get('trace',[]) if t['action']=='dream.collision'];result['replay']=[t for t in w.get('trace',[]) if t['action']=='dream.replay'];result['peakMeteors']=max([f['meteors'] for f in frames],default=None)
(out/'summary.json').write_text(json.dumps(result,ensure_ascii=False,indent=2));print(json.dumps({k:v for k,v in result.items() if k not in ['shots','contacts','replay']},indent=2))
