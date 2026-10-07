const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g

const SPACE = /\s+/g

/** Text on one line: control characters dropped, whitespace runs collapsed, ends trimmed. */
export function cleanText(text: string): string {
  return text.replace(CONTROL, '').replace(SPACE, ' ').trim()
}
