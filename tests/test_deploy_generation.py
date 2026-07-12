import shutil
import subprocess


def test_backend_dockerfile_renders(render, tmp_path):
    project = render(tmp_path)
    df = (project / "backend" / "Dockerfile").read_text()
    assert "uv sync --no-editable" in df
    assert 'CMD ["litestar", "run"' in df


def test_backend_image_builds(render, tmp_path):
    project = render(tmp_path)
    backend = project / "backend"
    uv = shutil.which("uv")
    docker = shutil.which("docker")
    assert uv and docker, "uv and docker required"
    # produce uv.lock (Dockerfile needs it), then build
    subprocess.run([uv, "lock"], cwd=backend, check=True, capture_output=True)
    r = subprocess.run(
        [docker, "build", "-t", "acme-app-api:test", "."],
        cwd=backend, capture_output=True, text=True,
    )
    if r.returncode != 0:
        raise AssertionError(f"docker build (backend) failed:\n{r.stdout[-3000:]}\n{r.stderr[-3000:]}")


def test_backend_image_builds_without_lockfile(render, tmp_path):
    # Regression guard: default generation ships no uv.lock (bootstrap=false), so the
    # prod Dockerfile must build without one already present (uv resolves on the fly).
    project = render(tmp_path)
    backend = project / "backend"
    docker = shutil.which("docker")
    assert docker, "docker required"
    assert not (backend / "uv.lock").exists()
    r = subprocess.run(
        [docker, "build", "-t", "acme-app-api:nolock-test", "."],
        cwd=backend, capture_output=True, text=True,
    )
    if r.returncode != 0:
        raise AssertionError(f"docker build (backend, no lockfile) failed:\n{r.stdout[-3000:]}\n{r.stderr[-3000:]}")


def test_frontend_dockerfile_renders(render, tmp_path):
    project = render(tmp_path)
    df = (project / "frontend" / "Dockerfile").read_text()
    assert 'CMD ["node", "build"]' in df


def test_frontend_image_builds(render, tmp_path):
    project = render(tmp_path)
    fe = project / "frontend"
    docker = shutil.which("docker")
    bun = shutil.which("bun")
    assert docker and bun
    subprocess.run([bun, "install"], cwd=fe, check=True, capture_output=True)
    r = subprocess.run(
        [docker, "build", "-t", "acme-app-web:test", "."],
        cwd=fe, capture_output=True, text=True,
    )
    if r.returncode != 0:
        raise AssertionError(f"docker build (frontend) failed:\n{r.stdout[-3000:]}\n{r.stderr[-3000:]}")


def test_nginx_and_compose_render(render, tmp_path):
    project = render(tmp_path)
    nginx = (project / "deploy" / "nginx" / "nginx.conf").read_text()
    assert "proxy_pass http://api_backend;" in nginx
    assert "{{" not in nginx
    for f in ("compose.yaml", "compose.prod.yaml"):
        assert (project / f).is_file()


def test_compose_prod_config_valid(render, tmp_path):
    project = render(tmp_path)
    docker = shutil.which("docker")
    assert docker
    r = subprocess.run(
        [docker, "compose", "-f", "compose.prod.yaml", "config"],
        cwd=project, capture_output=True, text=True,
        env={"PATH": __import__("os").environ["PATH"], "POSTGRES_PASSWORD": "x", "JWT_SECRET": "y", "ORIGIN": "http://localhost"},
    )
    if r.returncode != 0:
        raise AssertionError(f"compose config failed:\n{r.stdout}\n{r.stderr}")
    assert "api_backend" not in r.stdout  # sanity: services present
    assert "nginx" in r.stdout


def test_compose_dev_config_valid(render, tmp_path):
    import os
    project = render(tmp_path)
    docker = shutil.which("docker")
    assert docker
    r = subprocess.run(
        [docker, "compose", "-f", "compose.yaml", "config"],
        cwd=project, capture_output=True, text=True,
        env={"PATH": os.environ["PATH"]},
    )
    if r.returncode != 0:
        raise AssertionError(f"dev compose config failed:\n{r.stdout}\n{r.stderr}")


def test_compose_files_have_no_leftover_jinja(render, tmp_path):
    project = render(tmp_path)
    for f in ("compose.yaml", "compose.prod.yaml"):
        assert "{{" not in (project / f).read_text()


def test_fullstack_e2e_file_renders(render, tmp_path):
    project = render(tmp_path)
    e2e = (project / "frontend" / "e2e" / "fullstack.e2e.ts").read_text()
    assert "/api/register" in e2e
    assert "E2E Widget" in e2e
    assert (project / "scripts" / "e2e-stack.sh").is_file()


def test_justfile_renders_with_recipes(render, tmp_path):
    project = render(tmp_path)
    jf = (project / "justfile").read_text()
    assert "bootstrap:" in jf
    assert "docker compose -f compose.prod.yaml up" in jf
    # just interpolation survived Copier (raw), project_name substituted
    assert "{{ message }}" in jf          # just param, preserved
    assert "Acme App" in jf               # copier var, substituted


def test_fe_run_points_ssr_at_localhost_not_docker_host(render, tmp_path):
    # Regression: SvelteKit SSR (login form action) fetches the API via
    # INTERNAL_API_URL. On a host run it must target localhost, not the
    # docker-internal 'api' host (which is unreachable off the compose network).
    project = render(tmp_path)
    for name in ("justfile", "Makefile"):
        text = (project / name).read_text()
        fe_run = next(
            (ln for ln in text.splitlines() if "bun run dev" in ln and "INTERNAL_API_URL" in ln),
            None,
        )
        assert fe_run is not None, f"{name}: fe-run must set INTERNAL_API_URL"
        assert "INTERNAL_API_URL=http://localhost:" in fe_run, f"{name}: {fe_run!r}"
        assert "api:8000" not in fe_run, f"{name}: must not use the docker host: {fe_run!r}"


def test_justfile_lists_recipes(render, tmp_path):
    project = render(tmp_path)
    just = shutil.which("just")
    if not just:
        return  # just not installed in this env; skip gracefully
    r = subprocess.run([just, "--list"], cwd=project, capture_output=True, text=True)
    assert r.returncode == 0, r.stderr


def test_makefile_renders_with_targets(render, tmp_path):
    project = render(tmp_path)
    mf = (project / "Makefile").read_text()
    assert "bootstrap:" in mf
    assert "be-run:" in mf
    assert "docker compose -f compose.prod.yaml up" in mf
    assert "Acme App" in mf                    # copier var, substituted
    assert "acme_app.app:app" in mf            # package_name substituted


def test_makefile_lists_targets(render, tmp_path):
    project = render(tmp_path)
    make = shutil.which("make")
    if not make:
        return  # make not installed in this env; skip gracefully
    # help is the default goal; it must parse and exit cleanly
    r = subprocess.run([make, "-n", "help"], cwd=project, capture_output=True, text=True)
    assert r.returncode == 0, r.stderr


def test_generated_root_has_commitizen(render, tmp_path):
    project = render(tmp_path)
    pyproject = (project / "pyproject.toml").read_text()
    assert "[tool.commitizen]" in pyproject
    assert 'version_provider = "pep621"' in pyproject
    assert (project / ".pre-commit-config.yaml").is_file()
    assert (project / ".github" / "workflows" / "ci.yml").is_file()


def test_bootstrap_defaults_off_skips_install(render, tmp_path):
    # default answers have bootstrap=false → no .venv/node_modules created by _tasks
    project = render(tmp_path)
    assert not (project / "backend" / ".venv").exists()
    assert not (project / "frontend" / "node_modules").exists()
