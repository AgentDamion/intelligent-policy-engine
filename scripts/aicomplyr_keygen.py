#!/usr/bin/env python3
"""
Generate API keys for AICOMPLYR (dev-only).

Examples:
  python scripts/aicomplyr_keygen.py
  python scripts/aicomplyr_keygen.py 3
"""

import secrets
import sys


def main() -> None:
    count = 1
    if len(sys.argv) > 1:
        try:
            count = int(sys.argv[1])
        except ValueError:
            print("Usage: python scripts/aicomplyr_keygen.py [count]", file=sys.stderr)
            sys.exit(2)
        if count < 1 or count > 50:
            print("count must be between 1 and 50", file=sys.stderr)
            sys.exit(2)

    for _ in range(count):
        print(secrets.token_urlsafe(32))


if __name__ == "__main__":
    main()


