# Independent Market SDK candidate review

**SCOPED_SOURCE_AND_SAVED_EVIDENCE_PASS; NOT_ACTIVATED; NOT_INSTALL_READY.** The eight original builders are consistent with the exact frozen Market3225 and same-graph Core Collection signatures. No functional defect was found in the reviewed constructor scope. One P2 evidence finding remains below. This review executed only local read-only data/hash checks; it did not run the candidate, compiler, VM, build, sandbox probe, network, Git or chain operation.

Candidate: `../independent-market-sdk-candidate-v1`. Machine-readable checks and exact SHA pins are in [verification.json](verification.json); the reproducible saved-evidence checker is [verify_saved_evidence.py](verify_saved_evidence.py).

## Scope and source result

Market frozen manifest matches `3225bc37f9812b9b6ef4dd0f4c8521132096b58ab16982e5a5f461fcc2920104`, paired with App `010b1ccae2b2f01e5378008abf48c901d3b77b93954bcc79ad4fc5c45dffe129`. Market ABI SHA is `72586a4503fc4737caca6a41b2e4d8826ab2e3eb7ec167d92c955407dff316ff`; same-graph Core Collection ABI SHA is `2c9d015a20ba03dbd1f8561528e542ef8533f9c0a683698ca78a1408cd41dddd`. Both frozen graph hash maps match their current files, and independent declaration parsing matches the saved parsed ABI.

| Original builder | Exact target and type arguments | Source/unsigned shape reviewed |
| --- | --- | --- |
| `buildListSoulTx` | `market::list_soul<C>` or `list_soul_with_collection<C>` | Owned Soul consumed by value; actual Collection in the latter; Config, price, expiry, Soul revision, manifest, fee revision, Clock in ABI order. Move creates/shares Listing directly. |
| `buildBuySoulTx` | `market::buy_soul<C>` or `buy_soul_with_collection<C>` | Listing, actual Collection when required, Config, listing CAS, manifest, Collection snapshot when required, buyer quote, fee revision, attempt, exact payment, Clock. |
| `buildDelistSoulTx` | `market::cancel<Soul,C>` | Listing and CAS only; Move checks seller; no Config/pause dependency. |
| `buildDeleteSoulListingTx` | `market::delete_listing<Soul,C>` | Listing only; Move requires terminal state and absent AssetKey; cleanup is permissionless. |
| `buildListCollectionTx` | `collection::list<C>` | Actual Collection, seller Kiosk/sealed Account, Config, ask, expiry, holder epoch, fee revision, Clock. |
| `buildBuyCollectionTx` | `collection::buy<C>` | Right Listing, actual Collection/Factory/TransferPolicy<Right>, seller and buyer Kiosks, buyer Account, Config, listing CAS, holder epoch, fee revision, quote, attempt, payment, Clock. |
| `buildDelistCollectionTx` | `collection::cancel<C>` | Right Listing, seller Kiosk/Account and CAS; no Config. |
| `buildDeleteCollectionListingTx` | `collection::delete_listing<C>` | Right Listing only; Move requires terminal state and absent RightKey; no seller restriction. |

Collection Right remains its distinct Core custody/holder journey; no substitution with a Soul order was found. Soul sale transfers to the sender, and Collection-backed Soul purchase binds the actual Collection snapshot. Client parameters do not establish real ownership, canonical object identity, shared mutability or chain type origins.

The typed payment helper validates canonical C, normalized nonzero IDs, duplicate IDs, positive bigint u64 amount/balances, merged u64 overflow and sufficient selected balance before coin commands. Exact selected total consumes the primary Coin directly, after merging when needed. Excess selected balance produces a SplitCoins result consumed by buy, with residual primary retained and exposed by the helper. The original ID-only `buildExactPaymentCoin` function is byte exact for untouched Native callers; it is not used by the adapted buy routes. This does not grant a broad pass to unadapted Native behavior.

Current installed SDK has the exact original 105-file set and hashes. The independent baseline has 105 matching ordinary copies with no shared source-file inode. Only original `tx/list.ts`, `buy.ts`, `delist.ts` differ in the candidate; the other 102 original files match, and `tx/market-target.ts` is the only added source. All 106 candidate source hashes, tests, package/lock pins, retained report/evidence hashes and original 181-file guard pass with zero drift.

## Saved verification result and finding

Saved round02 and round03 raw test logs each contain 35 named passes, zero failures/cancellations/skips/todos, and summaries matching `result.json`. They use real `@mysten/sui` Transaction source, not a mock. Round02 targeted typecheck retains the real TS2345 array-inference failure. Final source uses TransactionArgument arrays. The targeted configuration covers only the four adapted/helper files and test file, excluding the whole index, unchanged Native modules and UI. The installed local package identities match Sui 2.16.0, tsx 4.23.1 and TypeScript 6.0.3.

**SDK-EVIDENCE-01 (P2, evidence portability):** round03 targeted typecheck is writer-reported PASS, but its retained raw log is empty and the SDK evidence set has no process completion receipt recording argv, cwd and exit code. An empty log hash cannot independently prove successful compiler completion. Retain the actual completed process receipt with log/source hashes, or obtain one in a separately authorized offline evidence run. Do not fabricate a historical receipt. This finding does not identify a runtime defect; this reviewer did not rerun tsc.

The missing initial ad-hoc smoke stdout is explicitly disclosed in both its saved receipt and result; its reported 34/35/comment-regex failure is not independently reproducible from retained raw output. The round02/03 logs are retained and hash exact. The 12 saved sandbox probe rows match result exactly: 11 protected path writes and network access were denied. The saved sandbox policy contains those protections; this reviewer did not execute the probes or infer a broader sandbox guarantee.

All ten saved unsigned examples pass independent Python checks for package/module/function, generic count and values, ABI parameter order/count, object IDs, decoded BCS u64/hash32 values and consumed split-result references. Their sender/gas fields remain unset and objects unresolved; the evidence is explicitly illustrative, unsigned and uses fabricated IDs. It proves saved constructor shape, not an executable chain PTB, real quote authenticity or settlement.

## Activation and delivery boundary

`UI_MAPPING.md` accurately records the changed public signatures, owned-Soul custody/read/quote/index gaps, distinct Collection Right mapping, existing-pair restriction, pending automatic buyer Kiosk/Account creation and repricing. Its retained production/regression caller hashes match current source. Whole-index exports, original UI activation, affected old-signature regression suites, automatic pair composition, repricing and chain identity/build/sign/settlement/readback remain unaccepted. No source installation, Publisher/latestCap/governance verification, B0 completion or Core budget release clearance follows from this review.

This report attaches to existing DOF-001/P01/P09 evidence without changing their owners, milestones or status. Review stage: Test, limited to source and retained offline evidence. Applied manage-soulidity-phases; read actual AGENTS/PROJECT_MEMORY/CURRENT and its single named handoff. Handbook v1.0 sections 1–4, 5–7, 8.3/8.4, 9 and 12, Operating Model section 8 and its review template were read from the primary repository because the actual worktree has no agent-management copy; their SHA pins are recorded in verification.json. Financial-model and EVM mechanisms are not applicable; payment shape is applicable, while actual funds/authority/governance remain unverified. Release/Deploy/Operate/Monitor were not performed. The parent owns remaining acceptance and any remote backup; this review performed no remote writes.
