from pathlib import Path
import subprocess,json,os,hashlib
p=Path.cwd();env=dict(os.environ);env['TSX_DISABLE_CACHE']='1';commands=[('permission-probe',['python3','permission_probe.py']),('dump-composition',['/opt/homebrew/bin/node','--import','tsx','evidence/dump-composition.mts'])];rows=[]
for name,cmd in commands:
 r=subprocess.run(cmd,env=env,capture_output=True);out=p/f'evidence/{name}.stdout.log';err=p/f'evidence/{name}.stderr.log';out.write_bytes(r.stdout);err.write_bytes(r.stderr)
 rows.append({'name':name,'exit_code':r.returncode,'sandbox_argv':['/usr/bin/sandbox-exec','-f','sandbox.sb','python3','retain_checks.py'],'child_argv':cmd,'stdout':str(out.relative_to(p)),'stdout_sha256':hashlib.sha256(r.stdout).hexdigest(),'stderr':str(err.relative_to(p)),'stderr_sha256':hashlib.sha256(r.stderr).hexdigest()});print(name,'exit',r.returncode)
(p/'evidence/retention-exit-receipts.json').write_text(json.dumps(rows,indent=2)+'\n');assert all(row['exit_code']==0 for row in rows)
