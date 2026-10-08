import type { StackItem } from '../../types/index.js'
import type { FakeFile } from './fake-file.js'

/**
 * A project that declares the packages of these stack items at their versions in use: npm ones in `package.json`, PyPI ones in `requirements.txt`.
 *
 * @param items the stack items
 */
export function stackTreeOf(items: readonly StackItem[]): Record<string, FakeFile> {
  const of = (ecosystem: string) => items.filter(item => item.release.ecosystem === ecosystem)
  const npm = Object.fromEntries(
    of('npm').map(item => [item.release.name, item.release.current ?? '1.0.0']),
  )
  const pypi = of('pypi').map(item => `${item.release.name}==${item.release.current ?? '1.0.0'}`)

  return {
    '.git': { isDir: true },
    'package.json': JSON.stringify({ name: 'app', dependencies: npm }),
    ...(pypi.length === 0 ? {} : { 'requirements.txt': `${pypi.join('\n')}\n` }),
  }
}
