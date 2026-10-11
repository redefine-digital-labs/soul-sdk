# Original Collection composition restoration

This bounded candidate extends the exact upstream isolated SDK source. Status: Plan/Code; NOT_ACTIVATED and NOT_INSTALL_READY. Existing records DOF-001 / P01 / P09, owners and full objective remain authoritative.

1. Retain all eight previously adapted Soul and Collection Right public names, explicit targets, typed Coin<C>, CAS, snapshot, quote and fee commitments; preserve valid prior35 tests and their raw receipts.
2. `buildBuyCollectionTx` accepts both optional `buyerKioskId` and `buyerAccountObjectId` or neither. Existing pair uses only collection buy; missing pair composes Core custody new -> buy borrows both NestedResults -> custody finalize consumes the identical pair after buy. Never accept raw caps, expose a cap or use legacy environment/fallback; malformed and partial pairs fail locally. Account metadata is not on-chain proof.
3. Restore original `buildUpdateCollectionListingPriceTx` with params.target and same-PTB collection cancel<C>(Listing,Kiosk,Account,CAS) then list<C>(Collection,same Kiosk,same Account,Config,ask,expiry,holderEpoch,feeRevision,Clock). No registration/finalizer. Validate all repricing inputs before touching caller Transaction.
4. Pin actual frozen Market3225 / paired010b Core and leaf custody declarations; never substitute newer Maker ad70 graph. Real Transaction offline tests check exact BCS/order/types/references and caller command offset. No RPC, signing, chain build or business VM claim.
5. Write only this new candidate. Original/install SDK105, UI, contracts, CURRENT, Git, remote, dependency runtime and caches remain untouched. Reuse upstream node_modules read-only through excluded symlink. Max3 bounded verification rounds, stop after2 without substantive progress.

Soul repricing remains unresolved: current Market cancel transfers Soul to sender and returns void. It cannot feed list with the former escrow object ID within this PTB. No fake object ID reuse or invented contract ABI.

Acceptance: current35 regression pass, new composition tests pass, targeted tsc exit0, exact independent source/baseline hashes and protected181 checks, sandbox denies writes outside scope/network; independent parent review and remaining coherent install/UI/chain gates recorded separately.
