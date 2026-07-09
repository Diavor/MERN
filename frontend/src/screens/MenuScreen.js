import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Icon from "../brace/ui/Icon";
import Loader from "../brace/ui/Loader";
import Message from "../brace/ui/Message";
import PizzaCard from "../brace/ui/PizzaCard";
import { useToast } from "../brace/ui/Toast";
import { useCartUI } from "../brace/ui/CartUI";
import Paginate from "../components/Paginate";
import Meta from "../components/Meta";
import { listProducts } from "../store/actions/products";
import { addToCart } from "../store/actions/cart";

const pillStyle = (active) => ({
  padding: "10px 18px",
  background: active ? "var(--text)" : "transparent",
  color: active ? "var(--bg)" : "var(--text-dim)",
  border: "1px solid " + (active ? "var(--text)" : "var(--line)"),
  borderRadius: 999,
  cursor: "pointer",
  marginRight: 8,
  fontFamily: "var(--mono)",
  fontSize: 11,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  whiteSpace: "nowrap",
  transition: "all .2s ease",
});

const MenuScreen = ({ history, match }) => {
  const keyword = match.params.keyword || "";
  const pageNumber = match.params.pageNumber || 1;

  const dispatch = useDispatch();
  const toast = useToast();
  const cartUI = useCartUI();

  const { loading, error, products, page, pages } = useSelector(
    (state) => state.productList
  );

  const [cat, setCat] = useState("all");
  const [q, setQ] = useState(keyword);
  const [sort, setSort] = useState("default");

  useEffect(() => {
    dispatch(listProducts(keyword, pageNumber));
    setCat("all");
    setQ(keyword);
  }, [dispatch, keyword, pageNumber]);

  const categories = useMemo(() => {
    const seen = [];
    (products || []).forEach((p) => {
      if (p.category && !seen.includes(p.category)) seen.push(p.category);
    });
    return seen;
  }, [products]);

  const items = useMemo(() => {
    let xs = (products || []).slice();
    if (cat !== "all") xs = xs.filter((p) => p.category === cat);
    if (sort === "price-asc") xs.sort((a, b) => a.price - b.price);
    if (sort === "price-desc") xs.sort((a, b) => b.price - a.price);
    return xs;
  }, [products, cat, sort]);

  const submitSearch = (e) => {
    e.preventDefault();
    const term = q.trim();
    history.push(term ? `/menu/search/${term}` : "/menu");
  };

  const quickAdd = (product) => {
    dispatch(addToCart(product._id, 1, [], null));
    toast(`Aggiunto al carrello · ${product.name}`, "ok");
    cartUI.setOpen(true);
  };

  return (
    <div style={{ paddingTop: 140, minHeight: "70vh" }}>
      <Meta title="BRÀCE | Il menu" />
      <div className="b-container">
        {/* Header */}
        <div style={{ paddingBottom: 60, borderBottom: "1px solid var(--line)" }}>
          <div className="eyebrow" style={{ marginBottom: 20 }}>
            Il menu
          </div>
          <h1
            className="display"
            style={{
              fontSize: "clamp(64px, 10vw, 148px)",
              lineHeight: 0.9,
              margin: 0,
              letterSpacing: "-0.01em",
            }}
          >
            La carta,
            <br />
            <span className="it" style={{ color: "var(--gold)", fontWeight: 300 }}>
              per intero.
            </span>
          </h1>
          <p
            style={{
              marginTop: 28,
              fontSize: 17,
              color: "var(--text-dim)",
              maxWidth: 600,
              lineHeight: 1.6,
            }}
          >
            Tutte le nostre pizze, cotte nel forno a legna. Cerca, filtra e
            ordina come preferisci.
          </p>
        </div>

        {/* Sticky filter bar */}
        <div
          style={{
            position: "sticky",
            top: 78,
            zIndex: 50,
            background: "var(--scrim-blur-strong)",
            backdropFilter: "blur(20px)",
            padding: "24px 0",
            borderBottom: "1px solid var(--line)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 24,
            flexWrap: "wrap",
          }}
        >
          {categories.length >= 2 ? (
            <div className="no-scrollbar" style={{ display: "flex", gap: 0, overflowX: "auto" }}>
              <button onClick={() => setCat("all")} style={pillStyle(cat === "all")}>
                Tutte
              </button>
              {categories.map((c) => (
                <button key={c} onClick={() => setCat(c)} style={pillStyle(cat === c)}>
                  {c}
                </button>
              ))}
            </div>
          ) : (
            <span />
          )}

          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <form
              onSubmit={submitSearch}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 14px",
                border: "1px solid var(--line)",
                borderRadius: 999,
                minWidth: 220,
              }}
            >
              <Icon.search style={{ color: "var(--text-faint)" }} />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Cerca una pizza…"
                aria-label="Cerca una pizza"
                style={{
                  background: "none",
                  border: "none",
                  outline: "none",
                  color: "var(--text)",
                  fontFamily: "var(--mono)",
                  fontSize: 12,
                  width: "100%",
                }}
              />
            </form>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              aria-label="Ordina per prezzo"
              style={{
                background: "var(--bg-2)",
                color: "var(--text-dim)",
                border: "1px solid var(--line)",
                borderRadius: 999,
                padding: "10px 14px",
                fontFamily: "var(--mono)",
                fontSize: 11,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}
            >
              <option value="default">Ordina</option>
              <option value="price-asc">Prezzo crescente</option>
              <option value="price-desc">Prezzo decrescente</option>
            </select>
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div style={{ padding: "80px 0" }}>
            <Loader />
          </div>
        ) : error ? (
          <div style={{ padding: "48px 0" }}>
            <Message variant="danger">{error}</Message>
          </div>
        ) : (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                gap: 28,
                marginTop: 48,
                marginBottom: 48,
              }}
            >
              {items.length === 0 ? (
                <div
                  style={{
                    gridColumn: "1 / -1",
                    textAlign: "center",
                    padding: 80,
                    color: "var(--text-faint)",
                  }}
                >
                  <div className="display" style={{ fontSize: 32 }}>
                    Niente da mostrare.
                  </div>
                  <p style={{ marginTop: 12 }}>
                    Prova a cambiare filtro o cerca un&apos;altra pizza.
                  </p>
                  <button
                    className="b-btn ghost"
                    style={{ marginTop: 24 }}
                    onClick={() => {
                      setCat("all");
                      setSort("default");
                      history.push("/menu");
                    }}
                  >
                    Mostra tutto il menu
                  </button>
                </div>
              ) : (
                items.map((product) => (
                  <PizzaCard
                    key={product._id}
                    product={product}
                    onClick={() => history.push(`/product/${product._id}`)}
                    onAdd={quickAdd}
                  />
                ))
              )}
            </div>

            <div style={{ paddingBottom: 80 }}>
              <Paginate pages={pages} page={page} keyword={keyword} />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MenuScreen;
