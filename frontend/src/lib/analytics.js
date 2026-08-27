// GA4 hazır altyapı: window.gtag mevcutsa event gönderir, yoksa sessizce loglar.
export const trackEvent = (name, params = {}) => {
  if (typeof window.gtag === "function") {
    window.gtag("event", name, params);
  } else if (process.env.NODE_ENV === "development") {
    console.debug("[analytics]", name, params);
  }
};

export const events = {
  phoneCall: () => trackEvent("phone_call_click"),
  directions: () => trackEvent("directions_click"),
  menuView: (category) => trackEvent("menu_view", { category }),
  reservationClick: () => trackEvent("reservation_click"),
  instagramClick: () => trackEvent("instagram_click"),
};
