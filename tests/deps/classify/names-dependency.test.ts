import { describe, expect, test } from 'claude-code/testing'

import Classify from '../../../hooks/deps/classify'
import type { Dependency } from '../../../types/index.js'

type Named = Pick<Dependency, 'ecosystem' | 'name'>

/** The package a tag names, the dependency, and whether it is that dependency. */
const CASES: readonly (readonly [string, Named, boolean])[] = [
  ['@scope/pkg', { ecosystem: 'npm', name: '@scope/pkg' }, true],
  ['@scope/other', { ecosystem: 'npm', name: '@scope/pkg' }, false],
  ['pkg', { ecosystem: 'npm', name: '@scope/pkg' }, true],
  ['tokio', { ecosystem: 'cargo', name: 'tokio' }, true],
  ['tokio-macros', { ecosystem: 'cargo', name: 'tokio' }, false],
  ['Pydantic_Core', { ecosystem: 'pypi', name: 'pydantic-core' }, true],
  [
    'jackson-databind',
    { ecosystem: 'maven', name: 'com.fasterxml.jackson.core:jackson-databind' },
    true,
  ],
  [
    'jackson-core',
    { ecosystem: 'maven', name: 'com.fasterxml.jackson.core:jackson-databind' },
    false,
  ],
  ['service/s3', { ecosystem: 'go', name: 'github.com/aws/aws-sdk-go-v2/service/s3' }, true],
  ['service/sqs', { ecosystem: 'go', name: 'github.com/aws/aws-sdk-go-v2/service/s3' }, false],
  ['sdk', { ecosystem: 'go', name: 'go.opentelemetry.io/otel/sdk' }, true],
  ['sdk', { ecosystem: 'go', name: 'go.opentelemetry.io/otel' }, false],
  ['sdk/v2', { ecosystem: 'go', name: 'example.com/mono/sdk/v2' }, true],
  ['go', { ecosystem: 'go', name: 'github.com/acme/client' }, true],
  ['go', { ecosystem: 'npm', name: 'acme-client' }, false],
  ['python', { ecosystem: 'pypi', name: 'acme-client' }, true],
  ['constructor', { ecosystem: 'npm', name: 'acme' }, false],
]

describe('names-dependency', () => {
  test('a tagged package matches by name, last part, Go subdirectory or ecosystem', () => {
    for (const [tagged, dependency, isSame] of CASES) {
      expect(Classify.namesDependency(tagged, dependency), `${tagged} vs ${dependency.name}`).toBe(
        isSame,
      )
    }
  })
})
