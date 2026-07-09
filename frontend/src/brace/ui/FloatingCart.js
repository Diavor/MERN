import React from "react";
import { useSelector } from "react-redux";
import Icon from "./Icon";
import fmt from "./fmt";
import { useCartUI } from "./CartUI";

const FloatingCart = () => {
  const { open, setOpen } = useCartUI();
  const { cartItems } = useSelector((s) => s.cart);
  const count = cartItems.reduce((sum, i) => sum + i.qty, 0);
  const subtotal = cartItems.reduce((sum, i) => sum + i.qty * i.price, 0);

  if (count === 0 || open) return null;
  return (
    <button
      onClick={() => setOpen(true)}
      style={{
        position: "fixed",
        bottom: 28,
        right: 28,
        zIndex: 90,
        background: "var(--accent)",
        color: "var(--cream)",
        border: "none",
        borderRadius: 999,
        padding: "14px 22px",
        display: "flex",
        alignItems: "center",
        gap: 10,
        boxShadow: "0 16px 40px rgba(192,57,43,0.35), 0 0 0 1px rgba(255,255,255,0.06) inset",
        cursor: "pointer",
        fontFamily: "var(--mono)",
        fontSize: 12,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
      }}
    >
      <Icon.bag />
      <span style={{ fontFamily: "var(--sans)", fontWeight: 600 }}>{count}</span>
      <span style={{ width: 1, height: 14, background: "rgba(255,255,255,0.3)" }} />
      <span>{fmt(subtotal)}</span>
    </button>
  );
};

export default FloatingCart;
