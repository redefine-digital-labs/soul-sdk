import { Transaction, type TransactionArgument } from '@mysten/sui/transactions'
import { coinType, marketTarget, objectId, u64, hash32, collectionTarget, type MarketTransactionTarget } from './market-target'

// Historical helper retained for untouched Native builders; new Soul route uses typed helper below.
export function buildExactPaymentCoin(
  tx: Transaction,
  paymentCoinObjectIds: string[],
  totalAtomic: bigint,
) {
  if (totalAtomic <= 0n) {
    throw new Error('totalAtomic must be positive')
  }
  if (paymentCoinObjectIds.length === 0) {
    throw new Error('paymentCoinObjectIds must contain at least one object id')
  }

  const [primaryCoinId, ...remainingCoinIds] = paymentCoinObjectIds
  const primaryCoin = tx.object(primaryCoinId!)
  if (remainingCoinIds.length > 0) {
    tx.mergeCoins(primaryCoin, remainingCoinIds.map((coinId) => tx.object(coinId)))
  }
  const [paymentCoin] = tx.splitCoins(primaryCoin, [tx.pure.u64(totalAtomic)])
  return paymentCoin
}

export interface TypedPaymentCoin { objectId: string; coinType: string; balanceAtomic: bigint }
/** Metadata must come from wallet-owned Coin<C> discovery. This offline builder cannot prove chain ownership. */
export function buildTypedExactPaymentCoin(tx: Transaction, coins: readonly TypedPaymentCoin[], totalAtomic: bigint, paymentCoinType: string) {
  const amount = u64(totalAtomic, 'totalAtomic', true), type = coinType(paymentCoinType)
  if (!coins.length) throw new Error('paymentCoins must contain at least one typed Coin<C>')
  const seen = new Set<string>(); let selectedAtomic = 0n
  const ids = coins.map(coin => {
    const id = objectId(coin.objectId, 'payment Coin<C>')
    if (seen.has(id)) throw new Error('duplicate payment coin ID')
    seen.add(id)
    if (coinType(coin.coinType) !== type) throw new Error('payment coin type differs from target C')
    selectedAtomic += u64(coin.balanceAtomic, 'coin balanceAtomic', true)
    if (selectedAtomic > 18446744073709551615n) throw new Error('merged Coin<C> balance exceeds u64')
    return id
  })
  if (selectedAtomic < amount) throw new Error('insufficient typed payment balance')
  const primary = tx.object(ids[0]!)
  if (ids.length > 1) tx.mergeCoins(primary, ids.slice(1).map(id => tx.object(id)))
  if (selectedAtomic === amount) return { paymentCoin: primary, changeCoin: null, selectedAtomic, changeAtomic: 0n }
  const [paymentCoin] = tx.splitCoins(primary, [tx.pure.u64(amount)])
  // Unconsumed primary remains wallet-owned; expose it for further same-PTB use.
  return { paymentCoin: paymentCoin!, changeCoin: primary, selectedAtomic, changeAtomic: selectedAtomic - amount }
}
export function buildBuySoulTx(params: {
  target: MarketTransactionTarget
  listingObjectId: string
  expectedListingRevision: bigint
  manifestHash: Uint8Array
  expectedQuoteHash: Uint8Array
  feeRevision: bigint
  attemptHash: Uint8Array
  totalAtomic: bigint
  paymentCoins: readonly TypedPaymentCoin[]
  collection?: { actualCollectionObjectId: string; expectedCollectionSnapshotHash: Uint8Array }
}, tx = new Transaction()) {
  const target = marketTarget(params.target)
  const args: TransactionArgument[] = [tx.object(objectId(params.listingObjectId, 'Listing<Soul,C>'))]
  if (params.collection) args.push(tx.object(objectId(params.collection.actualCollectionObjectId, 'actual Collection')))
  args.push(tx.object(target.configObjectId), tx.pure.u64(u64(params.expectedListingRevision, 'expectedListingRevision')),
    tx.pure.vector('u8', hash32(params.manifestHash, 'manifestHash')))
  if (params.collection) args.push(tx.pure.vector('u8', hash32(params.collection.expectedCollectionSnapshotHash, 'expectedCollectionSnapshotHash')))
  args.push(tx.pure.vector('u8', hash32(params.expectedQuoteHash, 'expectedQuoteHash')), tx.pure.u64(u64(params.feeRevision, 'feeRevision')),
    tx.pure.vector('u8', hash32(params.attemptHash, 'attemptHash')))
  const payment = buildTypedExactPaymentCoin(tx, params.paymentCoins, params.totalAtomic, target.paymentCoinType)
  args.push(payment.paymentCoin, tx.object(target.clockObjectId))
  tx.moveCall({ target: `${target.packageId}::market::${params.collection ? 'buy_soul_with_collection' : 'buy_soul'}`,
    typeArguments: [target.paymentCoinType], arguments: args })
  return tx
}

/** Existing buyer Kiosk/Account only. Automatic pair creation awaits its own verified adapter. */
export function buildBuyCollectionTx(params: {
  target: import('./market-target').CollectionBuyTarget
  listingObjectId: string; collectionObjectId: string; sellerKioskId: string
  buyerKioskId: string; buyerAccountObjectId: string
  expectedListingRevision: bigint; expectedHolderEpoch: bigint; feeRevision: bigint
  expectedQuoteHash: Uint8Array; attemptHash: Uint8Array
  totalAtomic: bigint; paymentCoins: readonly TypedPaymentCoin[]
}, tx = new Transaction()) {
  const target = collectionTarget(params.target)
  const args: TransactionArgument[] = [tx.object(objectId(params.listingObjectId, 'Collection Listing<C>')),
    tx.object(objectId(params.collectionObjectId, 'Collection')), tx.object(objectId(params.target.factoryObjectId, 'Collection Factory')),
    tx.object(objectId(params.target.rightTransferPolicyObjectId, 'TransferPolicy<Right>')), tx.object(objectId(params.sellerKioskId, 'seller Kiosk')),
    tx.object(objectId(params.buyerKioskId, 'buyer Kiosk')), tx.object(objectId(params.buyerAccountObjectId, 'buyer Account')), tx.object(target.configObjectId),
    tx.pure.u64(u64(params.expectedListingRevision, 'expectedListingRevision')), tx.pure.u64(u64(params.expectedHolderEpoch, 'expectedHolderEpoch')),
    tx.pure.u64(u64(params.feeRevision, 'feeRevision')), tx.pure.vector('u8', hash32(params.expectedQuoteHash, 'expectedQuoteHash')),
    tx.pure.vector('u8', hash32(params.attemptHash, 'attemptHash'))]
  const payment = buildTypedExactPaymentCoin(tx, params.paymentCoins, params.totalAtomic, target.paymentCoinType)
  args.push(payment.paymentCoin, tx.object(target.clockObjectId))
  tx.moveCall({ target: `${target.packageId}::collection::buy`, typeArguments: [target.paymentCoinType], arguments: args })
  return tx
}
