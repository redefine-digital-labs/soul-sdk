# Sui-core extraction independent candidate review

PASS for the isolated extraction. Actual canonical source-authority cutover remains pending. Reviewed frozen snapshot `2026-10-10T13:32:01.561540+00:00` against actual HEAD `0cfb60a29b2b378dd9fbf31970b324b2ef2e301e`. No actionable candidate findings.

- Ten byte-identical sources have only external Mysten imports or none; ten explicit filename subpaths, no root/wildcard/business export.
- Original105 SDK inputs (102 TypeScript+3 JSON), unchanged888-symbol barrel, original browser factory/wallet hook, original tests and two locks match their frozen SHA.
- Core dependency closure117/117 matches original full records apart from dev-scope flags;68 installed dependency identities match. Read-only typed checks pass; in-memory compiler output40/40 matches dist.
- Frozen tests pass: baseline300, linked300, actual-source300; public277 =269 unchanged original assertion instances+8 boundary cases. Six public test adaptations are exact import-string-only transforms.
- Final packed53 files match candidate, with all10 runtime/type exports independently resolved. Plan/apply/restore script and7 refusal controls protect canonical target, old/current inputs, backup and alternate locators before writes.
- All17 freeze keyfile hashes and139-file payload match; initial fresh install is historical.

Payload SHA256: `14c5a0af86a3e0afff49f8c3a04e6b4ea5902c61050ac6c7113b0843ecfc1c56`. Npm pack SHA256: `eb49086bc5e105a1c877617b004203ee2944926916171ccdb7cf564523fc1e72`. Core shrinkwrap SHA256: `73f0e0074765332ff9518786ecf0af91ba7bb92e52cdd7a746786e0bacd623e7`. Final source-authority script SHA256: `ab6974f23e7f96c82789a3a6e057a408bbc773bd3b5607252c8a024e162c9069`. Freeze SHA256: `76d5ae27d7864f1fa1b52270fca03ee45b77eaed71964193329c268ba497441e`.

Coordinator must apply actual10 links to `/Users/naoer/Documents/Claude/Projects/soulidity-ecosystem/soul-sdk/packages/sui-core/src` and verify post-cutover realpaths, actual105 source, original tests and UI entrypoints before claiming integration. The consumer fixture includes UI-only dependency changes; it does not claim the complete original web closure. No published package, full UI build/deployment or new Standard/Content/Maker/Market adapter acceptance is inferred.

Reviewer performed read-only source/evidence checks and independent no-emit/in-memory type/packed-runtime validation. Unit test counts are verified frozen executor results, not a second reviewer test run. Only these two review artifacts were written; original locks, wallet behavior and SDK sources stayed unchanged.
