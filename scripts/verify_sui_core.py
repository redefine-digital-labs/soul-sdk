#!/usr/bin/env python3
"""Registered local build/test/pack check for the independent Sui utility unit."""
import os
import shutil
import subprocess
import uuid
from pathlib import Path

root = Path(__file__).resolve().parent.parent
node = os.environ.get('SOUL_SDK_NODE_BIN') or shutil.which('node')
npm = os.environ.get('SOUL_SDK_NPM_CLI') or shutil.which('npm')
if not node or not npm:
    raise SystemExit('Provision Node24.19.0 and npm11.19.0 before running the package check.')
command = ['python3', str(root / 'tools/sui-core-extraction/verify-package-v2.py'),
           '--package-root', str(root / 'packages/sui-core'),
           '--output-dir', str(root / 'output' / ('sui-core-' + uuid.uuid4().hex[:12])),
           '--node', str(Path(node).resolve()), '--npm-cli', str(Path(npm).resolve())]
raise SystemExit(subprocess.call(command, cwd=root))
