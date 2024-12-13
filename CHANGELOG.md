# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Compiler option for explicitly running the Lightning CSS transforms twice. The
  default behavior is now to run them only once.

### Changed

- Lightning CSS transforms to run only once by default. They were run twice
  before to mimic Tailwind’s tools’ behavior.

## [0.1.1] - 2024-12-13

### Fixed

- All of the JavaScript files missing from the `npm` package. The previous
  version tried to publish files from a `src` directory that does not exist.

## [0.1.0] - 2024-12-13

- Initial release of the project with functions for compiling CSS input and CSS
  files.

[unreleased]:
  https://github.com/anttikivi/tailwindcss-node-compiler/compare/v0.1.1...HEAD
[0.1.1]:
  https://github.com/anttikivi/tailwindcss-node-compiler/compare/v0.1.0...v0.1.1
[0.1.0]:
  https://github.com/anttikivi/tailwindcss-node-compiler/releases/tag/v0.1.0
