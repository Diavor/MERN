import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import Icon from "../ui/Icon";
import "./AdminLayout.scss";

// The storefront Nav is not rendered on /admin (see App.js), so the console
// owns the full viewport. Kept as a CSS var in case chrome returns.
const NAV_OFFSET = 0;

const NAV_ITEMS = [
  { to: "/admin", label: "Dashboard", title: "Panoramica", Ic: Icon.menu, match: (p) => p === "/admin" },
  { to: "/admin/orderlist", label: "Ordini", title: "Tutti gli ordini", Ic: Icon.bag, match: (p) => p.startsWith("/admin/order") },
  { to: "/admin/kitchen", label: "Cucina", title: "Display cucina", Ic: Icon.flame, match: (p) => p.startsWith("/admin/kitchen") },
  { to: "/admin/delivery", label: "Consegne", title: "Consegne · Corriere", Ic: Icon.bag, match: (p) => p.startsWith("/admin/delivery") },
  { to: "/admin/productlist", label: "Prodotti", title: "Catalogo prodotti", Ic: Icon.flame, match: (p) => p.startsWith("/admin/product") },
  { to: "/admin/pages", label: "Pagine", title: "Pagine del sito", Ic: Icon.menu, match: (p) => p.startsWith("/admin/pages") },
  { to: "/admin/coupons", label: "Coupon", title: "Codici sconto", Ic: Icon.star, match: (p) => p.startsWith("/admin/coupons") },
  { to: "/admin/zones", label: "Zone consegna", title: "Zone di consegna", Ic: Icon.leaf, match: (p) => p.startsWith("/admin/zones") },
  { to: "/admin/customers", label: "Clienti", title: "Clienti", Ic: Icon.user, match: (p) => p.startsWith("/admin/customers") || p.startsWith("/admin/user") },
  { to: "/admin/settings", label: "Impostazioni", title: "Impostazioni", Ic: Icon.leaf, match: (p) => p.startsWith("/admin/settings") },
];

const AdminLayout = ({ children }) => {
  const { pathname } = useLocation();
  const { userInfo } = useSelector((s) => s.userLogin);
  const active = NAV_ITEMS.find((i) => i.match(pathname)) || NAV_ITEMS[0];

  return (
    <div className="admin-layout" style={{ "--nav-offset": NAV_OFFSET + "px" }}>
      {/* SIDEBAR */}
      <aside className="admin-layout__sidebar">
        <div className="admin-layout__head">
          <div className="eyebrow admin-layout__head-eyebrow">Console</div>
          <div className="display admin-layout__title">
            Amministrazione
          </div>
          {userInfo && (
            <div className="mono admin-layout__user">
              {userInfo.name} · Owner
            </div>
          )}
        </div>

        <nav className="admin-layout__nav">
          {NAV_ITEMS.map((it) => {
            const on = it.match(pathname);
            const Ic = it.Ic;
            return (
              <Link
                key={it.to}
                to={it.to}
                className={"admin-layout__link" + (on ? " is-active" : "")}
              >
                <span className="admin-layout__link-icon">
                  <Ic />
                </span>
                <span className="admin-layout__link-label">{it.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="admin-layout__foot">
          <Link to="/" className="b-btn sm ghost admin-layout__foot-btn">
            ← Torna al sito
          </Link>
        </div>
      </aside>

      {/* CONTENT */}
      <div className="admin-layout__content">
        <div className="admin-layout__header">
          <div>
            <div className="eyebrow admin-layout__header-eyebrow">{active.label}</div>
            <h1 className="display admin-layout__header-title">
              {active.title}
            </h1>
          </div>
          {userInfo && (
            <div className="admin-layout__avatar">
              {(userInfo.name || "A").charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <div className="admin-layout__body">{children}</div>
      </div>
    </div>
  );
};

export default AdminLayout;
