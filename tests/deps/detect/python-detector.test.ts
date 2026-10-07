import { describe, expect, test } from 'claude-code/testing'

import Fixtures from '../../fixtures'
import Python from '../../fixtures/deps/python'

describe('python-detector', () => {
  const PYDANTIC = {
    'pyproject.toml': Python.PYDANTIC_PYPROJECT,
    'uv.lock': Python.PYDANTIC_UV_LOCK,
    'pydantic-core/pyproject.toml': Python.PYDANTIC_CORE_PYPROJECT,
  }

  const TEXTUAL = {
    'pyproject.toml': Python.TEXTUAL_PYPROJECT,
    'poetry.lock': Python.TEXTUAL_POETRY_LOCK,
  }

  test('PEP 621: runtime dependencies take their uv.lock version, markers and extras dropped', async () => {
    const { dependencies } = await Fixtures.scanOf(PYDANTIC)

    expect(Fixtures.depNamed(dependencies, 'typing-extensions', 'pyproject.toml')).toEqual({
      ecosystem: 'pypi',
      name: 'typing-extensions',
      versionInUse: '4.16.0',
      range: '>=4.16.0',
      isDev: false,
      isRoot: true,
      manifestPath: 'pyproject.toml',
    })
    expect(Fixtures.depNamed(dependencies, 'tzdata')).toMatchObject({
      versionInUse: '2025.1',
      isDev: true,
    })
    expect(Fixtures.depNamed(dependencies, 'tzdata')?.range).toBeUndefined()
  })

  test('uv workspace: the member is read and its own package is not followed', async () => {
    const { dependencies } = await Fixtures.scanOf(PYDANTIC)

    expect(Fixtures.depNamed(dependencies, 'pydantic-core')).toBeUndefined()
    expect(
      Fixtures.depNamed(dependencies, 'typing-extensions', 'pydantic-core/pyproject.toml'),
    ).toMatchObject({ versionInUse: '4.16.0', isRoot: false })
  })

  test('optional extras and dependency groups count as dev', async () => {
    const { dependencies } = await Fixtures.scanOf(PYDANTIC)

    expect(Fixtures.depNamed(dependencies, 'email-validator')).toMatchObject({
      range: '>=2.0.0',
      versionInUse: '2.2.0',
      isDev: true,
    })
    expect(Fixtures.depNamed(dependencies, 'pytest')?.isDev).toBe(true)
  })

  test('Poetry: dependencies and groups, versions from poetry.lock, python left out', async () => {
    const { dependencies } = await Fixtures.scanOf(TEXTUAL)

    expect(Fixtures.depNamed(dependencies, 'rich')).toMatchObject({
      versionInUse: '14.2.0',
      range: '>=14.2.0',
      isDev: false,
    })
    expect(Fixtures.depNamed(dependencies, 'markdown-it-py')).toMatchObject({
      range: '>=2.1.0',
      isDev: false,
    })
    expect(Fixtures.depNamed(dependencies, 'tree-sitter')?.isDev).toBe(true)
    expect(Fixtures.depNamed(dependencies, 'black')).toMatchObject({ isDev: true, range: '24.4.2' })
    expect(Fixtures.depNamed(dependencies, 'python')).toBeUndefined()
  })

  test('without a lockfile ranges stay and only exact pins are in use', async () => {
    const { dependencies } = await Fixtures.scanOf({ 'pyproject.toml': Python.TEXTUAL_PYPROJECT })

    expect(Fixtures.depNamed(dependencies, 'rich')).toEqual({
      ecosystem: 'pypi',
      name: 'rich',
      range: '>=14.2.0',
      isDev: false,
      isRoot: true,
      manifestPath: 'pyproject.toml',
    })
    expect(Fixtures.depNamed(dependencies, 'black')?.versionInUse).toBe('24.4.2')
  })

  test('requirements files: pins in use, -r and -c lines skipped, a test file counts as dev', async () => {
    const { dependencies } = await Fixtures.scanOf({
      'requirements.txt': Python.HA_REQUIREMENTS,
      'requirements_test.txt': Python.HA_REQUIREMENTS_TEST,
    })

    expect(Fixtures.depNamed(dependencies, 'aiohttp')).toMatchObject({
      versionInUse: '3.14.4',
      range: '==3.14.4',
      isDev: false,
      manifestPath: 'requirements.txt',
    })
    expect(Fixtures.depNamed(dependencies, 'certifi')).toMatchObject({ range: '>=2021.5.30' })
    expect(Fixtures.depNamed(dependencies, 'certifi')?.versionInUse).toBeUndefined()
    expect(Fixtures.depNamed(dependencies, 'pytest')).toMatchObject({
      versionInUse: '9.0.3',
      isDev: true,
      manifestPath: 'requirements_test.txt',
    })
    expect(dependencies.some(dependency => dependency.name.startsWith('-'))).toBe(false)
  })

  test('dev dependencies are left out by default and followed with the toggle', async () => {
    const runtime = await Fixtures.detectedOf(TEXTUAL, { cap: 500 })
    const all = await Fixtures.detectedOf(TEXTUAL, { cap: 500, includeDev: true })

    expect(runtime.project?.dependencies.map(dependency => dependency.name)).toEqual([
      'markdown-it-py',
      'mdit-py-plugins',
      'rich',
      'typing-extensions',
      'platformdirs',
      'pygments',
    ])
    expect(Fixtures.depNamed(all.project?.dependencies ?? [], 'pytest')?.isDev).toBe(true)
  })

  test('a broken pyproject.toml is skipped with a debug line, never thrown', async () => {
    const { dependencies, logs } = await Fixtures.scanOf({
      'pyproject.toml': Python.BROKEN_PYPROJECT,
      'requirements.txt': Python.HA_REQUIREMENTS,
    })

    expect(Fixtures.depNamed(dependencies, 'aiohttp')?.versionInUse).toBe('3.14.4')
    expect(dependencies.every(dependency => dependency.manifestPath === 'requirements.txt')).toBe(
      true,
    )
    expect(logs.some(line => /skipped pyproject\.toml: TOML/.test(line))).toBe(true)
  })
})
