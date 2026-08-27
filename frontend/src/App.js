import { useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Lenis from "@studio-freight/lenis";
import { Toaster } from "sonner";
import { SiteProvider } from "@/context/SiteContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { StickyBar } from "@/components/StickyBar";
import { CookieConsent } from "@/components/CookieConsent";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import Home from "@/pages/Home";
import MenuPage from "@/pages/MenuPage";
import AboutPage from "@/pages/AboutPage";
import GalleryPage from "@/pages/GalleryPage";
import ContactPage from "@/pages/ContactPage";
import ReservationPage from "@/pages/ReservationPage";
import LegalPage from "@/pages/LegalPage";
import AdminPage from "@/pages/AdminPage";
import AuthCallback from "@/pages/AuthCallback";

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => window.scrollTo(0, 0), [pathname]);
  return null;
};

function AppRouter() {
  const location = useLocation();
  // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
  if (location.hash?.includes("session_id=")) {
    return <AuthCallback />;
  }
  const isAdmin = location.pathname.startsWith("/admin");

  return (
    <>
      <ScrollToTop />
      {!isAdmin && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/menu" element={<MenuPage />} />
        <Route path="/hakkimizda" element={<AboutPage />} />
        <Route path="/galeri" element={<GalleryPage />} />
        <Route path="/iletisim" element={<ContactPage />} />
        <Route path="/rezervasyon" element={<ReservationPage />} />
        <Route path="/gizlilik-politikasi" element={<LegalPage type="privacy" />} />
        <Route path="/kvkk" element={<LegalPage type="kvkk" />} />
        <Route path="/cerez-politikasi" element={<LegalPage type="cookies" />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
      {!isAdmin && <Footer />}
      {!isAdmin && <StickyBar />}
      {!isAdmin && <WhatsAppButton />}
      {!isAdmin && <CookieConsent />}
    </>
  );
}

function App() {
  useEffect(() => {
    const lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    let rafId;
    const raf = (time) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);
    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  return (
    <div className="grain min-h-screen bg-[#030303] text-white">
      <BrowserRouter>
        <SiteProvider>
          <AppRouter />
          <Toaster position="top-center" theme="dark" richColors />
        </SiteProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
