import { Transaction } from '@mysten/sui/transactions'
import { collectionTarget, objectId, u64, type CollectionTransactionTarget } from './market-target'

/** Cancel and relist the same Collection Right using its existing sealed pair. */
export function buildUpdateCollectionListingPriceTx(params: {
  target: CollectionTransactionTarget
  currentKioskId: string
  currentAccountObjectId: string
  collectionObjectId: string
  listingObjectId: string
  expectedListingRevision: bigint
  newPriceAtomic: bigint
  expiryMs: bigint
  expectedHolderEpoch: bigint
  feeRevision: bigint
}, tx = new Transaction()) {
  // Validate everything before touching a caller-supplied Transaction.
  const target = collectionTarget(params.target)
  const kiosk = objectId(params.currentKioskId, 'seller Kiosk')
  const account = objectId(params.currentAccountObjectId, 'seller Account')
  if (kiosk === account) throw new Error('seller Kiosk and Account IDs must be distinct')
  const collection = objectId(params.collectionObjectId, 'Collection')
  const listing = objectId(params.listingObjectId, 'Collection Listing<C>')
  const revision = u64(params.expectedListingRevision, 'expectedListingRevision')
  const ask = u64(params.newPriceAtomic, 'newPriceAtomic', true)
  const expiry = u64(params.expiryMs, 'expiryMs')
  const epoch = u64(params.expectedHolderEpoch, 'expectedHolderEpoch')
  const feeRevision = u64(params.feeRevision, 'feeRevision')
  const kioskArg = tx.object(kiosk), accountArg = tx.object(account)
  tx.moveCall({ target: `${target.packageId}::collection::cancel`, typeArguments: [target.paymentCoinType], arguments: [
    tx.object(listing), kioskArg, accountArg, tx.pure.u64(revision),
  ] })
  tx.moveCall({ target: `${target.packageId}::collection::list`, typeArguments: [target.paymentCoinType], arguments: [
    tx.object(collection), kioskArg, accountArg, tx.object(target.configObjectId),
    tx.pure.u64(ask), tx.pure.u64(expiry), tx.pure.u64(epoch), tx.pure.u64(feeRevision), tx.object(target.clockObjectId),
  ] })
  return tx
}
