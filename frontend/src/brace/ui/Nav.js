import React, { useEffect, useState } from "react";
import { Link, useHistory, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import Icon from "./Icon";
import { useCartUI } from "./CartUI";
import { logout } from "../../store/actions/user";
import "./Nav.scss";

// Labels are translation keys — resolved with t() at render time.
const LINKS = [
  ["/", "nav.home"],
  ["/menu", "nav.menu"],
  ["/collezione", "nav.collection"],
  ["/story", "nav.story"],
];

const linkClass = (active) => "nav__link" + (active ? " is-active" : "");

const Nav = () => {
  const { t, i18n } = useTranslation();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
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

  // route change closes the mobile menu; Esc closes it too
  useEffect(() => setMenuOpen(false), [pathname]);
  useEffect(() => {
    if (!menuOpen) return undefined;
    const onKey = (e) => e.key === "Escape" && setMenuOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const isActive = (to) =>
    to === "/"
      ? pathname === "/"
      : pathname.startsWith(to) ||
        (to === "/menu" && pathname.startsWith("/product"));

  const accountActive = isActive("/profile") || isActive("/login");

  // Two languages only — a single toggle beats a dropdown.
  const otherLang = i18n.resolvedLanguage === "it" ? "en" : "it";
  const switchLang = () => i18n.changeLanguage(otherLang);

  return (
    <>
      <header className={"nav" + (scrolled ? " is-scrolled" : "")}>
      <div className="b-container nav__inner">
        <Link to="/" className="nav__brand" aria-label="Pizzeria Grani Antichi — home">
          <img
            src="/logo-grani-antichi.svg"
            alt="Pizzeria Grani Antichi"
            className="nav__logo"
            width={104}
            height={44}
          />
        </Link>

        <nav className="nav__links">
          {LINKS.map(([to, label]) => (
            <Link key={to} to={to} className={linkClass(isActive(to))}>
              {t(label)}
            </Link>
          ))}
          <Link
            to={userInfo ? "/profile" : "/login"}
            className={linkClass(accountActive)}
          >
            {userInfo ? t("nav.account") : t("nav.login")}
          </Link>
          {userInfo && userInfo.isAdmin && (
            <Link to="/admin" className={linkClass(pathname.startsWith("/admin"))}>
              Admin
            </Link>
          )}
          {userInfo && (
            <button
              type="button"
              className="nav__logout"
              onClick={() => {
                dispatch(logout());
                history.push("/");
              }}
            >
              {t("nav.logout")}
            </button>
          )}
        </nav>

        <div className="nav__actions">
          <button
            type="button"
            className="b-btn ghost nav__lang"
            onClick={switchLang}
            aria-label={t("nav.switchLang")}
          >
            {otherLang.toUpperCase()}
          </button>
          <button
            type="button"
            onClick={() => history.push("/menu")}
            className="b-btn ghost nav__search"
          >
            <Icon.search /> {t("nav.search")}
          </button>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="nav__cart"
          >
            <Icon.bag /> <span className="nav__cart-label">{t("nav.cart")}</span>
            {count > 0 && <span className="nav__cart-count">{count}</span>}
          </button>
          <button
            type="button"
            className="nav__burger"
            aria-label={menuOpen ? t("nav.closeMenu") : t("nav.openMenu")}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
          >
            {menuOpen ? <Icon.close /> : <Icon.menu />}
          </button>
        </div>
      </div>
      </header>

      {/* Mobile-only full-screen menu. Sibling of the header, NOT a child:
          the scrolled header's backdrop-filter would otherwise become the
          containing block for this fixed panel and clip it to the bar. */}
      <nav className={"nav__menu" + (menuOpen ? " is-open" : "")}>
        {LINKS.map(([to, label]) => (
          <Link
            key={to}
            to={to}
            className={"nav__menu-link" + (isActive(to) ? " is-active" : "")}
          >
            {t(label)}
          </Link>
        ))}
        <Link
          to={userInfo ? "/profile" : "/login"}
          className={"nav__menu-link" + (accountActive ? " is-active" : "")}
        >
          {userInfo ? t("nav.account") : t("nav.login")}
        </Link>
        <button
          type="button"
          className="nav__menu-link nav__menu-lang"
          onClick={switchLang}
        >
          {otherLang === "it" ? "Italiano" : "English"}
        </button>
        {userInfo && userInfo.isAdmin && (
          <Link to="/admin" className="nav__menu-link">
            Admin
          </Link>
        )}
        {userInfo && (
          <button
            type="button"
            className="nav__menu-link nav__menu-logout"
            onClick={() => {
              dispatch(logout());
              history.push("/");
            }}
          >
            {t("nav.logout")}
          </button>
        )}
      </nav>
    </>
  );
};

export default Nav;
