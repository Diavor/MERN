import React from "react";
import { useSelector } from "react-redux";
import Icon from "./Icon";
import fmt from "./fmt";
import { useCartUI } from "./CartUI";
import "./FloatingCart.scss";

const FloatingCart = () => {
  const { open, setOpen } = useCartUI();
  const { cartItems } = useSelector((s) => s.cart);
  const count = cartItems.reduce((sum, i) => sum + i.qty, 0);
  const subtotal = cartItems.reduce((sum, i) => sum + i.qty * i.price, 0);

  if (count === 0 || open) return null;
  return (
    <button type="button" className="floating-cart" onClick={() => setOpen(true)}>
      <Icon.bag />
      <span className="floating-cart__count">{count}</span>
      <span className="floating-cart__sep" />
      <span>{fmt(subtotal)}</span>
    </button>
  );
};

export default FloatingCart;
