# Releasing `land-sdk`

Target repository: `https://github.com/trylandeu/land-sdk`

Current mode: package is private (`"private": true`), so npm publish is intentionally disabled.
When ready to publish, set `"private": false` in `package.json`.

## Release checklist

1. Update code and tests.
2. Run:
   - `npm run typecheck`
   - `npm run test`
3. Update `CHANGELOG.md`.
4. Choose next version using `VERSIONING.md`.
5. Bump version:
   - `npm version <patch|minor|major>`
6. Push branch and open PR.
7. After merge, create a GitHub release tag matching `package.json` version (for example `v0.2.0`).

## Notes

- `prepack` runs `npm run build`, so publish artifacts are always built from current source.
- Package exports are served from `dist/` only.
