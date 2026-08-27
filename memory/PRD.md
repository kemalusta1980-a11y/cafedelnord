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

## Backlog / Sonraki Adımlar
- P1: Ürün görseli dosya yükleme (şu an URL ile), admin'e GA4 Measurement ID alanı
- P1: Gerçek Instagram/adres/saat bilgilerinin girilmesi (site sahibi)
- P2: EN içerik çeviri onay akışı, galeri fotoğraflarının admin'den yönetimi
- P2: Rezervasyon e-posta/SMS bildirimi
