"""Project contract regression; not a substitute for Studio runtime graph verification."""
import json,pathlib
root=pathlib.Path(__file__).resolve().parents[2]
def read(p):return json.loads((root/p).read_text())
a=read('view/data/artifact.flamo.json')
ids=set()
def walk(v):
 if isinstance(v,dict):
  g=v.get('guid')
  if isinstance(g,dict) and 'type' in v:ids.add(f"{g['sessionID']}:{g['localID']}")
  for x in v.values():walk(x)
 elif isinstance(v,list):
  for x in v:walk(x)
walk(a['scene'])
contracts={}
for p in (root/'.flamo/interaction-library/contracts').glob('*.behavior.json'):
 c=json.loads(p.read_text());contracts[c['id'],c['version']]=c
count=0;bindings=0
for nid,na in a['nodeArtifacts'].items():
 for s in na.get('scripts',[]):
  if not s.get('src','').startswith('src/components/coal/'):continue
  matches=[b for b in na.get('interactions',[]) if b['behaviorRef']==s['behaviorRef'] and b['version']==s['version']]
  assert len(matches)==1,(nid,s)
  assert matches[0]['roleBindings']['root']==nid
  count+=1
 for b in na.get('interactions',[]):
  key=b['behaviorRef'],b['version'];assert key in contracts,key
  c=contracts[key];roles=b.get('roleBindings',{})
  for role,rule in c['requiredRoles'].items():
   value=roles.get(role,[]);targets=value if isinstance(value,list) else [value]
   assert not rule.get('required') or targets,(nid,role,'required')
   cardinality=rule.get('cardinality')
   if cardinality=='one':assert len(targets)==1,(nid,role,targets)
   if cardinality=='zero-or-one':assert len(targets)<=1,(nid,role,targets)
   for target in targets:assert target in ids,(nid,role,target,'absent')
  bindings+=1
baseline=root/'.flamo/tools/coal-contract-baseline.json'
if baseline.exists():
 old=json.loads(baseline.read_text())
 assert old['scene']==a['scene'],'Scene mutated'
 assert old['surfaces']=={k:v.get('surface') for k,v in a['nodeArtifacts'].items()},'Public surface mutated'
print(json.dumps({'coalScripts':count,'validatedBindings':bindings,'sceneAndSurfacesUnchanged':baseline.exists(),'status':'passed'},indent=2))
