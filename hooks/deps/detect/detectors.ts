import { CARGO_DETECTOR } from './cargo-detector.js'
import { COMPOSER_DETECTOR } from './composer-detector.js'
import { DART_DETECTOR } from './dart-detector.js'
import type { Detector } from './detector.js'
import { DOTNET_DETECTOR } from './dotnet-detector.js'
import { GO_DETECTOR } from './go-detector.js'
import { GRADLE_DETECTOR } from './gradle-detector.js'
import { MAVEN_DETECTOR } from './maven-detector.js'
import { NPM_DETECTOR } from './npm-detector.js'
import { PYTHON_DETECTOR } from './python-detector.js'
import { RUBY_DETECTOR } from './ruby-detector.js'
import { SWIFT_DETECTOR } from './swift-detector.js'

/**
 * Every ecosystem detection reads, in the order their dependencies are listed.
 */
export const DETECTORS: readonly Detector[] = [
  NPM_DETECTOR,
  PYTHON_DETECTOR,
  GO_DETECTOR,
  CARGO_DETECTOR,
  RUBY_DETECTOR,
  COMPOSER_DETECTOR,
  DOTNET_DETECTOR,
  MAVEN_DETECTOR,
  GRADLE_DETECTOR,
  SWIFT_DETECTOR,
  DART_DETECTOR,
]
