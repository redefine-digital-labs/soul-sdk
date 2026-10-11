import { Transaction } from '@mysten/sui/transactions'
import { exitTarget, objectId, u64, collectionExitTarget, type MarketExitTarget } from './market-target'

/** Seller cancellation uses Listing CAS; no Config or live/pause gate. */
export function buildDelistSoulTx(params: {
  target: MarketExitTarget; listingObjectId: string; expectedListingRevision: bigint
}, tx = new Transaction()) {
  const target = exitTarget(params.target)
  tx.moveCall({ target: `${target.packageId}::market::cancel`, typeArguments: [target.soulType, target.paymentCoinType],
    arguments: [tx.object(objectId(params.listingObjectId, 'Listing<Soul,C>')), tx.pure.u64(u64(params.expectedListingRevision, 'expectedListingRevision'))] })
  return tx
}
/** Permissionless terminal-only cleanup. Contract checks state and missing escrow; no Config. */
export function buildDeleteSoulListingTx(params: {
  target: MarketExitTarget; listingObjectId: string
}, tx = new Transaction()) {
  const target = exitTarget(params.target)
  tx.moveCall({ target: `${target.packageId}::market::delete_listing`, typeArguments: [target.soulType, target.paymentCoinType],
    arguments: [tx.object(objectId(params.listingObjectId, 'Listing<Soul,C>'))] })
  return tx
}
export function buildDelistCollectionTx(params: {
  target: import('./market-target').CollectionExitTarget
  listingObjectId: string; currentKioskId: string; currentAccountObjectId: string; expectedListingRevision: bigint
}, tx = new Transaction()) {
  const target = collectionExitTarget(params.target)
  tx.moveCall({ target: `${target.packageId}::collection::cancel`, typeArguments: [target.paymentCoinType], arguments: [
    tx.object(objectId(params.listingObjectId, 'Collection Listing<C>')), tx.object(objectId(params.currentKioskId, 'seller Kiosk')),
    tx.object(objectId(params.currentAccountObjectId, 'seller Account')), tx.pure.u64(u64(params.expectedListingRevision, 'expectedListingRevision')),
  ] })
  return tx
}
export function buildDeleteCollectionListingTx(params: {
  target: import('./market-target').CollectionExitTarget; listingObjectId: string
}, tx = new Transaction()) {
  const target = collectionExitTarget(params.target)
  tx.moveCall({ target: `${target.packageId}::collection::delete_listing`, typeArguments: [target.paymentCoinType],
    arguments: [tx.object(objectId(params.listingObjectId, 'Collection Listing<C>'))] })
  return tx
}
