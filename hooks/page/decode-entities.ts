const NAMED: ReadonlyMap<string, string> = new Map(
  (
    'amp:& lt:< gt:> quot:" apos:\' nbsp:  shy: copy:© reg:® trade:™ ' +
    'hellip:… mdash:— ndash:– lsquo:‘ rsquo:’ ldquo:“ rdquo:” ' +
    'sbquo:‚ bdquo:„ laquo:« raquo:» bull:• middot:· euro:€ ' +
    'pound:£ yen:¥ cent:¢ deg:° times:× divide:÷ plusmn:± ' +
    'sect:§ para:¶ larr:← rarr:→ uarr:↑ darr:↓ hearts:♥ ' +
    'check:✓ star:☆ iexcl:¡ iquest:¿ micro:µ ordf:ª ordm:º ' +
    'frac12:½ frac14:¼ frac34:¾ sup2:² sup3:³ szlig:ß ' +
    'agrave:à aacute:á acirc:â atilde:ã auml:ä aring:å aelig:æ ' +
    'ccedil:ç egrave:è eacute:é ecirc:ê euml:ë igrave:ì iacute:í ' +
    'icirc:î iuml:ï ntilde:ñ ograve:ò oacute:ó ocirc:ô otilde:õ ' +
    'ouml:ö oslash:ø ugrave:ù uacute:ú ucirc:û uuml:ü yacute:ý ' +
    'yuml:ÿ Agrave:À Aacute:Á Acirc:Â Atilde:Ã Auml:Ä Aring:Å ' +
    'AElig:Æ Ccedil:Ç Egrave:È Eacute:É Ecirc:Ê Euml:Ë Igrave:Ì ' +
    'Iacute:Í Icirc:Î Iuml:Ï Ntilde:Ñ Ograve:Ò Oacute:Ó Ocirc:Ô ' +
    'Otilde:Õ Ouml:Ö Oslash:Ø Ugrave:Ù Uacute:Ú Ucirc:Û Uuml:Ü ' +
    'Yacute:Ý'
  )
    .split(' ')
    .map(pair => [pair.slice(0, pair.indexOf(':')), pair.slice(pair.indexOf(':') + 1)] as const),
)

const WINDOWS_1252 = '€\u0081‚ƒ„…†‡ˆ‰Š‹Œ\u008dŽ\u008f' + '\u0090‘’“”•–—˜™š›œ\u009džŸ'

const REFERENCE = /&(?:#(\d{1,7})|#[xX]([0-9a-fA-F]{1,6})|([A-Za-z][A-Za-z0-9]{1,31}));/g

const REPLACEMENT = '�'

const characterOf = (code: number) => {
  if (code >= 0x80 && code <= 0x9f) {
    return WINDOWS_1252[code - 0x80] ?? REPLACEMENT
  }

  const invalid = code === 0 || code > 0x10ffff || (code >= 0xd800 && code <= 0xdfff)

  return invalid ? REPLACEMENT : String.fromCodePoint(code)
}

/**
 * Text with its HTML character references decoded in one pass, so `&amp;lt;` becomes `&lt;`.
 *
 * @param text the text with references
 * @returns the text with the numeric and known named references decoded
 */
export const decodeEntities = (text: string) =>
  text.includes('&')
    ? text.replace(REFERENCE, (whole, decimal?: string, hex?: string, name?: string) => {
        if (decimal !== undefined) {
          return characterOf(Number.parseInt(decimal, 10))
        }

        if (hex !== undefined) {
          return characterOf(Number.parseInt(hex, 16))
        }

        return NAMED.get(name ?? '') ?? whole
      })
    : text
