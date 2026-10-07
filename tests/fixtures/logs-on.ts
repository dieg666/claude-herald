import type { On } from 'claude-code'

/**
 * Answers `$.ui.log`, recording each line as `<to>: <text>`.
 *
 * @param on the test's registrar
 */
export function logsOn(on: On): string[] {
  const logs: string[] = []

  on('ui.log', ($, e) => {
    logs.push(`${e.to ?? 'transcript'}: ${e.text}`)

    return { value: undefined }
  })

  return logs
}
