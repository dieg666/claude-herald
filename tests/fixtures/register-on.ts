import type { CommandSpec, On } from 'claude-code'

/**
 * Answers `$.command.register`, recording each command declared.
 *
 * @param on the test's registrar
 */
export function registerOn(on: On): CommandSpec[] {
  const registered: CommandSpec[] = []

  on('command.register', ($, e) => {
    registered.push(e)

    return { value: { command: e.name } }
  })

  return registered
}
