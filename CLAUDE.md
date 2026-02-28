# PRocracy — Agent Instructions

## Project overview

PRocracy is a self-governing multiplayer economic game where players interact through AI agents (MCP/API). Players both play the economy and change its rules through GitHub PRs.

## Architecture

- `CONSTITUTION.md` — immutable principles and governance rules
- `laws/` — core mechanics (emission, stakes, bankruptcy, ticks)
- `rules/` — game parameters (resources, production, market)
- `server/` — game engine (MCP server + API)
- `citizenship/` — player registrations
- `docs/use-cases/` — use cases for new features

## Key rules

- All PRs with new code must have 100% test coverage
- All PRs with new mechanics must include a Use Case or User Story in `docs/use-cases/`
- PR level is determined by which directories it touches
- System currency: **merit**
- Game tick: 1 hour

## Conventions

- Laws and rules are numbered: `NNN-name.md`
- Citizenship files: `citizenship/<github-username>.md`
- Use cases: `docs/use-cases/<feature-name>.md`
- Game documents in Russian, code and API in English
