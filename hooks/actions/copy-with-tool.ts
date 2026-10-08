import type { Host } from '../host/host.js'
import { messageOf } from '../refresh/message-of.js'
import { clipboardArgvsOf } from './clipboard-argvs-of.js'
import { platformOf } from './platform-of.js'

/**
 * Copies text with the platform's clipboard tools, trying each in order until one exits cleanly; never throws.
 *
 * @param host the engine
 * @param text what to copy
 * @returns undefined once copied, else why the last tool failed
 */
export async function copyWithTool(host: Host, text: string): Promise<string | undefined> {
  let reason = 'no clipboard tool'

  for (const argv of clipboardArgvsOf(await platformOf(host))) {
    try {
      const { exitCode, stderr } = await host.processRun(argv, { stdin: text, timeoutMs: 5000 })

      if (exitCode === 0) {
        return undefined
      }

      reason = `${argv[0]} exited with ${exitCode}${stderr.trim() === '' ? '' : `: ${messageOf(stderr)}`}`
    } catch (error) {
      reason = `${argv[0]}: ${messageOf(error)}`
    }

    host.debug(`herald: clipboard: ${reason}`)
  }

  return reason
}
