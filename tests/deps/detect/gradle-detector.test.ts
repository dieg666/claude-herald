import { describe, expect, test } from 'claude-code/testing'

import Fixtures from '../../fixtures'
import Maven from '../../fixtures/deps/maven'

describe('gradle-detector', () => {
  const NOWINANDROID = {
    'app/build.gradle.kts': Maven.NOWINANDROID_APP_BUILD_GRADLE_KTS,
    'gradle/libs.versions.toml': Maven.NOWINANDROID_LIBS_VERSIONS_TOML,
  }

  const PETCLINIC = { 'build.gradle': Maven.PETCLINIC_BUILD_GRADLE }

  test('catalog references resolve to group:name and the version.ref version', async () => {
    const { dependencies } = await Fixtures.scanOf(NOWINANDROID)

    expect(Fixtures.depNamed(dependencies, 'androidx.core:core-ktx')).toEqual({
      ecosystem: 'maven',
      name: 'androidx.core:core-ktx',
      versionInUse: '1.15.0',
      range: '1.15.0',
      isDev: false,
      isRoot: false,
      manifestPath: 'app/build.gradle.kts',
    })
  })

  test('project dependencies are left out; test, debug and tooling configurations are dev', async () => {
    const { dependencies } = await Fixtures.scanOf(NOWINANDROID)

    expect(dependencies.some(dependency => dependency.name.includes('projects'))).toBe(false)
    expect(Fixtures.depNamed(dependencies, 'org.robolectric:robolectric')?.isDev).toBe(true)
    expect(
      dependencies
        .filter(dependency => dependency.name === 'com.google.dagger:hilt-compiler')
        .map(dependency => dependency.isDev),
    ).toEqual([false, true])
  })

  test('Groovy strings: $var versions resolve from ext, a BOM-managed version stays empty', async () => {
    const { dependencies } = await Fixtures.scanOf(PETCLINIC)

    expect(Fixtures.depNamed(dependencies, 'org.webjars.npm:bootstrap')).toMatchObject({
      versionInUse: '5.3.8',
      isDev: false,
    })
    expect(
      Fixtures.depNamed(dependencies, 'org.springframework.boot:spring-boot-starter-cache'),
    ).toEqual({
      ecosystem: 'maven',
      name: 'org.springframework.boot:spring-boot-starter-cache',
      isDev: false,
      isRoot: true,
      manifestPath: 'build.gradle',
    })
    expect(Fixtures.depNamed(dependencies, 'com.puppycrawl.tools:checkstyle')).toMatchObject({
      versionInUse: '12.3.1',
      isDev: true,
    })
  })

  test('dev configurations are left out by default and followed with the toggle', async () => {
    const runtime = await Fixtures.detectedOf(PETCLINIC, { cap: 500 })
    const all = await Fixtures.detectedOf(PETCLINIC, { cap: 500, includeDev: true })
    const devtools = 'org.springframework.boot:spring-boot-devtools'

    expect(Fixtures.depNamed(runtime.project?.dependencies ?? [], devtools)).toBeUndefined()
    expect(Fixtures.depNamed(all.project?.dependencies ?? [], devtools)?.isDev).toBe(true)
  })

  test('a broken version catalog is skipped with a debug line; string coordinates still count', async () => {
    const { dependencies, logs } = await Fixtures.scanOf({
      ...NOWINANDROID,
      'gradle/libs.versions.toml': Maven.BROKEN_LIBS_VERSIONS_TOML,
      'build.gradle': Maven.PETCLINIC_BUILD_GRADLE,
    })

    expect(
      dependencies.some(dependency => dependency.manifestPath === 'app/build.gradle.kts'),
    ).toBe(false)
    expect(Fixtures.depNamed(dependencies, 'org.webjars.npm:bootstrap')?.versionInUse).toBe('5.3.8')
    expect(logs.some(line => /skipped gradle\/libs\.versions\.toml: TOML/.test(line))).toBe(true)
  })
})
