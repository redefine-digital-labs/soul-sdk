# soul-sdk

SDK: client tools without authoritative state. On-demand reads, transaction construction, error handling and recovery.

Maintenance entry points: [MODULE](MODULE.md), [Agent boundaries](AGENTS.md), [compatibility](COMPATIBILITY.md), [operation and recovery](RUNBOOK.md). Machine configuration: [module.json](module.json).

Actual construction: 10 generic Sui sources moved to their sole maintenance location in `packages/sui-core`; original SDK paths locate the same source. Independent package 277 tests, original consumer 300 tests, and type checks of 105 original SDK sources and two original UI entry points pass. Original 888 exports, source contents and original root/web locks remain; business-module adaptation and complete UI journeys still await construction. See module.json for detailed evidence statuses; independent deployment and remote CI remain unaccepted.
Recommended role LUQI; original Owner unchanged. Unconfirmed actual maintainer and independent acceptor mappings remain pending; role names are not accounts or audit qualifications.

```sh
python3 scripts/ci.py
python3 scripts/ci.py --product
python3 scripts/ci.py --release-ready
```

Default CI checks the maintenance contract; `--product` refuses to pass when no product command is registered. Readiness gates do not deploy or sign.

The actual package name is `@soulidity/sui-core@0.0.1`, exposing only 10 explicit file entry points, with no business modules or root wildcard exports. The original lock pins a 117-package closure; dependency drift in the first fresh installation was rejected and failure evidence retained, then the final repinned run passed. Installation/build uses recorded Node24.19 and npm11.19; this does not establish remote publication.

- [Actual source cutover](evidence/sui-core-extraction/actual-cutover-command.json), [original caller regression and type verification](evidence/sui-core-extraction/actual-post-cutover-verification.json).
- [Independent package build / 277 tests](evidence/sui-core-extraction/installed-package-run/evidence.json), [repository product CI](evidence/sui-core-extraction/actual-product-ci.json), [independent actual-path review](evidence/sui-core-extraction/independent-actual-review.json).
- Executable recovery tool: `tools/sui-core-extraction/source-authority.py`; before recovery, verify the 10 current locations, original source hashes and `actual-ten-source-before` copies, starting with a read-only plan. Recovery does not modify on-chain objects or replace full-product acceptance.

## Current checkpoint

See [construction status](CONSTRUCTION_STATUS.md) for current evidence, blockers, recovery material and remote coordination. This checkpoint is not a release.
