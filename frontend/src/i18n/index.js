import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import axios from "axios";
import it from "./locales/it.json";
import en from "./locales/en.json";

// Storefront i18n. Italian is the base language (and the fallback — the admin
// console stays Italian-only and never calls t()). Resources are bundled, so
// translations resolve synchronously and Suspense never triggers.
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      it: { translation: it },
      en: { translation: en },
    },
    fallbackLng: "it",
    supportedLngs: ["it", "en"],
    load: "languageOnly", // navigator may report "en-US" — collapse to "en"
    interpolation: { escapeValue: false }, // React already escapes output
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
    },
  });

// Keep <html lang> and the API request language in sync with the UI language —
// the backend localizes client-facing errors and the confirmation email from
// Accept-Language (axios here is the configured singleton, see axiosConfig).
const syncLanguage = (lng) => {
  document.documentElement.lang = lng;
  axios.defaults.headers.common["Accept-Language"] = lng;
};
syncLanguage(i18n.language);
i18n.on("languageChanged", syncLanguage);

export default i18n;
