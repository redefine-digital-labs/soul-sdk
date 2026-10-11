# SDK continuation ABI

Independent Market defines `Listing<soulidity_standard::soul::Soul,C>`. SDK `buildUpdateListingPriceTx` should build one Move call with actual Config and old shared listing, selecting collection form only with the actual bound Collection. No old cancel+object-ID reuse, no `cancel` result, no finalize/registry call. Both APIs share the new listing internally and return its ID; discovery/recovery must read Listed and Cancelled, then use the new ID.

`relist_soul<C>(l:&mut Listing<Soul,C>, cfg:&Config<C>, expected_listing:u64, price:u64, expiry:u64, expected_soul:u64, manifest_hash:vector<u8>, fee_revision:u64, clock:&Clock, ctx:&mut TxContext): ID`

`relist_soul_with_collection<C>(l:&mut Listing<Soul,C>, c:&Collection, cfg:&Config<C>, expected_listing:u64, price:u64, expiry:u64, expected_soul:u64, manifest_hash:vector<u8>, fee_revision:u64, clock:&Clock, ctx:&mut TxContext): ID`

Supply exactly one coin type argument C; TxContext implicit. `expected_listing` is old listing revision; `expected_soul` is Application character revision (the existing list API), distinct from Standard Soul revision. Client must provide exact current manifest hash, Config fee revision, new explicit price/expiry and Clock object. Published compatible package ABI/SDK actual PTB execution remains pending.
