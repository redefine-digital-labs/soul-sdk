import { normalizeStructTag } from '@mysten/sui/utils'

/** Explicit unpublished candidate target. No env or old-package fallback. */
export interface MarketTransactionTarget {
  packageId: string
  soulType: string
  paymentCoinType: string
  configObjectId: string
  clockObjectId: string
}
export interface MarketExitTarget {
  packageId: string
  soulType: string
  paymentCoinType: string
}
export function objectId(value: string, label = 'object ID'): string {
  if (typeof value !== 'string' || !/^0x[0-9a-fA-F]{1,64}$/.test(value)) throw new Error(`${label} must be a hex Sui ID`)
  const id = `0x${value.slice(2).toLowerCase().padStart(64, '0')}`
  if (BigInt(id) === 0n) throw new Error(`${label} must be nonzero`)
  return id
}
export function u64(value: bigint, label: string, positive = false): bigint {
  if (typeof value !== 'bigint' || value < (positive ? 1n : 0n) || value > 18446744073709551615n) throw new Error(`${label} must be ${positive ? 'positive ' : ''}u64 bigint`)
  return value
}
export function hash32(value: Uint8Array, label: string): number[] {
  if (!(value instanceof Uint8Array) || value.length !== 32) throw new Error(`${label} must be exactly 32 bytes`)
  return Array.from(value)
}
export function coinType(value: string): string {
  if (typeof value !== 'string' || !/^0x[0-9a-fA-F]{1,64}::[A-Za-z_][A-Za-z0-9_]*::[A-Za-z_][A-Za-z0-9_]*(?:<.*>)?$/.test(value)) throw new Error('paymentCoinType must be a Move struct type')
  return normalizeStructTag(value)
}
export function exitTarget(target: MarketExitTarget): MarketExitTarget {
  if (!target) throw new Error('explicit independent Market target is required')
  if (typeof target.soulType !== 'string' || !/^0x[0-9a-fA-F]{1,64}::soul::Soul$/.test(target.soulType)) throw new Error('soulType must be the defining Standard ::soul::Soul type')
  return { packageId: objectId(target.packageId, 'Market package'), soulType: normalizeStructTag(target.soulType), paymentCoinType: coinType(target.paymentCoinType) }
}
export function marketTarget(target: MarketTransactionTarget): MarketTransactionTarget {
  return { ...exitTarget(target), configObjectId: objectId(target.configObjectId, 'Config<C>'), clockObjectId: objectId(target.clockObjectId, 'Clock') }
}
/** Core Collection Right is a distinct Kiosk/Account journey, never a Soul order. */
export interface CollectionExitTarget { packageId: string; paymentCoinType: string }
export interface CollectionTransactionTarget extends CollectionExitTarget { configObjectId: string; clockObjectId: string }
export interface CollectionBuyTarget extends CollectionTransactionTarget { factoryObjectId: string; rightTransferPolicyObjectId: string }
export function collectionExitTarget(target: CollectionExitTarget): CollectionExitTarget {
  if (!target) throw new Error('explicit independent Core Collection target is required')
  return { packageId: objectId(target.packageId, 'Core package'), paymentCoinType: coinType(target.paymentCoinType) }
}
export function collectionTarget(target: CollectionTransactionTarget): CollectionTransactionTarget {
  return { ...collectionExitTarget(target), configObjectId: objectId(target.configObjectId, 'Config<C>'), clockObjectId: objectId(target.clockObjectId, 'Clock') }
}
