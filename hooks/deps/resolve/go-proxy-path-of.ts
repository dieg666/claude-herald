/**
 * A module path as the Go proxy spells it: each upper-case letter as `!` and its lower case.
 *
 * @param module the module path
 */
export function goProxyPathOf(module: string): string {
  return module.replace(/[A-Z]/g, letter => `!${letter.toLowerCase()}`)
}
