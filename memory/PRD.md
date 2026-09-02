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
- İterasyon 17 (bug fix, deploy parite): Mobilde (deploy edilmiş cafedelnord.com.tr) içerikler boş görünüyordu — RCA: içerik güncellemeleri dev DB'ye yazılmıştı, prod DB eski seed'de kalmıştı. Fix: tüm güncel içerik /app/backend/seed_data.json'a export edildi (export: /app/scripts/export_seed.py); server.py seed() SÜRÜMLÜ + NON-DESTRUCTIVE upsert migrasyonuna çevrildi (SEED_VERSION=2, db.meta takibi; kategoriler slug ile, ürünler name ile, galeri image ile upsert; delete yok). Testing agent boş-DB simülasyonu + idempotans + mobil parite %100 PASS (iteration_11.json); deployment_agent: PASS, production-ready. ÖNEMLİ İŞLEYİŞ: içerik değişikliklerinde deploy öncesi export_seed.py çalıştırıp SEED_VERSION artırılmalı.
- İterasyon 18 (redesign): Kullanıcının referans görseline göre görsel yeniden tasarım — hero split layout (sol metin+CTA, sağ dairesel kumpir görseli), h1/h2 Cormorant Garamond serif, kart fiyat rozeti kaldırıldı (fiyat/sepet/sipariş yasak — kullanıcı kuralı). Testler %100 PASS (iteration_12.json).
- İterasyon 19 (palet düzeltmesi): Kullanıcı referanstaki MOR paleti istedi ("hala siyah arayüz"). Tüm koyu hexler sed ile mora çevrildi: #030303→#170f2e, #050505→#1b1236, #0a/#0c→#221645, #0d0d0d→#251a4a, accent #e63946→#a78bfa (lila; --gold değişkeni ve 'gold' class adları aynı kaldı). body: mor gradient (165deg #6d4bc4→#4a2f96→#2a1b5e→#170f2e fixed); App.js kök sarmalayıcı bg şeffaf; hero kendi gradientsiz. Screenshot ile masaüstü doğrulandı. NOT: Yayın için yeniden deploy gerekli.
- İterasyon 20 (yaratıcı cila): Hero'ya dönen kesikli halka (ring-spin 60s), nefes alan radial ışıltı (hero-glow), süzülen mini lezzet madalyonları (float-chip a/b: künefe + latte, float animasyonları, mobilde küçülür), hero altına mevcut i18n içerikli üç özellik rozeti (hero-feature-strip: m1/m2/m3Title), lila tonlu marquee, hero-dish hover scale+rotate. Masaüstü screenshot doğrulandı — referans görselle birebir uyumlu premium mor tasarım. — zararsız ResizeObserver loop hataları craco devServer overlay filtresi + index.js global error listener ile bastırıldı. Testing agent: tüm sayfalar + resize/scroll stres testleri PASS, hiçbir overlay/hata yok (iteration_3.json)

## Backlog / Sonraki Adımlar
- P1: Ürün görseli dosya yükleme (şu an URL ile), admin'e GA4 Measurement ID alanı
- P1: Gerçek Instagram/adres/saat bilgilerinin girilmesi (site sahibi)
- P2: EN içerik çeviri onay akışı, galeri fotoğraflarının admin'den yönetimi
- P2: Rezervasyon e-posta/SMS bildirimi
