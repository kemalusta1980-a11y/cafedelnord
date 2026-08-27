import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie } from "lucide-react";
import { Link } from "react-router-dom";
import { safeStorage } from "../lib/storage";
import { useSite } from "../context/SiteContext";

export const CookieConsent = () => {
  const { t } = useSite();
  const [visible, setVisible] = useState(() => !safeStorage.get("cdn_cookie_consent"));

  const decide = (value) => {
    safeStorage.set("cdn_cookie_consent", value);
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="fixed bottom-20 lg:bottom-6 left-4 right-4 lg:left-auto lg:right-6 lg:max-w-md z-[60] backdrop-blur-xl bg-[#0d0d0d]/95 border border-white/15 rounded-2xl p-5 shadow-2xl"
          data-testid="cookie-banner"
        >
          <div className="flex items-start gap-3">
            <Cookie className="text-gold shrink-0 mt-0.5" size={20} />
            <div>
              <p className="text-sm text-white/80 leading-relaxed">
                {t("cookieText")}{" "}
                <Link to="/cerez-politikasi" className="text-gold underline" data-testid="cookie-policy-link">{t("cookieLink")}</Link>
                {" "}{t("cookieText2")}
              </p>
              <div className="flex gap-3 mt-4">
                <button onClick={() => decide("accepted")} className="btn-pill btn-solid !py-2 !px-4 !text-xs" data-testid="cookie-accept-btn">
                  {t("accept")}
                </button>
                <button onClick={() => decide("rejected")} className="btn-pill btn-ghost !py-2 !px-4 !text-xs" data-testid="cookie-reject-btn">
                  {t("reject")}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
