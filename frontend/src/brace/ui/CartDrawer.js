import React from "react";
import { useHistory } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Icon from "./Icon";
import fmt from "./fmt";
import ProductImage from "./ProductImage";
import { useCartUI } from "./CartUI";
import { updateCartQty, removeCart } from "../../store/actions/cart";
import { FREE_DELIVERY_THRESHOLD } from "../content";

const qtyBtn = {
  width: 24,
  height: 24,
  borderRadius: 999,
  border: "1px solid var(--line-2)",
  background: "transparent",
  color: "var(--text)",
  cursor: "pointer",
  display: "grid",
  placeItems: "center",
};

export function TotalRow({ label, value, muted, accent }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        fontFamily: "var(--mono)",
        fontSize: 12,
        padding: "6px 0",
        color: muted ? "var(--text-faint)" : accent ? "var(--gold)" : "var(--text-dim)",
      }}
    >
      <span>{label}</span>
      <span style={{ color: accent ? "var(--gold)" : muted ? "var(--text-faint)" : "var(--text)" }}>
        {value}
      </span>
    </div>
  );
}

const lineCaption = (item) => {
  const parts = [];
  if (item.selectedDough) parts.push(item.selectedDough.name);
  if (item.toppings && item.toppings.length > 0)
    parts.push(item.toppings.map((t) => t.name).join(", "));
  return parts.join(" · ");
};

const CartDrawer = () => {
  const { open, setOpen } = useCartUI();
  const history = useHistory();
  const dispatch = useDispatch();
  const { cartItems } = useSelector((s) => s.cart);

  const subtotal = cartItems.reduce((sum, i) => sum + i.qty * i.price, 0);
  const count = cartItems.reduce((sum, i) => sum + i.qty, 0);

  const goTo = (path) => {
    setOpen(false);
    history.push(path);
  };

  return (
    <>
      <div
        onClick={() => setOpen(false)}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 200,
          background: "var(--scrim-overlay)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity .3s ease",
          backdropFilter: open ? "blur(4px)" : "none",
        }}
      />

      <aside
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: 460,
          maxWidth: "92vw",
          background: "var(--bg-2)",
          borderLeft: "1px solid var(--line)",
          zIndex: 201,
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform .45s cubic-bezier(.2,.7,.2,1)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            padding: "26px 28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid var(--line)",
          }}
        >
          <div>
            <div className="eyebrow">Il tuo carrello</div>
            <div className="display" style={{ fontSize: 28, marginTop: 4 }}>
              {count} {count === 1 ? "pezzo" : "pezzi"}
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            style={{
              background: "none",
              border: "1px solid var(--line-2)",
              color: "var(--text)",
              width: 38,
              height: 38,
              borderRadius: 999,
              cursor: "pointer",
              display: "grid",
              placeItems: "center",
            }}
          >
            <Icon.close />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "8px 28px" }}>
          {cartItems.length === 0 ? (
            <div style={{ textAlign: "center", padding: "80px 0", color: "var(--text-faint)" }}>
              <Icon.bag width={32} height={32} />
              <div className="display" style={{ fontSize: 24, marginTop: 18, color: "var(--text-dim)" }}>
                Carrello vuoto
              </div>
              <button onClick={() => goTo("/menu")} className="b-btn ghost" style={{ marginTop: 24 }}>
                Vedi il menu
              </button>
            </div>
          ) : (
            cartItems.map((item) => (
              <div
                key={item.key || item.product}
                style={{
                  display: "grid",
                  gridTemplateColumns: "60px 1fr auto",
                  gap: 16,
                  padding: "20px 0",
                  borderBottom: "1px solid var(--line)",
                  alignItems: "center",
                }}
              >
                <div style={{ width: 60, height: 60 }}>
                  <ProductImage src={item.image} alt={item.name} style={{ width: 60, height: 60 }} />
                </div>
                <div>
                  <div className="display" style={{ fontSize: 17, marginBottom: 4 }}>
                    {item.name}
                  </div>
                  {lineCaption(item) && (
                    <div
                      style={{
                        fontFamily: "var(--mono)",
                        fontSize: 10,
                        color: "var(--text-faint)",
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                      }}
                    >
                      {lineCaption(item)}
                    </div>
                  )}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
                    <button onClick={() => dispatch(updateCartQty(item, item.qty - 1))} style={qtyBtn}>
                      <Icon.minus />
                    </button>
                    <span
                      style={{ minWidth: 16, textAlign: "center", fontFamily: "var(--mono)", fontSize: 12 }}
                    >
                      {item.qty}
                    </span>
                    <button onClick={() => dispatch(updateCartQty(item, item.qty + 1))} style={qtyBtn}>
                      <Icon.plus />
                    </button>
                    <button
                      onClick={() => dispatch(removeCart(item.key || item.product))}
                      style={{
                        marginLeft: 6,
                        background: "none",
                        border: "none",
                        color: "var(--text-faint)",
                        cursor: "pointer",
                        fontSize: 11,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        fontFamily: "var(--mono)",
                      }}
                    >
                      Rimuovi
                    </button>
                  </div>
                </div>
                <div className="display" style={{ fontSize: 18 }}>
                  {fmt(item.price * item.qty)}
                </div>
              </div>
            ))
          )}
        </div>

        {cartItems.length > 0 && (
          <div style={{ padding: "20px 28px", borderTop: "1px solid var(--line)", background: "var(--bg)" }}>
            <TotalRow label="Subtotale" value={fmt(subtotal)} />
            {subtotal >= FREE_DELIVERY_THRESHOLD && (
              <TotalRow label="Consegna" value="Gratis" accent />
            )}
            <div style={{ height: 1, background: "var(--line-2)", margin: "12px 0" }} />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                marginBottom: 18,
              }}
            >
              <span className="eyebrow">Totale parziale</span>
              <span className="display" style={{ fontSize: 32 }}>
                {fmt(subtotal)}
              </span>
            </div>
            <button
              onClick={() => goTo("/checkout")}
              className="b-btn ember"
              style={{ width: "100%", justifyContent: "center", padding: "16px 22px", fontSize: 12 }}
            >
              Procedi al checkout <Icon.arrow className="arrow" />
            </button>
            <div
              style={{
                marginTop: 12,
                fontFamily: "var(--mono)",
                fontSize: 10,
                color: "var(--text-faint)",
                textAlign: "center",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}
            >
              Consegna gratuita oltre €{FREE_DELIVERY_THRESHOLD}
            </div>
          </div>
        )}
      </aside>
    </>
  );
};

export default CartDrawer;
