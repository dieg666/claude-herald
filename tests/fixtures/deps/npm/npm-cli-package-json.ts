/**
 * npm/cli package.json (workspaces, dependencies trimmed).
 */
export const NPM_CLI_PACKAGE_JSON = `{
  "version": "12.2.0",
  "name": "npm",
  "workspaces": [
    "docs",
    "smoke-tests",
    "mock-globals",
    "mock-registry",
    "workspaces/*"
  ],
  "dependencies": {
    "@isaacs/string-locale-compare": "^1.1.0",
    "@npmcli/arborist": "^10.0.3",
    "semver": "^7.8.5",
    "abbrev": "^5.0.0"
  },
  "devDependencies": {
    "tap": "^16.3.9",
    "@npmcli/docs": "^1.0.0"
  }
}
`
