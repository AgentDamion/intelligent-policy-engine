#!/usr/bin/env python3
"""
AICOMPLYR Proof Bundle Uploader

Parses Cursor execution logs and uploads them to AICOMPLYR API.
Supports both local dev mode and production mode.

Usage:
    $env:AICOMPLYR_API_KEY="DEV_MODE_TEST_KEY_001"
    $env:TASK_ID="TEST-001"
    python scripts/aicomplyr_upload.py
"""

import os
import sys
import re
import json
import datetime
import requests

# Toggle between local dev and production
DEV_MODE = os.getenv("AICOMPLYR_DEV_MODE", "true").lower() == "true"
API_URL = os.getenv(
    "AICOMPLYR_API_URL",
    "http://127.0.0.1:8000/v1/proof-bundles" if DEV_MODE else "https://api.aicomplyr.io/v1/proof-bundles"
)


def fail(msg):
    print(f"ERROR: {msg}", file=sys.stderr)
    sys.exit(1)

def warn(msg: str) -> None:
    print(f"WARNING: {msg}", file=sys.stderr)


def parse_cursor_output(text: str) -> dict:
    """Extract structured fields from Cursor execution log."""
    def g(rx):
        m = re.search(rx, text, re.IGNORECASE | re.MULTILINE)
        return m.group(1).strip() if m else None

    files = g(r"Files touched:? (.+)")
    return {
        "what": g(r"What was changed:? (.+)"),
        "why": g(r"Why it was changed:? (.+)"),
        "files": [f.strip() for f in files.split(",")] if files else [],
        "status": g(r"Status:? (.+)"),
    }


def build_proof_bundle(log_text: str) -> dict:
    """Build AICOMPLYR proof bundle payload from log text."""
    task_id = os.getenv("TASK_ID", "UNSET")
    approval = os.getenv("APPROVER", "dev@localhost")
    tags = os.getenv("COMPLIANCE_TAGS", "dev-mode").split(",")
    tests_passed = os.getenv("TESTS_PASSED", "true").lower() == "true"

    return {
        "task_id": task_id,
        "execution_log": {
            **parse_cursor_output(log_text),
            "compliance_tags": [t.strip() for t in tags if t.strip()],
            "tests_passed": tests_passed,
            "timestamp": datetime.datetime.now(datetime.UTC).isoformat().replace("+00:00", "Z"),
            "approval": approval,
        },
    }


def main():
    strict_upload = os.getenv("AICOMPLYR_STRICT_UPLOAD", "false").lower() == "true"
    api_key = os.getenv("AICOMPLYR_API_KEY")
    if not api_key:
        fail("AICOMPLYR_API_KEY env var is required")

    log_path = os.getenv("CURSOR_LOG_PATH", "cursor_output.log")
    if not os.path.exists(log_path):
        fail(f"Log file not found: {log_path}")

    with open(log_path, "r", encoding="utf-8") as f:
        log_text = f.read()

    payload = build_proof_bundle(log_text)
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}

    print(f">> Uploading to {API_URL} (DEV_MODE={DEV_MODE})")
    print(f">> Payload: {json.dumps(payload, indent=2)}")

    try:
        resp = requests.post(API_URL, headers=headers, json=payload, timeout=10)
        if resp.status_code == 201:
            print("SUCCESS:", json.dumps(resp.json(), indent=2))
        else:
            msg = f"API error {resp.status_code}: {resp.text}"
            if strict_upload:
                fail(msg)
            warn(msg)
            sys.exit(0)
    except requests.exceptions.ConnectionError:
        msg = "Connection failed. Is the local server running? Start with: uvicorn aicomplyr_server:app --reload"
        if strict_upload:
            fail(msg)
        warn(msg)
        sys.exit(0)


if __name__ == "__main__":
    main()
