/**
 * pydantic/pydantic uv.lock, trimmed to the packages the tests read, two wheels each.
 */
export const PYDANTIC_UV_LOCK = `version = 1
revision = 3
requires-python = ">=3.10"
resolution-markers = [
    "python_full_version >= '3.15'",
    "python_full_version == '3.13.*' and implementation_name == 'cpython'",
    "(python_full_version >= '3.12' and python_full_version < '3.15' and implementation_name != 'cpython') or (python_full_version == '3.12.*' and implementation_name == 'cpython') or (python_full_version == '3.14.*' and implementation_name == 'cpython')",
    "python_full_version == '3.11.*'",
    "python_full_version < '3.11'",
]

[manifest]
members = [
    "pydantic",
    "pydantic-core",
]

[[package]]
name = "annotated-types"
version = "0.7.0"
source = { registry = "https://pypi.org/simple" }
sdist = { url = "https://files.pythonhosted.org/packages/ee/67/531ea369ba64dcff5ec9c3402f9f51bf748cec26dde048a2f973a4eea7f5/annotated_types-0.7.0.tar.gz", hash = "sha256:aff07c09a53a08bc8cfccb9c85b05f1aa9a2a6f23728d790723543408344ce89", size = 16081, upload-time = "2024-05-20T21:33:25.928Z" }
wheels = [
    { url = "https://files.pythonhosted.org/packages/78/b6/6307fbef88d9b5ee7421e68d78a9f162e0da4900bc5f5793f6d3d0e34fb8/annotated_types-0.7.0-py3-none-any.whl", hash = "sha256:1f02e8b43a8fbbc3f3e0d4f0f4bfc8131bcb4eebe8849b8e5c773f3a1c582a53", size = 13643, upload-time = "2024-05-20T21:33:24.1Z" },
]

[[package]]
name = "coverage"
version = "7.13.5"
source = { registry = "https://pypi.org/simple" }
sdist = { url = "https://files.pythonhosted.org/packages/9d/e0/70553e3000e345daff267cec284ce4cbf3fc141b6da229ac52775b5428f1/coverage-7.13.5.tar.gz", hash = "sha256:c81f6515c4c40141f83f502b07bbfa5c240ba25bbe73da7b33f1e5b6120ff179", size = 915967, upload-time = "2026-03-17T10:33:18.341Z" }
wheels = [
    { url = "https://files.pythonhosted.org/packages/69/33/e8c48488c29a73fd089f9d71f9653c1be7478f2ad6b5bc870db11a55d23d/coverage-7.13.5-cp310-cp310-macosx_10_9_x86_64.whl", hash = "sha256:e0723d2c96324561b9aa76fb982406e11d93cdb388a7a7da2b16e04719cf7ca5", size = 219255, upload-time = "2026-03-17T10:29:51.081Z" },
    { url = "https://files.pythonhosted.org/packages/da/bd/b0ebe9f677d7f4b74a3e115eec7ddd4bcf892074963a00d91e8b164a6386/coverage-7.13.5-cp310-cp310-macosx_11_0_arm64.whl", hash = "sha256:52f444e86475992506b32d4e5ca55c24fc88d73bcbda0e9745095b28ef4dc0cf", size = 219772, upload-time = "2026-03-17T10:29:52.867Z" },
]

[package.optional-dependencies]
toml = [
    { name = "tomli", marker = "python_full_version <= '3.11'" },
]

[[package]]
name = "email-validator"
version = "2.2.0"
source = { registry = "https://pypi.org/simple" }
dependencies = [
    { name = "dnspython" },
    { name = "idna" },
]
sdist = { url = "https://files.pythonhosted.org/packages/48/ce/13508a1ec3f8bb981ae4ca79ea40384becc868bfae97fd1c942bb3a001b1/email_validator-2.2.0.tar.gz", hash = "sha256:cb690f344c617a714f22e66ae771445a1ceb46821152df8e165c5f9a364582b7", size = 48967, upload-time = "2024-06-20T11:30:30.034Z" }
wheels = [
    { url = "https://files.pythonhosted.org/packages/d7/ee/bf0adb559ad3c786f12bcbc9296b3f5675f529199bef03e2df281fa1fadb/email_validator-2.2.0-py3-none-any.whl", hash = "sha256:561977c2d73ce3611850a06fa56b414621e0c8faa9d66f2611407d87465da631", size = 33521, upload-time = "2024-06-20T11:30:28.248Z" },
]

[[package]]
name = "pydantic"
source = { editable = "." }
dependencies = [
    { name = "annotated-types" },
    { name = "pydantic-core" },
    { name = "typing-extensions" },
    { name = "typing-inspection" },
]

[package.optional-dependencies]
email = [
    { name = "email-validator" },
]
timezone = [
    { name = "tzdata", marker = "sys_platform == 'win32'" },
]

[package.dev-dependencies]
all = [
    { name = "ansi2html" },
    { name = "autoflake" },
    { name = "build" },
    { name = "cloudpickle" },
    { name = "coverage", extra = ["toml"] },
    { name = "devtools" },
    { name = "dirty-equals" },
    { name = "faker" },
    { name = "jsonschema" },
    { name = "memray", marker = "python_full_version < '3.15' and platform_python_implementation == 'CPython' and sys_platform != 'win32'" },
    { name = "mike" },
    { name = "mkdocs" },
    { name = "mkdocs-exclude" },
    { name = "mkdocs-llmstxt" },
    { name = "mkdocs-material" },
    { name = "mkdocs-redirects" },
    { name = "mkdocstrings-python" },
    { name = "mypy" },
    { name = "packaging" },
    { name = "pydantic-docs" },
    { name = "pydantic-extra-types" },
    { name = "pydantic-settings" },
    { name = "pyodide-build", version = "0.19.1", source = { registry = "https://pypi.org/simple" }, marker = "python_full_version < '3.12'" },
    { name = "pyodide-build", version = "0.39.0", source = { registry = "https://pypi.org/simple" }, marker = "python_full_version >= '3.12'" },
    { name = "pyrefly" },
    { name = "pyright" },
    { name = "pytest" },
    { name = "pytest-benchmark" },
    { name = "pytest-codspeed" },
    { name = "pytest-examples" },
    { name = "pytest-memray", marker = "python_full_version < '3.15' and platform_python_implementation == 'CPython' and sys_platform != 'win32'" },
    { name = "pytest-mock" },
    { name = "pytest-pretty" },
    { name = "pytest-run-parallel" },
    { name = "pytz" },
    { name = "pyupgrade" },
    { name = "requests" },
    { name = "ruff" },
    { name = "sqlalchemy" },
    { name = "time-machine", marker = "platform_python_implementation != 'PyPy'" },
    { name = "tomli" },
    { name = "twine" },
]
build = [
    { name = "build" },
    { name = "twine" },
]
coverage = [
    { name = "coverage", extra = ["toml"] },
]
dev = [
    { name = "coverage", extra = ["toml"] },
    { name = "dirty-equals" },
    { name = "faker" },
    { name = "jsonschema" },
    { name = "packaging" },
    { name = "pytest" },
    { name = "pytest-benchmark" },
    { name = "pytest-codspeed" },
    { name = "pytest-examples" },
    { name = "pytest-mock" },
    { name = "pytest-pretty" },
    { name = "pytest-run-parallel" },
    { name = "pytz" },
    { name = "time-machine", marker = "platform_python_implementation != 'PyPy'" },
]
docs = [
    { name = "autoflake" },
    { name = "build" },
    { name = "mike" },
    { name = "mkdocs" },
    { name = "mkdocs-exclude" },
    { name = "mkdocs-llmstxt" },
    { name = "mkdocs-material" },
    { name = "mkdocs-redirects" },
    { name = "mkdocstrings-python" },
    { name = "pydantic-docs" },
    { name = "pydantic-extra-types" },
    { name = "pydantic-settings" },
    { name = "pyupgrade" },
    { name = "requests" },
    { name = "tomli" },
]
docs-upload = [
    { name = "algoliasearch" },
    { name = "beautifulsoup4" },
]
linting = [
    { name = "pyright" },
    { name = "ruff" },
]
pyodide-build = [
    { name = "pyodide-build", version = "0.19.1", source = { registry = "https://pypi.org/simple" }, marker = "python_full_version < '3.12'" },
    { name = "pyodide-build", version = "0.39.0", source = { registry = "https://pypi.org/simple" }, marker = "python_full_version >= '3.12'" },
]
testing-extra = [
    { name = "ansi2html" },
    { name = "cloudpickle" },
    { name = "devtools" },
    { name = "memray", marker = "python_full_version < '3.15' and platform_python_implementation == 'CPython' and sys_platform != 'win32'" },
    { name = "pytest-memray", marker = "python_full_version < '3.15' and platform_python_implementation == 'CPython' and sys_platform != 'win32'" },
    { name = "sqlalchemy" },
]
tweet = [
    { name = "tweepy" },
]
typechecking = [
    { name = "mypy" },
    { name = "pydantic-settings" },
    { name = "pyrefly" },
    { name = "pyright" },
]

[package.metadata]
requires-dist = [
    { name = "annotated-types", specifier = ">=0.6.0" },
    { name = "email-validator", marker = "extra == 'email'", specifier = ">=2.0.0" },
    { name = "pydantic-core", editable = "pydantic-core" },
    { name = "typing-extensions", specifier = ">=4.16.0" },
    { name = "typing-inspection", specifier = ">=0.4.4" },
    { name = "tzdata", marker = "sys_platform == 'win32' and extra == 'timezone'" },
]
provides-extras = ["email", "timezone"]

[package.metadata.requires-dev]
all = [
    { name = "ansi2html" },
    { name = "autoflake" },
    { name = "build" },
    { name = "build", specifier = ">=1.3.0" },
    { name = "cloudpickle" },
    { name = "coverage", extras = ["toml"] },
    { name = "devtools" },
    { name = "dirty-equals" },
    { name = "faker" },
    { name = "jsonschema" },
    { name = "memray", marker = "python_full_version < '3.15' and platform_python_implementation == 'CPython' and sys_platform != 'win32'" },
    { name = "mike" },
    { name = "mkdocs" },
    { name = "mkdocs-exclude" },
    { name = "mkdocs-llmstxt" },
    { name = "mkdocs-material" },
    { name = "mkdocs-redirects" },
    { name = "mkdocstrings-python" },
    { name = "mypy" },
    { name = "packaging" },
    { name = "pydantic-docs", git = "https://github.com/pydantic/pydantic-docs" },
    { name = "pydantic-extra-types", specifier = ">=2.10.6" },
    { name = "pydantic-settings" },
    { name = "pyodide-build" },
    { name = "pyrefly" },
    { name = "pyright" },
    { name = "pytest" },
    { name = "pytest-benchmark" },
    { name = "pytest-codspeed" },
    { name = "pytest-examples" },
    { name = "pytest-memray", marker = "python_full_version < '3.15' and platform_python_implementation == 'CPython' and sys_platform != 'win32'" },
    { name = "pytest-mock" },
    { name = "pytest-pretty" },
    { name = "pytest-run-parallel", specifier = ">=0.3.1" },
    { name = "pytz" },
    { name = "pyupgrade" },
    { name = "requests" },
    { name = "ruff" },
    { name = "sqlalchemy" },
    { name = "time-machine", marker = "platform_python_implementation != 'PyPy'" },
    { name = "tomli" },
    { name = "twine" },
]
build = [
    { name = "build" },
    { name = "twine" },
]
coverage = [{ name = "coverage", extras = ["toml"] }]
dev = [
    { name = "coverage", extras = ["toml"] },
    { name = "dirty-equals" },
    { name = "faker" },
    { name = "jsonschema" },
    { name = "packaging" },
    { name = "pytest" },
    { name = "pytest-benchmark" },
    { name = "pytest-codspeed" },
    { name = "pytest-examples" },
    { name = "pytest-mock" },
    { name = "pytest-pretty" },
    { name = "pytest-run-parallel", specifier = ">=0.3.1" },
    { name = "pytz" },
    { name = "time-machine", marker = "platform_python_implementation != 'PyPy'" },
]
docs = [
    { name = "autoflake" },
    { name = "build", specifier = ">=1.3.0" },
    { name = "mike" },
    { name = "mkdocs" },
    { name = "mkdocs-exclude" },
    { name = "mkdocs-llmstxt" },
    { name = "mkdocs-material" },
    { name = "mkdocs-redirects" },
    { name = "mkdocstrings-python" },
    { name = "pydantic-docs", git = "https://github.com/pydantic/pydantic-docs" },
    { name = "pydantic-extra-types", specifier = ">=2.10.6" },
    { name = "pydantic-settings" },
    { name = "pyupgrade" },
    { name = "requests" },
    { name = "tomli" },
]
docs-upload = [
    { name = "algoliasearch", specifier = ">=4.12.0" },
    { name = "beautifulsoup4", specifier = ">=4.13.3" },
]
linting = [
    { name = "pyright" },
    { name = "ruff" },
]
pyodide-build = [{ name = "pyodide-build" }]
testing-extra = [
    { name = "ansi2html" },
    { name = "cloudpickle" },
    { name = "devtools" },
    { name = "memray", marker = "python_full_version < '3.15' and platform_python_implementation == 'CPython' and sys_platform != 'win32'" },
    { name = "pytest-memray", marker = "python_full_version < '3.15' and platform_python_implementation == 'CPython' and sys_platform != 'win32'" },
    { name = "sqlalchemy" },
]
tweet = [{ name = "tweepy" }]
typechecking = [
    { name = "mypy" },
    { name = "pydantic-settings" },
    { name = "pyrefly" },
    { name = "pyright" },
]

[[package]]
name = "pydantic-core"
source = { editable = "pydantic-core" }
dependencies = [
    { name = "typing-extensions" },
]

[package.dev-dependencies]
codspeed = [
    { name = "pytest-codspeed", marker = "python_full_version == '3.13.*' and implementation_name == 'cpython'" },
]
dev = [
    { name = "maturin" },
]
linting = [
    { name = "griffe" },
    { name = "maturin" },
    { name = "mypy" },
    { name = "pre-commit" },
    { name = "pyright" },
    { name = "ruff" },
]
testing-extra = [
    { name = "coverage" },
    { name = "dirty-equals" },
    { name = "exceptiongroup", marker = "python_full_version < '3.11'" },
    { name = "hypothesis" },
    { name = "inline-snapshot" },
    { name = "maturin" },
    { name = "numpy", version = "2.2.6", source = { registry = "https://pypi.org/simple" }, marker = "python_full_version < '3.11' and implementation_name == 'cpython' and platform_machine == 'x86_64'" },
    { name = "numpy", version = "2.3.4", source = { registry = "https://pypi.org/simple" }, marker = "python_full_version >= '3.11' and python_full_version < '3.13' and implementation_name == 'cpython' and platform_machine == 'x86_64'" },
    { name = "pandas", marker = "python_full_version < '3.13' and implementation_name == 'cpython' and platform_machine == 'x86_64'" },
    { name = "pytest" },
    { name = "pytest-benchmark" },
    { name = "pytest-examples", marker = "implementation_name == 'cpython' and platform_machine == 'x86_64'" },
    { name = "pytest-mock" },
    { name = "pytest-pretty" },
    { name = "pytest-run-parallel" },
    { name = "pytest-timeout" },
    { name = "python-dateutil" },
    { name = "typing-inspection" },
    { name = "tzdata" },
]
wasm = [
    { name = "maturin" },
    { name = "ruff" },
]

[package.metadata]
requires-dist = [{ name = "typing-extensions", specifier = ">=4.16.0" }]

[package.metadata.requires-dev]
codspeed = [{ name = "pytest-codspeed", marker = "python_full_version == '3.13.*' and implementation_name == 'cpython'" }]
dev = [{ name = "maturin", specifier = ">=1.15" }]
linting = [
    { name = "griffe" },
    { name = "maturin", specifier = ">=1.15" },
    { name = "mypy" },
    { name = "pre-commit" },
    { name = "pyright" },
    { name = "ruff" },
]
testing-extra = [
    { name = "coverage" },
    { name = "dirty-equals" },
    { name = "exceptiongroup", marker = "python_full_version < '3.11'" },
    { name = "hypothesis" },
    { name = "inline-snapshot" },
    { name = "maturin", specifier = ">=1.15" },
    { name = "numpy", marker = "python_full_version < '3.13' and implementation_name == 'cpython' and platform_machine == 'x86_64'" },
    { name = "pandas", marker = "python_full_version < '3.13' and implementation_name == 'cpython' and platform_machine == 'x86_64'" },
    { name = "pytest" },
    { name = "pytest-benchmark" },
    { name = "pytest-examples", marker = "implementation_name == 'cpython' and platform_machine == 'x86_64'" },
    { name = "pytest-mock" },
    { name = "pytest-pretty" },
    { name = "pytest-run-parallel" },
    { name = "pytest-timeout" },
    { name = "python-dateutil" },
    { name = "typing-inspection", specifier = ">=0.4.1" },
    { name = "tzdata" },
]
wasm = [
    { name = "maturin", specifier = ">=1.15" },
    { name = "ruff" },
]

[[package]]
name = "pytest"
version = "9.1.1"
source = { registry = "https://pypi.org/simple" }
dependencies = [
    { name = "colorama", marker = "sys_platform == 'win32'" },
    { name = "exceptiongroup", marker = "python_full_version < '3.11'" },
    { name = "iniconfig" },
    { name = "packaging" },
    { name = "pluggy" },
    { name = "pygments" },
    { name = "tomli", marker = "python_full_version < '3.11'" },
]
sdist = { url = "https://files.pythonhosted.org/packages/e4/47/b9efed96c114afcfa3c9d3fe98a76a1d14c74a9e266d397cf6eb64be5e01/pytest-9.1.1.tar.gz", hash = "sha256:1088fbde8f2b49d95a549a195707afa7a76a3ce9bcadc26b6d71f0ffda5fe313", size = 1636369, upload-time = "2026-06-19T10:58:32.857Z" }
wheels = [
    { url = "https://files.pythonhosted.org/packages/24/25/1de2678b631f5a49215c6c96fff41ba892b0a34df68d6d80292b1b48aa7f/pytest-9.1.1-py3-none-any.whl", hash = "sha256:37a86b45efb9a47a61a36449063e8e18d0cab3161329fc099eb21783169c4f0c", size = 386536, upload-time = "2026-06-19T10:58:31.347Z" },
]

[[package]]
name = "typing-extensions"
version = "4.16.0"
source = { registry = "https://pypi.org/simple" }
sdist = { url = "https://files.pythonhosted.org/packages/f6/cc/6253133b5bb138fc3306cebfbda2c520f545d36b5be2c7255cc528bb45d6/typing_extensions-4.16.0.tar.gz", hash = "sha256:dc983d19a509c94dba722ee6abd33940f7c05a89e243c47e907eb4db6f1a43e5", size = 113555, upload-time = "2026-07-02T08:40:05.92Z" }
wheels = [
    { url = "https://files.pythonhosted.org/packages/49/d3/b8441a820a491ddfc024b0b0cf0393375b75ea13866d9c66727e54c2fc80/typing_extensions-4.16.0-py3-none-any.whl", hash = "sha256:481caa481374e813c1b176ada14e97f1f67a4539ce9cfeb3f350d78d6370c2e8", size = 45571, upload-time = "2026-07-02T08:40:04.659Z" },
]

[[package]]
name = "typing-inspection"
version = "0.4.4"
source = { registry = "https://pypi.org/simple" }
dependencies = [
    { name = "typing-extensions" },
]
sdist = { url = "https://files.pythonhosted.org/packages/a3/26/b09b8010994eccc3c09092e6b34058f36a460eea2d4c3e8b910c695975a0/typing_inspection-0.4.4.tar.gz", hash = "sha256:547274fa6b0a561ccf549cc9524b999a578e737d015d8709d021f9d0d13bea47", size = 76928, upload-time = "2026-08-12T12:37:25.997Z" }
wheels = [
    { url = "https://files.pythonhosted.org/packages/67/81/4add07e5172b7ac40d8ed5ff580409a7801a4fe26d529bdd915401dabfbe/typing_inspection-0.4.4-py3-none-any.whl", hash = "sha256:65b8397ba37ccbce054456aaccddfc91e6e3083c92824df348d96ca832f3f147", size = 14750, upload-time = "2026-08-12T12:37:24.648Z" },
]

[[package]]
name = "tzdata"
version = "2025.1"
source = { registry = "https://pypi.org/simple" }
sdist = { url = "https://files.pythonhosted.org/packages/43/0f/fa4723f22942480be4ca9527bbde8d43f6c3f2fe8412f00e7f5f6746bc8b/tzdata-2025.1.tar.gz", hash = "sha256:24894909e88cdb28bd1636c6887801df64cb485bd593f2fd83ef29075a81d694", size = 194950, upload-time = "2025-01-21T19:49:38.686Z" }
wheels = [
    { url = "https://files.pythonhosted.org/packages/0f/dd/84f10e23edd882c6f968c21c2434fe67bd4a528967067515feca9e611e5e/tzdata-2025.1-py2.py3-none-any.whl", hash = "sha256:7e127113816800496f027041c570f50bcd464a020098a3b6b199517772303639", size = 346762, upload-time = "2025-01-21T19:49:37.187Z" },
]
`
