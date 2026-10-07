/**
 * npm/cli package-lock.json (v3), trimmed to the entries the tests read.
 */
export const NPM_CLI_PACKAGE_LOCK = `{
  "name": "npm",
  "version": "12.2.0",
  "lockfileVersion": 3,
  "requires": true,
  "packages": {
    "": {
      "name": "npm",
      "version": "12.2.0",
      "license": "Artistic-2.0",
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
    },
    "docs": {
      "name": "@npmcli/docs",
      "version": "1.0.0",
      "license": "ISC",
      "devDependencies": {
        "jsdom": "27.0.0",
        "semver": "^7.3.8",
        "yaml": "^2.2.1"
      },
      "engines": {
        "node": "^22.22.2 || ^24.15.0 || >=26.0.0"
      }
    },
    "docs/node_modules/jsdom": {
      "version": "27.0.0",
      "resolved": "https://registry.npmjs.org/jsdom/-/jsdom-27.0.0.tgz",
      "integrity": "sha512-lIHeR1qlIRrIN5VMccd8tI2Sgw6ieYXSVktcSHaNe3Z5nE/tcPQYQWOq00wxMvYOsz+73eAkNenVvmPC6bba9A==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@asamuzakjp/dom-selector": "^6.5.4",
        "cssstyle": "^5.3.0",
        "data-urls": "^6.0.0",
        "decimal.js": "^10.5.0",
        "html-encoding-sniffer": "^4.0.0",
        "http-proxy-agent": "^7.0.2",
        "https-proxy-agent": "^7.0.6",
        "is-potential-custom-element-name": "^1.0.1",
        "parse5": "^7.3.0",
        "rrweb-cssom": "^0.8.0",
        "saxes": "^6.0.0",
        "symbol-tree": "^3.2.4",
        "tough-cookie": "^6.0.0",
        "w3c-xmlserializer": "^5.0.0",
        "webidl-conversions": "^8.0.0",
        "whatwg-encoding": "^3.1.1",
        "whatwg-mimetype": "^4.0.0",
        "whatwg-url": "^15.0.0",
        "ws": "^8.18.2",
        "xml-name-validator": "^5.0.0"
      },
      "engines": {
        "node": ">=20"
      },
      "peerDependencies": {
        "canvas": "^3.0.0"
      },
      "peerDependenciesMeta": {
        "canvas": {
          "optional": true
        }
      }
    },
    "node_modules/@npmcli/arborist": {
      "resolved": "workspaces/arborist",
      "link": true
    },
    "node_modules/@npmcli/fs": {
      "version": "6.0.0",
      "resolved": "https://registry.npmjs.org/@npmcli/fs/-/fs-6.0.0.tgz",
      "integrity": "sha512-AheOs4swKka/XLtht6xxJDPezlQ7K2IYQ9Y8lST4JLDjnralnWuMM9AE2CdVcgQJ5omrXhsRzM7F7aYmeZBvKQ==",
      "inBundle": true,
      "license": "ISC",
      "dependencies": {
        "semver": "^7.3.5"
      },
      "engines": {
        "node": "^22.22.2 || ^24.15.0 || >=26.0.0"
      }
    },
    "node_modules/abbrev": {
      "version": "5.0.0",
      "resolved": "https://registry.npmjs.org/abbrev/-/abbrev-5.0.0.tgz",
      "integrity": "sha512-/XrFJgzQQQHpti1raDJC6m4ws6aNktmjBlhk8Fdlk7LwCEuDoieEJJY9OFHjfiFJFFRM2tK+Ky/IsfbbmlMu1w==",
      "inBundle": true,
      "license": "ISC",
      "engines": {
        "node": "^22.22.2 || ^24.15.0 || >=26.0.0"
      }
    },
    "node_modules/lru-cache": {
      "version": "11.5.2",
      "resolved": "https://registry.npmjs.org/lru-cache/-/lru-cache-11.5.2.tgz",
      "integrity": "sha512-4pfM1Ff0x50o0tQwb5ucw/RzNyD0/YJME6IVcStalZuMWxdt3sR3huStTtxz4PUmvZfRguvDejasvQ2kifR11g==",
      "inBundle": true,
      "license": "BlueOak-1.0.0",
      "engines": {
        "node": "20 || >=22"
      }
    },
    "node_modules/pacote": {
      "version": "22.0.0",
      "resolved": "https://registry.npmjs.org/pacote/-/pacote-22.0.0.tgz",
      "integrity": "sha512-++VqeOZeL03uGM2MFLk96jGCSt1owBGkyFKoPr+trwNlZhCpjN2RrvwYxt8nTbs1wNMqSFYurq0TafVWkAIHig==",
      "inBundle": true,
      "license": "ISC",
      "dependencies": {
        "@gar/promise-retry": "^1.0.0",
        "@npmcli/git": "^8.0.0",
        "@npmcli/installed-package-contents": "^5.0.0",
        "@npmcli/package-json": "^8.0.0",
        "@npmcli/promise-spawn": "^10.0.0",
        "@npmcli/run-script": "^11.0.0",
        "cacache": "^21.0.1",
        "fs-minipass": "^3.0.0",
        "minipass": "^7.0.2",
        "npm-package-arg": "^14.0.0",
        "npm-packlist": "^11.2.0",
        "npm-pick-manifest": "^12.0.0",
        "npm-registry-fetch": "^20.0.1",
        "proc-log": "^7.0.0",
        "sigstore": "^5.0.0",
        "ssri": "^14.0.0",
        "tar": "^7.4.3"
      },
      "bin": {
        "pacote": "bin/index.js"
      },
      "engines": {
        "node": "^22.22.2 || ^24.15.0 || >=26.0.0"
      }
    },
    "node_modules/semver": {
      "version": "7.8.5",
      "resolved": "https://registry.npmjs.org/semver/-/semver-7.8.5.tgz",
      "integrity": "sha512-Y7/KDsb8LjooZpwaqGyulO6DQlksgCncchHGk+sZIY4SBvUocMBEFH5Ur1fI4dV+Jvl0w6cjvucaIi40puRioA==",
      "inBundle": true,
      "license": "ISC",
      "bin": {
        "semver": "bin/semver.js"
      },
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/tap": {
      "version": "16.3.10",
      "bundleDependencies": [
        "ink",
        "treport",
        "@types/react",
        "@isaacs/import-jsx",
        "react"
      ],
      "dev": true,
      "license": "ISC",
      "dependencies": {
        "@isaacs/import-jsx": "^4.0.1",
        "@types/react": "^17.0.52",
        "chokidar": "^3.3.0",
        "findit": "^2.0.0",
        "foreground-child": "^2.0.0",
        "fs-exists-cached": "^1.0.0",
        "glob": "^7.2.3",
        "ink": "^3.2.0",
        "isexe": "^2.0.0",
        "istanbul-lib-processinfo": "^2.0.3",
        "jackspeak": "^1.4.2",
        "libtap": "^1.4.0",
        "minipass": "^3.3.4",
        "mkdirp": "^1.0.4",
        "nyc": "^15.1.0",
        "opener": "^1.5.1",
        "react": "^17.0.2",
        "rimraf": "^3.0.0",
        "signal-exit": "^3.0.6",
        "source-map-support": "^0.5.16",
        "tap-mocha-reporter": "^5.0.3",
        "tap-parser": "^11.0.2",
        "tap-yaml": "^1.0.2",
        "tcompare": "^5.0.7",
        "treport": "^3.0.4",
        "which": "^2.0.2"
      },
      "bin": {
        "tap": "bin/run.js"
      },
      "engines": {
        "node": ">=12"
      },
      "funding": {
        "url": "https://github.com/sponsors/isaacs"
      },
      "peerDependencies": {
        "coveralls": "^3.1.1",
        "flow-remove-types": ">=2.112.0",
        "ts-node": ">=8.5.2",
        "typescript": ">=3.7.2"
      },
      "peerDependenciesMeta": {
        "coveralls": {
          "optional": true
        },
        "flow-remove-types": {
          "optional": true
        },
        "ts-node": {
          "optional": true
        },
        "typescript": {
          "optional": true
        }
      }
    },
    "node_modules/yaml": {
      "version": "2.9.0",
      "resolved": "https://registry.npmjs.org/yaml/-/yaml-2.9.0.tgz",
      "integrity": "sha512-2AvhNX3mb8zd6Zy7INTtSpl1F15HW6Wnqj0srWlkKLcpYl/gMIMJiyuGq2KeI2YFxUPjdlB+3Lc10seMLtL4cA==",
      "dev": true,
      "license": "ISC",
      "bin": {
        "yaml": "bin.mjs"
      },
      "engines": {
        "node": ">= 14.6"
      },
      "funding": {
        "url": "https://github.com/sponsors/eemeli"
      }
    },
    "workspaces/arborist": {
      "name": "@npmcli/arborist",
      "version": "10.0.3",
      "license": "ISC",
      "dependencies": {
        "@npmcli/fs": "^6.0.0",
        "lru-cache": "^11.2.1",
        "semver": "^7.3.7",
        "pacote": "^22.0.0"
      },
      "devDependencies": {},
      "engines": {
        "node": "^22.22.2 || ^24.15.0 || >=26.0.0"
      }
    }
  }
}
`
