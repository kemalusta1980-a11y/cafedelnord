import os
import logging
import httpx

logger = logging.getLogger(__name__)

STORAGE_BASE = (os.environ.get("INTEGRATION_PROXY_URL") or "").strip() or "https://integrations.emergentagent.com"
STORAGE_URL = STORAGE_BASE.rstrip("/") + "/objstore/api/v1/storage"
APP_NAME = "cafedelnord"

_storage_key = None


async def init_storage(force: bool = False):
    global _storage_key
    if _storage_key and not force:
        return _storage_key
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(f"{STORAGE_URL}/init", json={"emergent_key": os.environ.get("EMERGENT_LLM_KEY")})
    resp.raise_for_status()
    _storage_key = resp.json()["storage_key"]
    return _storage_key


async def put_object(path: str, data: bytes, content_type: str) -> dict:
    key = await init_storage()
    async with httpx.AsyncClient(timeout=120) as client:
        resp = await client.put(
            f"{STORAGE_URL}/objects/{path}",
            headers={"X-Storage-Key": key, "Content-Type": content_type},
            content=data,
        )
    if resp.status_code == 404:
        key = await init_storage(force=True)
        async with httpx.AsyncClient(timeout=120) as client:
            resp = await client.put(
                f"{STORAGE_URL}/objects/{path}",
                headers={"X-Storage-Key": key, "Content-Type": content_type},
                content=data,
            )
    resp.raise_for_status()
    return resp.json()


async def get_object(path: str) -> tuple[bytes, str]:
    key = await init_storage()
    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.get(f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": key})
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")
