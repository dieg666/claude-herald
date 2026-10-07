/** Inline formatting tags that sometimes leak into plain-text titles. */
export const INLINE_TAG =
  /<\/?(?:a|abbr|b|br|cite|code|del|em|font|i|ins|kbd|mark|q|s|small|span|strong|sub|sup|u)(?:\s[^<>]*)?\/?>/gi
