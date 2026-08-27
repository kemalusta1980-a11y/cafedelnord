from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends, File, UploadFile
from html import escape
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import time
import logging
import httpx
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title="Cafe Del Nord API")
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

AUTH_API = "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data"

from email_service import send_email  # noqa: E402
from storage_service import init_storage, put_object, get_object, APP_NAME  # noqa: E402


# ---------- Models ----------
class Category(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    name_en: Optional[str] = None
    slug: str
    order: int = 0
    visible: bool = True


class MenuItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    category_id: str
    name: str
    name_en: Optional[str] = None
    description: str = ""
    description_en: Optional[str] = None
    price: Optional[float] = None
    image: Optional[str] = None
    order: int = 0
    visible: bool = True
    featured: bool = False


class Campaign(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str = ""
    image: Optional[str] = None
    active: bool = True
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class GalleryPhoto(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    image: str
    alt: str = ""
    tall: bool = False
    order: int = 0
    visible: bool = True


class Settings(BaseModel):
    id: str = "site"
    site_name: str = "Cafe Del Nord"
    tagline: str = "Bir cafeden daha fazlası"
    hero_title: str = "EFSANE LEZZET SİZLERLE"
    hero_subtitle: str = ""
    about_text: str = ""
    quality_text: str = ""
    vision_text: str = ""
    phone: str = ""
    email: str = ""
    address: str = ""
    maps_url: str = ""
    instagram: str = ""
    facebook: str = ""
    hours_weekday: str = ""
    hours_weekend: str = ""
    reservation_enabled: bool = True
    notification_email: str = ""
    whatsapp: str = ""


class ReservationCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    phone: str = Field(min_length=7, max_length=30)
    date: str
    time: str
    guests: int = Field(ge=1, le=50)
    note: str = Field(default="", max_length=500)


class Reservation(ReservationCreate):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    status: str = "new"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


# ---------- Auth helpers ----------
async def get_current_user(request: Request):
    token = request.cookies.get("session_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    session = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=401, detail="Invalid session")
    expires_at = session["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


async def require_admin(user=Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin yetkisi gerekli")
    return user


# ---------- Rate limiting (simple in-memory) ----------
_rate_buckets = {}

def rate_limit(request: Request, key: str, limit: int = 5, window: int = 60):
    ip = request.headers.get("x-forwarded-for", request.client.host if request.client else "?").split(",")[0].strip()
    bucket_key = f"{key}:{ip}"
    now = time.time()
    hits = [t for t in _rate_buckets.get(bucket_key, []) if now - t < window]
    if len(hits) >= limit:
        raise HTTPException(status_code=429, detail="Çok fazla istek. Lütfen biraz sonra tekrar deneyin.")
    hits.append(now)
    _rate_buckets[bucket_key] = hits


# ---------- Auth routes ----------
class SessionRequest(BaseModel):
    session_id: str


@api_router.post("/auth/session")
async def create_session(body: SessionRequest, response: Response):
    async with httpx.AsyncClient() as hc:
        r = await hc.get(AUTH_API, headers={"X-Session-ID": body.session_id})
    if r.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid session id")
    data = r.json()
    existing = await db.users.find_one({"email": data["email"]}, {"_id": 0})
    if existing:
        user_id = existing["user_id"]
        await db.users.update_one({"user_id": user_id}, {"$set": {"name": data.get("name"), "picture": data.get("picture")}})
        role = existing.get("role", "viewer")
    else:
        user_count = await db.users.count_documents({})
        role = "admin" if user_count == 0 else "viewer"
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await db.users.insert_one({
            "user_id": user_id,
            "email": data["email"],
            "name": data.get("name"),
            "picture": data.get("picture"),
            "role": role,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
    session_token = data["session_token"]
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    response.set_cookie("session_token", session_token, max_age=7 * 24 * 3600,
                        httponly=True, secure=True, samesite="none", path="/")
    return {"user_id": user_id, "email": data["email"], "name": data.get("name"),
            "picture": data.get("picture"), "role": role}


@api_router.get("/auth/me")
async def auth_me(user=Depends(get_current_user)):
    return user


@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    token = request.cookies.get("session_token")
    if token:
        await db.user_sessions.delete_one({"session_token": token})
    response.delete_cookie("session_token", path="/")
    return {"ok": True}


# ---------- Public routes ----------
@api_router.get("/")
async def root():
    return {"message": "Cafe Del Nord API"}


@api_router.get("/settings")
async def get_settings():
    doc = await db.settings.find_one({"id": "site"}, {"_id": 0})
    merged = {**Settings().model_dump(), **(doc or {})}
    merged.pop("notification_email", None)
    return merged


@api_router.get("/menu")
async def get_menu():
    cats = await db.categories.find({"visible": True}, {"_id": 0}).sort("order", 1).to_list(100)
    items = await db.menu_items.find({"visible": True}, {"_id": 0}).sort("order", 1).to_list(1000)
    by_cat = {}
    for it in items:
        by_cat.setdefault(it["category_id"], []).append(it)
    return [{**c, "items": by_cat.get(c["id"], [])} for c in cats]


@api_router.get("/featured")
async def get_featured():
    return await db.menu_items.find({"visible": True, "featured": True}, {"_id": 0}).sort("order", 1).to_list(20)


@api_router.get("/campaigns")
async def get_campaigns():
    return await db.campaigns.find({"active": True}, {"_id": 0}).sort("created_at", -1).to_list(20)


@api_router.get("/gallery")
async def get_gallery():
    return await db.gallery.find({"visible": True}, {"_id": 0}).sort("order", 1).to_list(200)


async def notify_reservation(res: "Reservation"):
    settings = await db.settings.find_one({"id": "site"}, {"_id": 0}) or {}
    to = (settings.get("notification_email") or "").strip()
    if not to:
        return
    subject = "Yeni Rezervasyon Talebi — Cafe Del Nord"
    html = (
        '<table role="presentation" width="100%"><tr><td style="padding:24px;font-family:Arial,sans-serif;color:#222">'
        '<h2 style="margin:0 0 16px">Yeni rezervasyon talebi</h2>'
        f'<p style="margin:4px 0"><strong>Ad Soyad:</strong> {escape(res.name)}</p>'
        f'<p style="margin:4px 0"><strong>Telefon:</strong> {escape(res.phone)}</p>'
        f'<p style="margin:4px 0"><strong>Tarih / Saat:</strong> {escape(res.date)} {escape(res.time)}</p>'
        f'<p style="margin:4px 0"><strong>Kişi Sayısı:</strong> {res.guests}</p>'
        f'<p style="margin:4px 0"><strong>Not:</strong> {escape(res.note) or "-"}</p>'
        '<p style="margin:16px 0 0">Yönetim panelindeki Rezervasyonlar sekmesinden onaylayabilirsiniz.</p>'
        '<p style="font-size:12px;color:#888;margin-top:20px">Bu e-posta Cafe Del Nord web sitesi tarafından gönderilmiştir.</p>'
        "</td></tr></table>"
    )
    try:
        await send_email(to=to, subject=subject, html=html)
        logger.info(f"Reservation notification sent to {to}")
    except Exception as e:
        logger.error(f"Reservation email failed: {e}")


@api_router.post("/reservations")
async def create_reservation(body: ReservationCreate, request: Request):
    settings = await db.settings.find_one({"id": "site"}, {"_id": 0}) or {}
    if not settings.get("reservation_enabled", True):
        raise HTTPException(status_code=403, detail="Rezervasyon şu anda kapalıdır.")
    rate_limit(request, "reservation", limit=5, window=300)
    res = Reservation(**body.model_dump())
    await db.reservations.insert_one(res.model_dump())
    await notify_reservation(res)
    return {"ok": True, "id": res.id}


# ---------- Admin routes ----------
@api_router.get("/admin/menu")
async def admin_menu(user=Depends(require_admin)):
    cats = await db.categories.find({}, {"_id": 0}).sort("order", 1).to_list(100)
    items = await db.menu_items.find({}, {"_id": 0}).sort("order", 1).to_list(1000)
    by_cat = {}
    for it in items:
        by_cat.setdefault(it["category_id"], []).append(it)
    return [{**c, "items": by_cat.get(c["id"], [])} for c in cats]


class CategoryIn(BaseModel):
    name: str
    name_en: Optional[str] = None
    slug: Optional[str] = None
    order: int = 0
    visible: bool = True


@api_router.post("/admin/categories")
async def create_category(body: CategoryIn, user=Depends(require_admin)):
    slug = body.slug or body.name.lower().replace(" ", "-")
    cat = Category(name=body.name, name_en=body.name_en, slug=slug, order=body.order, visible=body.visible)
    await db.categories.insert_one(cat.model_dump())
    return cat


@api_router.put("/admin/categories/{cat_id}")
async def update_category(cat_id: str, body: dict, user=Depends(require_admin)):
    allowed = {k: v for k, v in body.items() if k in {"name", "name_en", "slug", "order", "visible"}}
    r = await db.categories.update_one({"id": cat_id}, {"$set": allowed})
    if r.matched_count == 0:
        raise HTTPException(status_code=404, detail="Kategori bulunamadı")
    return {"ok": True}


@api_router.delete("/admin/categories/{cat_id}")
async def delete_category(cat_id: str, user=Depends(require_admin)):
    await db.menu_items.delete_many({"category_id": cat_id})
    await db.categories.delete_one({"id": cat_id})
    return {"ok": True}


class MenuItemIn(BaseModel):
    category_id: str
    name: str
    name_en: Optional[str] = None
    description: str = ""
    description_en: Optional[str] = None
    price: Optional[float] = None
    image: Optional[str] = None
    order: int = 0
    visible: bool = True
    featured: bool = False


@api_router.post("/admin/items")
async def create_item(body: MenuItemIn, user=Depends(require_admin)):
    item = MenuItem(**body.model_dump())
    await db.menu_items.insert_one(item.model_dump())
    return item


@api_router.put("/admin/items/{item_id}")
async def update_item(item_id: str, body: dict, user=Depends(require_admin)):
    allowed_keys = {"category_id", "name", "name_en", "description", "description_en",
                    "price", "image", "order", "visible", "featured"}
    allowed = {k: v for k, v in body.items() if k in allowed_keys}
    r = await db.menu_items.update_one({"id": item_id}, {"$set": allowed})
    if r.matched_count == 0:
        raise HTTPException(status_code=404, detail="Ürün bulunamadı")
    return {"ok": True}


@api_router.delete("/admin/items/{item_id}")
async def delete_item(item_id: str, user=Depends(require_admin)):
    await db.menu_items.delete_one({"id": item_id})
    return {"ok": True}


@api_router.get("/admin/settings")
async def admin_settings_get(user=Depends(require_admin)):
    doc = await db.settings.find_one({"id": "site"}, {"_id": 0})
    return {**Settings().model_dump(), **(doc or {})}


@api_router.put("/admin/settings")
async def update_settings(body: dict, user=Depends(require_admin)):
    allowed_keys = set(Settings.model_fields.keys()) - {"id"}
    allowed = {k: v for k, v in body.items() if k in allowed_keys}
    await db.settings.update_one({"id": "site"}, {"$set": allowed}, upsert=True)
    return {"ok": True}


@api_router.get("/admin/reservations")
async def admin_reservations(user=Depends(require_admin)):
    return await db.reservations.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)


@api_router.put("/admin/reservations/{res_id}")
async def update_reservation(res_id: str, body: dict, user=Depends(require_admin)):
    if "status" in body and body["status"] in {"new", "confirmed", "cancelled"}:
        await db.reservations.update_one({"id": res_id}, {"$set": {"status": body["status"]}})
    return {"ok": True}


ALLOWED_IMAGE_TYPES = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif"}
MAX_UPLOAD_SIZE = 5 * 1024 * 1024


@api_router.post("/admin/upload")
async def upload_image(file: UploadFile = File(...), user=Depends(require_admin)):
    ext = ALLOWED_IMAGE_TYPES.get(file.content_type)
    if not ext:
        raise HTTPException(status_code=400, detail="Sadece JPG, PNG, WEBP veya GIF yükleyebilirsiniz.")
    data = await file.read()
    if len(data) > MAX_UPLOAD_SIZE:
        raise HTTPException(status_code=400, detail="Dosya 5MB'dan büyük olamaz.")
    path = f"{APP_NAME}/uploads/{uuid.uuid4()}.{ext}"
    try:
        result = await put_object(path, data, file.content_type)
    except Exception as e:
        logger.error(f"Upload failed: {e}")
        raise HTTPException(status_code=502, detail="Dosya yüklenemedi, lütfen tekrar deneyin.")
    await db.files.insert_one({
        "id": str(uuid.uuid4()),
        "storage_path": result["path"],
        "original_filename": file.filename,
        "content_type": file.content_type,
        "size": result.get("size", len(data)),
        "is_deleted": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    return {"url": f"/api/files/{result['path']}"}


@api_router.get("/files/{path:path}")
async def serve_file(path: str):
    record = await db.files.find_one({"storage_path": path, "is_deleted": False}, {"_id": 0})
    if not record:
        raise HTTPException(status_code=404, detail="File not found")
    try:
        data, content_type = await get_object(path)
    except Exception:
        raise HTTPException(status_code=404, detail="File not found")
    return Response(content=data, media_type=record.get("content_type", content_type),
                    headers={"Cache-Control": "public, max-age=86400"})


class GalleryIn(BaseModel):
    image: str
    alt: str = ""
    tall: bool = False
    order: int = 0
    visible: bool = True


@api_router.get("/admin/gallery")
async def admin_gallery(user=Depends(require_admin)):
    return await db.gallery.find({}, {"_id": 0}).sort("order", 1).to_list(200)


@api_router.post("/admin/gallery")
async def create_gallery_photo(body: GalleryIn, user=Depends(require_admin)):
    photo = GalleryPhoto(**body.model_dump())
    await db.gallery.insert_one(photo.model_dump())
    return photo


@api_router.put("/admin/gallery/{photo_id}")
async def update_gallery_photo(photo_id: str, body: dict, user=Depends(require_admin)):
    allowed = {k: v for k, v in body.items() if k in {"image", "alt", "tall", "order", "visible"}}
    r = await db.gallery.update_one({"id": photo_id}, {"$set": allowed})
    if r.matched_count == 0:
        raise HTTPException(status_code=404, detail="Fotoğraf bulunamadı")
    return {"ok": True}


@api_router.delete("/admin/gallery/{photo_id}")
async def delete_gallery_photo(photo_id: str, user=Depends(require_admin)):
    await db.gallery.delete_one({"id": photo_id})
    return {"ok": True}


class CampaignIn(BaseModel):
    title: str
    description: str = ""
    image: Optional[str] = None
    active: bool = True


@api_router.get("/admin/campaigns")
async def admin_campaigns(user=Depends(require_admin)):
    return await db.campaigns.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)


@api_router.post("/admin/campaigns")
async def create_campaign(body: CampaignIn, user=Depends(require_admin)):
    camp = Campaign(**body.model_dump())
    await db.campaigns.insert_one(camp.model_dump())
    return camp


@api_router.put("/admin/campaigns/{camp_id}")
async def update_campaign(camp_id: str, body: dict, user=Depends(require_admin)):
    allowed = {k: v for k, v in body.items() if k in {"title", "description", "image", "active"}}
    await db.campaigns.update_one({"id": camp_id}, {"$set": allowed})
    return {"ok": True}


@api_router.delete("/admin/campaigns/{camp_id}")
async def delete_campaign(camp_id: str, user=Depends(require_admin)):
    await db.campaigns.delete_one({"id": camp_id})
    return {"ok": True}


# ---------- Seed ----------
SEED_CATEGORIES = [
    {"name": "Ana Yemekler", "name_en": "Main Dishes", "slug": "ana-yemekler", "order": 0},
    {"name": "Tatlılar", "name_en": "Desserts", "slug": "tatlilar", "order": 1},
    {"name": "Soğuk İçecekler", "name_en": "Cold Drinks", "slug": "soguk-icecekler", "order": 2},
    {"name": "Sıcak İçecekler", "name_en": "Hot Drinks", "slug": "sicak-icecekler", "order": 3},
]

SEED_ITEMS = {
    "ana-yemekler": [
        ("Kumpir", "Taş fırında pişmiş kumpirlik özel patates ile tereyağ ve kaşar peynirinin buluşması.", "/images/kumpir.jpg", True),
        ("Et Burger", "Dana etinden hazırlanmış hamburger köftesi, patates kızartması.", "/images/et-burger.jpg", True),
        ("Tavuk Burger", "Tavuk etinden hazırlanmış hamburger köftesi, patates kızartması.", "/images/tavuk-burger.jpg", False),
        ("Karışık Izgara", "Dana bonfile, tavuk pirzola, kasap köfte, içli köfte, patates kızartması, pilav.", "/images/karisik-izgara.jpg", False),
        ("Pizza Çeşitleri", "Karışık pizza, margarita pizza, kavurmalı pizza, tavuklu pizza.", "/images/pizza.jpg", True),
        ("İçli Köfte", "Bulgurun hamur haline getirilerek içinin hazırlanmış kıyma ile doldurulması.", "/images/icli-kofte.jpg", False),
        ("Çorba Çeşitleri", "Asırlık lezzet, özenle seçilen mercimeğin sebzelerle bütünleşmesi.", "/images/corba.jpg", False),
        ("Patates Kızartması", "Kızartmalık patates yetiştirilen tarlalardan gelen patateslerin çıtır çıtır kızartılmış hali.", "/images/patates.jpg", False),
        ("Tost Çeşitleri", "Kaşarlı, sucuklu ve karışık tost çeşitlerimiz.", "/images/nord-banner.jpg", False),
        ("Sucuklu Yumurta", "Geleneksel kahvaltılarımızın vazgeçilmezi.", "/images/sucuklu-yumurta.jpg", False),
        ("Salata Çeşitleri", "Taze sebzelerle hazırlanan salata çeşitlerimiz. Ton balıklı, beyaz peynirli, mevsim salata.", "/images/salata.jpg", False),
        ("Serpme Kahvaltı", "Sıcacık çay eşliğinde çeşit çeşit ürünlerden oluşan tam bir serpme kahvaltı.", "/images/serpme.jpg", True),
    ],
    "tatlilar": [
        ("Waffle", "Taze waffle hamuru, muhteşem waffle çikolatası, muz, çilek, kivi ve soslar.", "/images/waffle.jpg", True),
        ("Künefe", "Taze künefe kadayıfı ve özel künefe peynirinin şerbetle buluşması.", "/images/kunefe.jpg", True),
        ("Katmer", "İncecik açılarak hazırlanmış katmerlik yufkanın fıstık ile uyumu.", "/images/katmer.jpg", False),
        ("Sufle", "Muhteşem sufle kekinin içindeki akıcı çikolatanın lezzetine bayılacaksınız.", "/images/sufle.jpg", False),
        ("Sütlaç", "Geleneksel tatlımız sizler için özenle hazırlanır. Mutlaka denemelisiniz.", "/images/sutlac.jpg", False),
        ("Trileçe", "Yumuşacık kekin sütle uyumu sonrasında karamel sosu ile taçlandırılması.", "/images/trilece.jpg", False),
    ],
    "soguk-icecekler": [
        ("Milkshake Çeşitleri", "Süt ve meyvelerle hazırlanan serinleten lezzetler. Muz, kivi, çilek, kavun, çikolata.", "/images/milkshake.jpg", False),
        ("Frozen Çeşitleri", "Buz ve meyve püresiyle hazırlanan serinleten lezzet. Kivi, çilek, kavun.", "/images/frozen.jpg", False),
        ("Buzlu Kahve Çeşitleri", "Espresso ile hazırlanan klasik kahvelerin buzla hazırlanarak servis edilmesi.", "/images/buzlu-kahve.jpg", False),
        ("Taze Meyve Suları", "Taze meyvelerden soğuk sıkım meyve suları. Portakal, elma, havuç suyu.", "/images/meyve-suyu-1.jpg", False),
        ("Atom & Limonata", "Taze meyvelerden soğuk sıkım. Atom, nar suyu, limonata çeşitleri.", "/images/meyve-suyu-2.jpg", False),
        ("Kutu İçecekler", "Serinleten kutu içecekler. Cola, Fanta, Sprite, Cappy, Fuse Tea ve çeşitleri.", "/images/kutu-icecek.jpg", False),
    ],
    "sicak-icecekler": [
        ("Türk Kahvesi", "Özenle seçilmiş yöresel kahve çekirdeklerinin çekilerek hazırlanan geleneksel lezzet.", "/images/turk-kahvesi.jpg", True),
        ("Espresso", "Özenle seçilmiş yöresel kahve çekirdeklerinin çekilerek hazırlanan keskin lezzet.", "/images/espresso.jpg", False),
        ("Latte", "Süt ve yöresel kahve çekirdekleri ile hazırlanan espressonun buluşması.", "/images/latte.jpg", False),
        ("Cappuccino", "Köpüklü süt ve yöresel kahve çekirdekleri ile hazırlanan espressonun buluşması.", "/images/cappuccino.jpg", False),
        ("Americano", "Su ve kahve çekirdekleri ile hazırlanan double espressonun buluşması.", "/images/americano.jpg", False),
        ("Filtre Kahve", "Damla demlemeli kağıt kahve filtresi ile hazırlanan muhteşem kahve deneyimi.", "/images/filtre-kahve.jpg", False),
        ("Çay Çeşitleri", "Çeşit çeşit şifalı bitki çayları, ince belli bardakta geleneksel Türk çayı.", "/images/cay.jpg", False),
        ("Salep", "Kaliteli salep ve tarçının birlikteliği soğuk kış günleri için sizleri bekliyor.", "/images/salep.jpg", False),
        ("Sıcak Çikolata", "Süt ve kaliteli çikolatanın birlikteliği soğuk kış günleri için sizleri bekliyor.", "/images/sicak-cikolata.jpg", False),
    ],
}


SEED_GALLERY = [
    ("/images/kumpir.jpg", "Taş fırında kumpir", False),
    ("/images/kahve-atmosfer.jpg", "Kahve atmosferi", True),
    ("/images/et-burger.jpg", "Et burger", False),
    ("/images/kunefe.jpg", "Künefe", False),
    ("/images/serpme.jpg", "Serpme kahvaltı", True),
    ("/images/waffle.jpg", "Waffle", False),
    ("/images/pizza.jpg", "Pizza çeşitleri", False),
    ("/images/tatli-atmosfer.jpg", "Tatlılar", True),
    ("/images/latte.jpg", "Latte", False),
    ("/images/karisik-izgara.jpg", "Karışık ızgara", False),
    ("/images/milkshake.jpg", "Milkshake", False),
    ("/images/turk-kahvesi.jpg", "Türk kahvesi", True),
    ("/images/icecek-atmosfer.jpg", "Soğuk içecekler", False),
    ("/images/katmer.jpg", "Katmer", False),
    ("/images/burger-atmosfer.jpg", "Burger çeşitleri", False),
    ("/images/sufle.jpg", "Sufle", False),
]


async def seed():
    if await db.categories.count_documents({}) == 0:
        for c in SEED_CATEGORIES:
            cat = Category(**c)
            await db.categories.insert_one(cat.model_dump())
            for i, (name, desc, img, feat) in enumerate(SEED_ITEMS[cat.slug]):
                item = MenuItem(category_id=cat.id, name=name, description=desc,
                                image=img, order=i, featured=feat)
                await db.menu_items.insert_one(item.model_dump())
        logger.info("Menu seeded")
    if await db.settings.count_documents({"id": "site"}) == 0:
        s = Settings(
            hero_subtitle="Özenle seçilmiş kumpirlik patateslerin, yöresel tereyağ ve kaşar peynirinin buluşması. Usta ellerde hazırlanan lezzetler.",
            about_text="Birinci sınıf ürünlerle, usta şeflerin deneyimi ile hazırladığımız ürünlerimizi mutlaka denemelisiniz. Muhteşem lezzetlerimizi deneyimledikten sonra taze çekilmiş kahvelerimizle taçlandırmalısınız.",
            quality_text="Ürünlerimizi hazırlarken kullandığımız hammaddeler onaylı birinci sınıf gıda ürünleridir. Hijyen kurallarına uymak ana prensibimizdir. Tarım Bakanlığı tarafından düzenli denetlenmekteyiz.",
            vision_text="Cafe Del Nord ailesi olarak hizmet ve ürün kalitemizi en üst düzeyde tutmak asli görevimizdir. Bu ilkeyle hizmet sektöründe çalışmaya devam etmekteyiz.",
            phone="0 (212) 809 27 62",
            maps_url="https://www.google.com/maps/search/?api=1&query=Cafe+Del+Nord",
        )
        await db.settings.insert_one(s.model_dump())
        logger.info("Settings seeded")
    if await db.gallery.count_documents({}) == 0:
        for i, (img, alt, tall) in enumerate(SEED_GALLERY):
            photo = GalleryPhoto(image=img, alt=alt, tall=tall, order=i)
            await db.gallery.insert_one(photo.model_dump())
        logger.info("Gallery seeded")


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def on_startup():
    await seed()
    try:
        await init_storage()
        logger.info("Storage initialized")
    except Exception as e:
        logger.error(f"Storage init failed: {e}")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
