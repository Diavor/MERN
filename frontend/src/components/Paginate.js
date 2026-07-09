import React from "react";
import { Link } from "react-router-dom";

// Pagination in the BRÀCE design language: mono pill numbers, plain Links.
const Paginate = ({ pages, page, isAdmin = false, keyword = "" }) => {
  if (!pages || pages <= 1) return null;

  const urlFor = (n) =>
    isAdmin
      ? `/admin/productlist/${n}`
      : keyword
      ? `/menu/search/${keyword}/page/${n}`
      : `/menu/page/${n}`;

  return (
    <nav
      aria-label="Paginazione"
      style={{
        display: "flex",
        gap: 10,
        justifyContent: "center",
        flexWrap: "wrap",
        padding: "8px 0",
      }}
    >
      {[...Array(pages).keys()].map((x) => {
        const n = x + 1;
        const active = n === Number(page);
        return (
          <Link
            key={n}
            to={urlFor(n)}
            aria-current={active ? "page" : undefined}
            className="mono"
            style={{
              width: 42,
              height: 42,
              borderRadius: 999,
              display: "grid",
              placeItems: "center",
              fontSize: 12,
              letterSpacing: "0.1em",
              textDecoration: "none",
              background: active ? "var(--text)" : "transparent",
              color: active ? "var(--bg)" : "var(--text-dim)",
              border: "1px solid " + (active ? "var(--text)" : "var(--line)"),
              transition: "all .2s ease",
            }}
          >
            {n}
          </Link>
        );
      })}
    </nav>
  );
};

export default Paginate;
