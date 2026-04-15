"""Ensure `app` is importable when pytest collects tests from this directory."""

from __future__ import annotations

import sys
from pathlib import Path

_BACKEND_ROOT = Path(__file__).resolve().parent.parent
_root = str(_BACKEND_ROOT)
if _root not in sys.path:
    sys.path.insert(0, _root)
