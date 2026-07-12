import yaml


def test_generation_creates_gitignore(render, tmp_path):
    project = render(tmp_path)
    assert (project / ".gitignore").is_file()


def test_generation_creates_justfile(render, tmp_path):
    project = render(tmp_path)
    assert (project / "justfile").is_file()


def test_readme_substitutes_project_name(render, tmp_path):
    project = render(tmp_path)
    readme = (project / "README.md").read_text()
    assert "# Acme App" in readme


def test_computed_slug_and_package_name(render, tmp_path):
    project = render(tmp_path)
    readme = (project / "README.md").read_text()
    # project_slug derived from "Acme App"
    assert "acme-app" in readme
    # package_name derived from the slug
    assert "acme_app" in readme


def test_env_example_has_expected_keys(render, tmp_path):
    project = render(tmp_path)
    env = (project / ".env.example").read_text()
    for key in (
        "POSTGRES_DB=",
        "POSTGRES_USER=",
        "POSTGRES_PASSWORD=",
        "BACKEND_PORT=",
        "FRONTEND_PORT=",
        "DOMAIN=",
        "DATABASE_URL=",
    ):
        assert key in env, f"missing {key}"


def test_env_example_uses_default_ports(render, tmp_path):
    project = render(tmp_path)
    env = (project / ".env.example").read_text()
    assert "BACKEND_PORT=8000" in env
    assert "FRONTEND_PORT=3000" in env


def test_copier_answers_file_exists(render, tmp_path):
    project = render(tmp_path)
    assert (project / ".copier-answers.yml").is_file()


def test_copier_answers_records_project_name(render, tmp_path):
    project = render(tmp_path)
    answers = yaml.safe_load((project / ".copier-answers.yml").read_text())
    assert answers["project_name"] == "Acme App"


def test_copier_answers_omits_secret_password(render, tmp_path):
    project = render(tmp_path)
    answers = yaml.safe_load((project / ".copier-answers.yml").read_text())
    assert "db_password" not in answers


def test_generation_initializes_git_repo(render, tmp_path):
    project = render(tmp_path)
    assert (project / ".git").is_dir()


def test_dotenv_contains_real_password(render, tmp_path):
    project = render(tmp_path)
    env = (project / ".env").read_text()
    assert "POSTGRES_PASSWORD=secret" in env
    assert "postgresql+asyncpg://acme_app:secret@localhost:5432/acme_app" in env


def test_env_example_uses_placeholder_password(render, tmp_path):
    project = render(tmp_path)
    example = (project / ".env.example").read_text()
    assert "POSTGRES_PASSWORD=changeme" in example
    assert "secret" not in example  # the real password must never be committed


def test_env_example_database_url_substitutes_user_and_db(render, tmp_path):
    project = render(tmp_path)
    example = (project / ".env.example").read_text()
    assert "postgresql+asyncpg://acme_app:changeme@localhost:5432/acme_app" in example


def test_db_host_and_port_are_questions(render, tmp_path):
    # defaults: localhost:5432
    project = render(tmp_path)
    env = (project / ".env").read_text()
    assert "@localhost:5432/" in env
    # overriding db_host/db_port flows into .env and config.py (host/external DB address)
    project2 = render(tmp_path / "custom", db_host="pg.internal", db_port=6543)
    env2 = (project2 / ".env").read_text()
    assert "@pg.internal:6543/" in env2
    config2 = (project2 / "backend" / "src" / "acme_app" / "config.py").read_text()
    assert "pg.internal:6543" in config2


def test_compose_keeps_internal_db_service_regardless_of_db_host(render, tmp_path):
    # The compose api MUST reach Postgres via the internal 'db' service, never db_host;
    # db_port only maps the host-exposed port.
    project = render(tmp_path, db_host="pg.internal", db_port=6543)
    compose = (project / "compose.yaml").read_text()
    assert "@db:5432/" in compose  # api -> internal service, unaffected by db_host
    assert "pg.internal" not in compose  # db_host must not leak into container networking
    assert "6543:5432" in compose  # host port mapping uses db_port


def test_dotenv_is_gitignored(render, tmp_path):
    project = render(tmp_path)
    gitignore = (project / ".gitignore").read_text()
    assert ".env" in gitignore
    assert "!.env.example" in gitignore


def test_copier_answers_records_src_path(render, tmp_path):
    project = render(tmp_path)
    answers = yaml.safe_load((project / ".copier-answers.yml").read_text())
    assert "_src_path" in answers
