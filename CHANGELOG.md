# Changelog

All notable changes to this project are documented in this file.

The format is based on Keep a Changelog and this project follows Semantic Versioning.

## [0.2.0] - 2026-02-18

### Added
- Added typed client coverage for health/auth, markets, tokens, prices, history (events/prices/rates), and webhook endpoints.
- Added endpoint parity for:
  - `GET /obligations/{id}/risk`
  - `GET /history/obligations/{id}`
  - `GET /history/positions/{id}`
- Added SDK build pipeline to emit `dist` JS + declarations.
- Added Node-based SDK unit and integration test suites.
- Added release/versioning documentation.

### Changed
- Renamed package to `@trylandeu/land-sdk`.
- Switched package exports from `src` to built `dist`.
