/** Validate raw Sui TypeTag tokens before any SDK normalization or PTB writes.
 * SDK 2.16 normalization/BCS parsing alone do not validate this grammar.
 * Explicit work stack supports recursive types without a JavaScript recursion cap.
 */
export function validateMoveTypeTag(value: string): { kind: 'primitive' | 'vector' | 'struct'; compact: string } {
  const invalid = () => { throw new Error('invalid raw Move TypeTag') }
  if (typeof value !== 'string') return invalid()
  const tokens: string[] = []
  const token = /0x[0-9a-fA-F]+|[A-Za-z_][A-Za-z0-9_]*|::|[<>,]/y
  for (let offset = 0; offset < value.length;) {
    // Move's lexer accepts ASCII whitespace, never whitespace inside a token.
    if (/[\t\n\f\r ]/.test(value[offset]!)) { offset++; continue }
    token.lastIndex = offset
    const match = token.exec(value)
    if (!match) return invalid()
    tokens.push(match[0]); offset = token.lastIndex
  }
  const primitive = new Set(['bool', 'u8', 'u16', 'u32', 'u64', 'u128', 'u256', 'address', 'signer'])
  const identifier = /^(?:[A-Za-z][A-Za-z0-9_]*|_[A-Za-z0-9_]+)$/
  let cursor = 0
  const take = (expected: string) => { if (tokens[cursor++] !== expected) invalid() }
  const tasks: ('type' | 'vector-end' | 'struct-rest')[] = ['type']
  const kind = primitive.has(tokens[0]!) ? 'primitive' : tokens[0] === 'vector' ? 'vector' : 'struct'
  while (tasks.length) {
    const task = tasks.pop()!
    if (task === 'vector-end') { take('>'); continue }
    if (task === 'struct-rest') {
      if (tokens[cursor] === '>') { cursor++; continue }
      take(','); tasks.push('struct-rest', 'type'); continue
    }
    const head = tokens[cursor++]
    if (head === undefined) return invalid()
    if (primitive.has(head)) continue
    if (head === 'vector') { take('<'); tasks.push('vector-end', 'type'); continue }
    // A Sui numerical type address is 32 bytes, with the existing 0x input contract.
    if (!/^0x[0-9a-fA-F]{1,64}$/.test(head)) return invalid()
    take('::')
    if (!identifier.test(tokens[cursor++] ?? '')) return invalid()
    take('::')
    if (!identifier.test(tokens[cursor++] ?? '')) return invalid()
    if (tokens[cursor] === '<') { cursor++; tasks.push('struct-rest', 'type') }
  }
  if (cursor !== tokens.length) return invalid()
  return { kind, compact: tokens.join('') }
}
