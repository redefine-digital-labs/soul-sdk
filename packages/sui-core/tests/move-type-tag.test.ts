import { describe, it, expect } from 'vitest'
import { validateMoveTypeTag } from '../src/move-type-tag'

describe('pure grammar package public helper', () => {
  it('accepts all Move primitives as primitive roots', () => {
    for (const type of ['bool','u8','u16','u32','u64','u128','u256','address','signer']) expect(validateMoveTypeTag(type)).toEqual({ kind: 'primitive', compact: type })
  })
  it('accepts nested vector and struct roots', () => {
    expect(validateMoveTypeTag('vector<0x1::m::T<vector<u64>,address>>').kind).toBe('vector')
    expect(validateMoveTypeTag('0x1::_module::_Token<u8,vector<bool>>').kind).toBe('struct')
  })
  it('compacts only ASCII whitespace between complete tokens', () => {
    expect(validateMoveTypeTag(' 0x1 \t:: m :: T < u8 , vector < bool > >\r\n').compact).toBe('0x1::m::T<u8,vector<bool>>')
    for (const type of ['0x 1::m::T','0x1::m::To ken','0x1::m::T\u00a0']) expect(() => validateMoveTypeTag(type)).toThrow()
  })
  it('rejects malformed nested identifiers and path suffixes', () => {
    for (const type of ['0x1::m::T<0x2::bad-name::T>','0x1::m::T<0x2::m::Bad-Name>','0x1::m::T<0x2::m::T::Extra>','0x1::_::T','0x1::m::_']) expect(() => validateMoveTypeTag(type)).toThrow()
  })
  it('rejects incomplete and repeated delimiters', () => {
    for (const type of ['','vector<>','vector<u8,u64>','0x1::m::T<>','0x1::m::T<u8,,u64>','0x1::m::T<u8','0x1::m::T<u8>>']) expect(() => validateMoveTypeTag(type)).toThrow()
  })
  it('enforces the existing prefixed 32 byte numerical address contract', () => {
    expect(validateMoveTypeTag(`0x${'f'.repeat(64)}::m::T`).kind).toBe('struct')
    for (const type of [`0x${'f'.repeat(65)}::m::T`,'0X1::m::T','1::m::T','0xg::m::T']) expect(() => validateMoveTypeTag(type)).toThrow()
  })
  it('uses an explicit stack for deep but finite recursive types', () => {
    const value = 'vector<'.repeat(10000)+'u8'+'>'.repeat(10000)
    expect(validateMoveTypeTag(value)).toEqual({kind:'vector', compact:value})
  })
  it('rejects unknown primitives and runtime non strings', () => {
    for (const value of ['U8','string','u8<u64>']) expect(() => validateMoveTypeTag(value)).toThrow()
    expect(() => validateMoveTypeTag(null as unknown as string)).toThrow()
  })
})
