const TAG = /^[A-Za-z]{1,8}(?:-[A-Za-z0-9]{1,8})*$/

/** A declared language as a BCP 47 tag (`en_US` reads `en-US`), or undefined when it is not one. */
export function langOf(text: string | undefined): string | undefined {
  const tag = text?.trim().replaceAll('_', '-') ?? ''

  return TAG.test(tag) ? tag : undefined
}
