# Isolated Soul repricing SDK candidate v2

Restore original seller price-update journey using exactly one independent Market relist call. Explicit MarketTransactionTarget, old listing CAS, new positive u64 price, explicit u64 expiry, current Application Soul revision (distinct from Standard revision), exact32-byte manifest hash, Config fee revision and actual Clock are required. Actual Collection ID selects relist_soul_with_collection; absence selects relist_soul. Exactly C type argument; no owned-Soul object ID or kiosk/registry/finalize path and no result reuse.

Validate every input before mutating an optional supplied Transaction. Preserve all107 upstream source files except tx/update-price.ts and both unchanged test files containing76 cases. Full original-config107 source typecheck, all unchanged76 plus meaningful SDK/BCS tests; exact actual105/installed181 and frozen input guards before/after. No signing/network/chain/build/activation/Git/UI mutation. Max5 verification attempts; stop after2 with no progress.

DOF-001/P01/P09, original157 responsibilities/30 modules and owners remain. Full objective stays active. Handbook1.0 sections1–4,5,7,8.3/8.4,9,12; OPERATING_MODEL8. Implemented/Verified are separate from Released/Adopted. Contract original44PASS/new18of20 was the input state; the root-owned separate harness driver decides any later results.

Final05 adds exact normalized C↔BCS TypeTag roundtrip before supplied tx mutation. Parent04dc386-file freeze preserved; authorized append-only final-round05 directory. Fifth gate is final; independent review probes remain separate.
