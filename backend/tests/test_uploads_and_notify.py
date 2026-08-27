"""Tests for iteration-2 features: image upload, notification email, notification_email setting."""
import os
import time
import subprocess
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://nord-taste-beta.preview.emergentagent.com").rstrip("/")
ADMIN_TOKEN = os.environ.get("ADMIN_TOKEN", "test_session_admin_1787840617697")
VIEWER_TOKEN = os.environ.get("VIEWER_TOKEN", "test_session_viewer_1787840617697")
SAMPLE_IMG = "/app/frontend/public/images/kumpir.jpg"


@pytest.fixture(scope="module")
def admin_auth():
    return {"Authorization": f"Bearer {ADMIN_TOKEN}"}


@pytest.fixture(scope="module")
def viewer_auth():
    return {"Authorization": f"Bearer {VIEWER_TOKEN}"}


# ---------------- Upload endpoint ----------------
def test_upload_requires_auth():
    with open(SAMPLE_IMG, "rb") as f:
        r = requests.post(f"{BASE_URL}/api/admin/upload", files={"file": ("k.jpg", f, "image/jpeg")})
    assert r.status_code == 401


def test_upload_viewer_forbidden(viewer_auth):
    with open(SAMPLE_IMG, "rb") as f:
        r = requests.post(f"{BASE_URL}/api/admin/upload",
                          files={"file": ("k.jpg", f, "image/jpeg")}, headers=viewer_auth)
    assert r.status_code == 403


def test_upload_rejects_non_image(admin_auth):
    r = requests.post(f"{BASE_URL}/api/admin/upload",
                      files={"file": ("a.txt", b"hello", "text/plain")}, headers=admin_auth)
    assert r.status_code == 400


@pytest.fixture(scope="module")
def uploaded_url(admin_auth):
    with open(SAMPLE_IMG, "rb") as f:
        r = requests.post(f"{BASE_URL}/api/admin/upload",
                          files={"file": ("k.jpg", f, "image/jpeg")}, headers=admin_auth)
    assert r.status_code == 200, r.text
    data = r.json()
    assert "url" in data
    assert data["url"].startswith("/api/files/cafedelnord/uploads/")
    assert data["url"].endswith(".jpg")
    return data["url"]


def test_upload_returns_url(uploaded_url):
    assert uploaded_url  # populated by fixture


# ---------------- Serve endpoint ----------------
def test_serve_file_ok(uploaded_url):
    r = requests.get(f"{BASE_URL}{uploaded_url}")
    assert r.status_code == 200
    assert r.headers.get("content-type", "").startswith("image/")
    assert len(r.content) > 1000


def test_serve_file_404():
    r = requests.get(f"{BASE_URL}/api/files/cafedelnord/uploads/does-not-exist-xyz.jpg")
    assert r.status_code == 404


# ---------------- Menu item uses uploaded image ----------------
def test_menu_item_uses_uploaded_image(admin_auth, uploaded_url):
    menu = requests.get(f"{BASE_URL}/api/menu").json()
    item_id = menu[0]["items"][0]["id"]
    original = menu[0]["items"][0].get("image")
    try:
        r = requests.put(f"{BASE_URL}/api/admin/items/{item_id}",
                         json={"image": uploaded_url}, headers=admin_auth)
        assert r.status_code == 200
        menu2 = requests.get(f"{BASE_URL}/api/menu").json()
        found = [i for c in menu2 for i in c["items"] if i["id"] == item_id][0]
        assert found["image"] == uploaded_url
    finally:
        requests.put(f"{BASE_URL}/api/admin/items/{item_id}",
                     json={"image": original}, headers=admin_auth)


# ---------------- Settings.notification_email ----------------
def test_settings_notification_email_field_present():
    r = requests.get(f"{BASE_URL}/api/settings")
    assert r.status_code == 200
    assert "notification_email" in r.json()


def test_update_notification_email(admin_auth):
    r = requests.put(f"{BASE_URL}/api/admin/settings",
                     json={"notification_email": "delivered@resend.dev"}, headers=admin_auth)
    assert r.status_code == 200
    r = requests.get(f"{BASE_URL}/api/settings")
    assert r.json()["notification_email"] == "delivered@resend.dev"


# ---------------- Reservation triggers email log ----------------
def _tail_backend_err(lines=200):
    try:
        out = subprocess.run(["tail", "-n", str(lines), "/var/log/supervisor/backend.err.log"],
                             capture_output=True, text=True, timeout=5)
        return out.stdout
    except Exception:
        return ""


def test_reservation_with_email_logs_notification(admin_auth):
    # Ensure setting is set
    requests.put(f"{BASE_URL}/api/admin/settings",
                 json={"notification_email": "delivered@resend.dev"}, headers=admin_auth)
    # Wait a beat for rate limit window to clear if previous tests ran
    time.sleep(1)
    payload = {"name": "TEST_Notify", "phone": "5551112233",
               "date": "2026-03-01", "time": "20:00", "guests": 2, "note": "notify"}
    r = requests.post(f"{BASE_URL}/api/reservations", json=payload)
    if r.status_code == 429:
        pytest.skip("rate limited from prior test run")
    assert r.status_code == 200
    # Give backend a moment to write log
    time.sleep(3)
    log = _tail_backend_err(400)
    assert "Reservation notification sent" in log, f"log excerpt:\n{log[-2000:]}"


def test_reservation_without_email_still_succeeds(admin_auth):
    # Clear notification_email
    requests.put(f"{BASE_URL}/api/admin/settings",
                 json={"notification_email": ""}, headers=admin_auth)
    time.sleep(1)
    payload = {"name": "TEST_NoNotify", "phone": "5551112233",
               "date": "2026-03-02", "time": "20:00", "guests": 2, "note": "no-notify"}
    r = requests.post(f"{BASE_URL}/api/reservations", json=payload)
    if r.status_code == 429:
        pytest.skip("rate limited from prior test run")
    assert r.status_code == 200
    assert r.json()["ok"] is True


# ---------------- Cleanup ----------------
def test_zzz_cleanup_reset_notification_email(admin_auth):
    r = requests.put(f"{BASE_URL}/api/admin/settings",
                     json={"notification_email": ""}, headers=admin_auth)
    assert r.status_code == 200
    r = requests.get(f"{BASE_URL}/api/settings")
    assert r.json().get("notification_email", "") == ""
