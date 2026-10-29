import shutil
import subprocess
from pathlib import Path


def test_backend_package_dir_uses_package_name(render, tmp_path):
    project = render(tmp_path)
    assert (project / "backend" / "src" / "acme_app").is_dir()


def test_backend_pyproject_substitutes_package_name(render, tmp_path):
    project = render(tmp_path)
    pyproject = (project / "backend" / "pyproject.toml").read_text()
    assert 'name = "acme_app"' in pyproject


def test_app_module_imports_use_package_name(render, tmp_path):
    project = render(tmp_path)
    app_py = (project / "backend" / "src" / "acme_app" / "app.py").read_text()
    # imports must reference the rendered package, not a literal {{ package_name }}
    assert "{{" not in app_py
    assert "from acme_app.config import Settings, get_settings" in app_py


def test_env_files_configure_keycloak(render, tmp_path):
    project = render(tmp_path, keycloak_client_secret="kc-real-secret")
    example = (project / ".env.example").read_text()
    env = (project / ".env").read_text()
    for key in ("KEYCLOAK_URL=", "KEYCLOAK_REALM=acme-app", "KEYCLOAK_CLIENT_ID=acme-app-web"):
        assert key in example and key in env
    # the answered client secret lands only in the git-ignored .env
    assert "KEYCLOAK_CLIENT_SECRET=kc-real-secret" in env
    assert "kc-real-secret" not in example
    # .env (auto-loaded by prod compose) must NOT ship a placeholder Keycloak DB
    # password, or it would silently satisfy prod's ${KEYCLOAK_DB_PASSWORD:?} guard.
    assert "KEYCLOAK_DB_PASSWORD=" not in env
    # the old self-made JWT auth is gone
    assert "JWT_SECRET" not in example and "JWT_SECRET" not in env


def test_backend_has_no_local_user_auth(render, tmp_path):
    project = render(tmp_path)
    pkg = project / "backend" / "src" / "acme_app"
    assert not (pkg / "domain" / "users").exists()
    assert not (pkg / "lib" / "security.py").exists()
    auth_py = (pkg / "lib" / "auth.py").read_text()
    assert "PyJWKClient" in auth_py
    config_py = (pkg / "config.py").read_text()
    assert 'keycloak_realm: str = "acme-app"' in config_py
    assert 'keycloak_audience: str = "acme-app-api"' in config_py
    pyproject = (project / "backend" / "pyproject.toml").read_text()
    assert "pwdlib" not in pyproject
    assert "pyjwt[crypto]" in pyproject


def test_config_default_does_not_leak_db_password(render, tmp_path):
    project = render(tmp_path)
    config_py = (project / "backend" / "src" / "acme_app" / "config.py").read_text()
    # a password inside a DB URL renders as ":<pw>@"; the real answered
    # password ("secret") must never appear in committed source
    assert ":secret@" not in config_py
    assert "postgresql+asyncpg://localhost:5432/acme_app" in config_py
    assert "{{" not in config_py


def test_backend_db_module_uses_advanced_alchemy(render, tmp_path):
    project = render(tmp_path)
    db_py = (project / "backend" / "src" / "acme_app" / "lib" / "db.py").read_text()
    assert "from advanced_alchemy.extensions.litestar import" in db_py
    assert "before_send_handler=\"autocommit\"" in db_py


def _run_checked(cmd, cwd):
    result = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True)
    if result.returncode != 0:
        raise AssertionError(f"{' '.join(cmd)} failed (exit {result.returncode}):\n{result.stdout}\n{result.stderr}")


def test_rendered_backend_passes_static_checks(render, tmp_path):
    project = render(tmp_path)
    backend = project / "backend"
    uv = shutil.which("uv")
    assert uv, "uv must be installed to run the static gate"
    _run_checked([uv, "sync"], backend)
    _run_checked([uv, "run", "ruff", "check", "."], backend)
    _run_checked([uv, "run", "mypy", "src"], backend)


def test_migrations_env_is_templatized(render, tmp_path):
    project = render(tmp_path)
    env_py = (project / "backend" / "migrations" / "env.py").read_text()
    assert "{{" not in env_py  # fully rendered, no leftover Jinja


def test_backend_has_dashboard_endpoint(render, tmp_path):
    project = render(tmp_path)
    pkg = project / "backend" / "src" / "acme_app"
    assert (pkg / "domain" / "dashboard" / "services.py").is_file()
    assert "DashboardController" in (pkg / "app.py").read_text()


def test_backend_has_middleware_settings(render, tmp_path):
    project = render(tmp_path)
    pkg = project / "backend" / "src" / "acme_app"
    config_py = (pkg / "config.py").read_text()
    for setting in ("cors_origins", "allowed_hosts", "rate_limit_per_minute", "metrics_enabled", "log_requests"):
        assert setting in config_py
    assert (pkg / "lib" / "request_id.py").is_file()
    assert "litestar[standard,prometheus]" in (project / "backend" / "pyproject.toml").read_text()
    # documented in both env files
    for env in (".env", ".env.example"):
        assert "RATE_LIMIT_PER_MINUTE=300" in (project / env).read_text()
