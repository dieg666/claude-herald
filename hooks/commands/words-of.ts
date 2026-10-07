const QUOTES = new Set(['"', "'"])

/**
 * The words of a command line: split on whitespace, text inside double or single quotes kept together without the quotes; an unclosed quote runs to the end.
 *
 * @param text what follows the command
 */
export function wordsOf(text: string): string[] {
  const words: string[] = []
  let word = ''
  let isWord = false
  let quote: string | undefined

  for (const char of text) {
    if (quote !== undefined) {
      if (char === quote) {
        quote = undefined
      } else {
        word += char
      }
    } else if (QUOTES.has(char)) {
      quote = char
      isWord = true
    } else if (/\s/.test(char)) {
      if (isWord) {
        words.push(word)
      }

      word = ''
      isWord = false
    } else {
      word += char
      isWord = true
    }
  }

  if (isWord) {
    words.push(word)
  }

  return words
}
