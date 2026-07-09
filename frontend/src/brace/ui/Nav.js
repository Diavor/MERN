import React, { useEffect, useState } from "react";
import { Link, useHistory, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Icon, { Mark } from "./Icon";
import { useCartUI } from "./CartUI";
import { logout } from "../../store/actions/user";

const LINKS = [
  ["/", "Casa"],
  ["/menu", "Menu"],
  ["/story", "Dough"],
];

const linkStyle = (active) => ({
  color: active ? "var(--gold)" : "var(--text-dim)",
  position: "relative",
  textDecoration: "none",
});

const underline = {
  position: "absolute",
  left: 0,
  right: 0,
  bottom: -8,
  height: 1,
  background: "var(--gold)",
};

const Nav = () => {
  const [scrolled, setScrolled] = useState(false);
  const { setOpen } = useCartUI();
  const history = useHistory();
  const { pathname } = useLocation();
  const dispatch = useDispatch();

  const { cartItems } = useSelector((s) => s.cart);
  const { userInfo } = useSelector((s) => s.userLogin);
  const count = cartItems.reduce((sum, i) => sum + i.qty, 0);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (to) =>
    to === "/"
      ? pathname === "/"
      : pathname.startsWith(to) ||
        (to === "/menu" && pathname.startsWith("/product"));

  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        borderBottom: "1px solid " + (scrolled ? "var(--line)" : "transparent"),
        background: scrolled ? "var(--scrim-blur)" : "transparent",
        backdropFilter: scrolled ? "blur(20px) saturate(140%)" : "none",
        transition: "all .35s ease",
      }}
    >
      <div
        className="b-container"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingTop: scrolled ? 16 : 26,
          paddingBottom: scrolled ? 16 : 26,
          transition: "padding .35s ease",
        }}
      >
        <Link
          to="/"
          style={{
            color: "var(--text)",
            display: "flex",
            alignItems: "center",
            gap: 10,
            textDecoration: "none",
          }}
        >
          <Mark size={28} />
          <span
            className="display"
            style={{ fontSize: 22, letterSpacing: "0.34em", lineHeight: 1, paddingTop: 2 }}
          >
            BRÀCE
          </span>
        </Link>

        <nav
          style={{
            display: "flex",
            gap: 36,
            alignItems: "center",
            fontSize: 12,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            fontFamily: "var(--mono)",
          }}
        >
          {LINKS.map(([to, label]) => (
            <Link key={to} to={to} style={linkStyle(isActive(to))}>
              {label}
              {isActive(to) && <span style={underline} />}
            </Link>
          ))}
          <Link
            to={userInfo ? "/profile" : "/login"}
            style={linkStyle(isActive("/profile") || isActive("/login"))}
          >
            {userInfo ? "Account" : "Accedi"}
            {(isActive("/profile") || isActive("/login")) && <span style={underline} />}
          </Link>
          {userInfo && userInfo.isAdmin && (
            <Link to="/admin" style={linkStyle(pathname.startsWith("/admin"))}>
              Admin
              {pathname.startsWith("/admin") && <span style={underline} />}
            </Link>
          )}
          {userInfo && (
            <button
              onClick={() => {
                dispatch(logout());
                history.push("/");
              }}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                cursor: "pointer",
                color: "var(--text-faint)",
                fontFamily: "inherit",
                fontSize: "inherit",
                letterSpacing: "inherit",
                textTransform: "inherit",
              }}
            >
              Esci
            </button>
          )}
        </nav>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button
            onClick={() => history.push("/menu")}
            className="b-btn sm ghost"
            style={{ padding: "10px 16px" }}
          >
            <Icon.search /> Cerca
          </button>
          <button
            onClick={() => setOpen(true)}
            style={{
              position: "relative",
              background: "none",
              border: "1px solid var(--line-2)",
              color: "var(--text)",
              padding: "10px 16px",
              borderRadius: 999,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontFamily: "var(--mono)",
              fontSize: 11,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
            }}
          >
            <Icon.bag /> Carrello
            {count > 0 && (
              <span
                style={{
                  background: "var(--accent)",
                  color: "var(--cream)",
                  padding: "2px 7px",
                  borderRadius: 999,
                  fontSize: 10,
                  fontWeight: 600,
                  fontFamily: "var(--sans)",
                  letterSpacing: 0,
                }}
              >
                {count}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Nav;
