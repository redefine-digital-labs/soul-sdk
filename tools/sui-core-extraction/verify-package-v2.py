#!/usr/bin/env python3
"""Verify the explicit eleven-source pure Sui unit; no RPC or publication."""
from pathlib import Path, PurePosixPath
import argparse
import hashlib
import json
import os
import shutil
import subprocess


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def require(ok, message):
    if not ok:
        raise ValueError(message)


def inputs(pkg, profile):
    manifest = json.loads((pkg / 'package.json').read_text())
    require(profile['profile_id'] == 'pure-sui-11-v2', 'Unknown source profile')
    require(manifest['name'] == '@soulidity/sui-core', 'Wrong package identity')
    require(manifest['exports'] == profile['exports'], 'Public export profile mismatch')
    require(set(manifest['exports']) == {'./' + Path(p).stem for p in profile['sources']},
            'Source/public subpath ownership mismatch')
    actual = {str(p.relative_to(pkg)) for p in (pkg / 'src').rglob('*') if p.is_file()}
    require(actual == set(profile['sources']), 'Exact eleven-source ownership mismatch')
    observed = {}
    for relative, expected in profile['required_file_shas'].items():
        path = PurePosixPath(relative)
        require(not path.is_absolute() and '..' not in path.parts, 'Unsafe profile path')
        file = pkg / relative
        require(file.is_file() and not file.is_symlink(), 'Missing regular profile file: ' + relative)
        require(file.resolve().is_relative_to(pkg), 'Profile file escapes package')
        observed[relative] = sha(file)
        require(observed[relative] == expected, 'Frozen source/test/config mismatch: ' + relative)
    return manifest, observed


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--package-root', required=True)
    ap.add_argument('--output-dir', required=True)
    ap.add_argument('--node', default=shutil.which('node'))
    ap.add_argument('--npm-cli', required=True)
    ap.add_argument('--install', action='store_true')
    a = ap.parse_args()
    pkg = Path(a.package_root).resolve(strict=True)
    out = Path(a.output_dir).absolute()
    require(not out.exists(), 'Output directory must be fresh')
    profile_path = Path(__file__).with_name('source-profile-v2.json')
    profile = json.loads(profile_path.read_text())
    manifest, before = inputs(pkg, profile)
    node = Path(a.node).resolve(strict=True)
    npm = Path(a.npm_cli).resolve(strict=True)
    require(subprocess.check_output([str(node), '--version'], text=True).strip() == 'v24.19.0',
            'Require Node24.19.0')
    require(subprocess.check_output([str(node), str(npm), '--version'], text=True).strip() == '11.19.0',
            'Require npm11.19.0')
    out.mkdir(parents=True)
    runtime = out / 'runtime'
    runtime.mkdir()
    for name in ['user.npmrc', 'global.npmrc']:
        (runtime / name).write_text('')
    # No inherited npm configuration or authentication. HOME is left unchanged.
    env = {k: v for k, v in os.environ.items()
           if not k.lower().startswith('npm_') and 'token' not in k.lower()}
    env.update({'npm_config_userconfig': str(runtime / 'user.npmrc'),
                'npm_config_globalconfig': str(runtime / 'global.npmrc'),
                'npm_config_cache': str(runtime / 'cache'),
                'npm_config_update_notifier': 'false'})
    commands = []

    def run(label, argv):
        result = subprocess.run(argv, cwd=pkg, env=env, capture_output=True, text=True)
        stdout = out / (label + '.stdout')
        stderr = out / (label + '.stderr')
        stdout.write_text(result.stdout)
        stderr.write_text(result.stderr)
        commands.append({'label': label, 'argv': argv, 'cwd': str(pkg),
                         'exit_code': result.returncode,
                         'stdout_sha256': sha(stdout), 'stderr_sha256': sha(stderr)})
        (out / 'commands.json').write_text(json.dumps(commands, indent=2) + '\n')
        require(result.returncode == 0, label + ' failed; inspect ' + str(out))
        return result.stdout

    if a.install:
        run('npm-ci', [str(node), str(npm), 'ci', '--ignore-scripts', '--no-audit', '--no-fund',
                       '--registry', 'https://registry.npmjs.org'])
    for name, version in {**manifest['dependencies'], **manifest['devDependencies']}.items():
        require(json.loads((pkg / 'node_modules' / name / 'package.json').read_text())['version'] == version,
                'Installed direct dependency mismatch: ' + name)
    run('build', [str(node), str(pkg / 'node_modules/typescript/bin/tsc'), '-p', str(pkg / 'tsconfig.json')])
    run('test', [str(node), str(pkg / 'node_modules/vitest/vitest.mjs'), 'run', '--reporter=json',
                 '--outputFile=' + str(out / 'tests.json')])
    tests = json.loads((out / 'tests.json').read_text())
    require(tests['success'] and tests['numPassedTests'] == 287 and tests['numFailedTests'] == 0
            and tests.get('numPendingTests', 0) == 0 and tests.get('numTodoTests', 0) == 0,
            'Require original277 plus direct10; no failed/skipped tests')
    packed = json.loads(run('pack', [str(node), str(npm), 'pack', '--ignore-scripts', '--json',
                                    '--pack-destination', str(out)]))[0]
    artifact = out / packed['filename']
    require(sha(artifact) == profile['pack_sha256'], 'Reviewed package artifact mismatch')
    _, after = inputs(pkg, profile)
    require(before == after, 'Source/test/lock/config changed during verification')
    report = {'status': 'PASS', 'profile_id': profile['profile_id'],
              'profile_sha256': sha(profile_path), 'source_files': len(profile['sources']),
              'tests_passed': 287, 'source_test_config_shas': after, 'commands': commands,
              'node': {'path': str(node), 'sha256': sha(node), 'version': 'v24.19.0'},
              'npm_cli_sha256': sha(npm), 'pack': {'path': str(artifact), 'sha256': sha(artifact),
              'integrity': packed['integrity']},
              'limits': 'Pure Sui utility local verification; no business activation, npm release, chain or UI journey acceptance'}
    (out / 'evidence.json').write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps({'status': 'PASS', 'profile': profile['profile_id'], 'tests': 287,
                      'pack_sha256': sha(artifact), 'evidence': str(out / 'evidence.json')}))


if __name__ == '__main__':
    try:
        main()
    except (ValueError, KeyError, OSError, subprocess.CalledProcessError) as error:
        raise SystemExit('Sui v2 verification failed: ' + str(error))
