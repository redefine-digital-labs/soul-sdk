#!/usr/bin/env python3
"""Reproducible local Sui-core build/test/pack runner; no RPC, Git or publication."""
from pathlib import Path
import argparse,hashlib,json,subprocess,shutil

def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()
def main():
 ap=argparse.ArgumentParser(description=__doc__)
 ap.add_argument('--package-root',required=True)
 ap.add_argument('--output-dir',required=True)
 ap.add_argument('--node',default=shutil.which('node'))
 ap.add_argument('--npm-cli',required=True)
 ap.add_argument('--install',action='store_true')
 ap.add_argument('--expected-node-version',default='v24.19.0')
 a=ap.parse_args();pkg=Path(a.package_root).resolve(strict=True);out=Path(a.output_dir).resolve()
 assert not out.exists(),f'Output directory must be fresh: {out}'
 node=Path(a.node).resolve(strict=True);npm=Path(a.npm_cli).resolve(strict=True)
 nodeversion=subprocess.check_output([str(node),'--version'],text=True).strip();assert nodeversion==a.expected_node_version
 manifest=json.loads((pkg/'package.json').read_text());lock=pkg/'npm-shrinkwrap.json'
 assert manifest['name']=='@soulidity/sui-core' and len(manifest['exports'])==10 and '.' not in manifest['exports']
 source_shas={str(p.relative_to(pkg)):sha(p) for p in sorted((pkg/'src').glob('*.ts'))};assert len(source_shas)==10
 lock_sha=sha(lock);out.mkdir(parents=True);commands=[]
 def run(label,argv):
  r=subprocess.run(argv,cwd=pkg,capture_output=True,text=True)
  (out/(label+'.stdout')).write_text(r.stdout);(out/(label+'.stderr')).write_text(r.stderr)
  commands.append({'label':label,'argv':argv,'cwd':str(pkg),'exit_code':r.returncode})
  assert r.returncode==0,f'{label} failed; inspect {out}'
 if a.install:run('npm-ci',[str(node),str(npm),'ci','--ignore-scripts','--no-audit','--no-fund','--registry','https://registry.npmjs.org'])
 for name,wanted in {**manifest['dependencies'],**manifest['devDependencies']}.items():
  assert json.loads((pkg/'node_modules'/name/'package.json').read_text())['version']==wanted
 run('build',[str(node),str(pkg/'node_modules/typescript/bin/tsc'),'-p',str(pkg/'tsconfig.json')])
 run('test',[str(node),str(pkg/'node_modules/vitest/vitest.mjs'),'run','--reporter=json','--outputFile='+str(out/'tests.json')])
 tests=json.loads((out/'tests.json').read_text());assert tests['success'] and tests['numFailedTests']==0
 run('pack',[str(node),str(npm),'pack','--ignore-scripts','--json','--pack-destination',str(out)])
 pack=json.loads((out/'pack.stdout').read_text())[0]
 assert source_shas=={str(p.relative_to(pkg)):sha(p) for p in sorted((pkg/'src').glob('*.ts'))}
 assert sha(lock)==lock_sha,'npm shrinkwrap changed during verification'
 report={'status':'passed','node':{'path':str(node),'version':nodeversion,'sha256':sha(node)},'npm_cli':str(npm),'commands':commands,'source_shas':source_shas,'lock_sha256':lock_sha,'tests_passed':tests['numPassedTests'],'pack':{'filename':pack['filename'],'integrity':pack['integrity'],'sha256':sha(out/pack['filename'])},'limits':'Local npm unit only; no source cutover, published package, full UI deployment or contract adapter claim'}
 (out/'evidence.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({'status':'passed','tests':tests['numPassedTests'],'evidence':str(out/'evidence.json')}))
if __name__=='__main__':main()
