#!/usr/bin/env python3
"""Plan by default; explicit --apply performs the coordinator's reversible cutover.
Only the ten inventoried SDK files are changed. No Git/npm/RPC operations.
"""
from pathlib import Path
import argparse, hashlib, json, os, shutil

HERE = Path(__file__).resolve().parent.parent


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def assert_regular(path):
    assert path.is_file() and not path.is_symlink(), f'Expected regular file: {path}'

def checked_paths(args,sources):
    root = Path(args.actual_root).resolve(strict=True)
    target = Path(args.target_repo).resolve(strict=True)
    old = root / 'packages/soulidity-sdk/src'
    new = target / 'packages/sui-core/src'
    assert old.is_dir() and new.is_dir()
    assert root != target
    return [(old / Path(s['path']).name, new / Path(s['path']).name, s['sha256']) for s in sources]

def main():
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument('operation', choices=['cutover', 'restore'])
    ap.add_argument('--actual-root', required=True)
    ap.add_argument('--target-repo', required=True)
    ap.add_argument('--backup-dir', required=True)
    ap.add_argument('--apply', action='store_true')
    ap.add_argument('--evidence-dir', default=str(HERE/'evidence'))
    args=ap.parse_args()
    evidence=Path(args.evidence_dir).resolve(strict=True)
    sources=json.loads((evidence/'source-import.json').read_text())['sources']
    guard=json.loads((evidence/'integration-guard.json').read_text())
    paths=checked_paths(args,sources)
    root=Path(args.actual_root).resolve(strict=True)
    for record in guard['paths']:
        current=root / record['path']
        assert current.is_file() and sha(current)==record['sha256'], f'Frozen original guard mismatch: {current}'
        is_ten=record['path'].startswith('packages/soulidity-sdk/src/') and current.name in guard['cutover_ten']
        if not is_ten or args.operation=='cutover':
            assert not current.is_symlink(), f'Unexpected frozen source locator: {current}'
    backup=Path(args.backup_dir)
    rows=[]
    for old,new,expected in paths:
        assert_regular(new); assert sha(new)==expected, f'Target SHA mismatch: {new}'
        saved=backup / old.name
        temporary=old.with_name(old.name+'.sui-core-authority-tmp')
        assert not temporary.exists() and not temporary.is_symlink(), f'Unexpected temp: {temporary}'
        if args.operation=='cutover':
            assert_regular(old); assert sha(old)==expected, f'Original SHA mismatch: {old}'
        else:
            assert (old.is_symlink() and old.resolve(strict=True)==new.resolve(strict=True)) or (old.is_file() and not old.is_symlink() and sha(old)==expected), f'Unexpected or changed current source: {old}'
            assert_regular(saved); assert sha(saved)==expected, f'Backup SHA mismatch: {saved}'
        rows.append({'consumer':str(old),'authority':str(new),'sha256':expected,'restore':str(saved),'relative_link':os.path.relpath(new,old.parent)})
    if args.operation=='cutover':
        assert not backup.exists(), f'Backup directory must be fresh: {backup}'
    if args.apply:
        if args.operation=='cutover':
            backup.mkdir(parents=True)
            for old,new,expected in paths: shutil.copy2(old, backup / old.name)
            (backup/'manifest.json').write_text(json.dumps(rows,indent=2)+'\n')
        # All inputs validated before any source write. Atomic per-file replacement.
        for old,new,expected in paths:
            temporary=old.with_name(old.name+'.sui-core-authority-tmp')
            assert not temporary.exists() and not temporary.is_symlink(), f'Unexpected temp: {temporary}'
            if args.operation=='cutover':temporary.symlink_to(os.path.relpath(new,old.parent))
            else:shutil.copy2(backup / old.name,temporary)
            os.replace(temporary,old)
        for old,new,expected in paths:
            assert sha(old)==expected
            assert (old.is_symlink() and old.resolve(strict=True)==new.resolve(strict=True)) if args.operation=='cutover' else not old.is_symlink()
    print(json.dumps({'operation':args.operation,'applied':args.apply,'files':rows,'limit':'Local source ownership only; never chain rollback'},indent=2))

if __name__=='__main__':main()
