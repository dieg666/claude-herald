/**
 * vuejs/core pnpm-lock.yaml (v9, two documents), trimmed to the importers and catalog entries the tests read.
 */
export const VUE_PNPM_LOCK = `---
lockfileVersion: '9.0'

importers:

  .:
    configDependencies: {}
    packageManagerDependencies:
      pnpm:
        specifier: 12.4.2
        version: 12.4.2

packages:

  pnpm@12.4.2:
    resolution: {integrity: sha512-CK3GYTGAJ1x8ntraOdzwjJxhrU5+rzMKTzRh8QKw+QdCNFTRF/mOctR/7wYWBwZE17/8lzpqV/UJCm18NosHyQ==}
    engines: {node: '>=18.*'}
    hasBin: true

snapshots:

  pnpm@12.4.2:
    optionalDependencies:
      '@pnpm/exe.android-arm64': 12.4.2
      '@pnpm/exe.android-x64': 12.4.2
      '@pnpm/exe.darwin-arm64': 12.4.2
      '@pnpm/exe.darwin-x64': 12.4.2
      '@pnpm/exe.freebsd-x64': 12.4.2
      '@pnpm/exe.linux-arm64': 12.4.2
      '@pnpm/exe.linux-arm64-musl': 12.4.2
      '@pnpm/exe.linux-ppc64': 12.4.2
      '@pnpm/exe.linux-riscv64': 12.4.2
      '@pnpm/exe.linux-s390x': 12.4.2
      '@pnpm/exe.linux-x64': 12.4.2
      '@pnpm/exe.linux-x64-musl': 12.4.2
      '@pnpm/exe.win32-arm64': 12.4.2
      '@pnpm/exe.win32-x64': 12.4.2

---
lockfileVersion: '9.0'

settings:
  autoInstallPeers: true
  dedupePeers: true
  excludeLinksFromLockfile: false

catalogs:
  default:
    '@babel/parser':
      specifier: ^7.29.8
      version: 7.29.8
    '@babel/types':
      specifier: ^7.29.8
      version: 7.29.8
    estree-walker:
      specifier: ^2.0.2
      version: 2.0.2
    magic-string:
      specifier: ^0.30.21
      version: 0.30.21
    source-map-js:
      specifier: ^1.2.1
      version: 1.2.1
importers:

  .:
    devDependencies:
      '@babel/parser':
        specifier: 'catalog:'
        version: 7.29.8
      '@rollup/plugin-alias':
        specifier: ^6.0.0
        version: 6.0.0(rollup@4.63.3)
      '@vue/consolidate':
        specifier: 1.0.0
        version: 1.0.0
      typescript:
        specifier: ~6.0.3
        version: 6.0.3
      vitest:
        specifier: ^4.1.10
        version: 4.1.11(@types/node@24.13.5)(@vitest/browser-playwright@4.1.11)(@vitest/coverage-v8@4.1.11)(jsdom@30.0.1)(vite@8.3.0)

  packages/compiler-sfc:
    dependencies:
      '@babel/parser':
        specifier: 'catalog:'
        version: 7.29.8
      '@vue/compiler-core':
        specifier: workspace:*
        version: link:../compiler-core
      '@vue/compiler-dom':
        specifier: workspace:*
        version: link:../compiler-dom
      '@vue/compiler-ssr':
        specifier: workspace:*
        version: link:../compiler-ssr
      '@vue/shared':
        specifier: workspace:*
        version: link:../shared
      estree-walker:
        specifier: 'catalog:'
        version: 2.0.2
      magic-string:
        specifier: 'catalog:'
        version: 0.30.21
      postcss:
        specifier: ^8.5.28
        version: 8.5.28
      source-map-js:
        specifier: 'catalog:'
        version: 1.2.1
    devDependencies:
      '@babel/types':
        specifier: 'catalog:'
        version: 7.29.8
      '@vue/consolidate':
        specifier: ^1.0.0
        version: 1.0.0
      hash-sum:
        specifier: ^2.0.0
        version: 2.0.0
      lru-cache:
        specifier: 10.1.0
        version: 10.1.0
      merge-source-map:
        specifier: ^1.1.0
        version: 1.1.0
      minimatch:
        specifier: ~10.2.6
        version: 10.2.6
      postcss-modules:
        specifier: ^6.0.1
        version: 6.0.1(postcss@8.5.28)
      postcss-selector-parser:
        specifier: ^7.1.6
        version: 7.1.6
      pug:
        specifier: ^3.0.4
        version: 3.0.4
      sass:
        specifier: ^1.104.1
        version: 1.104.1

  packages/runtime-core:
    dependencies:
      '@vue/reactivity':
        specifier: workspace:*
        version: link:../reactivity
      '@vue/shared':
        specifier: workspace:*
        version: link:../shared

packages:

  estree-walker@2.0.2:
    resolution: {integrity: sha512-Rfkk/Mp/DL7JVje3u18FxFujQlTNR2q6QfMSMB7AvCBx91NGj/ba3kCfza0f6dVDbw7YlRf/nDrn7pQrCCyQ/w==}

  postcss@8.5.28:
    resolution: {integrity: sha512-RRuzqDtt5Y9h3quz5hWhK+TPnsmVs6WwSU6LkJMeY4HstUEDuYTG8UJSdawMRzmzAtV+KEoG8N3Qg2qLy5vM/A==}
    engines: {node: ^10 || ^12 || >=14}

snapshots:

  estree-walker@2.0.2: {}

  postcss@8.5.28:
    dependencies:
      nanoid: 3.3.19
      picocolors: 1.1.1
      source-map-js: 1.2.1
`
