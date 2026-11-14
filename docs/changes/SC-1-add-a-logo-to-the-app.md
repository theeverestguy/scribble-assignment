# Summary

Add a drawing-themed Scribble logo

## What changed

Added a locally bundled SVG mark beside the Scribble name in the shared header, with responsive sizing.

## Decisions

The original pencil and scribble mark uses the existing blue and amber palette. The image is decorative; the adjacent text retains the accessible brand name. The shared shell keeps it present on every route without changing navigation.

## How each criterion is met

- Add an appropriate app logo: `AppShell branding > shows the bundled drawing logo beside the accessible Scribble name` checks the header image and brand text; `AppShell branding > bundles a valid, self-contained SVG drawing mark` checks the SVG asset. The pencil and scribble reflect the drawing game.

## How to verify

Start the frontend and visit the start, create, join, lobby and game screens (create or join a room to reach the latter two). Check the header and existing controls at desktop and 320px widths; inspect the image's empty alt text and the adjacent Scribble text. Browser visual checks were not run in this environment.

## Tests

- Added two `AppShell branding` tests for the decorative image, preserved text and content, and valid local SVG.
- Frontend: `npm test` (4 passed), `npm run build` and `npx tsc --noEmit` passed.
- Backend: `npm test` (4 passed), `npm run build` and `npx tsc --noEmit -p tsconfig.json` passed.
- An initial `npm test` at the repository root failed because there is no root package.json; reran successfully in each app directory.
- Neither app defines a lint script or lint configuration, so lint was not available.

## Docs updated

README now mentions the shared header logo.

## Open questions

None.
