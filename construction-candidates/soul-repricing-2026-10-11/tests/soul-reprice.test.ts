import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { Transaction, Inputs } from '@mysten/sui/transactions'
import { bcs } from '@mysten/sui/bcs'
import { buildUpdateListingPriceTx } from '../src/tx/update-price'
import { objectId, coinType } from '../src/tx/market-target'

const id = (n: number) => objectId(`0x${n.toString(16)}`)
const C = coinType('0xabc::usdc::USDC')
const target = { packageId: id(101), soulType: `${id(102)}::soul::Soul`, paymentCoinType: C, configObjectId: id(103), clockObjectId: id(6) }
const base = { target, listingObjectId: id(202), expectedListingRevision: 11n, newPriceAtomic: 201n, expiryMs: 123456n,
  expectedSoulRevision: 7n, manifestHash: Uint8Array.from({length:32}, (_,i)=>i), feeRevision: 13n }
const pins = JSON.parse(readFileSync('evidence/inputs-before.json','utf8'))
const source = readFileSync('upstream-evidence/market.move','utf8')
assert.equal(createHash('sha256').update(source).digest('hex'), pins.abi_sha256)
function splitParams(value: string): string[] {
  const parts: string[]=[];let depth=0,start=0
  for(let i=0;i<value.length;i++){if(value[i]==='<')depth++;if(value[i]==='>')depth--;if(value[i]===','&&depth===0){parts.push(value.slice(start,i));start=i+1}}
  parts.push(value.slice(start));return parts
}
const abi = Object.fromEntries([...source.matchAll(/^public fun (relist_soul(?:_with_collection)?)<([^>]+)>\(([^)]*)\):ID/gm)].map(m=>[m[1],{
  generics:m[2].split(','), params:splitParams(m[3]).map(p=>({name:p.slice(0,p.indexOf(':')),type:p.slice(p.indexOf(':')+1)})).filter(p=>!p.type.includes('TxContext')),
}]))
function verify(tx: Transaction, collection: boolean, params=base) {
  const d=tx.getData(); assert.equal(d.commands.length,1)
  const call=d.commands[0].MoveCall!; const name=collection?'relist_soul_with_collection':'relist_soul'
  assert.equal(call.package,target.packageId); assert.equal(call.module,'market'); assert.equal(call.function,name)
  assert.deepEqual(abi[name].generics,['C']); assert.deepEqual(call.typeArguments,[C])
  const expected: Record<string, unknown>={l:params.listingObjectId,...collection?{c:id(203)}:{},cfg:params.target.configObjectId,
    expected_listing:String(params.expectedListingRevision),price:String(params.newPriceAtomic),expiry:String(params.expiryMs),
    expected_soul:String(params.expectedSoulRevision),manifest_hash:Array.from(params.manifestHash),fee_revision:String(params.feeRevision),clock:params.target.clockObjectId}
  assert.deepEqual(abi[name].params.map(p=>p.name),Object.keys(expected))
  assert.equal(call.arguments.length,abi[name].params.length)
  abi[name].params.forEach((p,i)=>{
    const arg=call.arguments[i];assert.equal(arg.$kind,'Input','old ID inputs only: no Result/NestedResult')
    const input=d.inputs[arg.Input!]
    if(p.type.startsWith('&')) {assert.equal(input.$kind,'UnresolvedObject');assert.equal(input.UnresolvedObject!.objectId,expected[p.name])}
    else {assert.equal(input.$kind,'Pure');const bytes=Buffer.from(input.Pure!.bytes,'base64');assert.deepEqual(p.type==='u64'?bcs.u64().parse(bytes):bcs.vector(bcs.u8()).parse(bytes),expected[p.name])}
  })
  writeFileSync(`evidence/unsigned-${name}.json`,JSON.stringify(d,null,2)+'\n')
}
for(const collection of [false,true]) {
  test(`exact frozen ${collection?'Collection':'standalone'} relist ABI and BCS arguments`,()=>verify(buildUpdateListingPriceTx({...base,...collection?{actualCollectionObjectId:id(203)}:{}}),collection))
  test(`unsigned ${collection?'Collection':'standalone'} TransactionKind BCS builds offline`,async()=>{
    const tx=buildUpdateListingPriceTx({...base,...collection?{actualCollectionObjectId:id(203)}:{}})
    // Test-only deterministic shared-reference resolution; no RPC or chain truth implied.
    tx.addBuildPlugin(async(data,_options,next)=>{
      data.inputs=data.inputs.map(input=>input.UnresolvedObject?Inputs.SharedObjectRef({objectId:input.UnresolvedObject.objectId,initialSharedVersion:'1',mutable:input.UnresolvedObject.objectId===base.listingObjectId}):input)
      await next()
    })
    const bytes=await tx.build({onlyTransactionKind:true});const parsed=bcs.TransactionKind.parse(bytes)
    assert.equal(parsed.$kind,'ProgrammableTransaction');assert.equal(parsed.ProgrammableTransaction!.commands.length,1)
    const call=parsed.ProgrammableTransaction!.commands[0].MoveCall!
    assert.equal(call.function,collection?'relist_soul_with_collection':'relist_soul');assert.deepEqual(call.typeArguments,[C])
    assert.ok(call.arguments.every(arg=>arg.$kind==='Input'))
    writeFileSync(`evidence/kind-${collection?'collection':'standalone'}.bin`,bytes)
    writeFileSync(`evidence/kind-${collection?'collection':'standalone'}.json`,JSON.stringify(parsed,null,2)+'\n')
  })
}
test('valid append preserves existing PTB commands and returns supplied instance',()=>{
  const tx=new Transaction();tx.moveCall({target:`${id(901)}::probe::before`,arguments:[tx.pure.u64(44n)]})
  const before=tx.getData();assert.equal(buildUpdateListingPriceTx(base,tx),tx)
  const after=tx.getData();assert.deepEqual(after.commands[0],before.commands[0]);assert.deepEqual(after.inputs.slice(0,before.inputs.length),before.inputs)
  assert.equal(after.commands.length,2);assert.equal(after.commands[1].MoveCall!.function,'relist_soul')
})
test('u64 boundary values are encoded exactly and zero revisions/expiry are permitted',()=>{
  const params={...base,expectedListingRevision:0n,newPriceAtomic:18446744073709551615n,expiryMs:0n,expectedSoulRevision:0n,feeRevision:0n}
  verify(buildUpdateListingPriceTx(params),false,params)
})
test('manifest input is copied; later caller mutation does not alter PTB intent',()=>{
  const params={...base,manifestHash:new Uint8Array(base.manifestHash)};const tx=buildUpdateListingPriceTx(params);const before=tx.getData();params.manifestHash.fill(99);assert.deepEqual(tx.getData(),before)
})
const invalid: [string,unknown][]=[
 ['missing target',{target:undefined}],['zero package',{target:{...target,packageId:'0x0'}}],['bad package',{target:{...target,packageId:'wat'}}],
 ['bad Soul type',{target:{...target,soulType:'0x1::item::Item'}}],['bad coin primitive',{target:{...target,paymentCoinType:'u64'}}],
 ['bad coin generic',{target:{...target,paymentCoinType:'0xabc::usdc::USDC<bogus>'}}],
 ['empty coin generics',{target:{...target,paymentCoinType:'0xabc::usdc::USDC<>'}}],
 ['empty nested coin generics',{target:{...target,paymentCoinType:'0xabc::usdc::USDC<0xdef::inner::Token<>>'}}],['missing Config',{target:{...target,configObjectId:undefined}}],
 ['zero Clock',{target:{...target,clockObjectId:'0x0'}}],['bad listing',{listingObjectId:'not-id'}],['zero listing',{listingObjectId:'0x0'}],
 ['missing listing CAS',{expectedListingRevision:undefined}],['negative listing CAS',{expectedListingRevision:-1n}],['overflow listing CAS',{expectedListingRevision:1n<<64n}],
 ['zero price',{newPriceAtomic:0n}],['negative price',{newPriceAtomic:-1n}],['number price',{newPriceAtomic:201}],['overflow price',{newPriceAtomic:1n<<64n}],
 ['missing expiry',{expiryMs:undefined}],['negative expiry',{expiryMs:-1n}],['overflow expiry',{expiryMs:1n<<64n}],
 ['missing Application revision',{expectedSoulRevision:undefined}],['negative Application revision',{expectedSoulRevision:-1n}],['overflow Application revision',{expectedSoulRevision:1n<<64n}],
 ['missing manifest',{manifestHash:undefined}],['31 byte manifest',{manifestHash:new Uint8Array(31)}],['33 byte manifest',{manifestHash:new Uint8Array(33)}],['array manifest',{manifestHash:Array(32).fill(1)}],
 ['missing fee revision',{feeRevision:undefined}],['negative fee revision',{feeRevision:-1n}],['overflow fee revision',{feeRevision:1n<<64n}],
 ['invalid actual Collection',{actualCollectionObjectId:'wat'}],['empty actual Collection',{actualCollectionObjectId:''}],['zero actual Collection',{actualCollectionObjectId:'0x0'}],['null actual Collection',{actualCollectionObjectId:null}],
]
for(const [label,patch] of invalid) test(`reject ${label} before supplied PTB mutation`,()=>{
  const tx=new Transaction();tx.setSender(id(777));tx.moveCall({target:`${id(901)}::probe::before`,arguments:[tx.pure.u64(44n)]});const before=tx.getData()
  assert.throws(()=>buildUpdateListingPriceTx({...base,...patch as object} as any,tx));assert.deepEqual(tx.getData(),before)
})
test('candidate removes legacy env/kiosk/registry/finalize calls',()=>{
  const builder=readFileSync('src/tx/update-price.ts','utf8');assert.doesNotMatch(builder,/getRequiredSoulidityEnv|currentKiosk|stateObjectId|finalize|ensure_personal|cancel_soul_listing|animacraft|managed.*[Aa]uthor/)
  assert.match(source,/let s=cancel_value\(l,expected_listing,ctx\);\s*list_soul\(s,cfg/)
  assert.match(source,/let s=cancel_value\(l,expected_listing,ctx\);\s*list_soul_with_collection\(s,c,cfg/)
})

test('valid generic payment struct remains one exact C type argument',()=>{
 const generic=coinType('0xabc::usdc::USDC<u64,0xdef::inner::Token>')
 const tx=buildUpdateListingPriceTx({...base,target:{...target,paymentCoinType:generic}})
 assert.deepEqual(tx.getData().commands[0].MoveCall!.typeArguments,[generic])
 assert.equal(tx.getData().commands[0].MoveCall!.arguments.length,9)
})
