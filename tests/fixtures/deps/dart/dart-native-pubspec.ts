/**
 * dart-lang/native pubspec.yaml, the pub workspace root, members trimmed to three.
 */
export const DART_NATIVE_PUBSPEC = `name: dart_lang_native_workspace
publish_to: none

environment:
  sdk: '>=3.10.0 <4.0.0'

workspace:
  - pkgs/code_assets
  - pkgs/ffi
  # - pkgs/ffigen  # TODO
  # - pkgs/ffigen/example/add  # TODO
  # - pkgs/ffigen/example/c_json  # TODO
  # - pkgs/ffigen/example/ffinative  # TODO
  # - pkgs/ffigen/example/libclang-example  # TODO
  # - pkgs/ffigen/example/objective_c  # TODO
  # - pkgs/ffigen/example/shared_bindings  # TODO
  # - pkgs/ffigen/example/simple  # TODO
  # - pkgs/ffigen/example/swift  # TODO
  - pkgs/hooks
  # - pkgs/hooks_runner/test_data/native_add_version_skew  # Intentionally uses incompatible older versions.
  # - pkgs/hooks_runner/test_data/native_add_version_skew_2  # Intentionally uses incompatible older versions.
  # - pkgs/jni  # TODO
  # - pkgs/jni_flutter  # TODO
  # - pkgs/jni_flutter/android_test_runner  # TODO
  # - pkgs/jni_flutter/example  # TODO
  # - pkgs/jni/example  # TODO
  # - pkgs/jnigen  # TODO
  # - pkgs/jnigen/android_test_runner  # TODO
  # - pkgs/jnigen/example/in_app_java  # TODO
  # - pkgs/jnigen/example/kotlin_plugin # TODO
  # - pkgs/jnigen/example/kotlin_plugin/example  # TODO
  # - pkgs/jnigen/example/maven_libs # TODO
  # - pkgs/jnigen/example/maven_libs/example  # TODO
  # - pkgs/jnigen/example/maven_libs_groovy # TODO
  # - pkgs/jnigen/example/maven_libs_groovy/example  # TODO
  # - pkgs/jnigen/example/notification_plugin  # TODO
  # - pkgs/jnigen/example/notification_plugin/example  # TODO
  # - pkgs/jnigen/example/pdfbox_plugin  # TODO
  # - pkgs/jnigen/example/pdfbox_plugin/dart_example  # TODO
  # - pkgs/jnigen/example/pdfbox_plugin/example  # TODO
  # - pkgs/objective_c  # TODO
  # - pkgs/objective_c/example/command_line  # TODO
  # - pkgs/objective_c/example/flutter_app  # Requires Flutter.
  # - pkgs/objective_c/example/path_provider_example  # Requires Flutter.
  # - pkgs/swiftgen  # TODO
  # - pkgs/swiftgen/example  # TODO

# Used in tool/
dev_dependencies:
  args: ^2.7.0
  dart_flutter_team_lints: ^3.5.2
  dependency_validator: ^5.1.0
  path: ^1.9.1
  yaml: ^3.1.3

# Hook user-defines are specified in the pub workspace.
hooks:
  user_defines:
    prebuilt_assets_example:
      local_build: false
    download_asset:
      local_build: false
    user_defines: # package name
      user_define_key: user_define_value
      user_define_key2:
        foo: bar
      some_file: pkgs/hooks_runner/test_data/user_defines/assets/data.json
    some_other_package: # package name
      user_define_key3: user_define_value3

dependency_overrides:
  ffigen:
    path: pkgs/ffigen
`
