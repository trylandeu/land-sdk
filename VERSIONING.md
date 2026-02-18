# Versioning Policy

This SDK uses Semantic Versioning (`MAJOR.MINOR.PATCH`).

## Rules

- `MAJOR`: breaking API changes in exported types, client method signatures, or runtime behavior.
- `MINOR`: backward-compatible endpoint additions, new client methods, new optional fields.
- `PATCH`: backward-compatible fixes, docs/tests/build tooling updates that do not alter public API behavior.

## 0.x Behavior

While the SDK is in `0.x`, breaking changes may still occur, but releases must still increment:

- Breaking change: bump `MINOR` (for example `0.2.0` -> `0.3.0`)
- Non-breaking fix/addition: bump `PATCH` (for example `0.2.0` -> `0.2.1`)
