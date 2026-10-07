/**
 * koel/koel composer.lock cut off after its first lines: not JSON.
 */
export const BROKEN_COMPOSER_LOCK = `{
    "_readme": [
        "This file locks the dependencies of your project to a known state",
        "Read more about it at https://getcomposer.org/doc/01-basic-usage.md#installing-dependencies",
        "This file is @generated automatically"
    ],
    "content-hash": "1b54c3050f19527b586ca2291adbad70",
    "packages": [
        {
            "name": "algolia/algoliasearch-client-php",
            "version": "3.4.2",
            "source": {
                "type": "git",
                "url": "https://github.com/algolia/algoliasearch-client-php.git",
                "reference": "7505959`
