"""Backend tests for iteration 14: page content editor + settings translation."""
import os
import time
import pytest
import requests

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/") if os.environ.get("REACT_APP_BACKEND_URL") else "https://nord-taste-beta.preview.emergentagent.com"
TOKEN = os.environ.get("ADMIN_TOKEN", "test_session_content_1788642803623")
AUTH = {"Authorization": f"Bearer {TOKEN}"}


# ---------- Public GET /api/content ----------
def test_public_content_get_no_auth():
    r = requests.get(f"{BASE_URL}/api/content", timeout=15)
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, dict)
    # doc should at least contain id: content
    assert data.get("id") == "content"


# ---------- PUT /api/admin/content requires auth ----------
def test_admin_content_put_requires_auth():
    r = requests.put(f"{BASE_URL}/api/admin/content", json={"dessertTitle": "X"}, timeout=15)
    assert r.status_code == 401


def test_admin_content_get_requires_auth():
    r = requests.get(f"{BASE_URL}/api/admin/content", timeout=15)
    assert r.status_code == 401


# ---------- PUT /admin/content translates text ----------
@pytest.fixture(scope="module")
def unique_dessert_title():
    return f"Enfes Tatlılar {int(time.time())}"


def test_admin_content_put_translates(unique_dessert_title):
    payload = {"dessertTitle": unique_dessert_title, "hero_image": "/images/kumpir.jpg"}
    r = requests.put(f"{BASE_URL}/api/admin/content", json=payload, headers=AUTH, timeout=60)
    assert r.status_code == 200, r.text
    data = r.json()
    assert data.get("translated") is True, f"Translation failed: {data}"
    content = data.get("content", {})
    assert content.get("dessertTitle") == unique_dessert_title
    assert content.get("hero_image") == "/images/kumpir.jpg"
    # Auto translations must be present
    for lang in ("en", "de", "ru", "ar"):
        key = f"dessertTitle_{lang}"
        assert content.get(key), f"Missing {key} in {list(content.keys())}"


def test_public_content_reflects_admin_write(unique_dessert_title):
    r = requests.get(f"{BASE_URL}/api/content", timeout=15)
    assert r.status_code == 200
    content = r.json()
    assert content.get("dessertTitle") == unique_dessert_title
    assert content.get("dessertTitle_en")


def test_admin_content_put_idempotent_no_llm(unique_dessert_title):
    """Re-sending same payload should skip LLM (fast response)."""
    payload = {"dessertTitle": unique_dessert_title, "hero_image": "/images/kumpir.jpg"}
    t0 = time.time()
    r = requests.put(f"{BASE_URL}/api/admin/content", json=payload, headers=AUTH, timeout=30)
    elapsed = time.time() - t0
    assert r.status_code == 200
    # No LLM call means fast; give generous limit
    assert elapsed < 5.0, f"Idempotent PUT took too long ({elapsed:.1f}s) - likely re-translating"
    data = r.json()
    assert data.get("translated") is True


def test_admin_content_whitelist_ignores_invalid_keys():
    payload = {"nonExistentKey_xyz": "should-be-ignored", "dessertTitle": "Tatlılar"}
    r = requests.put(f"{BASE_URL}/api/admin/content", json=payload, headers=AUTH, timeout=60)
    assert r.status_code == 200
    content = r.json()["content"]
    assert "nonExistentKey_xyz" not in content


# ---------- PUT /admin/settings translates translatable fields ----------
def test_admin_settings_translates_tagline():
    unique = f"Sıcak bir mola {int(time.time())}"
    payload = {"tagline": unique}
    r = requests.put(f"{BASE_URL}/api/admin/settings", json=payload, headers=AUTH, timeout=60)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body.get("translated") is True
    # Verify persisted
    g = requests.get(f"{BASE_URL}/api/settings", timeout=15).json()
    assert g.get("tagline") == unique
    for lang in ("en", "de", "ru", "ar"):
        assert g.get(f"tagline_{lang}"), f"tagline_{lang} missing"


# ---------- Cleanup: restore reasonable defaults ----------
def test_zzz_cleanup_restore_defaults():
    """Reset dessertTitle to sane value so site doesn't show test artifacts."""
    payload = {"dessertTitle": "Tatlılar"}
    r = requests.put(f"{BASE_URL}/api/admin/content", json=payload, headers=AUTH, timeout=60)
    assert r.status_code == 200
