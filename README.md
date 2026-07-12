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

A [Copier](https://copier.readthedocs.io/) template that generates an opinionated
full-stack monorepo: a Litestar backend (Postgres, layered architecture) and a
SvelteKit + shadcn-svelte frontend, wired for docker compose + nginx deployment.

## Usage

```bash
uvx copier copy gh:haluk/fullstack-litestar-svelte my-new-project --trust
```

## Development

```bash
uv sync
uv run pytest
```

