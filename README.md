# copier-uv-fullstack

[![Copier](https://img.shields.io/badge/Copier-ocopied-success)](https://copier.readthedocs.io/)
[![License](https://img.shields.io/github/license/haluk/fullstack-litestar-svelte)](https://github.com/haluk/fullstack-litestar-svelte/blob/main/LICENSE)
[![CI](https://img.shields.io/github/actions/workflow/status/haluk/fullstack-litestar-svelte/ci.yml?branch=main)](https://github.com/haluk/fullstack-litestar-svelte/actions/workflows/ci.yml)
[![Python](https://img.shields.io/badge/python-%3E%3D3.14-blue)](https://www.python.org/)
[![uv](https://img.shields.io/badge/uv-package%20manager-blueviolet)](https://github.com/astral-sh/uv)
[![Ruff](https://img.shields.io/badge/Ruff-linting-fcc845)](https://docs.astral.sh/ruff/)
[![Litestar](https://img.shields.io/badge/Litestar-backend-orange)](https://litestar.dev/)
[![Postgres](https://img.shields.io/badge/PostgreSQL-database-336791?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![SvelteKit](https://img.shields.io/badge/SvelteKit-frontend-ff3e00?logo=svelte&logoColor=white)](https://kit.svelte.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-styling-06b6d4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![shadcn-svelte](https://img.shields.io/badge/shadcn--svelte-components-000000)](https://www.shadcn-svelte.com/)
[![Vite](https://img.shields.io/badge/Vite-build-646cff?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Bun](https://img.shields.io/badge/Bun-runtime-fc2e5e?logo=bun&logoColor=white)](https://bun.sh/)
[![Docker](https://img.shields.io/badge/Docker-container-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![Docker Compose](https://img.shields.io/badge/Docker_Compose-orchestration-2496ED?logo=docker&logoColor=white)](https://docs.docker.com/compose/)
[![Playwright](https://img.shields.io/badge/Playwright-e2e-2ead33?logo=playwright&logoColor=white)](https://playwright.dev/)
[![Keycloak](https://img.shields.io/badge/Keycloak-auth-4d4d4d?logo=keycloak&logoColor=white)](https://www.keycloak.org/)

A [Copier](https://copier.readthedocs.io/) template that generates an opinionated
full-stack monorepo: a Litestar backend (Postgres, layered architecture) and a
SvelteKit + shadcn-svelte frontend, with authentication delegated to Keycloak and
wired for docker compose + nginx deployment.

## What you get

- **Backend** — Litestar 2 + advanced-alchemy (SQLAlchemy 2 async, Alembic migrations) on
  Postgres, with a layered repository → service → controller structure. Sample `items`
  CRUD and a `dashboard` aggregate endpoint.
- **Authentication** — [Keycloak](https://www.keycloak.org/) owns login, registration and
  roles; the app stores no passwords. The API verifies Keycloak bearer tokens against the
  realm's JWKS (signature, issuer, audience, expiry), exposes `GET /api/me`, and offers a
  `requires_realm_role(...)` guard. The SvelteKit server is the OIDC client (authorization
  code + PKCE) and keeps tokens in httpOnly cookies, refreshing them automatically.
- **Frontend** — SvelteKit 3 + shadcn-svelte + Tailwind CSS 4 (bun, adapter-node): a landing
  page, a dashboard (stat tiles, 14-day activity chart, recent items) fed by the API, and an
  items page.
- **Infrastructure** — dev `compose.yaml` (Postgres, Keycloak with an auto-imported realm,
  hot-reloading api and web) and prod `compose.prod.yaml` (nginx in front of web, api and
  Keycloak at `/auth/`, with a dedicated Postgres for Keycloak). Multi-stage Dockerfiles.
- **Tooling** — `justfile` and `Makefile` task runners, pytest (testcontainers), vitest,
  Playwright full-stack e2e, ruff, mypy, deptry, pre-commit, commitizen, and GitHub Actions CI.

## Usage

```bash
uvx copier copy gh:haluk/fullstack-litestar-svelte my-new-project --trust
cd my-new-project
just dev   # postgres + keycloak + api + web; open http://localhost:3000
```

Sign up through Keycloak from the app's **Login** button (self-registration is enabled).
The Keycloak admin console is at `http://localhost:8080/admin` (user `admin`).

### Template questions

| Question | Default | Notes |
|---|---|---|
| `project_name` | — | Human-readable name; also the Keycloak realm display name |
| `project_slug` | from `project_name` | Used for the Keycloak realm and client ids (`<slug>-web`, audience `<slug>-api`) |
| `package_name` | from `project_slug` | Python package of the backend |
| `author_name`, `author_email` | — | |
| `python_version` | `3.14` | 3.11–3.14 |
| `db_name`, `db_user` | `package_name` | |
| `db_password` | `changeme` | Secret: written only to the git-ignored `.env` |
| `db_host`, `db_port` | `localhost`, `5432` | For host-based runs; compose uses the internal `db` service |
| `backend_port`, `frontend_port` | `8000`, `3000` | Host ports in development |
| `keycloak_port` | `8080` | Host port for Keycloak in development |
| `keycloak_admin_password` | `admin` | Secret: `.env` only |
| `keycloak_client_secret` | `change-me-client-secret` | Secret: `.env` only; shared by Keycloak and the SvelteKit server |
| `domain` | `localhost` | Deployment domain (nginx `server_name`) |
| `bootstrap` | `false` | Run `uv sync` and `bun install` after generation |

Production (`just prod`) additionally requires `KEYCLOAK_DB_PASSWORD` in the environment, and
`ORIGIN` should be the public URL (Keycloak is then served at `$ORIGIN/auth`).

## Development

```bash
uv sync
uv run pytest                                  # render the template and check the output
uv run python scripts/render-sample.py         # render a sample project into ./.dev-render
```

The generation suite builds Docker images and runs the rendered project's lint, type and
build gates, so it needs Docker, uv and bun. To run the full-stack e2e against a rendered
project, use `./scripts/e2e-stack.sh` inside it. On macOS, render somewhere under your home
directory (e.g. `./.dev-render`), because Docker Desktop can't bind-mount files from `/tmp`.
