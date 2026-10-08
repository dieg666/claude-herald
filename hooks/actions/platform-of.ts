import type { Host } from '../host/host.js'
import { messageOf } from '../refresh/message-of.js'
import type { Platform } from './platform.js'

/**
 * The platform: Windows when `OS` is `Windows_NT`, macOS when `uname -s` answers `Darwin`, anything else otherwise; never throws.
 *
 * @param host the engine
 */
export async function platformOf(host: Host): Promise<Platform> {
  if ((await host.osVariable().catch(() => undefined)) === 'Windows_NT') {
    return 'windows'
  }

  try {
    const { exitCode, stdout } = await host.processRun(['uname', '-s'], { timeoutMs: 5000 })

    return exitCode === 0 && stdout.trim() === 'Darwin' ? 'darwin' : 'other'
  } catch (error) {
    host.debug(`herald: uname -s failed: ${messageOf(error)}`)

    return 'other'
  }
}
