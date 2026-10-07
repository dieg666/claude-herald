/**
 * koel/koel composer.lock, trimmed to the packages the tests read.
 */
export const KOEL_COMPOSER_LOCK = `{
    "_readme": [
        "This file locks the dependencies of your project to a known state",
        "Read more about it at https://getcomposer.org/doc/01-basic-usage.md#installing-dependencies",
        "This file is @generated automatically"
    ],
    "content-hash": "1b54c3050f19527b586ca2291adbad70",
    "packages": [
        {
            "name": "aws/aws-crt-php",
            "version": "v1.2.7",
            "source": {
                "type": "git",
                "url": "https://github.com/awslabs/aws-crt-php.git",
                "reference": "d71d9906c7bb63a28295447ba12e74723bd3730e"
            },
            "dist": {
                "type": "zip",
                "url": "https://api.github.com/repos/awslabs/aws-crt-php/zipball/d71d9906c7bb63a28295447ba12e74723bd3730e",
                "reference": "d71d9906c7bb63a28295447ba12e74723bd3730e",
                "shasum": ""
            },
            "require": {
                "php": ">=5.5"
            },
            "type": "library",
            "license": [
                "Apache-2.0"
            ]
        },
        {
            "name": "guzzlehttp/guzzle",
            "version": "7.15.5",
            "source": {
                "type": "git",
                "url": "https://github.com/guzzle/guzzle.git",
                "reference": "ee80339fd9177ba44c49cdb653ff02a4d1106b9a"
            },
            "dist": {
                "type": "zip",
                "url": "https://api.github.com/repos/guzzle/guzzle/zipball/ee80339fd9177ba44c49cdb653ff02a4d1106b9a",
                "reference": "ee80339fd9177ba44c49cdb653ff02a4d1106b9a",
                "shasum": ""
            },
            "require": {
                "ext-json": "*",
                "guzzlehttp/promises": "^2.5.3",
                "guzzlehttp/psr7": "^2.13.1",
                "php": "^7.2.5 || ^8.0",
                "psr/http-client": "^1.0",
                "symfony/deprecation-contracts": "^2.5 || ^3.0",
                "symfony/polyfill-php80": "^1.25"
            },
            "type": "library",
            "license": [
                "MIT"
            ]
        },
        {
            "name": "laravel/framework",
            "version": "v13.30.0",
            "source": {
                "type": "git",
                "url": "https://github.com/laravel/framework.git",
                "reference": "9c008e7c9a64a8ea6d6e4f1683bd569acc10bf9e"
            },
            "dist": {
                "type": "zip",
                "url": "https://api.github.com/repos/laravel/framework/zipball/9c008e7c9a64a8ea6d6e4f1683bd569acc10bf9e",
                "reference": "9c008e7c9a64a8ea6d6e4f1683bd569acc10bf9e",
                "shasum": ""
            },
            "require": {
                "brick/math": "^0.14.2 || ^0.15 || ^0.16 || ^0.17 || ^0.18 || ^0.19",
                "composer-runtime-api": "^2.2",
                "doctrine/inflector": "^2.0.5",
                "dragonmantank/cron-expression": "^3.4",
                "egulias/email-validator": "^4.0",
                "ext-ctype": "*",
                "ext-filter": "*",
                "ext-hash": "*",
                "ext-mbstring": "*",
                "ext-openssl": "*",
                "ext-session": "*",
                "ext-tokenizer": "*",
                "fruitcake/php-cors": "^1.3",
                "guzzlehttp/guzzle": "^7.8.2 || ^8.0",
                "guzzlehttp/promises": "^2.0.3 || ^3.0",
                "guzzlehttp/psr7": "^2.9 || ^3.0",
                "guzzlehttp/uri-template": "^1.0 || ^2.0",
                "laravel/prompts": "^0.3.11",
                "laravel/serializable-closure": "^2.0.10",
                "league/commonmark": "^2.8.1",
                "league/flysystem": "^3.25.1",
                "league/flysystem-local": "^3.25.1",
                "league/uri": "^7.5.1",
                "monolog/monolog": "^3.10",
                "nesbot/carbon": "^3.8.4",
                "nunomaduro/termwind": "^2.0",
                "php": "^8.3",
                "psr/container": "^1.1.1 || ^2.0.1",
                "psr/http-message": "^1.0 || ^2.0",
                "psr/log": "^1.0 || ^2.0 || ^3.0",
                "psr/simple-cache": "^1.0 || ^2.0 || ^3.0",
                "ramsey/uuid": "^4.7",
                "symfony/console": "^7.4.0 || ^8.0.0",
                "symfony/error-handler": "^7.4.0 || ^8.0.0",
                "symfony/finder": "^7.4.0 || ^8.0.0",
                "symfony/http-foundation": "^7.4.0 || ^8.0.0",
                "symfony/http-kernel": "^7.4.0 || ^8.0.0",
                "symfony/mailer": "^7.4.0 || ^8.0.0",
                "symfony/mime": "^7.4.0 || ^8.0.0",
                "symfony/polyfill-php84": "^1.36",
                "symfony/polyfill-php85": "^1.36",
                "symfony/polyfill-php86": "^1.36",
                "symfony/process": "^7.4.5 || ^8.0.5",
                "symfony/routing": "^7.4.0 || ^8.0.0",
                "symfony/uid": "^7.4.0 || ^8.0.0",
                "symfony/var-dumper": "^7.4.0 || ^8.0.0",
                "tijsverkoyen/css-to-inline-styles": "^2.2.5",
                "vlucas/phpdotenv": "^5.6.1",
                "voku/portable-ascii": "^2.0.2"
            },
            "type": "library",
            "license": [
                "MIT"
            ]
        },
        {
            "name": "nunomaduro/collision",
            "version": "v8.9.4",
            "source": {
                "type": "git",
                "url": "https://github.com/nunomaduro/collision.git",
                "reference": "716af8f95a470e9094cfca09ed897b023be191a5"
            },
            "dist": {
                "type": "zip",
                "url": "https://api.github.com/repos/nunomaduro/collision/zipball/716af8f95a470e9094cfca09ed897b023be191a5",
                "reference": "716af8f95a470e9094cfca09ed897b023be191a5",
                "shasum": ""
            },
            "require": {
                "filp/whoops": "^2.18.4",
                "nunomaduro/termwind": "^2.4.0",
                "php": "^8.2.0",
                "symfony/console": "^7.4.8 || ^8.0.8"
            },
            "type": "library",
            "license": [
                "MIT"
            ]
        },
        {
            "name": "predis/predis",
            "version": "v1.1.10",
            "source": {
                "type": "git",
                "url": "https://github.com/predis/predis.git",
                "reference": "a2fb02d738bedadcffdbb07efa3a5e7bd57f8d6e"
            },
            "dist": {
                "type": "zip",
                "url": "https://api.github.com/repos/predis/predis/zipball/a2fb02d738bedadcffdbb07efa3a5e7bd57f8d6e",
                "reference": "a2fb02d738bedadcffdbb07efa3a5e7bd57f8d6e",
                "shasum": ""
            },
            "require": {
                "php": ">=5.3.9"
            },
            "type": "library",
            "license": [
                "MIT"
            ]
        }
    ],
    "packages-dev": [
        {
            "name": "mockery/mockery",
            "version": "1.6.12",
            "source": {
                "type": "git",
                "url": "https://github.com/mockery/mockery.git",
                "reference": "1f4efdd7d3beafe9807b08156dfcb176d18f1699"
            },
            "dist": {
                "type": "zip",
                "url": "https://api.github.com/repos/mockery/mockery/zipball/1f4efdd7d3beafe9807b08156dfcb176d18f1699",
                "reference": "1f4efdd7d3beafe9807b08156dfcb176d18f1699",
                "shasum": ""
            },
            "require": {
                "hamcrest/hamcrest-php": "^2.0.1",
                "lib-pcre": ">=7.0",
                "php": ">=7.3"
            },
            "type": "library",
            "license": [
                "BSD-3-Clause"
            ]
        },
        {
            "name": "phpunit/phpunit",
            "version": "11.5.55",
            "source": {
                "type": "git",
                "url": "https://github.com/sebastianbergmann/phpunit.git",
                "reference": "adc7262fccc12de2b30f12a8aa0b33775d814f00"
            },
            "dist": {
                "type": "zip",
                "url": "https://api.github.com/repos/sebastianbergmann/phpunit/zipball/adc7262fccc12de2b30f12a8aa0b33775d814f00",
                "reference": "adc7262fccc12de2b30f12a8aa0b33775d814f00",
                "shasum": ""
            },
            "require": {
                "ext-dom": "*",
                "ext-json": "*",
                "ext-libxml": "*",
                "ext-mbstring": "*",
                "ext-xml": "*",
                "ext-xmlwriter": "*",
                "myclabs/deep-copy": "^1.13.4",
                "phar-io/manifest": "^2.0.4",
                "phar-io/version": "^3.2.1",
                "php": ">=8.2",
                "phpunit/php-code-coverage": "^11.0.12",
                "phpunit/php-file-iterator": "^5.1.1",
                "phpunit/php-invoker": "^5.0.1",
                "phpunit/php-text-template": "^4.0.1",
                "phpunit/php-timer": "^7.0.1",
                "sebastian/cli-parser": "^3.0.2",
                "sebastian/code-unit": "^3.0.3",
                "sebastian/comparator": "^6.3.3",
                "sebastian/diff": "^6.0.2",
                "sebastian/environment": "^7.2.1",
                "sebastian/exporter": "^6.3.2",
                "sebastian/global-state": "^7.0.2",
                "sebastian/object-enumerator": "^6.0.1",
                "sebastian/recursion-context": "^6.0.3",
                "sebastian/type": "^5.1.3",
                "sebastian/version": "^5.0.2",
                "staabm/side-effects-detector": "^1.0.5"
            },
            "type": "library",
            "license": [
                "BSD-3-Clause"
            ]
        }
    ],
    "aliases": [],
    "minimum-stability": "stable",
    "stability-flags": {
        "roave/security-advisories": 20
    },
    "prefer-stable": false,
    "prefer-lowest": false,
    "platform": {
        "php": ">=8.3",
        "ext-exif": "*",
        "ext-gd": "*",
        "ext-fileinfo": "*",
        "ext-json": "*",
        "ext-simplexml": "*"
    },
    "platform-dev": {},
    "plugin-api-version": "2.9.0"
}
`
