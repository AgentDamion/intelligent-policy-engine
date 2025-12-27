#!/usr/bin/env python3
"""
AICOMPLYR Engine - Local Development Server

Receives proof bundles from Cursor execution logs and stores them locally.
Run with: uvicorn aicomplyr_server:app --reload
"""

from fastapi import FastAPI, File, UploadFile, Header, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import shutil
import os
import json
from datetime import datetime

app = FastAPI(title="AICOMPLYR Engine - Local Dev")

UPLOAD_DIR = "uploads"
BUNDLES_DIR = "proof_bundles"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(BUNDLES_DIR, exist_ok=True)

def _get_allowed_api_keys() -> set[str]:
    """
    Minimal API key management (dev-only):
    - Reads comma-separated allowlist from AICOMPLYR_API_KEYS
    - Falls back to DEV_MODE_TEST_KEY_001 if unset (convenient local default)
    """
    raw = os.getenv("AICOMPLYR_API_KEYS", "").strip()
    if not raw:
        return {"DEV_MODE_TEST_KEY_001"}
    return {k.strip() for k in raw.split(",") if k.strip()}


def _require_bearer_api_key(authorization: Optional[str]) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")

    api_key = authorization.replace("Bearer ", "", 1).strip()
    if api_key not in _get_allowed_api_keys():
        raise HTTPException(status_code=403, detail="Invalid AICOMPLYR API Key")

    return api_key


def _require_header_api_key(x_api_key: Optional[str]) -> str:
    if not x_api_key:
        raise HTTPException(status_code=401, detail="Missing x-api-key header")

    api_key = x_api_key.strip()
    if api_key not in _get_allowed_api_keys():
        raise HTTPException(status_code=403, detail="Invalid AICOMPLYR API Key")

    return api_key


class ExecutionLog(BaseModel):
    what: Optional[str] = None
    why: Optional[str] = None
    files: List[str] = []
    status: Optional[str] = None
    compliance_tags: List[str] = []
    tests_passed: bool = True
    timestamp: str
    approval: str


class ProofBundle(BaseModel):
    task_id: str
    execution_log: ExecutionLog


@app.post("/v1/proof-bundles", status_code=201)
async def create_proof_bundle(
    bundle: ProofBundle,
    authorization: str = Header(None)
):
    """
    Receive and store a proof bundle from Cursor execution logs.
    """
    # 1. Validate API key
    _require_bearer_api_key(authorization)

    # 2. Store the proof bundle
    bundle_id = f"{bundle.task_id}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
    bundle_path = f"{BUNDLES_DIR}/{bundle_id}.json"

    with open(bundle_path, "w", encoding="utf-8") as f:
        json.dump(bundle.model_dump(), f, indent=2)

    print(f"[OK] Received proof bundle: {bundle_id}")
    print(f"     Task: {bundle.task_id}")
    print(f"     Files: {bundle.execution_log.files}")
    print(f"     Status: {bundle.execution_log.status}")

    # 3. Response
    return {
        "id": bundle_id,
        "status": "stored",
        "message": "Proof bundle received and secured."
    }


@app.post("/upload-proof")
async def upload_proof_file(
    file: UploadFile = File(...),
    x_api_key: str = Header(None)
):
    """
    Alternative endpoint for raw file uploads.
    """
    _require_header_api_key(x_api_key)

    file_location = f"{UPLOAD_DIR}/{file.filename}"
    with open(file_location, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    print(f"[OK] Received file upload: {file.filename}")
    return {"status": "success", "filename": file.filename}


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "ok", "mode": "dev"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)

