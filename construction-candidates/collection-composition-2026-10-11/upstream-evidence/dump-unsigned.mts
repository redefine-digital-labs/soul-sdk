import { writeFileSync } from 'node:fs'
import { buildListSoulTx,buildListCollectionTx } from '../src/tx/list.ts'
import { buildBuySoulTx,buildBuyCollectionTx } from '../src/tx/buy.ts'
import { buildDelistSoulTx,buildDeleteSoulListingTx,buildDelistCollectionTx,buildDeleteCollectionListingTx } from '../src/tx/delist.ts'
const id=(n:number)=>`0x${n.toString(16).padStart(64,'0')}`,h=(n:number)=>new Uint8Array(32).fill(n),C=`${id(999)}::coin::COIN`
const target={packageId:id(101),soulType:`${id(102)}::soul::Soul`,paymentCoinType:C,configObjectId:id(103),clockObjectId:id(6)}
const core={packageId:id(104),paymentCoinType:C,configObjectId:id(103),clockObjectId:id(6),factoryObjectId:id(105),rightTransferPolicyObjectId:id(106)}
const pay=[{objectId:id(301),coinType:C,balanceAtomic:120n}],expiryMs=99999n,feeRevision=8n
const txs={
 soulList:buildListSoulTx({target,ownedSoulObjectId:id(201),priceAtomic:100n,expiryMs,expectedSoulRevision:7n,manifestHash:h(1),feeRevision}),
 soulCollectionList:buildListSoulTx({target,ownedSoulObjectId:id(201),priceAtomic:100n,expiryMs,expectedSoulRevision:7n,manifestHash:h(1),feeRevision,actualCollectionObjectId:id(203)}),
 soulBuy:buildBuySoulTx({target,listingObjectId:id(202),expectedListingRevision:9n,manifestHash:h(1),expectedQuoteHash:h(2),feeRevision,attemptHash:h(3),totalAtomic:100n,paymentCoins:pay}),
 soulCollectionBuy:buildBuySoulTx({target,listingObjectId:id(202),expectedListingRevision:9n,manifestHash:h(1),expectedQuoteHash:h(2),feeRevision,attemptHash:h(3),totalAtomic:100n,paymentCoins:pay,collection:{actualCollectionObjectId:id(203),expectedCollectionSnapshotHash:h(4)}}),
 soulCancel:buildDelistSoulTx({target,listingObjectId:id(202),expectedListingRevision:9n}),
 soulDelete:buildDeleteSoulListingTx({target,listingObjectId:id(202)}),
 rightList:buildListCollectionTx({target:core,collectionObjectId:id(203),currentKioskId:id(204),currentAccountObjectId:id(205),priceAtomic:100n,expiryMs,expectedHolderEpoch:12n,feeRevision}),
 rightBuy:buildBuyCollectionTx({target:core,listingObjectId:id(206),collectionObjectId:id(203),sellerKioskId:id(204),buyerKioskId:id(207),buyerAccountObjectId:id(208),expectedListingRevision:14n,expectedHolderEpoch:15n,feeRevision,expectedQuoteHash:h(5),attemptHash:h(6),totalAtomic:100n,paymentCoins:pay}),
 rightCancel:buildDelistCollectionTx({target:core,listingObjectId:id(206),currentKioskId:id(204),currentAccountObjectId:id(205),expectedListingRevision:14n}),
 rightDelete:buildDeleteCollectionListingTx({target:core,listingObjectId:id(206)}),
}
writeFileSync('evidence/unsigned-transactions.json',JSON.stringify({status:'ILLUSTRATIVE_UNSIGNED_UNRESOLVED_NOT_DEPLOYMENT_IDS',source:'actual @mysten/sui 2.16.0 Transaction.getData; no build/RPC/sign',transactions:Object.fromEntries(Object.entries(txs).map(([name,tx])=>[name,tx.getData()]))},null,2)+'\n')
