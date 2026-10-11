import { Transaction, type TransactionArgument } from '@mysten/sui/transactions'
import { bcs } from '@mysten/sui/bcs'
import { normalizeStructTag } from '@mysten/sui/utils'
import { marketTarget, objectId, u64, hash32, type MarketTransactionTarget } from './market-target'
export type { MarketTransactionTarget } from './market-target'

/** Atomic seller repricing. Move closes the old receipt and shares a new Listing.
 * expectedSoulRevision is Application character revision, not Standard Soul revision.
 * Recover the new listing ID from Listed after execution; the old ID is terminal.
 */
export function buildUpdateListingPriceTx(params: {
  target: MarketTransactionTarget
  listingObjectId: string
  expectedListingRevision: bigint
  newPriceAtomic: bigint
  expiryMs: bigint
  expectedSoulRevision: bigint
  manifestHash: Uint8Array
  feeRevision: bigint
  actualCollectionObjectId?: string
}, tx = new Transaction()) {
  // Complete validation before adding inputs or commands to a caller's PTB.
  const target = marketTarget(params.target)
  const coinTypeBytes = bcs.TypeTag.serialize(target.paymentCoinType).toBytes()
  if (normalizeStructTag(bcs.TypeTag.parse(coinTypeBytes)) !== target.paymentCoinType) {
    throw new Error('paymentCoinType must roundtrip as an exact Move struct type')
  }
  const listing = objectId(params.listingObjectId, 'Soul listing')
  const collection = params.actualCollectionObjectId === undefined
    ? undefined : objectId(params.actualCollectionObjectId, 'actual Collection')
  const expectedListing = u64(params.expectedListingRevision, 'expectedListingRevision')
  const price = u64(params.newPriceAtomic, 'newPriceAtomic', true)
  const expiry = u64(params.expiryMs, 'expiryMs')
  const expectedSoul = u64(params.expectedSoulRevision, 'expectedSoulRevision')
  const manifest = hash32(params.manifestHash, 'manifestHash')
  const feeRevision = u64(params.feeRevision, 'feeRevision')

  const args: TransactionArgument[] = [tx.object(listing)]
  if (collection !== undefined) args.push(tx.object(collection))
  args.push(tx.object(target.configObjectId), tx.pure.u64(expectedListing),
    tx.pure.u64(price), tx.pure.u64(expiry), tx.pure.u64(expectedSoul),
    tx.pure.vector('u8', manifest), tx.pure.u64(feeRevision), tx.object(target.clockObjectId))
  tx.moveCall({ target: `${target.packageId}::market::${collection === undefined ? 'relist_soul' : 'relist_soul_with_collection'}`,
    typeArguments: [target.paymentCoinType], arguments: args })
  return tx
}
