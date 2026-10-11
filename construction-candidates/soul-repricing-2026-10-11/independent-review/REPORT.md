# Soul relist and SDK independent review v2

Overall scoped verdict: FAIL / SDK NOT_INSTALL_READY. Scope A contract/final harness PASS; Scope C passive compatibility PASS. Scope B saved121/121 tests and full107-source typecheck PASS are preserved, but one P2 input-validation finding blocks SDK acceptance.

Independent evidence checks:58 PASS/1 FAIL across59 checks. One additional minimal20-case unsigned grammar probe produced17 expected outcomes and3 malformed nested-identifier inputs accepted with supplied PTB mutation. Exact command/exit/source/runtime/raw evidence is retained. No source edits, VM or broad test reruns, Git/remotes/CURRENT/UI/chain changes.

| Scope | Verdict | Evidence |
| --- | --- | --- |
| A: frozen contract1cc475a + final driver | PASS23/23 | source unchanged outside cancel/additive relist block; production194 onlyMarket delta; actual64/64 with unchanged44/new20; original/frozen/installed guards exact |
| B: final fifth SDK0f71ef7 | FAIL23/24 | exact397files and historical04dc386 preserved;121/121/full107tsc confirmed; malformed nested modules/types pass roundtrip and mutate caller PTB |
| C: unchanged passive6 vectors onnew1cc | PASS12/12 | three original Move sources exact, VM6/6 raw, fresh production194 byte-equal to006, protected inputs exact |

Finding SDK-REPRICE-V2-01: final-round05/src/tx/update-price.ts:23–27 accepts C<0xdef::bad-name::Token>, C<0xdef::inner::Bad-Name>, C<0xdef::inner::Token::Extra>. Validate complete recursive Move TypeTag grammar before any transaction mutation. Preserve this fifth candidate; no sixth attempt authorized/performed here. Parent owns the next distinct correction scope after checkpoint.

Detailed scope-a-review.md, scope-b-review.md, scope-c-review.md and their checks JSONs explain facts and limits. Existing DOF-001/P01/P09, Handbook1.0 sections1–4,5,7,8.3/8.4,9,12 and OperatingModel8 apply; original owners/status/roadmap remain. This is an evidence attachment, not a competing board. Implemented/Verified scope facts are separate from Released/Adopted. No full B0, signed PTB/rollback, UI integration, activation, production initialization/release, deployed automation, external audit or full-goal closure claim.
