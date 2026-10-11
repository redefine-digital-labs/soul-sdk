#!/usr/bin/env python3
"""Create a fresh isolated verifier that reads actual source paths without modifying them."""
from pathlib import Path
import argparse,json,hashlib,shutil,os
HERE=Path(__file__).resolve().parent.parent


def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()
def select(value,kind):
 if isinstance(value,str):return value
 if isinstance(value,dict):
  for k in [kind,'default','import','require']:
   if k in value:
    chosen=select(value[k],kind)
    if chosen:return chosen
 return None

def main():
 ap=argparse.ArgumentParser(description=__doc__)
 ap.add_argument('--actual-root',required=True)
 ap.add_argument('--core-package',required=True)
 ap.add_argument('--dependency-root',default=str(HERE/'consumer-proof'))
 ap.add_argument('--context',required=True)
 ap.add_argument('--evidence-dir',default=str(HERE/'evidence'))
 a=ap.parse_args()
 evidence=Path(a.evidence_dir).resolve(strict=True)
 INPUT=json.loads((evidence/'source-import.json').read_text())
 GUARD=json.loads((evidence/'integration-guard.json').read_text())
 actual=Path(a.actual_root).resolve(strict=True);core=Path(a.core_package).resolve(strict=True);deps=Path(a.dependency_root).resolve(strict=True);ctx=Path(a.context)
 assert not ctx.exists(),f'Require fresh context: {ctx}'
 for r in GUARD['paths']:assert sha(actual/r['path'])==r['sha256'],f'Guard changed: {r["path"]}'
 assert json.loads((core/'node_modules/@mysten/sui/package.json').read_text())['version']=='2.16.0'
 ctx.mkdir(parents=True);(ctx/'node_modules').symlink_to(deps/'node_modules')
 (ctx/'package.json').write_text(json.dumps({'name':'sdk-actual-source-readonly-context','version':'0.0.0','private':True,'type':'module'},indent=2)+'\n')
 for file in INPUT['original_tests']:
  p=ctx/file;p.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(actual/file,p)
 for file in INPUT['unchanged_consumer_files']:
  p=ctx/file;p.parent.mkdir(parents=True,exist_ok=True)
  if file=='web/package.json':shutil.copy2(actual/file,p)
  else:p.symlink_to(actual/file)
 # Relative test module paths arrive at these links, then read the actual original SDK source tree.
 (ctx/'packages/soulidity-sdk').mkdir(parents=True)
 (ctx/'packages/soulidity-sdk/src').symlink_to(actual/'packages/soulidity-sdk/src')
 (ctx/'web/node_modules').symlink_to(deps/'node_modules')
 aliases=[];typepaths={};package_records=[]
 packages={'@mysten/sui':core/'node_modules/@mysten/sui','fflate':deps/'node_modules/fflate','@mysten/dapp-kit':deps/'node_modules/@mysten/dapp-kit','@noble/hashes':deps/'node_modules/@noble/hashes','@protobuf-ts/runtime-rpc':deps/'node_modules/@protobuf-ts/runtime-rpc','react':deps/'node_modules/react','react-dom':deps/'node_modules/react-dom'}
 for name,package in packages.items():
  manifest=json.loads((package/'package.json').read_text());exports=manifest.get('exports')
  if isinstance(exports,str) or (isinstance(exports,dict) and not any(k.startswith('.') for k in exports)):exports={'.':exports}
  if not exports:exports={'.':{'import':manifest.get('module',manifest.get('main')),'types':manifest.get('types',manifest.get('typings'))}}
  for key,value in exports.items():
   if '*' in key:continue
   specifier=name+(key[1:] if key!='.' else '')
   runtime=select(value,'import');decl=select(value,'types')
   if runtime:aliases.append({'find':specifier,'replacement':str(package/runtime)})
   if decl:
    if decl.endswith('.js') and (package/decl.replace('.js','.d.ts')).exists():decl=decl.replace('.js','.d.ts')
    if decl.endswith(('.ts','.mts','.cts')):typepaths[specifier]=[str(package/decl)]
  package_records.append({'name':name,'version':manifest['version'],'path':str(package)})
 # React's runtime export map has no declarations; use the real pinned DefinitelyTyped packages.
 for name in ['react','react-dom']:
  d=deps/'node_modules/@types'/name
  typepaths[name]=[str(d/'index.d.ts')];typepaths[name+'/*']=[str(d/'*')]
 aliases=[{'find':'@soulidity/sdk','replacement':str(actual/'packages/soulidity-sdk/src/index.ts')}]+aliases
 # Convert exact aliases to regexp so subpaths cannot be eaten by a root alias.
 code="import { defineConfig } from 'vitest/config';\nconst aliases = "+json.dumps(aliases)+";\nexport default defineConfig({ cacheDir: './.vite-cache', resolve: { alias: aliases.map(row => ({ find: new RegExp('^' + row.find.replace(/[.*+?^${}()|[\\\\]\\\\]/g, '\\\\$&') + '$'), replacement: row.replacement })) }, test: { environment: 'node', maxWorkers: 2, setupFiles: ['./tests/no-network.ts'], include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'] } });\n"
 (ctx/'vitest.config.ts').write_text(code)
 shutil.copy2(deps/'tests/no-network.ts',ctx/'tests/no-network.ts')
 typepaths['@soulidity/sdk']=[str(actual/'packages/soulidity-sdk/src/index.ts')]
 typepaths['@soulidity/sdk/*']=[str(actual/'packages/soulidity-sdk/src/*')]
 options={'strict':True,'skipLibCheck':True,'esModuleInterop':True,'target':'ES2022','module':'ESNext','moduleResolution':'bundler','lib':['ES2022','DOM','DOM.Iterable'],'types':['node','react'],'jsx':'react-jsx','noEmit':True,'paths':typepaths}
 (ctx/'tsconfig.sdk.json').write_text(json.dumps({'compilerOptions':options,'include':[str(actual/'packages/soulidity-sdk/src/**/*.ts')]},indent=2)+'\n')
 (ctx/'tsconfig.consumer.json').write_text(json.dumps({'compilerOptions':options,'include':[str(actual/'web/lib/sui/browser-client.ts'),str(actual/'web/lib/hooks/use-wallet-sign.ts')]},indent=2)+'\n')
 record={'actual_root':str(actual),'core_package':str(core),'dependency_root':str(deps),'context':str(ctx),'original_tests_unchanged':len(INPUT['original_tests']),'actual_sdk_src_readonly_link':str(ctx/'packages/soulidity-sdk/src'),'actual_ui_readonly_links':INPUT['unchanged_consumer_files'],'frozen_actual_guards':GUARD['paths'],'runtime_aliases':aliases,'type_paths':typepaths,'dependency_packages':package_records,'limit':'No writes to actual root or core package; verifier cache/reports under fresh context only'}
 (ctx/'context-manifest.json').write_text(json.dumps(record,indent=2)+'\n')
 print(ctx)

if __name__=='__main__':main()
