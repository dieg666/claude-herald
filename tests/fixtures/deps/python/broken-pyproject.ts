/**
 * Textualize/textual pyproject.toml cut off mid-file: not TOML.
 */
export const BROKEN_PYPROJECT = `[tool.poetry]
name = "textual"
version = "8.2.8"
homepage = "https://github.com/Textualize/textual"
repository = "https://github.com/Textualize/textual"
documentation = "https://textual.textualize.io/"

description = "Modern Text User Interface framework"
license = "MIT"
readme = "README.md"
classifiers = [
    "Development Status :: 5 - Production/Stable",
    "Environment :: Console",
    "Intended Audience :: Developers",
    "Operating System :: Microsoft :: Windows :: Windows 10",
    "Operating System :: Microsoft :: Windows :: Windows 11",
    "Operating System :: MacOS",
    "Operating System :: POSIX :: Linux",
    "Programming Language :: Python :: 3.9",
    "Programming Language :: Python :: 3.10",
    "Programming Language :: Python :: 3.11",
    "Programming Language :: Python :: 3.12",
    "Programming Language :: Python :: 3.13",
    "Programming Language :: Python :: 3.14",
    "Typing :: Typed",
]
include = [
    "src/textual/py.typed",
    { path = "docs/examples", format = "sdist" },
    { path = "tests", format = "sdist" },
    # The reason for the slightly convoluted path specification here is that
    # poetry populates the exclude list with the content of .gitignore, and
    # it also seems like exclude trumps include. So here we specify that we
    # want to package up the content of the docs-offline directory in a way
    # that works around that.
    { path = "docs-offline/**/*", format = "sdist" },
]
exclude = ["tests/snapshot_tests/__snapshots__"]

[tool.poetry.urls]
"Bug Tracker" = "https://github.com/Textualize/textual/issues"

[tool.ruff]
target-version = "py39"

[tool.poetry.dependencies]
python = "^3.9"
markdown-it-py = `
