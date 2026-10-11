import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { Transaction } from '@mysten/sui/transactions'
import { bcs } from '@mysten/sui/bcs'
import { buildBuyCollectionTx } from '../src/tx/buy'
import { buildUpdateCollectionListingPriceTx } from '../src/tx/update-collection-price'
import { objectId, coinType } from '../src/tx/market-target'

const pins = JSON.parse(readFileSync('evidence/composition-inputs.json','utf8'))
function parts(s: string) {
 const out: string[]=[];let d=0,start=0
 for(let i=0;i<s.length;i++){if(s[i]==='<')d++;if(s[i]==='>')d--;if(s[i]===','&&d===0){out.push(s.slice(start,i).trim());start=i+1}}
 if(s.slice(start).trim())out.push(s.slice(start).trim());return out
}
function parse(name: string) {
 const pin=pins.abi[name], source=readFileSync(pin.path,'utf8')
 assert.equal(createHash('sha256').update(source).digest('hex'),pin.sha256)
 const abi: Record<string,{generics:string[];params:{name:string;type:string}[];returns:string;declaration:string}>={}
 for(const m of source.matchAll(/^public fun (\w+)(?:<([^>]+)>)?\(([^)]*)\)\s*(?::([^\{]*))?\{/gm)) {
  abi[m[1]!] = {generics:parts(m[2]??''),params:parts(m[3]!).map(p=>{const i=p.indexOf(':');return{name:p.slice(0,i).replace(/^mut /,''),type:p.slice(i+1)}}),returns:(m[4]??'void').trim(),declaration:m[0]}
 }
 return {source,abi}
}
const custody=parse('core_custody'),leaf=parse('leaf_custody'),collection=parse('collection'),market=parse('market')
writeFileSync('evidence/composition-parsed-abi.json',JSON.stringify({custody:custody.abi,leaf:leaf.abi,collection:collection.abi,market:market.abi},null,2)+'\n')
const id=(n:number)=>objectId(`0x${n.toString(16)}`),hash=(n:number)=>new Uint8Array(32).fill(n)
const C=coinType('0xabc::usdc::USDC')
const target={packageId:id(104),paymentCoinType:C,configObjectId:id(103),clockObjectId:id(6),factoryObjectId:id(105),rightTransferPolicyObjectId:id(106)}
const coins=[{objectId:id(301),coinType:C,balanceAtomic:80n},{objectId:id(302),coinType:C,balanceAtomic:40n}]
const buy={target,listingObjectId:id(206),collectionObjectId:id(203),sellerKioskId:id(204),expectedListingRevision:14n,expectedHolderEpoch:15n,feeRevision:16n,expectedQuoteHash:hash(5),attemptHash:hash(6),totalAtomic:100n,paymentCoins:coins}
const existing={buyerKioskId:id(207),buyerAccountObjectId:id(208)}
const reprice={target,currentKioskId:id(204),currentAccountObjectId:id(205),collectionObjectId:id(203),listingObjectId:id(206),expectedListingRevision:17n,newPriceAtomic:112n,expiryMs:123456n,expectedHolderEpoch:18n,feeRevision:19n}
type Data=ReturnType<Transaction['getData']>
type Call=NonNullable<Data['commands'][number]['MoveCall']>
const calls=(tx:Transaction)=>tx.getData().commands.flatMap(c=>c.$kind==='MoveCall'?[c.MoveCall]:[])
function value(data:Data,arg:any,type:string):any {
 if(arg.$kind==='NestedResult'||arg.$kind==='Result')return arg
 assert.equal(arg.$kind,'Input');const input=data.inputs[arg.Input]!
 if(input.$kind==='UnresolvedObject')return input.UnresolvedObject.objectId
 assert.equal(input.$kind,'Pure');const bytes=Buffer.from((input as any).Pure.bytes,'base64')
 if(type==='u64')return bcs.u64().parse(bytes)
 if(type==='vector<u8>')return bcs.vector(bcs.u8()).parse(bytes)
 throw new Error(`unexpected ${type}`)
}
function verify(tx:Transaction,call:Call,module:'collection'|'custody',name:string,expected:Record<string,any>) {
 const abi=(module==='collection'?collection:custody).abi[name]!
 assert.ok(abi);assert.equal(call.package,target.packageId);assert.equal(call.module,module);assert.equal(call.function,name)
 assert.deepEqual(call.typeArguments,module==='collection'?[C]:[]);assert.equal(call.typeArguments.length,abi.generics.length)
 const params=abi.params.filter(p=>!p.type.includes('TxContext'))
 assert.equal(call.arguments.length,params.length);assert.deepEqual(params.map(p=>p.name),Object.keys(expected))
 params.forEach((p,i)=>assert.deepEqual(value(tx.getData(),call.arguments[i],p.type),expected[p.name],`${name}.${p.name}:${p.type}`))
}
const nested=(n:number,i:number)=>({$kind:'NestedResult',NestedResult:[n,i]})
function checkBuy(tx:Transaction,call:Call,k:any,a:any,payment:any) {
 verify(tx,call,'collection','buy',{l:id(206),c:id(203),f:id(105),p:id(106),seller:id(204),buyer:k,a,cfg:id(103),expected_listing:'14',expected_epoch:'15',fee_revision:'16',expected_quote:Array.from(hash(5)),attempt:Array.from(hash(6)),payment,clock:id(6)})
}
function seeded() {
 const tx=new Transaction();tx.moveCall({target:`${id(999)}::fixture::first`,arguments:[]});tx.moveCall({target:`${id(999)}::fixture::second`,arguments:[]});return tx
}
function unchangedOnFailure(action:(tx:Transaction)=>unknown,pattern:RegExp) {
 const tx=seeded(),before=structuredClone(tx.getData());assert.throws(()=>action(tx),pattern);assert.deepEqual(tx.getData(),before,'all commands and inputs remain unchanged')
}

test('exact Core/leaf ABI pins prove sealed linear pair creation and by-value finalization',()=>{
 for(const p of [custody,leaf]) {
  assert.equal(p.abi.new!.returns,'(Kiosk,Account)');assert.deepEqual(p.abi.new!.params,[{name:'ctx',type:'&mut TxContext'}])
  assert.deepEqual(p.abi.finalize!.params,[{name:'k',type:'Kiosk'},{name:'a',type:'Account'},{name:'ctx',type:'&TxContext'}]);assert.equal(p.abi.finalize!.returns,'ID')
 }
 assert.match(custody.source,/leaf::new\(ctx\)/);assert.match(custody.source,/leaf::finalize\(k,a,ctx\)/)
 assert.match(leaf.source,/public struct Account has key \{id:UID,kiosk:ID,owner:address,cap:KioskOwnerCap\}/)
 assert.match(leaf.source,/assert_access\(&mut k,&mut a,ctx\)/)
 assert.match(leaf.source,/transfer::public_share_object\(k\);transfer::transfer\(a,ctx.sender\(\)\)/)
 assert.equal(collection.abi.buy!.params[5]!.type,'&mut Kiosk');assert.equal(collection.abi.buy!.params[6]!.type,'&mut Account')
})
for(const offset of [0,2]) {
 test(`existing buyer pair preserves exact typed payment and adds no new/finalize; offset${offset}`,()=>{
  const tx=offset?seeded():new Transaction();assert.equal(buildBuyCollectionTx({...buy,...existing},tx),tx)
  const appended=calls(tx).slice(offset);assert.equal(appended.length,1);checkBuy(tx,appended[0]!,id(207),id(208),nested(offset+1,0))
  assert.deepEqual(tx.getData().commands.slice(offset).map(c=>c.$kind),['MergeCoins','SplitCoins','MoveCall'])
 })
 test(`new pair uses exact result pair for borrow and consuming finalize after buy; offset${offset}`,()=>{
  const tx=offset?seeded():new Transaction();assert.equal(buildBuyCollectionTx(buy,tx),tx)
  assert.deepEqual(tx.getData().commands.slice(offset).map(c=>c.$kind),['MergeCoins','SplitCoins','MoveCall','MoveCall','MoveCall'])
  const appended=calls(tx).slice(offset),pairIndex=offset+2,k=nested(pairIndex,0),a=nested(pairIndex,1)
  assert.deepEqual(appended.map(c=>`${c.module}::${c.function}`),['custody::new','collection::buy','custody::finalize'])
  verify(tx,appended[0]!,'custody','new',{});checkBuy(tx,appended[1]!,k,a,nested(offset+1,0));verify(tx,appended[2]!,'custody','finalize',{k,a})
  assert.deepEqual(appended[1]!.arguments[5],appended[2]!.arguments[0]);assert.deepEqual(appended[1]!.arguments[6],appended[2]!.arguments[1])
  assert.ok(appended.every(c=>c.package===target.packageId));assert.deepEqual(appended.flatMap(c=>c.typeArguments),[C])
  const split=tx.getData().commands[offset+1]!.SplitCoins!;assert.equal(value(tx.getData(),split.amounts[0],'u64'),'100')
 })
}
test('exact full typed Coin branch with new pair consumes object payment and no split',()=>{
 const tx=buildBuyCollectionTx({...buy,totalAtomic:80n,paymentCoins:[coins[0]!]})
 assert.deepEqual(tx.getData().commands.map(c=>c.$kind),['MoveCall','MoveCall','MoveCall'])
 const call=calls(tx)[1]!;verify(tx,call,'collection','buy',{l:id(206),c:id(203),f:id(105),p:id(106),seller:id(204),buyer:nested(0,0),a:nested(0,1),cfg:id(103),expected_listing:'14',expected_epoch:'15',fee_revision:'16',expected_quote:Array.from(hash(5)),attempt:Array.from(hash(6)),payment:id(301),clock:id(6)})
})
const badPair: Array<[string,Partial<typeof existing>,RegExp]>=[
 ['Kiosk only',{buyerKioskId:id(207)},/together/],['Account only',{buyerAccountObjectId:id(208)},/together/],
 ['null pair',{buyerKioskId:null as any,buyerAccountObjectId:null as any},/ID/],
 ['empty pair',{buyerKioskId:'',buyerAccountObjectId:''},/ID/],
 ['invalid Kiosk',{...existing,buyerKioskId:'garbage'},/ID/],['invalid Account',{...existing,buyerAccountObjectId:'garbage'},/ID/],
 ['zero Account',{...existing,buyerAccountObjectId:'0x0'},/nonzero/],['aliased pair',{buyerKioskId:'0xcf',buyerAccountObjectId:id(207)},/distinct/],
]
for(const [name,pair,error] of badPair)test(`buyer pair rejects ${name} before appending`,()=>unchangedOnFailure(tx=>buildBuyCollectionTx({...buy,...pair},tx),error))
const badBuy: Array<[string,any,RegExp]>=[
 ['quote length',{expectedQuoteHash:new Uint8Array(31)},/32 bytes/],['attempt length',{attemptHash:new Uint8Array(33)},/32 bytes/],
 ['CAS overflow',{expectedListingRevision:1n<<64n},/u64/],['negative holder epoch',{expectedHolderEpoch:-1n},/u64/],
 ['wrong typed payment',{paymentCoins:[{...coins[0]!,coinType:'0x2::sui::SUI'}]},/type differs/],['insufficient payment',{paymentCoins:[coins[0]!]},/insufficient/],
 ['missing target',{target:undefined},/explicit/],['wrong Factory',{target:{...target,factoryObjectId:'bad'}},/ID/],
]
for(const [name,patch,error] of badBuy)test(`new-pair buy rejects ${name} before appending`,()=>unchangedOnFailure(tx=>buildBuyCollectionTx({...buy,...patch},tx),error))
for(const offset of [0,2])test(`reprice emits exact cancel then list with reused Kiosk/Account and full BCS; offset${offset}`,()=>{
 const tx=offset?seeded():new Transaction();assert.equal(buildUpdateCollectionListingPriceTx(reprice,tx),tx)
 const appended=calls(tx).slice(offset);assert.equal(appended.length,2)
 verify(tx,appended[0]!,'collection','cancel',{l:id(206),k:id(204),a:id(205),expected:'17'})
 verify(tx,appended[1]!,'collection','list',{c:id(203),k:id(204),a:id(205),cfg:id(103),ask:'112',expiry:'123456',expected_epoch:'18',fee_revision:'19',clock:id(6)})
 assert.deepEqual(appended[0]!.arguments[1],appended[1]!.arguments[1]);assert.deepEqual(appended[0]!.arguments[2],appended[1]!.arguments[2])
 assert.equal(tx.getData().commands.length,offset+2);assert.ok(appended.every(c=>c.package===target.packageId))
})
const badReprice: Array<[string,any,RegExp]>=[
 ['zero ask',{newPriceAtomic:0n},/positive/],['ask overflow',{newPriceAtomic:1n<<64n},/u64/],['numeric ask',{newPriceAtomic:100},/bigint/],
 ['expiry overflow',{expiryMs:1n<<64n},/u64/],['holder epoch negative',{expectedHolderEpoch:-1n},/u64/],['fee revision negative',{feeRevision:-1n},/u64/],
 ['CAS overflow',{expectedListingRevision:1n<<64n},/u64/],['Account missing',{currentAccountObjectId:undefined},/ID/],
 ['Account aliased',{currentAccountObjectId:id(204)},/distinct/],['Collection malformed',{collectionObjectId:'invalid'},/ID/],
 ['Listing malformed',{listingObjectId:'invalid'},/ID/],['target missing',{target:undefined},/explicit/],
 ['Clock malformed',{target:{...target,clockObjectId:'invalid'}},/ID/],['Config malformed',{target:{...target,configObjectId:'invalid'}},/ID/],
]
for(const [name,patch,error] of badReprice)test(`reprice rejects ${name} before commands or inputs`,()=>unchangedOnFailure(tx=>buildUpdateCollectionListingPriceTx({...reprice,...patch},tx),error))
test('maximum u64 CAS/epoch/expiry/fees retain bytes while Move determines live policy',()=>{
 const max=(1n<<64n)-1n,tx=buildUpdateCollectionListingPriceTx({...reprice,expectedListingRevision:max,newPriceAtomic:max,expiryMs:max,expectedHolderEpoch:max,feeRevision:max})
 const [cancel,list]=calls(tx);assert.equal(value(tx.getData(),cancel!.arguments[3],'u64'),String(max))
 for(const i of [4,5,6,7])assert.equal(value(tx.getData(),list!.arguments[i],'u64'),String(max))
})
test('frozen Collection relist preserves Right custody; Soul void cancel cannot compose with old escrow ID',()=>{
 const cancel=collection.source.slice(collection.source.indexOf('public fun cancel<'),collection.source.indexOf('public fun buy<'))
 assert.match(cancel,/kiosk::return_purchase_cap\(k,cap\)/);assert.doesNotMatch(cancel,/transfer::.*transfer/);assert.equal(collection.abi.cancel!.returns,'void')
 assert.equal(market.abi.cancel!.returns,'void')
 const soulCancel=market.source.slice(market.source.indexOf('public fun cancel<'),market.source.indexOf('public fun delete_listing'))
 assert.match(soulCancel,/ctx.sender\(\)==l.seller/);assert.match(soulCancel,/transfer::public_transfer\(asset,l.seller\)/)
})
test('new composition files do not use old env/register/cap/finalize-listing routes; Native shared stays exact',()=>{
 const helper=readFileSync('src/tx/collection-buyer-pair.ts','utf8'),repriceSource=readFileSync('src/tx/update-collection-price.ts','utf8')
 for(const text of [helper,repriceSource])assert.doesNotMatch(text,/getRequiredSoulidityEnv|NEXT_PUBLIC|ensure_personal|finalize_collection|::market::|kiosk::new/)
 assert.equal(readFileSync('src/tx/shared.ts','utf8'),readFileSync('baseline/upstream-src/tx/shared.ts','utf8'))
})
