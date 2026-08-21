from __future__ import annotations

import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[1]
BACKEND_DIR = ROOT_DIR / "backend"

sys.path.append(str(BACKEND_DIR))

from app.services.name_verification_service import _detect_shell_keywords  # noqa: E402


def test_shell_keyword_detection() -> None:
    flags = _detect_shell_keywords("Omega Holdings and Ventures Ltd")
    assert "shell_keyword:holdings" in flags
    assert "shell_keyword:ventures" in flags
