"""Tests for gallery CRUD and whatsapp settings (iteration 4)."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://nord-taste-beta.preview.emergentagent.com").rstrip("/")
ADMIN_TOKEN = "test_session_admin_1787840617697"
VIEWER_TOKEN = "test_session_viewer_1787840617697"


@pytest.fixture(scope="module")
def s():
    sess = requests.Session()
    sess.headers.update({"Content-Type": "application/json"})
    return sess


@pytest.fixture(scope="module")
def admin_h():
    return {"Authorization": f"Bearer {ADMIN_TOKEN}"}


@pytest.fixture(scope="module")
def viewer_h():
    return {"Authorization": f"Bearer {VIEWER_TOKEN}"}


# --- Public gallery ---
def test_public_gallery_returns_16(s):
    r = s.get(f"{BASE_URL}/api/gallery")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
    assert len(data) == 16, f"expected 16 photos, got {len(data)}"
    # sorted by order asc
    orders = [p["order"] for p in data]
    assert orders == sorted(orders)
    # only visible
    assert all(p.get("visible", True) for p in data)
    # required fields
    for p in data:
        assert "image" in p and "alt" in p and "tall" in p and "order" in p
        assert "_id" not in p  # mongo _id excluded


# --- Auth guards ---
def test_admin_gallery_requires_token(s):
    r = s.get(f"{BASE_URL}/api/admin/gallery")
    assert r.status_code == 401


def test_admin_gallery_viewer_forbidden(s, viewer_h):
    r = s.get(f"{BASE_URL}/api/admin/gallery", headers=viewer_h)
    assert r.status_code == 403


# --- Full CRUD ---
def test_admin_gallery_full_crud(s, admin_h):
    # CREATE
    payload = {"image": "/api/images/TEST_PLACEHOLDER.jpg", "alt": "TEST_photo", "tall": True, "order": 999, "visible": True}
    r = s.post(f"{BASE_URL}/api/admin/gallery", json=payload, headers=admin_h)
    assert r.status_code == 200, r.text
    created = r.json()
    pid = created["id"]
    assert created["alt"] == "TEST_photo"
    assert created["tall"] is True
    assert created["order"] == 999

    # Verify visible in public GET
    r = s.get(f"{BASE_URL}/api/gallery")
    assert any(p["id"] == pid for p in r.json()), "new photo missing from public gallery"

    # UPDATE: hide it
    r = s.put(f"{BASE_URL}/api/admin/gallery/{pid}", json={"visible": False, "alt": "TEST_updated"}, headers=admin_h)
    assert r.status_code == 200
    assert r.json()["ok"] is True

    # Verify hidden from public
    r = s.get(f"{BASE_URL}/api/gallery")
    assert not any(p["id"] == pid for p in r.json()), "hidden photo still in public gallery"

    # Verify still in admin gallery with updated alt
    r = s.get(f"{BASE_URL}/api/admin/gallery", headers=admin_h)
    match = [p for p in r.json() if p["id"] == pid]
    assert len(match) == 1
    assert match[0]["alt"] == "TEST_updated"
    assert match[0]["visible"] is False

    # DELETE
    r = s.delete(f"{BASE_URL}/api/admin/gallery/{pid}", headers=admin_h)
    assert r.status_code == 200

    # Verify gone
    r = s.get(f"{BASE_URL}/api/admin/gallery", headers=admin_h)
    assert not any(p["id"] == pid for p in r.json())


def test_update_nonexistent_gallery_photo(s, admin_h):
    r = s.put(f"{BASE_URL}/api/admin/gallery/nonexistent-id-xyz", json={"visible": False}, headers=admin_h)
    assert r.status_code == 404


# --- WhatsApp settings ---
def test_settings_has_whatsapp_field(s):
    r = s.get(f"{BASE_URL}/api/settings")
    assert r.status_code == 200
    assert "whatsapp" in r.json()


def test_admin_update_whatsapp_and_cleanup(s, admin_h):
    # Get original
    orig = s.get(f"{BASE_URL}/api/settings").json().get("whatsapp", "")

    # Set
    r = s.put(f"{BASE_URL}/api/admin/settings", json={"whatsapp": "905001234567"}, headers=admin_h)
    assert r.status_code == 200

    # Verify persisted via public GET
    r = s.get(f"{BASE_URL}/api/settings")
    assert r.json()["whatsapp"] == "905001234567"

    # Clear
    r = s.put(f"{BASE_URL}/api/admin/settings", json={"whatsapp": ""}, headers=admin_h)
    assert r.status_code == 200
    r = s.get(f"{BASE_URL}/api/settings")
    assert r.json()["whatsapp"] == ""

    # Restore original
    s.put(f"{BASE_URL}/api/admin/settings", json={"whatsapp": orig}, headers=admin_h)
