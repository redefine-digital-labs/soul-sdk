from pathlib import Path
import json,socket,errno
p=Path.cwd();baseline=json.loads((p/'evidence/baseline.json').read_text())
r=Path(baseline['actual_sdk']).parents[2]
protected=[Path.home()/'.move',Path.home()/'.npm',Path(baseline['actual_sdk']),r/'move',r/'web',r/'docs/codex',Path('/Users/naoer/Documents/Claude/Projects/soulidity-ecosystem'),Path(baseline['abi_path']).parent,Path('/Users/naoer/.codex/worktrees/owned-creation-construction/soulidity/output/application-manifest-read-candidate/frozen'),p/'node_modules',p/'baseline']
results=[]
for directory in protected:
 path=directory/'.sdk-candidate-permission-probe';assert not path.exists()
 try:
  with path.open('xb') as f:f.write(b'permission probe')
  results.append({'path':str(directory),'write_denied':False,'errno':None})
 except OSError as e:results.append({'path':str(directory),'write_denied':e.errno in [errno.EPERM,errno.EACCES],'errno':e.errno})
try:
 with socket.socket() as s:s.connect(('127.0.0.1',9))
 results.append({'network_denied':False})
except OSError as e:results.append({'network_denied':e.errno in [errno.EPERM,errno.EACCES],'errno':e.errno})
print(json.dumps(results,indent=2));assert all(row.get('write_denied',row.get('network_denied')) for row in results)
