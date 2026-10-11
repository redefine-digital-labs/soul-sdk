import { describe, expect, it } from 'vitest'

import { resolveSuiNetwork } from '@soulidity/sui-core/sui-network'

describe('resolveSuiNetwork', () => {
  it('accepts the supported network names', () => {
    expect(resolveSuiNetwork('testnet')).toBe('testnet')
    expect(resolveSuiNetwork('mainnet')).toBe('mainnet')
  })

  it('falls back to testnet for unexpected values', () => {
    expect(resolveSuiNetwork('devnet')).toBe('testnet')
    expect(resolveSuiNetwork('')).toBe('testnet')
    expect(resolveSuiNetwork(undefined)).toBe('testnet')
  })
})
