import { Transaction, type TransactionArgument } from '@mysten/sui/transactions'
import { objectId } from './market-target'

export interface CollectionBuyerPairOptions {
  /** Both existing object IDs must be supplied, or omit both to create a pair. */
  buyerKioskId?: string
  /** Actual sealed Account object, never a native or personal Kiosk owner cap. */
  buyerAccountObjectId?: string
}
export type CollectionBuyerPair = { kioskId: string; accountId: string } | null

/** Syntax checks only; Move checks actual object types, pair binding and sender. */
export function validateCollectionBuyerPair(options: CollectionBuyerPairOptions): CollectionBuyerPair {
  const kiosk = options.buyerKioskId, account = options.buyerAccountObjectId
  if ((kiosk === undefined) !== (account === undefined)) {
    throw new Error('buyer Kiosk ID and sealed Account ID must be supplied together')
  }
  if (kiosk === undefined && account === undefined) return null
  const kioskId = objectId(kiosk!, 'buyer Kiosk'), accountId = objectId(account!, 'buyer Account')
  if (kioskId === accountId) throw new Error('buyer Kiosk and Account IDs must be distinct')
  return { kioskId, accountId }
}

/** Only Core owns this composition; no shared Native helper or environment route. */
export function appendCollectionBuyerPair(tx: Transaction, corePackageId: string, pair: CollectionBuyerPair): {
  buyerKiosk: TransactionArgument; buyerAccount: TransactionArgument; finalize: () => void
} {
  if (pair) return { buyerKiosk: tx.object(pair.kioskId), buyerAccount: tx.object(pair.accountId), finalize: () => {} }
  const [buyerKiosk, buyerAccount] = tx.moveCall({ target: `${corePackageId}::custody::new`, arguments: [] })
  return {
    buyerKiosk: buyerKiosk!, buyerAccount: buyerAccount!,
    finalize: () => { tx.moveCall({ target: `${corePackageId}::custody::finalize`, arguments: [buyerKiosk!, buyerAccount!] }) },
  }
}
