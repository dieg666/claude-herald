/**
 * How each `/news deps` subcommand is typed after `/news deps`, by name.
 */
export const DEPS_USAGES = {
  on: 'on',
  off: 'off',
  rescan: 'rescan',
  ignore: 'ignore <package>',
  unignore: 'unignore <package>',
  add: 'add <ecosystem:package|owner/repo>',
  map: 'map <package> <owner/repo|feed-url>',
  dev: 'dev <on|off>',
  level: 'level <level>',
  toast: 'toast <level|off>',
  cap: 'cap <1-500>',
  template: 'template <text>',
  filter: 'filter [text]',
} as const
