const OFFSET_BASIS = 0xcbf29ce484222325n

const PRIME = 0x100000001b3n

/**
 * A fingerprint of a text, to tell whether a page changed since it was last read.
 *
 * @param text the text to fingerprint, hashed as 64-bit FNV-1a over its UTF-8 bytes
 * @returns 16 lower-case hexadecimal digits
 */
export const contentHashOf = (text: string) => {
  let hash = OFFSET_BASIS

  for (const byte of new TextEncoder().encode(text)) {
    hash = BigInt.asUintN(64, (hash ^ BigInt(byte)) * PRIME)
  }

  return hash.toString(16).padStart(16, '0')
}
