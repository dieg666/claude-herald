import type { ThemeKey } from 'claude-code'

/**
 * A run of text a one-line row draws after its title, in its theme color when it has one.
 */
export type PaneCell = {
  readonly text: string
  readonly color?: ThemeKey
}
