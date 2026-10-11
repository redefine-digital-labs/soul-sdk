import { Transaction, type TransactionArgument } from '@mysten/sui/transactions'
import { marketTarget, objectId, u64, hash32, collectionTarget, type MarketTransactionTarget } from './market-target'

/** Consumes the actual owned Standard Soul by value. Move shares Listing directly. */
export function buildListSoulTx(params: {
  target: MarketTransactionTarget
  ownedSoulObjectId: string
  priceAtomic: bigint
  expiryMs: bigint
  expectedSoulRevision: bigint
  manifestHash: Uint8Array
  feeRevision: bigint
  actualCollectionObjectId?: string
}, tx = new Transaction()) {
  const target = marketTarget(params.target)
  const args: TransactionArgument[] = [tx.object(objectId(params.ownedSoulObjectId, 'owned Soul'))]
  if (params.actualCollectionObjectId !== undefined) args.push(tx.object(objectId(params.actualCollectionObjectId, 'actual Collection')))
  args.push(tx.object(target.configObjectId), tx.pure.u64(u64(params.priceAtomic, 'priceAtomic', true)),
    tx.pure.u64(u64(params.expiryMs, 'expiryMs')), tx.pure.u64(u64(params.expectedSoulRevision, 'expectedSoulRevision')),
    tx.pure.vector('u8', hash32(params.manifestHash, 'manifestHash')), tx.pure.u64(u64(params.feeRevision, 'feeRevision')), tx.object(target.clockObjectId))
  tx.moveCall({ target: `${target.packageId}::market::${params.actualCollectionObjectId !== undefined ? 'list_soul_with_collection' : 'list_soul'}`,
    typeArguments: [target.paymentCoinType], arguments: args })
  return tx
}

/** Original Collection Right listing uses actual Collection/Kiosk/Account and holder epoch. */
export type { CollectionTransactionTarget } from './market-target'
export function buildListCollectionTx(params: {
  target: import('./market-target').CollectionTransactionTarget
  collectionObjectId: string; currentKioskId: string; currentAccountObjectId: string
  priceAtomic: bigint; expiryMs: bigint; expectedHolderEpoch: bigint; feeRevision: bigint
}, tx = new Transaction()) {
  const target = collectionTarget(params.target)
  tx.moveCall({ target: `${target.packageId}::collection::list`, typeArguments: [target.paymentCoinType], arguments: [
    tx.object(objectId(params.collectionObjectId, 'Collection')), tx.object(objectId(params.currentKioskId, 'seller Kiosk')),
    tx.object(objectId(params.currentAccountObjectId, 'seller Account')), tx.object(target.configObjectId),
    tx.pure.u64(u64(params.priceAtomic, 'priceAtomic', true)), tx.pure.u64(u64(params.expiryMs, 'expiryMs')),
    tx.pure.u64(u64(params.expectedHolderEpoch, 'expectedHolderEpoch')), tx.pure.u64(u64(params.feeRevision, 'feeRevision')), tx.object(target.clockObjectId),
  ] })
  return tx
}
