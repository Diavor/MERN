import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import Icon from "../brace/ui/Icon";
import fmt from "../brace/ui/fmt";
import Rating from "../brace/ui/Rating";
import Loader from "../brace/ui/Loader";
import Message from "../brace/ui/Message";
import ProductImage from "../brace/ui/ProductImage";
import PizzaCard from "../brace/ui/PizzaCard";
import { useToast } from "../brace/ui/Toast";
import { useCartUI } from "../brace/ui/CartUI";
import Meta from "../components/Meta";
import {
  listProductDetails,
  createProductReview,
} from "../store/actions/product";
import { listProducts } from "../store/actions/products";
import { addToCart } from "../store/actions/cart";
import { PRODUCT_CREATE_REVIEW_RESET } from "../store/actionTypes";

const FieldGroup = ({ label, children }) => (
  <div style={{ marginTop: 28 }}>
    <div className="eyebrow" style={{ marginBottom: 14 }}>
      {label}
    </div>
    {children}
  </div>
);

const optionCard = (selected) => ({
  padding: "14px 16px",
  background: selected ? "var(--bg-3)" : "transparent",
  border: "1px solid " + (selected ? "var(--gold-deep)" : "var(--line)"),
  cursor: "pointer",
  textAlign: "left",
  color: "var(--text)",
  display: "flex",
  alignItems: "center",
  gap: 14,
  width: "100%",
  transition: "all .2s ease",
});

const qtyBtnSlim = {
  width: 24,
  height: 24,
  borderRadius: 999,
  border: "none",
  background: "transparent",
  color: "var(--text)",
  cursor: "pointer",
  display: "grid",
  placeItems: "center",
};

const monoLabel = {
  fontFamily: "var(--mono)",
  fontSize: 11,
  color: "var(--text-faint)",
  letterSpacing: "0.1em",
};

const selectStyle = {
  background: "var(--bg-2)",
  color: "var(--text)",
  border: "1px solid var(--line)",
  borderRadius: 999,
  padding: "10px 14px",
  fontFamily: "var(--mono)",
  fontSize: 12,
  letterSpacing: "0.08em",
};

const ProductScreen = ({ history, match }) => {
  const [qty, setQty] = useState(1);
  const [selectedToppings, setSelectedToppings] = useState([]);
  const [selectedDough, setSelectedDough] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [tab, setTab] = useState("desc");

  const dispatch = useDispatch();
  const toast = useToast();
  const cartUI = useCartUI();

  const { loading, error, product } = useSelector(
    (state) => state.productDetails
  );
  const { success: successReview, error: errorReview } = useSelector(
    (state) => state.productReviewCreate
  );
  const { userInfo } = useSelector((state) => state.userLogin);
  const { products: listedProducts } = useSelector(
    (state) => state.productList
  );

  useEffect(() => {
    if (successReview) {
      toast("Recensione inviata. Grazie!", "ok");
      setRating(0);
      setComment("");
      dispatch({ type: PRODUCT_CREATE_REVIEW_RESET });
    }
    dispatch(listProductDetails(match.params.id));
  }, [match, dispatch, successReview, toast]);

  // reset configuration when switching product
  useEffect(() => {
    setQty(1);
    setSelectedToppings([]);
    setSelectedDough(null);
    setTab("desc");
  }, [match.params.id]);

  // for the "related" strip
  useEffect(() => {
    if (!listedProducts || listedProducts.length === 0) {
      dispatch(listProducts());
    }
  }, [dispatch, listedProducts]);

  const toggleTopping = (topping) => {
    setSelectedToppings((prev) =>
      prev.find((t) => t.name === topping.name)
        ? prev.filter((t) => t.name !== topping.name)
        : [...prev, topping]
    );
  };

  const toppingsTotal = selectedToppings.reduce((acc, t) => acc + t.price, 0);
  const doughExtra = selectedDough ? selectedDough.price : 0;
  const unitPrice = (product.price || 0) + toppingsTotal + doughExtra;
  const inStock = product.countInStock > 0;

  const addToCartHandler = () => {
    dispatch(addToCart(product._id, qty, selectedToppings, selectedDough));
    toast(`Aggiunto al carrello · ${product.name}`, "ok");
    cartUI.setOpen(true);
  };

  const quickAddRelated = (p) => {
    dispatch(addToCart(p._id, 1, [], null));
    toast(`Aggiunto al carrello · ${p.name}`, "ok");
    cartUI.setOpen(true);
  };

  const submitHandler = (e) => {
    e.preventDefault();
    dispatch(createProductReview(match.params.id, { rating, comment }));
  };

  const related = (listedProducts || [])
    .filter((p) => p._id !== product._id)
    .slice(0, 3);

  if (loading) {
    return (
      <div style={{ paddingTop: 140, minHeight: "70vh" }}>
        <div className="b-container">
          <Loader />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ paddingTop: 140, minHeight: "70vh" }}>
        <div className="b-container">
          <Message variant="danger">{error}</Message>
        </div>
      </div>
    );
  }

  return (
    <div style={{ paddingTop: 120, paddingBottom: 140, minHeight: "70vh" }}>
      <Meta title={product.name} />
      <div className="b-container">
        {/* Breadcrumb */}
        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "center",
            fontFamily: "var(--mono)",
            fontSize: 11,
            color: "var(--text-faint)",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            marginBottom: 40,
          }}
        >
          <Link to="/" style={{ color: "var(--text-dim)", textDecoration: "none" }}>
            Casa
          </Link>
          <span>/</span>
          <Link to="/menu" style={{ color: "var(--text-dim)", textDecoration: "none" }}>
            Menu
          </Link>
          <span>/</span>
          <span style={{ color: "var(--gold)" }}>{product.name}</span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
            gap: 60,
            alignItems: "start",
          }}
        >
          {/* Gallery */}
          <div
            style={{
              aspectRatio: "1/1",
              background: "var(--bg-2)",
              border: "1px solid var(--line)",
              padding: 60,
              position: "relative",
              overflow: "hidden",
              display: "grid",
              placeItems: "center",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "radial-gradient(500px 400px at 60% 30%, rgba(192,57,43,0.14), transparent 60%)",
              }}
            />
            <div style={{ position: "relative", width: "100%", maxWidth: 420 }}>
              <ProductImage src={product.img} alt={product.name} />
            </div>

            {/* corner annotations */}
            <div
              style={{
                position: "absolute",
                top: 24,
                left: 24,
                fontFamily: "var(--mono)",
                fontSize: 10,
                color: "var(--text-faint)",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
              }}
            >
              BR · {(product._id || "").slice(-6).toUpperCase()}
            </div>
            <div
              style={{
                position: "absolute",
                top: 24,
                right: 24,
                fontFamily: "var(--mono)",
                fontSize: 10,
                color: "var(--gold)",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
              }}
            >
              {product.category}
            </div>
          </div>

          {/* Sticky configurator */}
          <div style={{ position: "sticky", top: 120 }}>
            <div className="eyebrow">{product.category}</div>
            <h1
              className="display"
              style={{
                fontSize: "clamp(48px, 6vw, 76px)",
                lineHeight: 0.98,
                margin: "14px 0 18px",
              }}
            >
              {product.name}
            </h1>

            <div style={{ display: "flex", alignItems: "baseline", gap: 16, marginTop: 12 }}>
              <span className="display" style={{ fontSize: 56, color: "var(--gold)" }}>
                {fmt(unitPrice)}
              </span>
              {toppingsTotal + doughExtra > 0 && (
                <span
                  className="mono"
                  style={{
                    fontSize: 12,
                    color: "var(--text-faint)",
                    textDecoration: "line-through",
                  }}
                >
                  {fmt(product.price)}
                </span>
              )}
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                marginTop: 22,
                paddingTop: 22,
                borderTop: "1px solid var(--line)",
              }}
            >
              <Rating
                value={product.rating}
                text={`${product.numReviews} recensioni`}
              />
            </div>

            {/* Impasto */}
            {product.doughVariants && product.doughVariants.length > 0 && (
              <FieldGroup label="Impasto">
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <button
                    onClick={() => setSelectedDough(null)}
                    style={optionCard(!selectedDough)}
                  >
                    <span
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: 999,
                        border:
                          "1px solid " +
                          (!selectedDough ? "var(--gold)" : "var(--line-2)"),
                        display: "grid",
                        placeItems: "center",
                        flexShrink: 0,
                      }}
                    >
                      {!selectedDough && (
                        <span
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: 999,
                            background: "var(--gold)",
                          }}
                        />
                      )}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500 }}>Standard</div>
                      <div className="mono" style={{ ...monoLabel, marginTop: 4 }}>
                        incluso
                      </div>
                    </div>
                  </button>
                  {product.doughVariants.map((d) => {
                    const active = selectedDough?.name === d.name;
                    return (
                      <button
                        key={d.name}
                        onClick={() => setSelectedDough(d)}
                        style={optionCard(active)}
                      >
                        <span
                          style={{
                            width: 16,
                            height: 16,
                            borderRadius: 999,
                            border:
                              "1px solid " +
                              (active ? "var(--gold)" : "var(--line-2)"),
                            display: "grid",
                            placeItems: "center",
                            flexShrink: 0,
                          }}
                        >
                          {active && (
                            <span
                              style={{
                                width: 8,
                                height: 8,
                                borderRadius: 999,
                                background: "var(--gold)",
                              }}
                            />
                          )}
                        </span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 500 }}>{d.name}</div>
                          <div className="mono" style={{ ...monoLabel, marginTop: 4 }}>
                            +{fmt(d.price)}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </FieldGroup>
            )}

            {/* Aggiunte */}
            {product.toppings && product.toppings.length > 0 && (
              <FieldGroup label="Aggiunte">
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                    gap: 8,
                  }}
                >
                  {product.toppings.map((t) => {
                    const checked = !!selectedToppings.find(
                      (s) => s.name === t.name
                    );
                    return (
                      <button
                        key={t.name}
                        onClick={() => toggleTopping(t)}
                        style={optionCard(checked)}
                      >
                        <span
                          style={{
                            width: 16,
                            height: 16,
                            border:
                              "1px solid " +
                              (checked ? "var(--gold)" : "var(--line-2)"),
                            display: "grid",
                            placeItems: "center",
                            color: "var(--gold)",
                            flexShrink: 0,
                          }}
                        >
                          {checked && <Icon.check />}
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 500, fontSize: 14 }}>{t.name}</div>
                          <div className="mono" style={{ ...monoLabel, marginTop: 4 }}>
                            +{fmt(t.price)}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </FieldGroup>
            )}

            {/* Qty + add */}
            <div
              style={{
                display: "flex",
                gap: 12,
                alignItems: "stretch",
                marginTop: 32,
                padding: "20px 0",
                borderTop: "1px solid var(--line)",
                borderBottom: "1px solid var(--line)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  border: "1px solid var(--line-2)",
                  padding: "0 16px",
                  borderRadius: 999,
                }}
              >
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  aria-label="Riduci quantità"
                  style={qtyBtnSlim}
                >
                  <Icon.minus />
                </button>
                <span className="mono" style={{ minWidth: 24, textAlign: "center", fontSize: 14 }}>
                  {qty}
                </span>
                <button
                  onClick={() =>
                    setQty(Math.min(product.countInStock || 1, qty + 1))
                  }
                  aria-label="Aumenta quantità"
                  style={qtyBtnSlim}
                >
                  <Icon.plus />
                </button>
              </div>
              <button
                onClick={addToCartHandler}
                disabled={!inStock}
                className="b-btn ember"
                style={{ flex: 1, justifyContent: "center", padding: "16px 22px" }}
              >
                {inStock
                  ? `Aggiungi al carrello — ${fmt(unitPrice * qty)}`
                  : "Esaurito"}
              </button>
            </div>

            {/* availability line */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontFamily: "var(--mono)",
                fontSize: 11,
                color: "var(--text-dim)",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                marginTop: 18,
              }}
            >
              <span>Preparata al momento</span>
              {inStock ? (
                <span style={{ color: "var(--ok)" }}>● Disponibile · forno acceso</span>
              ) : (
                <span style={{ color: "var(--accent)" }}>● Esaurito</span>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ marginTop: 100, borderTop: "1px solid var(--line)" }}>
          <div style={{ display: "flex", gap: 0, borderBottom: "1px solid var(--line)" }}>
            {[
              ["desc", "Descrizione"],
              ["reviews", `Recensioni (${product.numReviews || 0})`],
            ].map(([k, l]) => (
              <button
                key={k}
                onClick={() => setTab(k)}
                style={{
                  padding: "20px 28px",
                  background: "none",
                  border: "none",
                  color: tab === k ? "var(--gold)" : "var(--text-dim)",
                  cursor: "pointer",
                  fontFamily: "var(--mono)",
                  fontSize: 11,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  borderBottom:
                    "1px solid " + (tab === k ? "var(--gold)" : "transparent"),
                  marginBottom: -1,
                }}
              >
                {l}
              </button>
            ))}
          </div>

          <div style={{ padding: "48px 0", minHeight: 240 }}>
            {tab === "desc" && (
              <p
                className="it"
                style={{
                  fontSize: 24,
                  lineHeight: 1.5,
                  maxWidth: 760,
                  color: "var(--text-dim)",
                  margin: 0,
                }}
              >
                {product.description}
              </p>
            )}

            {tab === "reviews" && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                  gap: 60,
                  alignItems: "start",
                }}
              >
                {/* review list */}
                <div>
                  {(!product.reviews || product.reviews.length === 0) && (
                    <Message variant="info">
                      Nessuna recensione, per ora. Sii il primo a raccontarla.
                    </Message>
                  )}
                  {(product.reviews || []).map((r) => (
                    <div
                      key={r._id}
                      style={{
                        padding: "22px 0",
                        borderBottom: "1px solid var(--line)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "baseline",
                          gap: 14,
                        }}
                      >
                        <span className="display" style={{ fontSize: 20 }}>
                          {r.name}
                        </span>
                        <span className="mono" style={monoLabel}>
                          {new Date(r.createdAt).toLocaleDateString("it-IT")}
                        </span>
                      </div>
                      <div style={{ margin: "8px 0" }}>
                        <Rating value={r.rating} />
                      </div>
                      <p style={{ margin: 0, color: "var(--text-dim)", lineHeight: 1.6 }}>
                        {r.comment}
                      </p>
                    </div>
                  ))}
                </div>

                {/* review form */}
                <div>
                  <div className="eyebrow" style={{ marginBottom: 18 }}>
                    Scrivi una recensione
                  </div>
                  {errorReview && (
                    <div style={{ marginBottom: 16 }}>
                      <Message variant="danger">{errorReview}</Message>
                    </div>
                  )}
                  {userInfo ? (
                    <form onSubmit={submitHandler}>
                      <label className="mono" style={{ ...monoLabel, display: "block", marginBottom: 8 }}>
                        Valutazione
                      </label>
                      <select
                        value={rating}
                        onChange={(e) => setRating(e.target.value)}
                        required
                        style={{ ...selectStyle, width: "100%", marginBottom: 18 }}
                      >
                        <option value="">Scegli…</option>
                        <option value="1">1 — Scarsa</option>
                        <option value="2">2 — Discreta</option>
                        <option value="3">3 — Buona</option>
                        <option value="4">4 — Molto buona</option>
                        <option value="5">5 — Eccellente</option>
                      </select>
                      <label className="mono" style={{ ...monoLabel, display: "block", marginBottom: 8 }}>
                        Commento
                      </label>
                      <textarea
                        rows={4}
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        required
                        style={{
                          width: "100%",
                          background: "var(--bg-2)",
                          color: "var(--text)",
                          border: "1px solid var(--line)",
                          padding: 14,
                          fontFamily: "inherit",
                          fontSize: 15,
                          lineHeight: 1.5,
                          resize: "vertical",
                          marginBottom: 18,
                        }}
                      />
                      <button type="submit" className="b-btn solid">
                        Invia recensione
                      </button>
                    </form>
                  ) : (
                    <Message variant="info">
                      <Link to={`/login?redirect=/product/${product._id}`}>
                        Accedi
                      </Link>{" "}
                      per scrivere una recensione.
                    </Message>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <div style={{ marginTop: 80 }}>
            <div className="eyebrow" style={{ marginBottom: 24 }}>
              Da provare anche
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                gap: 24,
              }}
            >
              {related.map((r) => (
                <PizzaCard
                  key={r._id}
                  product={r}
                  onClick={() => {
                    history.push(`/product/${r._id}`);
                    window.scrollTo({ top: 0 });
                  }}
                  onAdd={quickAddRelated}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sticky quick-add bar */}
      <div
        className="b-rise"
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 60,
          background: "var(--scrim-blur-strong)",
          backdropFilter: "blur(20px)",
          borderTop: "1px solid var(--line)",
          padding: "14px 32px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 18,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
          <div style={{ width: 38, flexShrink: 0 }}>
            <ProductImage src={product.img} alt={product.name} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontFamily: "var(--mono)",
                fontSize: 10,
                color: "var(--text-faint)",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
              }}
            >
              {product.category}
            </div>
            <div className="display" style={{ fontSize: 18, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {product.name}
            </div>
          </div>
        </div>
        <button
          onClick={addToCartHandler}
          disabled={!inStock}
          className="b-btn ember"
        >
          {inStock ? (
            <>
              Aggiungi {fmt(unitPrice * qty)} <Icon.arrow className="arrow" />
            </>
          ) : (
            "Esaurito"
          )}
        </button>
      </div>
    </div>
  );
};

export default ProductScreen;
