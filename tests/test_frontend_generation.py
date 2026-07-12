import shutil
import subprocess


def test_frontend_package_json_substitutes_name(render, tmp_path):
    project = render(tmp_path)
    pkg = (project / "frontend" / "package.json").read_text()
    assert "acme-app-frontend" in pkg


def test_frontend_config_has_app_name(render, tmp_path):
    project = render(tmp_path)
    cfg = (project / "frontend" / "src" / "lib" / "config.ts").read_text()
    assert 'APP_NAME = "Acme App"' in cfg
    assert 'API_BASE = "/api"' in cfg


def test_frontend_app_html_title(render, tmp_path):
    project = render(tmp_path)
    html = (project / "frontend" / "src" / "app.html").read_text()
    assert "<title>Acme App</title>" in html


def test_no_leftover_jinja_anywhere_in_frontend(render, tmp_path):
    project = render(tmp_path)
    fe = project / "frontend"
    skip = {"node_modules", ".svelte-kit", "build", ".git"}
    for path in fe.rglob("*"):
        if not path.is_file() or any(part in skip for part in path.parts):
            continue
        try:
            text = path.read_text()
        except (UnicodeDecodeError, OSError):
            continue
        assert "{{" not in text, f"leftover Jinja in {path.relative_to(fe)}"


def test_frontend_uses_adapter_node_and_api_proxy(render, tmp_path):
    project = render(tmp_path)
    # SvelteKit 2.63 keeps the adapter inline in vite.config.ts (no svelte.config.js)
    vite = (project / "frontend" / "vite.config.ts").read_text()
    assert "@sveltejs/adapter-node" in vite
    assert "'/api'" in vite
    assert "localhost:8000" in vite


def test_frontend_has_shadcn_ui_components(render, tmp_path):
    project = render(tmp_path)
    ui = project / "frontend" / "src" / "lib" / "components" / "ui"
    assert (project / "frontend" / "components.json").is_file()
    for component in ("button", "input", "card", "table", "label"):
        assert (ui / component).is_dir(), f"missing shadcn component: {component}"


def test_frontend_app_css_has_theme_tokens(render, tmp_path):
    project = render(tmp_path)
    css = (project / "frontend" / "src" / "app.css").read_text()
    # shadcn components reference these tokens; a missing theme renders unstyled
    assert "--background:" in css
    assert "--primary:" in css
    assert ".dark {" in css
    assert "--color-primary: var(--primary);" in css


def test_generated_frontend_installs_checks_builds(render, tmp_path):
    project = render(tmp_path)
    fe = project / "frontend"
    bun = shutil.which("bun")
    assert bun, "bun must be installed for the frontend gate"

    def run(args):
        result = subprocess.run([bun, *args], cwd=fe, capture_output=True, text=True)
        if result.returncode != 0:
            raise AssertionError(f"bun {' '.join(args)} failed:\n{result.stdout}\n{result.stderr}")

    run(["install"])
    run(["run", "check"])
    run(["run", "build"])


def test_frontend_uses_adapter_node_and_shadcn(render, tmp_path):
    project = render(tmp_path)
    fe = project / "frontend"
    # SvelteKit 2.63 configures the adapter inline in vite.config.ts (no svelte.config.js)
    assert "adapter-node" in (fe / "vite.config.ts").read_text()
    assert (fe / "components.json").is_file()
    assert (fe / "src" / "lib" / "components" / "ui").is_dir()


def test_frontend_vite_proxies_api(render, tmp_path):
    project = render(tmp_path)
    vite = (project / "frontend" / "vite.config.ts").read_text()
    assert "'/api'" in vite
    assert "localhost:8000" in vite


def test_frontend_has_playwright_smoke_config(render, tmp_path):
    project = render(tmp_path)
    fe = project / "frontend"
    config = (fe / "playwright.config.ts").read_text()
    assert "testDir: 'e2e'" in config
    assert (fe / "e2e" / "home.e2e.ts").is_file()


def test_frontend_readme_mentions_project_name(render, tmp_path):
    project = render(tmp_path)
    readme = (project / "frontend" / "README.md").read_text()
    assert "Acme App" in readme
    assert "{{" not in readme
