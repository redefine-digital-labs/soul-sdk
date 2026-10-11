# soul-sdk

SDK: client tools without authoritative state. On-demand reads, transaction construction, error handling and recovery.

Maintenance entry points: [MODULE](MODULE.md), [Agent boundaries](AGENTS.md), [compatibility](COMPATIBILITY.md), [operation and recovery](RUNBOOK.md). Machine configuration: [module.json](module.json).

Current local construction: the ten original Sui utility sources retain their sole maintenance location and original SDK source links. The additive `move-type-tag` helper brings the pure utility package to eleven explicit subpaths. The actual registered package check passes287 tests and produces the pinned artifact; fresh package and consumer installations have passed independent review. Original SDK105 sources,888 exports and original root/web locks remain unchanged. Historical original300 consumer evidence is preserved; business adapters, complete UI journeys, independent actual-activation review and releases remain pending.
Recommended role LUQI; original Owner unchanged. Unconfirmed actual maintainer and independent acceptor mappings remain pending; role names are not accounts or audit qualifications.

```sh
python3 scripts/ci.py
python3 scripts/ci.py --product
python3 scripts/ci.py --release-ready
```

Default CI checks the maintenance contract; `--product` refuses to pass when no product command is registered. Readiness gates do not deploy or sign.

The actual package name is `@soulidity/sui-core@0.0.1`, exposing eleven explicit file entry points, with no business modules or root wildcard exports. The original lock pins a 117-package closure; dependency drift in the first fresh installation was rejected and failure evidence retained, then the final repinned run passed. Installation/build uses recorded Node24.19 and npm11.19; this does not establish remote publication.

- [Actual source cutover](evidence/sui-core-extraction/actual-cutover-command.json), [original caller regression and type verification](evidence/sui-core-extraction/actual-post-cutover-verification.json).
- [Independent package build / 277 tests](evidence/sui-core-extraction/installed-package-run/evidence.json), [repository product CI](evidence/sui-core-extraction/actual-product-ci.json), [independent actual-path review](evidence/sui-core-extraction/independent-actual-review.json).
- Executable recovery tool: `tools/sui-core-extraction/source-authority.py`; before recovery, verify the 10 current locations, original source hashes and `actual-ten-source-before` copies, starting with a read-only plan. Recovery does not modify on-chain objects or replace full-product acceptance.

Current pure-unit evidence: [activation receipt](evidence/sui-core-source-activation-v2/activation-receipt.json), [actual package verification](evidence/sui-core-source-activation-v2/actual-package-evidence.json), [clean-install independent review](evidence/sui-core-source-activation-v2/clean-install-review-result.json). The original ten-source checker remains unchanged; the registered checker uses the explicit v2 profile. The current package README is the only artifact member delta from the upstream reviewed archive.

## Current checkpoint

See [construction status](CONSTRUCTION_STATUS.md) for current evidence, blockers, recovery material and remote coordination. This checkpoint is not a release.
