from pathlib import Path
import json,socket,errno,sys
p=Path.cwd();b=json.loads((p/'evidence/baseline.json').read_text());pins=json.loads((p/'evidence/composition-inputs.json').read_text());r=Path(b['actual_sdk']).parents[2];up=Path(pins['upstream'])
paths=[Path.home()/'.move',Path.home()/'.npm',Path(b['actual_sdk']),r/'web',r/'move',r/'docs/codex',Path('/Users/naoer/Documents/Claude/Projects/soulidity/docs/codex'),Path('/Users/naoer/Documents/Claude/Projects/soulidity-ecosystem'),Path(b['abi_path']).parent,Path('/Users/naoer/.codex/worktrees/owned-creation-construction/soulidity/output/application-manifest-read-candidate/frozen'),up,up/'baseline',up/'node_modules',p/'baseline',p/'node_modules']
rows=[]
for d in paths:
 f=d/'.composition-permission-probe';assert not f.exists()
 try:
  with f.open('xb') as stream:stream.write(b'probe')
  raise RuntimeError('unexpected permitted outside-scope write: '+str(f))
 except OSError as e:rows.append({'path':str(d),'write_denied':e.errno in [errno.EACCES,errno.EPERM],'errno':e.errno})
for f in [p/'package.json',p/'package-lock.json']:
 try:
  fd=__import__('os').open(f,__import__('os').O_WRONLY);__import__('os').close(fd)
  rows.append({'path':str(f),'write_denied':False})
 except OSError as e:rows.append({'path':str(f),'write_denied':e.errno in [errno.EACCES,errno.EPERM],'errno':e.errno})
try:
 with socket.socket() as s:s.connect(('127.0.0.1',9))
 rows.append({'network_denied':False})
except OSError as e:rows.append({'network_denied':e.errno in [errno.EACCES,errno.EPERM],'errno':e.errno})
print(json.dumps(rows,indent=2));sys.exit(0 if all(row.get('write_denied',row.get('network_denied')) for row in rows) else 1)
