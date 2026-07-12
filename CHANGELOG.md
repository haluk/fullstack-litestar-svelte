## v0.3.0 (2026-07-10)

### Feat

- add deptry and pre-commit dependencies to backend
- add check target with pre-commit, mypy, and deptry to task runners
- add pytest coverage options to backend tests

## v0.2.1 (2026-07-10)

### Fix

- point local fe-run SSR at localhost instead of the docker api host

## v0.2.0 (2026-07-09)

### Feat

- add local (host) dev recipes and a Makefile mirror of the justfile

## v0.1.1 (2026-07-09)

### Feat

- make db_host and db_port copier questions (default localhost:5432)

### Fix

- render working tree (vcs_ref=HEAD) in dev/test helpers after tagging

## v0.1.0 (2026-07-09)

### Feat

- add commitizen, pre-commit, generated CI, and bootstrap task wiring
- add top-level justfile with dev/prod/migrate/test recipes
- add full-stack e2e (login->items) and stack runner script
- add nginx config and dev/prod docker compose
- add frontend Dockerfile and internal SSR /api routing for prod
- add multi-stage uv Dockerfile for the backend
- add protected items page with list, create, and delete
- add API client, login action with httpOnly cookie session, and logout
- scaffold SvelteKit + shadcn-svelte frontend with /api proxy and generation gate
- add alembic migrations scaffold, backend README, and static generation gate
- add JWT-protected items domain with full CRUD stack
- add users controller, login endpoint, and JWT authentication
- add users domain (model, repository, service, schemas) with password hashing
- wire advanced-alchemy DB plugin and testcontainers integration fixtures
- scaffold generated Litestar backend with config, app factory, health route
- add copier-answers file and git-init task for update support
- render README and .env.example with computed template vars
- add copier config and minimal template tree with smoke test

### Fix

- use uv run in dockerized migrate/makemigration recipes
- **template**: correct cz provider, drop baked-in JWT secret, template CI/origin
- **dev**: run migrations on dev-stack boot and fix host-side migrate recipes
- **backend**: make prod Docker build work without a committed uv.lock
- run dev api from uv base image with mounted source (working hot-reload)
- **frontend**: secure cookie only in prod, honest login error, reachable logout
- inline shadcn zinc theme tokens into app.css, add theme-token gate
- equalize authenticate() timing and drop redundant email index
- mount all API routes under /api and require auth for user listing
- anchor JWT auth exclude patterns and use a strong test JWT secret
- remove db_password from committed config.py default (env-only DATABASE_URL)
- keep db_password out of committed .env.example, generate git-ignored .env

### Refactor

- mark template repo as non-package via tool.uv
