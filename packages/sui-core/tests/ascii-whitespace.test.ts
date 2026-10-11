import { describe, it, expect } from 'vitest'
import { validateMoveTypeTag } from '../src/move-type-tag'

describe('corrected ASCII lexer boundary', () => {
  it('classifies each of 128 ASCII characters at a token boundary', () => {
    const allowed = new Set([9, 10, 12, 13, 32])
    for (let n = 0; n < 128; n++) {
      const raw = `0xa::cash::Cash<${String.fromCharCode(n)}u8>`
      if (allowed.has(n)) expect(validateMoveTypeTag(raw).compact).toBe('0xa::cash::Cash<u8>')
      else expect(() => validateMoveTypeTag(raw), `ASCII ${n}`).toThrow()
    }
  })
  it('rejects VT at root, token and generic boundaries', () => {
    for (const raw of ['\v0xa::cash::Cash', '0xa\v::cash::Cash', '0xa::cash::Cash<\vu8>', '0xa::cash::Cash<u8>\v']) {
      expect(() => validateMoveTypeTag(raw)).toThrow()
    }
  })
})
