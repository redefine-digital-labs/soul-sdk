import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { Transaction } from '@mysten/sui/transactions'
import { bcs } from '@mysten/sui/bcs'
import { buildListSoulTx, buildListCollectionTx } from '../src/tx/list'
import { buildBuySoulTx, buildBuyCollectionTx, buildTypedExactPaymentCoin } from '../src/tx/buy'
import { buildDelistSoulTx, buildDeleteSoulListingTx, buildDelistCollectionTx, buildDeleteCollectionListingTx } from '../src/tx/delist'
import { objectId, coinType } from '../src/tx/market-target'

const baseline = JSON.parse(readFileSync('evidence/baseline.json','utf8'))
const id = (n: number) => objectId(`0x${n.toString(16)}`)
const h = (n: number) => new Uint8Array(32).fill(n)
const C = coinType('0xabc::usdc::USDC')
const target = {packageId:id(101),soulType:`${id(102)}::soul::Soul`,paymentCoinType:C,configObjectId:id(103),clockObjectId:id(6)}
const core = {packageId:id(104),paymentCoinType:C,configObjectId:id(103),clockObjectId:id(6),factoryObjectId:id(105),rightTransferPolicyObjectId:id(106)}
const coins = [{objectId:id(301),coinType:C,balanceAtomic:80n},{objectId:id(302),coinType:C,balanceAtomic:40n}]
const list = {target,ownedSoulObjectId:id(201),priceAtomic:100n,expiryMs:99999n,expectedSoulRevision:7n,manifestHash:h(1),feeRevision:8n}
const buy = {target,listingObjectId:id(202),expectedListingRevision:9n,manifestHash:h(2),expectedQuoteHash:h(3),feeRevision:10n,attemptHash:h(4),totalAtomic:100n,paymentCoins:coins}
const listC = {target:core,collectionObjectId:id(203),currentKioskId:id(204),currentAccountObjectId:id(205),priceAtomic:111n,expiryMs:100000n,expectedHolderEpoch:12n,feeRevision:13n}
const buyC = {target:core,listingObjectId:id(206),collectionObjectId:id(203),sellerKioskId:id(204),buyerKioskId:id(207),buyerAccountObjectId:id(208),expectedListingRevision:14n,expectedHolderEpoch:15n,feeRevision:16n,expectedQuoteHash:h(5),attemptHash:h(6),totalAtomic:100n,paymentCoins:coins}

function splitParams(s: string): string[] {
  const out: string[]=[];let depth=0,start=0
  for(let i=0;i<s.length;i++){if(s[i]==='<')depth++;if(s[i]==='>')depth--;if(s[i]===','&&depth===0){out.push(s.slice(start,i).trim());start=i+1}}
  if(s.slice(start).trim())out.push(s.slice(start).trim());return out
}
function parseAbi(path: string, pin: string) {
  const text=readFileSync(path,'utf8');assert.equal(createHash('sha256').update(text).digest('hex'),pin)
  const functions: Record<string,{generics:string[];params:{name:string;type:string}[];declaration:string}>= {}
  for(const match of text.matchAll(/^public fun (\w+)(?:<([^>]+)>)?\(([^)]*)\)/gm)) {
    const params=splitParams(match[3]!).map(p=>{const colon=p.indexOf(':');return{name:p.slice(0,colon),type:p.slice(colon+1)}})
    functions[match[1]!] = {generics:splitParams(match[2]??''),params,declaration:match[0]}
  }
  return functions
}
const marketAbi=parseAbi(baseline.abi_path,baseline.abi_sha256),coreAbi=parseAbi(baseline.core_abi_path,baseline.core_abi_sha256)
writeFileSync('evidence/parsed-abi.json',JSON.stringify({market:marketAbi,core:coreAbi},null,2)+'\n')
type Data = ReturnType<Transaction['getData']>
function moveCalls(tx: Transaction) {return tx.getData().commands.filter(c=>c.$kind==='MoveCall').map(c=>c.MoveCall)}
function value(data: Data,arg:any,type:string):any {
  if(arg.$kind==='NestedResult'||arg.$kind==='Result') return {paymentResult:arg}
  assert.equal(arg.$kind,'Input');const input=data.inputs[arg.Input]!
  if(input.$kind==='UnresolvedObject')return input.UnresolvedObject.objectId
  assert.equal(input.$kind,'Pure'); const bytes=Buffer.from((input as any).Pure.bytes,'base64')
  if(type==='u64')return bcs.u64().parse(bytes)
  if(type==='vector<u8>')return bcs.vector(bcs.u8()).parse(bytes)
  throw new Error(`unexpected type ${type}`)
}
function verify(tx:Transaction,module:'market'|'collection',name:string,expected:Record<string,any>,typeArguments:string[]) {
  const abi=(module==='market'?marketAbi:coreAbi)[name]!
  assert.ok(abi,`${name} exists in actual frozen Move`)
  const call=moveCalls(tx).at(-1)!;assert.equal(call.package,module==='market'?target.packageId:core.packageId);assert.equal(call.module,module);assert.equal(call.function,name)
  assert.deepEqual(call.typeArguments,typeArguments)
  assert.equal(call.typeArguments.length,abi.generics.length)
  const params=abi.params.filter(p=>!p.type.includes('TxContext'))
  assert.equal(call.arguments.length,params.length)
  assert.deepEqual(params.map(p=>p.name),Object.keys(expected),'mapping covers actual ABI in exact argument order')
  params.forEach((p,i)=>{
    const actual=value(tx.getData(),call.arguments[i],p.type),exp=expected[p.name]
    if(exp==='PAYMENT')assert.equal((call.arguments[i] as any).$kind,'NestedResult')
    else assert.deepEqual(actual,exp,`${name}.${p.name}: ${p.type}`)
  })
  assert.ok(moveCalls(tx).every(c=>!c.function.includes('_v2')&&!c.function.includes('finalize')&&!c.function.includes('ensure_personal')))
}

test('frozen source ABI uses owned Soul and directly shares; exit preserves terminal/paused semantics',()=>{
 assert.equal(marketAbi.list_soul!.params[0]!.type,'Soul')
 assert.equal(marketAbi.list_soul_with_collection!.params[1]!.type,'&Collection')
 assert.deepEqual(marketAbi.cancel!.generics,['T:key+store','C'])
 assert.equal(marketAbi.delete_listing!.params[0]!.type,'Listing<T,C>')
 const source=readFileSync(baseline.abi_path,'utf8')
 assert.match(source,/transfer::share_object\(l\);id/)
 const cancel=source.slice(source.indexOf('public fun cancel<'),source.indexOf('public fun buy_soul<'))
 assert.doesNotMatch(cancel.replace(/^\/\/.*$/gm,''),/Config|assert_secondary/)
 assert.match(cancel,/l.state==1 \|\| l.state==2/);assert.match(cancel,/!dof::exists/)
 assert.doesNotMatch(cancel.slice(cancel.indexOf('public fun delete_listing')),/ctx.sender\(\)==l.seller/)
 assert.equal(coreAbi.list!.params[2]!.type,'&mut Account');assert.equal(coreAbi.buy!.params[3]!.type,'&TransferPolicy<Right>')
})
for(const collection of [false,true]) {
 test(`Soul list ABI ${collection?'with actual Collection':'plain'}`,()=>{
  const tx=buildListSoulTx({...list,...collection?{actualCollectionObjectId:id(203)}:{}})
  verify(tx,'market',collection?'list_soul_with_collection':'list_soul',{
    s:id(201),...collection?{c:id(203)}:{},cfg:id(103),price:'100',expiry:'99999',expected:'7',manifest_hash:Array.from(h(1)),fee_revision:'8',clock:id(6),
  },[C]);assert.equal(tx.getData().commands.length,1)
 })
 test(`Soul buy ABI ${collection?'Collection snapshot and quote':'plain quote'}`,()=>{
  const tx=buildBuySoulTx({...buy,...collection?{collection:{actualCollectionObjectId:id(203),expectedCollectionSnapshotHash:h(7)}}:{}})
  verify(tx,'market',collection?'buy_soul_with_collection':'buy_soul',{
   l:id(202),...collection?{c:id(203)}:{},cfg:id(103),expected:'9',manifest_hash:Array.from(h(2)),...collection?{expected_collection:Array.from(h(7))}:{},expected_quote:Array.from(h(3)),fee_revision:'10',attempt:Array.from(h(4)),payment:'PAYMENT',clock:id(6),
  },[C]);assert.deepEqual(tx.getData().commands.map(c=>c.$kind),['MergeCoins','SplitCoins','MoveCall'])
  const split=tx.getData().commands[1]!.SplitCoins!;assert.equal(value(tx.getData(),split.amounts[0],'u64'),'100')
  assert.deepEqual(moveCalls(tx)[0]!.arguments.at(-2),{$kind:'NestedResult',NestedResult:[1,0]})
 })
}
test('seller Soul cancel exact T,C with CAS and no Config',()=>verify(buildDelistSoulTx({target,listingObjectId:id(202),expectedListingRevision:11n}),'market','cancel',{l:id(202),expected:'11'},[target.soulType,C]))
test('permissionless Soul terminal cleanup has T,C and listing only',()=>verify(buildDeleteSoulListingTx({target,listingObjectId:id(202)}),'market','delete_listing',{l:id(202)},[target.soulType,C]))
test('Collection Right list original Core ABI',()=>verify(buildListCollectionTx(listC),'collection','list',{c:id(203),k:id(204),a:id(205),cfg:id(103),ask:'111',expiry:'100000',expected_epoch:'12',fee_revision:'13',clock:id(6)},[C]))
test('Collection Right buy original Core ABI with Factory policy and existing Kiosk/Account',()=>verify(buildBuyCollectionTx(buyC),'collection','buy',{l:id(206),c:id(203),f:id(105),p:id(106),seller:id(204),buyer:id(207),a:id(208),cfg:id(103),expected_listing:'14',expected_epoch:'15',fee_revision:'16',expected_quote:Array.from(h(5)),attempt:Array.from(h(6)),payment:'PAYMENT',clock:id(6)},[C]))
test('Collection Right cancel keeps Kiosk/Account and CAS without Config',()=>verify(buildDelistCollectionTx({target:core,listingObjectId:id(206),currentKioskId:id(204),currentAccountObjectId:id(205),expectedListingRevision:17n}),'collection','cancel',{l:id(206),k:id(204),a:id(205),expected:'17'},[C]))
test('Collection Right permissionless terminal cleanup listing only',()=>verify(buildDeleteCollectionListingTx({target:core,listingObjectId:id(206)}),'collection','delete_listing',{l:id(206)},[C]))
test('exact full typed Coin consumed without splitting and no change',()=>{
 const tx=new Transaction(),result=buildTypedExactPaymentCoin(tx,[coins[0]!],80n,C)
 assert.equal(tx.getData().commands.length,0);assert.equal(result.changeCoin,null);assert.equal(result.changeAtomic,0n);assert.equal(value(tx.getData(),result.paymentCoin,'Coin<C>'),id(301))
 const bought=buildBuySoulTx({...buy,totalAtomic:80n,paymentCoins:[coins[0]!]});assert.equal(bought.getData().commands.length,1)
 assert.equal(value(bought.getData(),moveCalls(bought)[0]!.arguments.at(-2),'Coin<C>'),id(301))
})
test('merged exact Coin consumed in full; remainder from split remains primary owned Coin',()=>{
 const exact=new Transaction(),full=buildTypedExactPaymentCoin(exact,coins,120n,C);assert.deepEqual(exact.getData().commands.map(c=>c.$kind),['MergeCoins']);assert.equal(full.changeCoin,null)
 const tx=new Transaction(),split=buildTypedExactPaymentCoin(tx,coins,100n,C);assert.equal(split.changeAtomic,20n);assert.equal(value(tx.getData(),split.changeCoin,'Coin<C>'),id(301));assert.deepEqual(split.paymentCoin,{$kind:'NestedResult',NestedResult:[1,0]})
})
const invalid: Array<[string,()=>unknown,RegExp]> = [
 ['missing target',()=>buildListSoulTx({...list,target:undefined as any}),/explicit/],
 ['malformed owned ID',()=>buildListSoulTx({...list,ownedSoulObjectId:'xyz'}),/ID/],
 ['zero package ID',()=>buildListSoulTx({...list,target:{...target,packageId:'0x0'}}),/nonzero/],
 ['wrong Soul type',()=>buildDelistSoulTx({target:{...target,soulType:'0x1::fake::Soul'},listingObjectId:id(202),expectedListingRevision:0n}),/defining/],
 ['wrong C metadata',()=>buildBuySoulTx({...buy,paymentCoins:[{...coins[0]!,coinType:'0x2::sui::SUI',balanceAtomic:100n}]}),/type differs/],
 ['duplicate normalized IDs',()=>buildBuySoulTx({...buy,paymentCoins:[coins[0]!,{...coins[0]!,objectId:'0x12d'}]}),/duplicate/],
 ['insufficient coins',()=>buildBuySoulTx({...buy,paymentCoins:[coins[0]!]}),/insufficient/],
 ['empty coins',()=>buildBuySoulTx({...buy,paymentCoins:[]}),/at least/],
 ['u64 overflow',()=>buildListSoulTx({...list,priceAtomic:1n<<64n}),/u64/],
 ['negative revision',()=>buildDelistSoulTx({target,listingObjectId:id(202),expectedListingRevision:-1n}),/u64/],
 ['number revision',()=>buildListSoulTx({...list,expectedSoulRevision:7 as any}),/u64/],
 ['zero price',()=>buildListSoulTx({...list,priceAtomic:0n}),/positive/],
 ['zero payment',()=>buildBuySoulTx({...buy,totalAtomic:0n}),/positive/],
 ['merged overflow',()=>buildBuySoulTx({...buy,paymentCoins:[{...coins[0]!,balanceAtomic:(1n<<64n)-1n},coins[1]!]}),/exceeds/],
 ['manifest hash length',()=>buildListSoulTx({...list,manifestHash:new Uint8Array(31)}),/32 bytes/],
 ['quote hash length',()=>buildBuySoulTx({...buy,expectedQuoteHash:new Uint8Array(33)}),/32 bytes/],
 ['attempt hash length',()=>buildBuySoulTx({...buy,attemptHash:new Uint8Array()}),/32 bytes/],
 ['Collection hash length',()=>buildBuySoulTx({...buy,collection:{actualCollectionObjectId:id(203),expectedCollectionSnapshotHash:new Uint8Array(31)}}),/32 bytes/],
 ['missing buyer Account',()=>buildBuyCollectionTx({...buyC,buyerAccountObjectId:undefined as any}),/ID/],
 ['missing Factory',()=>buildBuyCollectionTx({...buyC,target:{...core,factoryObjectId:undefined as any}}),/ID/],
 ['Core holder epoch overflow',()=>buildListCollectionTx({...listC,expectedHolderEpoch:1n<<64n}),/u64/],
]
for(const [name,fn,pattern] of invalid)test(`reject ${name}`,()=>assert.throws(fn,pattern))
test('u64 maximum CAS and 32-byte zero hash retain exact bytes without unsafe numeric conversion',()=>{
 const tx=buildListSoulTx({...list,expectedSoulRevision:(1n<<64n)-1n,manifestHash:h(0)})
 const c=moveCalls(tx)[0]!;assert.equal(value(tx.getData(),c.arguments[4],'u64'),'18446744073709551615');assert.deepEqual(value(tx.getData(),c.arguments[5],'vector<u8>'),Array(32).fill(0))
})
