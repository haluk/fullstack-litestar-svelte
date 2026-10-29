"""Dev helper: render the template into a target dir with sample answers.

Usage: uv run python scripts/render-sample.py [DEST]   (default: ./.dev-render)
"""
import sys
from pathlib import Path

import copier

ROOT = Path(__file__).resolve().parent.parent
ANSWERS = {
    "project_name": "Acme App",
    "author_name": "Dev",
    "author_email": "dev@example.com",
    "db_password": "secret",
}


def main() -> None:
    dest = sys.argv[1] if len(sys.argv) > 1 else str(ROOT / ".dev-render")
    copier.run_copy(
        str(ROOT), dest, data=ANSWERS,
        defaults=True, unsafe=True, overwrite=True, quiet=True,
        # render the working tree (incl. uncommitted edits), not the latest release tag
        vcs_ref="HEAD",
    )
    print(f"rendered to {dest}")


if __name__ == "__main__":
    main()
