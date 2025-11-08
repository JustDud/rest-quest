"""CLI entry point for the refactored emotion session."""

from __future__ import annotations

import argparse
import importlib
import sys

from session import run_session


def _run_mock() -> None:
    module = importlib.import_module("camera_mock")
    module.run_mock_session()


def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser(description="Emotion camera runner")
    parser.add_argument("--mock", action="store_true", help="Run in mock mode (no heavy ML / external APIs)")
    args = parser.parse_args(argv)

    try:
        if args.mock:
            print("Running in mock mode (--mock)")
            _run_mock()
        else:
            run_session()
    except KeyboardInterrupt:
        print("\nSession aborted by user.")


if __name__ == "__main__":
    main(sys.argv[1:])
