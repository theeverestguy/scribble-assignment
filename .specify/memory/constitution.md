<!--
Sync Impact Report:
- Version change: N/A → 1.0.0 (Initial Adoption)
- Added principles:
  - TypeScript Absolute (TS-1)
  - Immutability & Purity (IMM-1)
  - Ephemeral In-Memory Architecture (MEM-1)
  - HTTP Polling Synchronization (POL-1)
  - Validation-Driven Integrity (VAL-1)
- Added sections: Technology Stack & Constraints, Development Workflow
- Templates requiring updates: ✅ Updated / Checked
  - .specify/templates/plan-template.md: Aligned with constraints.
  - .specify/templates/spec-template.md: Aligned with requirements.
  - .specify/templates/tasks-template.md: Aligned with testing and setup.
- Follow-up TODOs: None.
-->

# Scribble Constitution

## Core Principles

### I. TypeScript Absolute (TS-1)
All code and refactors MUST be fully typed. Use of `any` is strictly forbidden. Use `unknown` only for truly dynamic data (e.g., raw API responses before validation). Standard ES module imports are required across both backend and frontend.
**Rationale**: Ensures structural integrity, prevents common runtime errors in a complex multiplayer state, and provides superior developer experience via IDE intellisense.

### II. Immutability & Purity (IMM-1)
Prefer immutable data structures for all state management. Core business logic (e.g., scoring, word selection, game rules) MUST reside in pure functions where possible to ensure deterministic behavior.
**Rationale**: Simplifies testing, makes state transitions predictable, and reduces the risk of side effects in concurrent-like polling environments.

### III. Ephemeral In-Memory Architecture (MEM-1)
Scribble is a persistence-less application. NO databases (SQL or NoSQL) or persistent storage solutions are allowed. All data MUST reside in-memory and is lost on server restart. Inactive rooms MUST be explicitly removed to maintain a minimal memory footprint.
**Rationale**: Aligns with the project's goal of a lightweight, session-based prototype and keeps the architecture extremely simple.

### IV. HTTP Polling Synchronization (POL-1)
WebSockets, Socket.io, and all other real-time push protocols are STRICTLY FORBIDDEN. All state synchronization between frontend and backend MUST use periodic HTTP polling (e.g., ~2s interval).
**Rationale**: Adheres to the synchronous-style design constraint and avoids the complexity of persistent connections.

### V. Validation-Driven Integrity (VAL-1)
Use `Zod` for all request payload and response validations. The backend MUST use centralized error handlers to ensure consistent responses. The frontend MUST handle API exceptions gracefully and MUST NOT crash on unexpected server errors.
**Rationale**: Ensures the system fails fast at the boundaries and provides clear, actionable feedback to users and developers.

## Technology Stack & Constraints

### Approved Stack
- **Backend**: Node.js, Express, TypeScript, Zod, `tsx` for execution.
- **Frontend**: React (v18), React Router (v6), Vite, TypeScript.
- **Testing**: Vitest for both frontend and backend unit/integration tests.

### Strictly Forbidden
- **No WebSockets**: Do not use any real-time push protocols.
- **No Databases**: All data must be stored in-memory only.
- **No Authentication**: Do not add accounts, sessions, JWT, or OAuth.

## Development Workflow

### Project Structure
- **Backend**: `src/api` (routes), `src/services` (logic), `src/models` (types).
- **Frontend**: `src/state` (Zustand/Context), `src/services` (API calls), `src/components`, `src/pages`.

### Quality Gates
- **Build Validation**: Execute `npm run build` in both `backend/` and `frontend/` before finalizing any feature.
- **Strict Typing**: No PR shall be accepted if it contains `any` or suppresses type errors without extreme justification.
- **Surgical Changes**: Prefer small, focused edits over large-scale refactors unless the architecture requires it.

## Governance
This Constitution is the foundational document for the Scribble project. It supersedes all other informal practices. Any amendments to these principles require a version bump and a migration plan if existing code is affected.

- All PRs and code reviews must verify compliance with these principles.
- Use `GEMINI.md` for environment-specific guidance and runtime development instructions.
- Complexity must be justified against the core principles of simplicity and ephemerality.
- Regular compliance reviews will be conducted to ensure architectural alignment.

**Version**: 1.0.0 | **Ratified**: 2026-06-03 | **Last Amended**: 2026-06-03
