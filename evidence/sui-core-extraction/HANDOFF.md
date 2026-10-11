# Sui-core extraction candidate handoff — 2026-10-10

Bounded isolated executor output. Actual old/new repositories were read-only; no RPC, signing, real keys, production, commits or npm publication. Root coordinator owns the actual cutover. This package ownership increment does not complete the V8 → reconstructed Standard/Content/Maker/Market business adapters.

Final freeze: `/tmp/sdk-sui-core-extraction-20261010/evidence/final-freeze.json`. Import archive SHA256 `14c5a0af86a3e0afff49f8c3a04e6b4ea5902c61050ac6c7113b0843ecfc1c56`; 139 files, 441295 bytes. No `node_modules`. Archive layout is relative to the new `soul-sdk` root:

- `packages/sui-core`: ten byte-identical sources, typed dist, package manifest, original-assertion tests, eight new blackbox boundary checks and original-lock-derived npm shrinkwrap.
- `tools/sui-core-extraction`: local verification runner, source-authority planner/apply/restore and readonly actual-source-context creator.
- `evidence/sui-core-extraction`: exact source/test hashes, import-only test diff, positive/negative guard controls, build/test/pack evidence, plus standalone `consumer-environment` manifest/lock for UI verifier dependencies.

`@soulidity/sui-core@0.0.1` is an unpublished candidate. It exports exactly `./sui-grpc-compat`, `./sui-network`, `./tx-result`, `./coin-selection`, `./object-inputs`, `./request`, `./format`, `./profile-read-step`, `./chain-object-discovery`, `./chain-event-discovery`. It has no root/wildcard/business export. No new Soul BCS, old deployment/document ID or business adapter is promoted into this package.

The core shrinkwrap has 117 dependency nodes and exactly matches original lock records, including nested/optional platform entries, except intended dev reachability flags. Installed68 core records match the frozen records. Runtime is the supplied Node24.19.0; npm11.19.0. Direct versions are Sui2.16.0, TypeScript6.0.3, Vitest4.1.5, @types/node25.6.2. Original `package-lock.json` and `web/package-lock.json` remain unchanged. The verifier's extra UI dependency environment is isolated and recorded in `consumer-verifier-extra-dependencies.json`; it is not proof of the original UI's full production build/deployment. Baseline and linked candidate share the identical verifier environment.

Verification: 9 unchanged original suites300/300 before and300/300 after ten candidate links; 6 original public-package suites269 plus8 new boundary checks=277/277. A direct readonly actual-source context also passed the same300 original assertions. Original105 SDK inputs are102TS+3JSON; its unchanged barrel retains888 public symbols. Independent package build, baseline/linked/actual SDK105 typechecks, two original UI consumer typechecks, ten fresh-tgz runtime/type exports and standalone runner ci→build→test→pack passed. Root/wildcard/business imports were rejected. Independent reviewer evidence is supplied separately; full UI production acceptance and business adapter migration remain pending.

Coordinator import and actual cutover from `/Users/naoer/Documents/Claude/Projects/soulidity-ecosystem/soul-sdk`:

1. Verify archive SHA and all `import-payload-files.json` entries, import the candidate tree without touching the existing template files outside these paths, and copy `final-freeze.json` as evidence.
2. Run the independent package runner. Node/npm arguments below are the exact observed public runtime tools. It records source, lock and pack identity and refuses lock/source drift:

```sh
python3 tools/sui-core-extraction/verify-package.py \
  --package-root packages/sui-core \
  --output-dir evidence/sui-core-extraction/installed-package-run \
  --node /Users/naoer/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node \
  --npm-cli /opt/homebrew/lib/node_modules/npm/bin/npm-cli.js --install
```

3. Plan then apply the source-authority change. The tool changes only the ten old SDK source locators and validates all127 original SDK/UI/lock inputs first. Backup directory must be fresh. All source bytes/API remain unchanged; all old SDK root/subpath imports remain available:

```sh
python3 tools/sui-core-extraction/source-authority.py cutover \
  --actual-root /Users/naoer/.codex/worktrees/soul-dof-v1-rebuild/soulidity \
  --target-repo /Users/naoer/Documents/Claude/Projects/soulidity-ecosystem/soul-sdk \
  --evidence-dir evidence/sui-core-extraction \
  --backup-dir evidence/sui-core-extraction/actual-ten-source-before
```

Append `--apply` only for the coordinator's authorized local cutover. Result maps exact relative symlink→new sole source authority. The unchanged original105 SDK barrel is retained in its original package; the new independent package contains no business barrel.

4. Prepare the separate UI verifier dependency root by running `npm ci --ignore-scripts --no-audit --no-fund --registry https://registry.npmjs.org` via the same Node/npm CLI inside `evidence/sui-core-extraction/consumer-environment`. This writes only the new evidence environment, not original locks. Create a fresh readonly actual-source context:

```sh
python3 tools/sui-core-extraction/create-actual-source-context.py \
  --actual-root /Users/naoer/.codex/worktrees/soul-dof-v1-rebuild/soulidity \
  --core-package packages/sui-core \
  --dependency-root evidence/sui-core-extraction/consumer-environment \
  --evidence-dir evidence/sui-core-extraction \
  --context /tmp/sdk-actual-source-context-after-cutover
```

The context links to the actual old105 sources and actual original UI files. Its explicit aliases bind runtime/declarations to the new independent core's real frozen Mysten package; React/dapp-kit verifier dependencies are separate. Test source files are byte-identical originals. From that fresh context run the supplied Node executable with `node_modules/vitest/vitest.mjs run --reporter=json --outputFile=original-tests.json`, `node_modules/typescript/bin/tsc -p tsconfig.sdk.json` and `node_modules/typescript/bin/tsc -p tsconfig.consumer.json`. All reports/cache stay in this context; source and original root/web locks stay read-only. Before/after expected result is300/300,0 typed diagnostics.

Recovery command uses the same paths and the frozen actual-ten backup:

```sh
python3 tools/sui-core-extraction/source-authority.py restore \
  --actual-root /Users/naoer/.codex/worktrees/soul-dof-v1-rebuild/soulidity \
  --target-repo /Users/naoer/Documents/Claude/Projects/soulidity-ecosystem/soul-sdk \
  --evidence-dir evidence/sui-core-extraction \
  --backup-dir evidence/sui-core-extraction/actual-ten-source-before
```

`--apply` performs atomic per-file restoration after complete validation. It accepts original regular files in a partial cutover, but refuses altered source/backup/lock or a different same-bytes locator. Positive roundtrip and7 guard rejection controls passed. This is local source rollback, never chain rollback. Keep the new evidence and original Owners/records. Existing record references and handbookv1.0 applicable1–5/9/12 are recorded in `source-import.json` and `validation-summary.json`; full parent goal stays open.

`initial-fresh-install/` is explicitly historical: first direct-pinned installation permitted transitive drift; those artifacts are not the final accepted candidate.
