// Thin admin CRUD helper over axios. Admin modules (Zones, Coupons, Pages) are
// self-contained and don't need global Redux state, so they call these directly
// and hold results in local component state. Auth token is read from the same
// persisted session Redux uses.
import axios from "../../api/axiosConfig";

const authConfig = (json = true) => {
  const userInfo = localStorage.getItem("userInfo")
    ? JSON.parse(localStorage.getItem("userInfo"))
    : null;
  return {
    headers: {
      ...(json && { "Content-Type": "application/json" }),
      ...(userInfo?.token && { Authorization: `Bearer ${userInfo.token}` }),
    },
  };
};

const unwrap = (p) =>
  p.then((r) => r.data).catch((err) => {
    const message =
      err.response && err.response.data && err.response.data.message
        ? err.response.data.message
        : err.message;
    throw new Error(message);
  });

// ---- Zones ----
export const fetchZones = () => unwrap(axios.get("/api/zones"));
export const createZone = (body) => unwrap(axios.post("/api/zones", body, authConfig()));
export const updateZone = (id, body) => unwrap(axios.put(`/api/zones/${id}`, body, authConfig()));
export const deleteZone = (id) => unwrap(axios.delete(`/api/zones/${id}`, authConfig(false)));

// ---- Coupons ----
export const fetchCoupons = () => unwrap(axios.get("/api/coupons", authConfig(false)));
export const createCoupon = (body) => unwrap(axios.post("/api/coupons", body, authConfig()));
export const updateCoupon = (id, body) => unwrap(axios.put(`/api/coupons/${id}`, body, authConfig()));
export const deleteCoupon = (id) => unwrap(axios.delete(`/api/coupons/${id}`, authConfig(false)));

// ---- Pages ----
export const fetchPages = () => unwrap(axios.get("/api/pages", authConfig(false)));
export const fetchPage = (id) => unwrap(axios.get(`/api/pages/${id}`, authConfig(false)));
export const createPage = (body) => unwrap(axios.post("/api/pages", body, authConfig()));
export const updatePage = (id, body) => unwrap(axios.put(`/api/pages/${id}`, body, authConfig()));
export const deletePage = (id) => unwrap(axios.delete(`/api/pages/${id}`, authConfig(false)));

// ---- Settings (singleton) ----
export const fetchSettings = () => unwrap(axios.get("/api/settings"));
export const updateSettings = (body) => unwrap(axios.put("/api/settings", body, authConfig()));

// ---- Public helpers (storefront) ----
export const fetchActiveZones = () => unwrap(axios.get("/api/zones?activeOnly=true"));
export const validateCoupon = (code, subtotal) =>
  unwrap(axios.post("/api/coupons/validate", { code, subtotal }));
