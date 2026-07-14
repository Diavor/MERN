import { useEffect, useState } from "react";
import axios from "../../api/axiosConfig";

// Storefront-facing read of the public site settings (restaurant, hours, …).
// GET /api/settings is public. The result is cached at module level so multiple
// consumers (footer, contact page, …) share a single request per page load.
let cache = null;
let inflight = null;

/** @returns {Promise<object>} the settings document (memoised). */
export function fetchPublicSettings() {
  if (cache) return Promise.resolve(cache);
  if (!inflight) {
    inflight = axios
      .get("/api/settings")
      .then((r) => {
        cache = r.data;
        return cache;
      })
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

/**
 * Subscribe to the public settings. Returns `null` until loaded so callers can
 * fall back to static content; never throws (storefront must render regardless).
 * @returns {object|null}
 */
export default function usePublicSettings() {
  const [settings, setSettings] = useState(cache);

  useEffect(() => {
    if (cache) return;
    let alive = true;
    fetchPublicSettings()
      .then((data) => alive && setSettings(data))
      .catch(() => {}); // ignore — caller uses its static fallback
    return () => {
      alive = false;
    };
  }, []);

  return settings;
}
