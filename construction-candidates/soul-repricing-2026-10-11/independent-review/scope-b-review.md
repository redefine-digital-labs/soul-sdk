# SDK final fifth candidate review

Scope B FAIL / NOT_INSTALL_READY. One P2 finding, three concrete counterexamples. Saved121/121 tests PASS and full original107-source tsconfig typecheck exit0 are confirmed; these do not satisfy complete input validation. Independent checks:23 PASS/1 FAIL. Evidence: scope-b-checks.json and sdk-minimal-counterexamples.*.

Final05 manifest0f71ef7e47e8cab750f39b50443d9af9726a2a6eee51b21236d390e425a6ff2b /397 ordinary files is exact. Historical04dc571e8f79405f110e2117024bba191d50f6e4aedb6914f359cb71a9510faf /386 files remains exact. Original upstream107 source has106 byte-identical files and only tx/update-price.ts replaced; original actual105, installed181, frozen contract3230, original76 test sources/status identities, runtime/package pins and protected CURRENT/governance are exact. Both saved before/after16 checks and all4 final receipts/raw hashes match. No broad suite rerun.

Positive builder semantics are correct: explicit target, exactly one C generic; l[,c],cfg,listingCAS,price,expiry,ApplicationSoulRevision,manifest,feeRevision,Clock match actual frozen Move signatures and independently decoded BCS values. Move returns ID while sharing the new Listing internally, so the builder correctly emits one call and uses no returned ID as an object/finalize/result. It returns the supplied Transaction instance and preserves prior commands. All normal scalar/object/hash validations precede tx.object/tx.pure/moveCall. Existing index export exposes the target type; legacy env/kiosk/registry/native-Animacraft fallback calls are absent.

[P2] Validate nested Move identifiers before supplied PTB mutation (final-round05/src/tx/update-price.ts:23–27). marketTarget checks outer struct syntax but accepts arbitrary nested generic text. normalizeStructTag and bcs.TypeTag roundtrip preserve invalid nested module/name strings, so malformed types pass the new guard. With valid other inputs and an already populated Transaction, these all return successfully and append a relist call:

- 0xabc::usdc::USDC<0xdef::bad-name::Token>
- 0xabc::usdc::USDC<0xdef::inner::Bad-Name>
- 0xabc::usdc::USDC<0xdef::inner::Token::Extra>

The encoded argument retains the malformed identifier, and supplied PTB state changes in each case. This directly violates SPEC: validate every input before mutating an optional supplied Transaction. No signing or chain loss was observed. The minimal parent-authorized20-case unsigned probe ran once under no-network/write-denying sandbox, with pinned runtime and sourceSHA13e6939edeba21c4e8d52b7df025970e2895b38386b1f2c158d23bbc78da32bb. Thirteen other malformed cases reject with unchanged PTB; valid nested/vector/multiple-generic/permitted-whitespace cases4/4 accept. Rawstdout and command/exit/hash receipt are retained.

Required correction: validate the entire recursive raw Move TypeTag grammar, including every nested address, module and type identifier, before transaction mutation; preserve valid nested/vector/multiple/whitespace behavior. BCS serializability plus normalization equality does not validate identifier grammar. This fifth candidate is frozen and not accepted; max5 is exhausted. No sixth attempt or source repair was performed by this review. A distinct substantiated correction scope is parent-owned.

UI_MAPPING.md accurately identifies original caller/data-event/recovery work still needed. Existing UI and routes remain unchanged; no chain/target ABI authority, signing, rollback, UI integration, activation, published compatibility, release or parent-goal completion is established.
