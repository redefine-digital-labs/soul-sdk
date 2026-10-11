from pathlib import Path
import os,subprocess,json,sys,hashlib,time,datetime
p=Path.cwd();round_no=int(sys.argv[1]);assert 1<=round_no<=5
receipt=p/f'evidence/round{round_no:02d}-receipts.json';assert not receipt.exists()
env=dict(os.environ);env['TSX_DISABLE_CACHE']='1'
commands=[('scope-before',['python3','verify_scope.py']),('all-sdk-tests',['/opt/homebrew/bin/node','--import','tsx','--test','tests/market.test.ts','tests/collection-composition.test.ts','tests/soul-reprice.test.ts']),('full-original-config-tsc',['/opt/homebrew/bin/node','node_modules/typescript/bin/tsc','-p','tsconfig.json']),('scope-after',['python3','verify_scope.py'])]
rows=[]
for name,child in commands:
 cmd=['/usr/bin/sandbox-exec','-f','sandbox.sb',*child];start=time.time();started=datetime.datetime.now(datetime.timezone.utc).isoformat();r=subprocess.run(cmd,env=env,cwd=p,capture_output=True)
 out=p/f'evidence/round{round_no:02d}-{name}.stdout.log';err=p/f'evidence/round{round_no:02d}-{name}.stderr.log';out.write_bytes(r.stdout);err.write_bytes(r.stderr)
 rows.append({'name':name,'argv':cmd,'cwd':str(p),'exit_code':r.returncode,'elapsed_seconds':time.time()-start,'started_utc':started,'finished_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'stdout':str(out.relative_to(p)),'stdout_sha256':hashlib.sha256(r.stdout).hexdigest(),'stderr':str(err.relative_to(p)),'stderr_sha256':hashlib.sha256(r.stderr).hexdigest()})
 print(name,'exit',r.returncode);print(r.stdout.decode(errors='replace')[-2700:]);print(r.stderr.decode(errors='replace')[-1800:])
receipt.write_text(json.dumps(rows,indent=2)+'\n');sys.exit(0 if all(r['exit_code']==0 for r in rows) else 1)
