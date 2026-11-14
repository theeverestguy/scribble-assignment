# Summary

Add Scribble logo and soft blue background

## What changed

Added a locally bundled SVG mark beside the Scribble name in the shared header, with responsive sizing. Changed the global page background to soft blue.

## Decisions

The original pencil and scribble mark uses the existing blue and amber palette. The image is decorative; the adjacent text retains the accessible brand name. The shared shell keeps it present on every route without changing navigation. The pale blue root background complements the logo and leaves the white panels and existing text colors intact.

## How each criterion is met

- Add an appropriate app logo: `AppShell branding > shows the bundled drawing logo beside the accessible Scribble name` checks the header image and brand text; `AppShell branding > bundles a valid, self-contained SVG drawing mark` checks the SVG asset. The pencil and scribble reflect the drawing game.
- Add a neat background color for app pages: `AppShell branding > sets a shared soft blue page background` checks the global root style used by the app.

## How to verify

Start the frontend and visit the start, create, join, lobby and game screens (create or join a room to reach the latter two). Check the blue background, header and existing controls at desktop and 320px widths; inspect the image's empty alt text and the adjacent Scribble text. Browser visual checks were not run in this environment.

## Tests

- Retained the two logo tests and added `AppShell branding > sets a shared soft blue page background`; enabled CSS processing in Vitest so the test can inspect the stylesheet.
- Frontend: `npm test` (5 passed), `npm run build` and `npx tsc --noEmit` passed. Initial background tests failed while CSS imports were stubbed; an intermediate build failed on unavailable Node types. The final test uses the CSS import with Vitest CSS processing enabled.
- Backend: `npm test` (4 passed), `npm run build` and `npx tsc --noEmit -p tsconfig.json` passed.
- An initial `npm test` at the repository root failed because there is no root package.json; reran successfully in each app directory.
- `npm run lint` failed in both apps because neither defines a lint script or lint configuration.

## Docs updated

README mentions the shared header logo and page background.

## Open questions

None.
