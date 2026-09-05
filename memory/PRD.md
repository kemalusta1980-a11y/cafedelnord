# PRD — CAFE DEL NORD Restoran Web Sitesi

## Orijinal Problem
www.cafedelnord.com.tr'nin içeriğini (menü, görseller, telefon, slogan) koruyarak tasarımı sıfırdan, 2026 standartlarında premium bir restoran web sitesi olarak yeniden yapmak. Admin paneli (Google auth), rezervasyon (DB'ye kayıt), TR/EN altyapı, SEO, KVKK/cookie, GA4-hazır analytics.

## Kullanıcı Seçimleri
- Kaynak site: www.cafedelnord.com.tr
- Admin girişi: Emergent-managed Google Auth (ilk giriş yapan kullanıcı admin olur)
- Rezervasyon: veritabanına kaydedilir, admin panelinden yönetilir

## İçerik Değerlendirmesi (KEEP/IMPROVE/DISCARD/MISSING)
- KEEP: Slogan "Bir cafeden daha fazlası", hero "Efsane lezzet sizlerle", telefon 0(212) 809 27 62, 33 menü ürünü + açıklamaları, 37 ürün fotoğrafı (lokale indirildi: /frontend/public/images/), kalite/vizyon/misyon metinleri
- IMPROVE: Menü kategorileştirildi (Ana Yemekler/Tatlılar/Soğuk İçecekler/Sıcak İçecekler), metinler modern sunuma uyarlandı
- DISCARD: Eski WordPress tasarımı, eski layout
- MISSING (uydurulmadı, admin panelinden doldurulabilir): adres, e-posta, çalışma saatleri, Instagram/Facebook linkleri, ürün fiyatları, hukuki metinler (placeholder olarak işaretli)

## Mimari
- Backend: FastAPI (/api prefix), MongoDB (motor). Koleksiyonlar: categories, menu_items, settings, reservations, campaigns, users, user_sessions. Startup seed (idempotent). In-memory rate limit (rezervasyon: 5/5dk/IP).
- Auth: Emergent Google OAuth. POST /api/auth/session, cookie session_token (httpOnly, secure, sameSite=None, 7 gün). İlk kullanıcı role=admin, sonrakiler viewer (403).
- Frontend: React + framer-motion + lenis + react-fast-marquee. Dark premium tema (#030303 + gold #d4af37), Cabinet Grotesk / Cormorant Garamond / Manrope.
- Sayfalar: / (kinetik hero, marquee, kampanyalar, öne çıkanlar, manifesto, split bölümler, Instagram CTA), /menu (sticky kategori nav + arama), /hakkimizda, /galeri (masonry+lightbox), /iletisim (maps embed, ara/yol tarifi), /rezervasyon, /admin (5 sekme), yasal x3 (placeholder), cookie banner, mobil sticky action bar.
- SEO: index.html meta+OG+Restaurant JSON-LD, sitemap.xml, robots.txt. Analytics: src/lib/analytics.js GA4-hazır (gtag varsa event yollar): phone_call_click, directions_click, menu_view, reservation_click, instagram_click.
- TR/EN altyapı: name_en/description_en alanları (admin'den düzenlenebilir), navbar dil değiştirici, EN yoksa TR'ye düşer.

## Yapılanlar (2026-06)
- MVP tamamlandı, testing agent: backend 15/15, frontend tüm kritik akışlar PASS (iteration_1.json)
- İterasyon 2: Admin görsel dosya yükleme (Emergent object storage, POST /api/admin/upload → /api/files/{path}), rezervasyon e-posta bildirimi (Emergent managed Resend, alıcı: settings.notification_email), GET /api/admin/settings (notification_email public settings'ten gizlendi). Testler: 12/12 + regresyon PASS (iteration_2.json)
- İterasyon 3 (bug fix): Önizlemede görülen "Uncaught runtime errors" CRA overlay hatası giderildi
- İterasyon 4: Galeri yönetimi (gallery koleksiyonu, GET /api/gallery + admin CRUD, admin panelde Galeri sekmesi: yükle/alt text/sıra/dikey/gizle/sil) ve WhatsApp yüzen butonu (settings.whatsapp, wa.me linki, boşsa gizli). Testler: 7/7 + tüm akışlar PASS (iteration_4.json)
- İterasyon 5 (bug fix): "Boş siyah ekran" bildirimi — yeniden üretilemedi (muhtemel geçici: derleme anı/stale chunk). Kalıcı önlem: index.html #root içine markalı HTML loader + App'e ErrorBoundary eklendi. Tüm sayfalar taze yüklemede doğrulandı (iteration_5.json)
- İterasyon 6 (bug fix, RCA bulundu): ErrorBoundary ekranı gerçek nedeni — SiteContext ve CookieConsent render sırasında localStorage'a erişiyordu; üçüncü taraf depolamanın engellendiği önizleme iframe'lerinde/tarayıcılarda SecurityError fırlatıp render'ı çökertiyordu. Fix: lib/storage.js safeStorage (try/catch) wrapper, tüm erişimler taşındı. Engelli-depolama simülasyonu + normal mod testing agent ile doğrulandı, %100 PASS (iteration_6.json)
- İterasyon 7 (bug fix, ikinci RCA): Kullanıcı tarayıcısında IntersectionObserver yok — framer-motion whileInView ReferenceError → ErrorBoundary. Fix: intersection-observer + resize-observer-polyfill paketleri (index.js'de), Lenis init try/catch, ErrorBoundary hata detayını gösteriyor (error-detail). 5 ortam senaryosu (IO/RO/localStorage engelli kombinasyonları) testing agent ile %100 PASS (iteration_7.json)
- İterasyon 8 (kullanıcı isteği + bug fix): Rezervasyon bölümü kapatıldı (reservation_enabled=false: nav/hero/footer CTA'lar gizli, /rezervasyon→/iletisim redirect, POST /api/reservations 403 — admin Ayarlar'dan tekrar açılabilir). "destroy is not a function" hatası düzeltildi: kısa gövdeli useEffect'ler (ScrollToTop window.scrollTo, Navbar setOpen) süslü gövdeye çevrildi — kullanıcı ortamında scrollTo patch'lenince dönen obje React cleanup olarak çağrılıp çöküyordu. Lenis cleanup try/catch, ErrorBoundary stack gösterimi. 13 senaryo %100 PASS (iteration_8.json)
- İterasyon 9: Çoklu dil genişletildi — TR/EN/DE/RU/AR. lib/i18n.js (5 dil ~45 UI metni), Navbar Globe dropdown dil seçici, Arapça'da RTL (document.dir) + letter-spacing:0 ligature koruması, backend name_de/ru/ar + description_de/ru/ar alanları, admin ürün formunda çeviri dili sekmeleri. Çeviri girilmedikçe içerik TR fallback. Testler %100 PASS (iteration_9.json)
- İterasyon 10: WhatsApp iletişim aktifleştirildi — numara 905342878402, karşılama mesajı "Merhaba, bilgi almak istiyorum." (settings.whatsapp_message, admin Ayarlar'dan değiştirilebilir). Buton href doğrulandı: wa.me/905342878402?text=... Numara normalizasyonu: baştaki 0 → 90.
- İterasyon 11: Gerçek adres girildi (Karadeniz Mahallesi, Eski Edirne Asfaltı Cad., Venezia Mega Outlet AVM, 34250 Gaziosmanpaşa / İstanbul — Title Case, kullanıcı isteği), maps_url gerçek konuma güncellendi, index.html JSON-LD'ye PostalAddress eklendi. Harita doğru konumu gösteriyor (doğrulandı). Kalan MISSING: e-posta, çalışma saatleri, Instagram, fiyatlar.
- İterasyon 12: Çalışma saatleri girildi (hafta içi 10:00-22:00, hafta sonu 10:00-23:00) — iletişim + footer'da görünüyor, JSON-LD openingHoursSpecification eklendi. Kalan MISSING: e-posta, Instagram, fiyatlar.
- İterasyon 13: E-posta girildi (destek@cafedelnord.com.tr) — iletişim + footer + JSON-LD. Kalan MISSING: Instagram, fiyatlar.
- İterasyon 14: 33 ürün açıklaması gastronomik ~120 karakterlik metinlerle yeniden yazıldı (kaynak: /app/scripts/update_descriptions.py). Bozuk serpme.jpg (alt yarısı gri/truncated) yeni üretilen fotoğrafla; iki-tabaklı salata.jpg ve pizza.jpg tek-özneli ortalanmış versiyonlarla değiştirildi (image edit, 1264x848). Testler %100 PASS (iteration_10.json)
- İterasyon 15: Tüm menü içeriği 4 dile çevrildi — 33 ürün adı+açıklaması ve 4 kategori adı EN/DE/RU/AR (kaynak: /app/scripts/translate_items.py, DB'ye yazıldı). Eksik çeviri: 0. Frontend'de DE/RU/AR menü render doğrulandı. Kalan MISSING: Instagram, fiyatlar.
- İterasyon 16: Instagram aktifleştirildi (instagram.com/cafedelnord — footer, iletişim, ana sayfa CTA). Hakkımızda + ana sayfa içerik metinleri 4 dile çevrildi: settings'e tagline/hero_subtitle/about_text/quality_text/vision_text _{en,de,ru,ar} alanları yazıldı; SiteContext'e st() localized-settings getter eklendi; Home manifesto ve About chapter başlık/metinleri i18n anahtarlarına taşındı. DE/RU render doğrulandı. Kalan MISSING: fiyatlar.
- İterasyon 17 (bug fix, deploy parite): Mobilde (deploy edilmiş cafedelnord.com.tr) içerikler boş görünüyordu — RCA: içerik güncellemeleri dev DB'ye yazılmıştı, prod DB eski seed'de kalmıştı. Fix: tüm güncel içerik /app/backend/seed_data.json'a export edildi (export: /app/scripts/export_seed.py); server.py seed() SÜRÜMLÜ + NON-DESTRUCTIVE upsert migrasyonuna çevrildi (SEED_VERSION=2, db.meta takibi; kategoriler slug ile, ürünler name ile, galeri image ile upsert; delete yok). Testing agent boş-DB simülasyonu + idempotans + mobil parite %100 PASS (iteration_11.json); deployment_agent: PASS, production-ready. ÖNEMLİ İŞLEYİŞ: içerik değişikliklerinde deploy öncesi export_seed.py çalıştırıp SEED_VERSION artırılmalı. — zararsız ResizeObserver loop hataları craco devServer overlay filtresi + index.js global error listener ile bastırıldı. Testing agent: tüm sayfalar + resize/scroll stres testleri PASS, hiçbir overlay/hata yok (iteration_3.json)

## Backlog / Sonraki Adımlar
- P1: Ürün görseli dosya yükleme (şu an URL ile), admin'e GA4 Measurement ID alanı
- P1: Gerçek Instagram/adres/saat bilgilerinin girilmesi (site sahibi)
- P2: EN içerik çeviri onay akışı, galeri fotoğraflarının admin'den yönetimi
- P2: Rezervasyon e-posta/SMS bildirimi

## Rollback Doğrulaması (Haziran 2026 fork)
- Kod Sep 2 12:20 durumuna (altın/siyah tema) geri alındı; kullanıcı onayladı.
- iteration_13 testing_agent regresyonu: 11 ziyaretçi akışı (ana sayfa, menü 33 ürün/4 kategori, galeri 16 foto, iletişim, hakkımızda, 5 dil + AR RTL, WhatsApp FAB, mobil 390px, rezervasyon gizli, cookie consent, console hataları) %100 GEÇTİ. Runtime hatası yok.
- Kozmetik düzeltme: MenuItemCard.js'deki geçersiz `font-800` sınıfı kaldırıldı.
- Bekleyen: Kullanıcının bir sonraki tasarım/özellik talebi. Fiyat/sepet/e-ticaret yasağı sürüyor. Rezervasyon kapalı kalmalı.

## Sayfa İçerikleri Editörü (Haziran 2026)
- Admin panele "Sayfa İçerikleri" sekmesi eklendi: tüm sayfa metinleri (TR) ve görselleri (hero, kahve/tatlı bölümü, hakkımızda 4 görsel) düzenlenebilir.
- TR metin kaydedilince EN/DE/RU/AR çevirileri otomatik AI ile (gpt-5.4, EMERGENT_LLM_KEY) oluşturulur. Ayarlar sekmesindeki tagline/hero_subtitle/about_text/quality_text/vision_text de otomatik çevriliyor.
- Backend: GET /api/content (public), GET/PUT /api/admin/content, translation_service.py. Sadece değişen metinler çevrilir.
- iteration_14 testi: backend 9/9, frontend %100 GEÇTİ.

## Yasal Metin Editörü (Haziran 2026)
- Sayfa İçerikleri sekmesine "Yasal Sayfalar" grubu eklendi: Gizlilik, KVKK, Çerez Politikası metinleri (büyük textarea) TR girilir, 4 dile otomatik çevrilir.
- LegalPage.js artık content'ten okur; boşsa placeholder uyarısı gösterir. Çerez politikasına temel bir gerçek metin kaydedildi; Gizlilik ve KVKK hâlâ placeholder (işletme sahibi doldurmalı).
- Curl + screenshot ile doğrulandı (TR/EN gösterim + placeholder korunumu).
