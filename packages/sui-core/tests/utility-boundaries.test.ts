import { expect, it, vi } from 'vitest'
import { toBase58 } from '@mysten/sui/utils'
import { CoinPaginationExhaustedError, selectCoinObjectIdsForAmountAcrossPages } from '@soulidity/sui-core/coin-selection'
import { parseRequiredObjectId, parseRequiredTxDigest, parseOptionalObjectId } from '@soulidity/sui-core/request'
import { formatAtomicAmountForDisplay, parseDisplayAmountToAtomic } from '@soulidity/sui-core/format'
import { profileReadStep } from '@soulidity/sui-core/profile-read-step'

it('collects an amount across later fake-RPC pages without treating discovery as custody proof', async () => {
  const getCoins = vi.fn().mockResolvedValueOnce({ data: [{ coinObjectId: 'coin-a', balance: '40' }], hasNextPage: true, nextCursor: 'later' })
    .mockResolvedValueOnce({ data: [{ coinObjectId: 'coin-b', balance: '60' }], hasNextPage: false })
  expect(await selectCoinObjectIdsForAmountAcrossPages({ getCoins }, { owner: 'owner', coinType: 'coin-type', requiredAmount: 100n })).toEqual(['coin-a', 'coin-b'])
  expect(getCoins.mock.calls.map(([args]) => args.cursor)).toEqual([undefined, 'later'])
})
it('fails malformed repeated pagination instead of looping or claiming insufficient funds', async () => {
  const getCoins = vi.fn().mockResolvedValue({ data: [], hasNextPage: true, nextCursor: 'repeat' })
  await expect(selectCoinObjectIdsForAmountAcrossPages({ getCoins }, { owner: 'owner', coinType: 'coin-type', requiredAmount: 1n })).rejects.toThrow('cursor repeated')
  expect(getCoins).toHaveBeenCalledTimes(2)
})
it('distinguishes page-budget exhaustion from a complete insufficient-balance scan', async () => {
  const getCoins = vi.fn().mockResolvedValue({ data: [{ coinObjectId: 'dust', balance: '1' }], hasNextPage: true, nextCursor: 'next' })
  await expect(selectCoinObjectIdsForAmountAcrossPages({ getCoins }, { owner: 'owner', coinType: 'coin-type', requiredAmount: 2n, maxPages: 1 })).rejects.toBeInstanceOf(CoinPaginationExhaustedError)
  expect(await selectCoinObjectIdsForAmountAcrossPages({ getCoins: vi.fn().mockResolvedValue({ data: [{ coinObjectId: 'dust', balance: '1' }], hasNextPage: false }) }, { owner: 'owner', coinType: 'coin-type', requiredAmount: 2n })).toBeNull()
})
it('rejects a promised additional coin page with no recovery cursor', async () => {
  const getCoins = vi.fn().mockResolvedValue({ data: [], hasNextPage: true })
  await expect(selectCoinObjectIdsForAmountAcrossPages({ getCoins }, { owner: 'owner', coinType: 'coin-type', requiredAmount: 1n })).rejects.toThrow('without a cursor')
})
it('normalizes wire IDs while rejecting invalid IDs and non-digest strings', () => {
  expect(parseRequiredObjectId(' 0x2 ')).toBe('0x' + '0'.repeat(63) + '2')
  expect(parseRequiredObjectId('0x' + 'a'.repeat(65))).toBeNull()
  expect(parseOptionalObjectId(null)).toBeNull()
  expect(parseRequiredTxDigest('transaction pending')).toBeNull()
  const digest = toBase58(new Uint8Array(32).fill(7))
  expect(parseRequiredTxDigest(' ' + digest + ' ')).toBe(digest)
})
it('round-trips an explicit nine-decimal amount above number precision without rounding', () => {
  const display = '18446744073.709551615', atomic = 18446744073709551615n
  expect(parseDisplayAmountToAtomic(display, { decimals: 9 })).toBe(atomic)
  expect(formatAtomicAmountForDisplay(atomic, { decimals: 9, symbol: 'SUI' })).toBe(display + ' SUI')
  expect(() => parseDisplayAmountToAtomic('1.0000000001', { decimals: 9 })).toThrow('at most 9')
})
it('never invokes a read after cancellation has already revoked its scope', async () => {
  const controller = new AbortController(), run = vi.fn(); controller.abort(new Error('cancelled'))
  await expect(profileReadStep(controller.signal, run)).rejects.toThrow('cancelled')
  expect(run).not.toHaveBeenCalled()
})
it('discards a late non-cooperative read without publishing its result', async () => {
  const controller = new AbortController(), discard = vi.fn()
  let finish!: (value: string) => void
  const pending = profileReadStep(controller.signal, () => new Promise<string>(resolve => { finish = resolve }), discard)
  await Promise.resolve()
  const rejected = expect(pending).rejects.toThrow('cancelled'); controller.abort(new Error('cancelled')); await rejected
  finish('late-secret'); await Promise.resolve(); await Promise.resolve()
  expect(discard).toHaveBeenCalledExactlyOnceWith('late-secret')
})
