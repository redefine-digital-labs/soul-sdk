from pathlib import Path
import os,subprocess,json,sys,hashlib,time
p=Path.cwd();round_no=int(sys.argv[1]);assert 1<=round_no<=3
receipt=p/f'evidence/round{round_no:02d}-exit-receipts.json';assert not receipt.exists()
env=dict(os.environ);env['TSX_DISABLE_CACHE']='1'
commands=[('prior35-tests',['/opt/homebrew/bin/node','--import','tsx','--test','tests/market.test.ts']),('composition-tests',['/opt/homebrew/bin/node','--import','tsx','--test','tests/collection-composition.test.ts']),('targeted-tsc',['/opt/homebrew/bin/node','node_modules/typescript/bin/tsc','-p','tsconfig.targeted.json'])]
rows=[]
for name,cmd in commands:
 start=time.time();r=subprocess.run(cmd,env=env,cwd=p,capture_output=True)
 out=p/f'evidence/round{round_no:02d}-{name}.stdout.log';err=p/f'evidence/round{round_no:02d}-{name}.stderr.log';out.write_bytes(r.stdout);err.write_bytes(r.stderr)
 rows.append({'name':name,'argv':['/usr/bin/sandbox-exec','-f','sandbox.sb','python3','run_verification.py',str(round_no)],'child_argv':cmd,'exit_code':r.returncode,'elapsed_seconds':time.time()-start,'stdout':str(out.relative_to(p)),'stdout_sha256':hashlib.sha256(r.stdout).hexdigest(),'stderr':str(err.relative_to(p)),'stderr_sha256':hashlib.sha256(r.stderr).hexdigest()})
 print(name, 'exit',r.returncode);print(r.stdout.decode(errors='replace')[-1600:]);print(r.stderr.decode(errors='replace')[-1600:])
receipt.write_text(json.dumps(rows,indent=2)+'\n')
sys.exit(0 if all(r['exit_code']==0 for r in rows) else 1)
