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
    assert "from acme_app.config import get_settings" in app_py


def test_env_files_have_jwt_secret(render, tmp_path):
    project = render(tmp_path)
    # .env.example documents the var for local setup; .env (auto-loaded by prod
    # compose) must NOT ship a placeholder secret, or it would silently satisfy
    # prod's ${JWT_SECRET:?} guard with an insecure value.
    assert "JWT_SECRET=" in (project / ".env.example").read_text()
    assert "JWT_SECRET=" not in (project / ".env").read_text()


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
