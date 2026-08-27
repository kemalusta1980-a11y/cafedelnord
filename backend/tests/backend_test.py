"""Backend API tests for Cafe Del Nord."""
import os
import time
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://nord-taste-beta.preview.emergentagent.com").rstrip("/")
ADMIN_TOKEN = os.environ.get("ADMIN_TOKEN", "test_session_admin_1787840617697")
VIEWER_TOKEN = os.environ.get("VIEWER_TOKEN", "test_session_viewer_1787840617697")


@pytest.fixture(scope="session")
def s():
    sess = requests.Session()
    sess.headers.update({"Content-Type": "application/json"})
    return sess


@pytest.fixture(scope="session")
def admin_headers():
    return {"Authorization": f"Bearer {ADMIN_TOKEN}"}


@pytest.fixture(scope="session")
def viewer_headers():
    return {"Authorization": f"Bearer {VIEWER_TOKEN}"}


# ---- Public settings ----
def test_settings(s):
    r = s.get(f"{BASE_URL}/api/settings")
    assert r.status_code == 200
    data = r.json()
    assert data["phone"] == "0 (212) 809 27 62"
    assert data["site_name"] == "Cafe Del Nord"


# ---- Public menu ----
def test_menu(s):
    r = s.get(f"{BASE_URL}/api/menu")
    assert r.status_code == 200
    cats = r.json()
    assert len(cats) == 4
    by_slug = {c["slug"]: c for c in cats}
    assert len(by_slug["ana-yemekler"]["items"]) == 12
    assert len(by_slug["tatlilar"]["items"]) == 6
    assert len(by_slug["soguk-icecekler"]["items"]) == 6
    assert len(by_slug["sicak-icecekler"]["items"]) == 9
    # All items must be visible
    for c in cats:
        for it in c["items"]:
            assert it["visible"] is True


def test_featured(s):
    r = s.get(f"{BASE_URL}/api/featured")
    assert r.status_code == 200
    data = r.json()
    names = {i["name"] for i in data}
    for expected in ["Kumpir", "Et Burger", "Pizza Çeşitleri", "Künefe", "Waffle", "Serpme Kahvaltı", "Türk Kahvesi"]:
        assert expected in names, f"missing featured item {expected}"


# ---- Reservations ----
def test_reservation_validation(s):
    # guests > 50
    r = s.post(f"{BASE_URL}/api/reservations", json={"name":"Ali","phone":"5551112233","date":"2026-02-01","time":"19:00","guests":51})
    assert r.status_code == 422
    # name too short
    r = s.post(f"{BASE_URL}/api/reservations", json={"name":"A","phone":"5551112233","date":"2026-02-01","time":"19:00","guests":2})
    assert r.status_code == 422


def test_reservation_create_and_admin_list(s, admin_headers):
    payload = {"name":"TEST_Ahmet","phone":"5551234567","date":"2026-02-10","time":"19:30","guests":2,"note":"pytest"}
    r = s.post(f"{BASE_URL}/api/reservations", json=payload)
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["ok"] is True
    res_id = data["id"]

    # Admin list should include it
    lr = s.get(f"{BASE_URL}/api/admin/reservations", headers=admin_headers)
    assert lr.status_code == 200
    ids = [x["id"] for x in lr.json()]
    assert res_id in ids
    # Store for status update test
    pytest.res_id = res_id


def test_reservation_status_update(s, admin_headers):
    res_id = getattr(pytest, "res_id", None)
    if not res_id:
        pytest.skip("no reservation id")
    r = s.put(f"{BASE_URL}/api/admin/reservations/{res_id}", json={"status":"confirmed"}, headers=admin_headers)
    assert r.status_code == 200
    # verify
    lr = s.get(f"{BASE_URL}/api/admin/reservations", headers=admin_headers)
    match = [x for x in lr.json() if x["id"] == res_id][0]
    assert match["status"] == "confirmed"


def test_reservation_rate_limit(s):
    # Rate limit is 5 per 5 min. We already made 1 successful + 2 validation-failed (validation happens before rate limit? actually rate_limit is inside handler, after body parse. 422 doesn't hit rate_limit).
    # Fire 6 valid ones and expect at least one 429.
    saw_429 = False
    for i in range(7):
        r = s.post(f"{BASE_URL}/api/reservations", json={"name":f"TEST_RL{i}","phone":"5551234567","date":"2026-02-10","time":"19:30","guests":2,"note":"rl"})
        if r.status_code == 429:
            saw_429 = True
            break
    assert saw_429, "expected 429 after >5 requests"


# ---- Auth ----
def test_auth_me_no_token(s):
    r = s.get(f"{BASE_URL}/api/auth/me")
    assert r.status_code == 401


def test_auth_me_admin(s, admin_headers):
    r = s.get(f"{BASE_URL}/api/auth/me", headers=admin_headers)
    assert r.status_code == 200
    assert r.json()["role"] == "admin"


def test_admin_menu_no_token(s):
    r = s.get(f"{BASE_URL}/api/admin/menu")
    assert r.status_code == 401


def test_admin_menu_viewer_forbidden(s, viewer_headers):
    r = s.get(f"{BASE_URL}/api/admin/menu", headers=viewer_headers)
    assert r.status_code == 403


def test_admin_menu_ok(s, admin_headers):
    r = s.get(f"{BASE_URL}/api/admin/menu", headers=admin_headers)
    assert r.status_code == 200
    assert len(r.json()) >= 4


# ---- Admin CRUD: category + item ----
def test_admin_category_and_item_crud(s, admin_headers):
    # Create category
    r = s.post(f"{BASE_URL}/api/admin/categories", json={"name":"TEST_Kategori","order":99}, headers=admin_headers)
    assert r.status_code == 200, r.text
    cat = r.json()
    cid = cat["id"]

    # Create item
    r = s.post(f"{BASE_URL}/api/admin/items", json={"category_id":cid,"name":"TEST_Ürün","price":42.5}, headers=admin_headers)
    assert r.status_code == 200
    item = r.json()
    iid = item["id"]

    # Update item
    r = s.put(f"{BASE_URL}/api/admin/items/{iid}", json={"price":55.0,"visible":False,"featured":True}, headers=admin_headers)
    assert r.status_code == 200

    # Verify via admin menu
    r = s.get(f"{BASE_URL}/api/admin/menu", headers=admin_headers)
    all_items = [i for c in r.json() for i in c["items"]]
    match = [i for i in all_items if i["id"] == iid][0]
    assert match["price"] == 55.0
    assert match["visible"] is False
    assert match["featured"] is True

    # Delete item
    r = s.delete(f"{BASE_URL}/api/admin/items/{iid}", headers=admin_headers)
    assert r.status_code == 200
    # Delete category
    r = s.delete(f"{BASE_URL}/api/admin/categories/{cid}", headers=admin_headers)
    assert r.status_code == 200


def test_admin_settings_update(s, admin_headers):
    # get current
    r = s.get(f"{BASE_URL}/api/settings")
    orig_tag = r.json().get("tagline")
    # update
    r = s.put(f"{BASE_URL}/api/admin/settings", json={"tagline":"TEST_TAG"}, headers=admin_headers)
    assert r.status_code == 200
    r = s.get(f"{BASE_URL}/api/settings")
    assert r.json()["tagline"] == "TEST_TAG"
    # restore
    s.put(f"{BASE_URL}/api/admin/settings", json={"tagline":orig_tag}, headers=admin_headers)


def test_admin_campaign_crud(s, admin_headers):
    r = s.post(f"{BASE_URL}/api/admin/campaigns", json={"title":"TEST_Camp"}, headers=admin_headers)
    assert r.status_code == 200
    cid = r.json()["id"]
    r = s.put(f"{BASE_URL}/api/admin/campaigns/{cid}", json={"title":"TEST_Camp2","active":False}, headers=admin_headers)
    assert r.status_code == 200
    r = s.get(f"{BASE_URL}/api/admin/campaigns", headers=admin_headers)
    assert any(c["id"] == cid for c in r.json())
    r = s.delete(f"{BASE_URL}/api/admin/campaigns/{cid}", headers=admin_headers)
    assert r.status_code == 200
