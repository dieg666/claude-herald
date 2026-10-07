/**
 * jestjs/jest package.json (devDependencies trimmed).
 */
export const JEST_PACKAGE_JSON = `{
  "name": "@jest/monorepo",
  "private": true,
  "workspaces": [
    "packages/*",
    "website",
    "examples/*"
  ],
  "devDependencies": {
    "@babel/core": "^7.27.4",
    "chalk": "^4.1.2",
    "typescript": "^5.8.3",
    "jest-junit": "^17.0.0",
    "@jest/globals": "workspace:*"
  },
  "packageManager": "yarn@4.18.0"
}
`
