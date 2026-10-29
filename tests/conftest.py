"""Pytest fixtures for exercising the Copier template."""
from pathlib import Path

import copier
import pytest

TEMPLATE_ROOT = Path(__file__).resolve().parent.parent

DEFAULT_ANSWERS = {
    "project_name": "Acme App",
    "author_name": "Test Author",
    "author_email": "test@example.com",
    "db_password": "secret",
}


@pytest.fixture
def render(tmp_path):
    """Render the template into a destination dir and return its path."""

    def _render(dst, **overrides):
        data = {**DEFAULT_ANSWERS, **overrides}
        copier.run_copy(
            str(TEMPLATE_ROOT),
            str(dst),
            data=data,
            defaults=True,
            unsafe=True,
            quiet=True,
            # Render the current working tree (incl. uncommitted changes), not the
            # latest release tag — otherwise the suite would test a stale tagged version.
            vcs_ref="HEAD",
        )
        return Path(dst)

    return _render
