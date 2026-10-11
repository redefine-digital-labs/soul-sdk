import { writeFileSync } from 'node:fs'
import { Transaction } from '@mysten/sui/transactions'
import { buildBuyCollectionTx } from '../src/tx/buy'
import { buildUpdateCollectionListingPriceTx } from '../src/tx/update-collection-price'
import { objectId,coinType } from '../src/tx/market-target'
const id=(n:number)=>objectId(`0x${n.toString(16)}`),C=coinType('0xabc::usdc::USDC')
const target={packageId:id(104),paymentCoinType:C,configObjectId:id(103),clockObjectId:id(6),factoryObjectId:id(105),rightTransferPolicyObjectId:id(106)}
const buy={target,listingObjectId:id(206),collectionObjectId:id(203),sellerKioskId:id(204),expectedListingRevision:14n,expectedHolderEpoch:15n,feeRevision:16n,expectedQuoteHash:new Uint8Array(32).fill(5),attemptHash:new Uint8Array(32).fill(6),totalAtomic:100n,paymentCoins:[{objectId:id(301),coinType:C,balanceAtomic:80n},{objectId:id(302),coinType:C,balanceAtomic:40n}]}
const prefix=new Transaction();prefix.moveCall({target:`${id(999)}::fixture::first`,arguments:[]});prefix.moveCall({target:`${id(999)}::fixture::second`,arguments:[]})
const transactions={newPair:buildBuyCollectionTx(buy).getData(),existingPair:buildBuyCollectionTx({...buy,buyerKioskId:id(207),buyerAccountObjectId:id(208)}).getData(),offsetNewPair:buildBuyCollectionTx(buy,prefix).getData(),reprice:buildUpdateCollectionListingPriceTx({target,currentKioskId:id(204),currentAccountObjectId:id(205),collectionObjectId:id(203),listingObjectId:id(206),expectedListingRevision:17n,newPriceAtomic:112n,expiryMs:123456n,expectedHolderEpoch:18n,feeRevision:19n}).getData()}
writeFileSync('evidence/composition-unsigned-transactions.json',JSON.stringify({scope:'synthetic offline realTransaction getData; unresolved objects; no build/RPC/sign/VM',transactions},null,2)+'\n')
