import type { CommandSpec } from 'claude-code'

/**
 * What the typeahead and `/help` show for `/herald`; its name and `immediate` are spelled in `register.tsx`.
 */
export const HERALD_COMMAND: Required<Pick<CommandSpec, 'description' | 'argumentHint'>> = {
  description:
    "News from feeds and pages and your stack's releases: open the pane, or add, remove and tune sources",
  argumentHint: '[add <url> [name] | list | remove <name> | deps | help]',
}
