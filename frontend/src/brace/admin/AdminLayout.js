import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import Icon from "../ui/Icon";

// Sits below the fixed site Nav. Offset clears the header height.
const NAV_OFFSET = 72;

const NAV_ITEMS = [
  { to: "/admin", label: "Dashboard", title: "Panoramica", Ic: Icon.menu, match: (p) => p === "/admin" },
  { to: "/admin/orderlist", label: "Ordini", title: "Tutti gli ordini", Ic: Icon.bag, match: (p) => p.startsWith("/admin/order") },
  { to: "/admin/productlist", label: "Prodotti", title: "Catalogo prodotti", Ic: Icon.flame, match: (p) => p.startsWith("/admin/product") },
  { to: "/admin/userlist", label: "Utenti", title: "Clienti e staff", Ic: Icon.user, match: (p) => p.startsWith("/admin/user") },
];

const AdminLayout = ({ children }) => {
  const { pathname } = useLocation();
  const { userInfo } = useSelector((s) => s.userLogin);
  const active = NAV_ITEMS.find((i) => i.match(pathname)) || NAV_ITEMS[0];

  return (
    <div
      style={{
        paddingTop: NAV_OFFSET,
        minHeight: "100vh",
        background: "var(--bg)",
        display: "grid",
        gridTemplateColumns: "260px 1fr",
      }}
    >
      {/* SIDEBAR */}
      <aside
        style={{
          position: "sticky",
          top: NAV_OFFSET,
          height: "calc(100vh - " + NAV_OFFSET + "px)",
          background: "var(--bg-2)",
          padding: "30px 0",
          display: "flex",
          flexDirection: "column",
          borderRight: "1px solid var(--line)",
        }}
      >
        <div style={{ padding: "0 28px 28px", borderBottom: "1px solid var(--line)" }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>Console</div>
          <div className="display" style={{ fontSize: 26, lineHeight: 1, letterSpacing: "0.02em" }}>
            Amministrazione
          </div>
          {userInfo && (
            <div className="mono" style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 10, letterSpacing: "0.08em" }}>
              {userInfo.name} · Owner
            </div>
          )}
        </div>

        <nav style={{ padding: "20px 12px", flex: 1 }}>
          {NAV_ITEMS.map((it) => {
            const on = it.match(pathname);
            const Ic = it.Ic;
            return (
              <Link
                key={it.to}
                to={it.to}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "12px 16px",
                  marginBottom: 2,
                  background: on ? "var(--bg-3)" : "transparent",
                  border: "1px solid " + (on ? "var(--line-2)" : "transparent"),
                  color: on ? "var(--gold)" : "var(--text-dim)",
                  textDecoration: "none",
                  fontFamily: "var(--mono)",
                  fontSize: 12,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  transition: "all .15s ease",
                }}
              >
                <span style={{ width: 18, display: "grid", placeItems: "center", color: on ? "var(--gold)" : "var(--text-faint)" }}>
                  <Ic />
                </span>
                <span style={{ flex: 1 }}>{it.label}</span>
              </Link>
            );
          })}
        </nav>

        <div style={{ padding: "20px 28px", borderTop: "1px solid var(--line)" }}>
          <Link to="/" className="b-btn sm ghost" style={{ width: "100%", justifyContent: "center" }}>
            ← Torna al sito
          </Link>
        </div>
      </aside>

      {/* CONTENT */}
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            padding: "26px 48px",
            borderBottom: "1px solid var(--line)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "var(--scrim-blur)",
            backdropFilter: "blur(20px)",
            position: "sticky",
            top: NAV_OFFSET,
            zIndex: 30,
          }}
        >
          <div>
            <div className="eyebrow" style={{ marginBottom: 6 }}>{active.label}</div>
            <h1 className="display" style={{ fontSize: 32, margin: 0, lineHeight: 1 }}>
              {active.title}
            </h1>
          </div>
          {userInfo && (
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 999,
                background: "var(--gold)",
                color: "var(--bg)",
                display: "grid",
                placeItems: "center",
                fontFamily: "var(--serif)",
                fontSize: 18,
              }}
            >
              {(userInfo.name || "A").charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <div style={{ padding: "40px 48px" }}>{children}</div>
      </div>
    </div>
  );
};

export default AdminLayout;
