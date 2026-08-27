import React, { useState } from "react";
import { useHistory } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import Icon from "./Icon";
import fmt from "./fmt";
import ProductImage from "./ProductImage";
import { useCartUI } from "./CartUI";
import Portal from "./Portal";
import CartUpsell from "./CartUpsell";
import { updateCartQty, removeCart } from "../../store/actions/cart";
import { DELIVERY_ZONES, FREE_DELIVERY_THRESHOLD } from "../content";
import "./CartDrawer.scss";

// Cheapest zone fee — folded into the drawer's total before a zone is chosen at
// checkout (the final fee is set per-zone there).
const MIN_ZONE_FEE = Math.min(...DELIVERY_ZONES.map((z) => z.price));

const lineCaption = (item) => {
  const parts = [];
  if (item.selectedDough) parts.push(item.selectedDough.name);
  if (item.toppings && item.toppings.length > 0)
    parts.push(item.toppings.map((t) => t.name).join(", "));
  return parts.join(" · ");
};

const CartDrawer = () => {
  const { t } = useTranslation();
  const { open, setOpen } = useCartUI();
  const history = useHistory();
  const dispatch = useDispatch();
  const { cartItems } = useSelector((s) => s.cart);

  const [delivery, setDelivery] = useState("delivery"); // "delivery" | "pickup"

  const subtotal = cartItems.reduce((sum, i) => sum + i.qty * i.price, 0);
  const count = cartItems.reduce((sum, i) => sum + i.qty, 0);

  const deliveryFee =
    delivery === "pickup" || subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : MIN_ZONE_FEE;
  const total = Math.max(0, subtotal + deliveryFee);

  const goTo = (path) => {
    setOpen(false);
    history.push(path);
  };

  const openClass = open ? " is-open" : "";

  return (
    <Portal>
      <div
        className={"cart-drawer__scrim" + openClass}
        onClick={() => setOpen(false)}
      />

      <aside className={"cart-drawer__panel" + openClass}>
        <div className="cart-drawer__head">
          <div>
            <div className="eyebrow">{t("cart.title")}</div>
            <div className="display cart-drawer__count">
              {t("cart.pieces", { count })}
            </div>
          </div>
          <button
            type="button"
            className="cart-drawer__close"
            onClick={() => setOpen(false)}
          >
            <Icon.close />
          </button>
        </div>

        {/* delivery / pickup toggle */}
        <div className="cart-drawer__mode">
          <div className="cart-drawer__seg">
            {[
              ["delivery", t("cart.delivery")],
              ["pickup", t("cart.pickup")],
            ].map(([k, label]) => (
              <button
                key={k}
                type="button"
                className={
                  "cart-drawer__seg-btn" + (delivery === k ? " is-active" : "")
                }
                onClick={() => setDelivery(k)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="cart-drawer__body">
          {cartItems.length === 0 ? (
            <div className="cart-drawer__empty">
              <Icon.bag width={32} height={32} />
              <div className="display cart-drawer__empty-title">
                {t("cart.empty")}
              </div>
              <button
                type="button"
                onClick={() => goTo("/menu")}
                className="b-btn ghost cart-drawer__empty-cta"
              >
                {t("cart.viewMenu")}
              </button>
            </div>
          ) : (
            cartItems.map((item) => (
              <div key={item.key || item.product} className="cart-drawer__line">
                <div className="cart-drawer__thumb">
                  <ProductImage
                    src={item.image}
                    alt={item.name}
                    style={{ width: 60, height: 60 }}
                  />
                </div>
                <div>
                  <div className="display cart-drawer__name">{item.name}</div>
                  {lineCaption(item) && (
                    <div className="cart-drawer__caption">
                      {lineCaption(item)}
                    </div>
                  )}
                  <div className="cart-drawer__qty-row">
                    <button
                      type="button"
                      className="cart-drawer__qty"
                      onClick={() => dispatch(updateCartQty(item, item.qty - 1))}
                    >
                      <Icon.minus />
                    </button>
                    <span className="cart-drawer__qty-value">{item.qty}</span>
                    <button
                      type="button"
                      className="cart-drawer__qty"
                      onClick={() => dispatch(updateCartQty(item, item.qty + 1))}
                    >
                      <Icon.plus />
                    </button>
                    <button
                      type="button"
                      className="cart-drawer__remove"
                      onClick={() =>
                        dispatch(removeCart(item.key || item.product))
                      }
                    >
                      {t("cart.remove")}
                    </button>
                  </div>
                </div>
                <div className="display cart-drawer__line-total">
                  {fmt(item.price * item.qty)}
                </div>
              </div>
            ))
          )}

          {/* "Add to your order" nudge — drinks first, then dessert. Adds
              in-place so the customer never leaves the cart. */}
          {cartItems.length > 0 && <CartUpsell enabled={open} />}
        </div>

        {cartItems.length > 0 && (
          <div className="cart-drawer__foot">
            <div className="cart-drawer__total-row">
              <span className="eyebrow">{t("cart.total")}</span>
              <span className="display cart-drawer__total-value">
                {fmt(total)}
              </span>
            </div>
            <button
              type="button"
              onClick={() => goTo("/checkout")}
              className="b-btn ember cart-drawer__checkout"
            >
              {t("cart.checkout")} <Icon.arrow className="arrow" />
            </button>
            <div className="cart-drawer__free">
              {t("cart.freeDelivery", { amount: FREE_DELIVERY_THRESHOLD })}
            </div>
          </div>
        )}
      </aside>
    </Portal>
  );
};

export default CartDrawer;
