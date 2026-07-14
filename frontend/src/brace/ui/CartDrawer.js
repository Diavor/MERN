import React, { useState } from "react";
import { useHistory } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Icon from "./Icon";
import fmt from "./fmt";
import ProductImage from "./ProductImage";
import { useCartUI } from "./CartUI";
import { useToast } from "./Toast";
import Portal from "./Portal";
import { updateCartQty, removeCart } from "../../store/actions/cart";
import { validateCoupon } from "../admin/api";
import { DELIVERY_ZONES, FREE_DELIVERY_THRESHOLD } from "../content";
import "./CartDrawer.scss";

const round2 = (n) => Math.round(n * 100) / 100;
// Cheapest zone fee — shown as the delivery estimate before a zone is chosen at
// checkout (the final fee is set per-zone there).
const MIN_ZONE_FEE = Math.min(...DELIVERY_ZONES.map((z) => z.price));

export function TotalRow({ label, value, muted, accent }) {
  const cls =
    "total-row" + (muted ? " is-muted" : "") + (accent ? " is-accent" : "");
  return (
    <div className={cls}>
      <span>{label}</span>
      <span className="total-row__value">{value}</span>
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
  const toast = useToast();
  const { cartItems } = useSelector((s) => s.cart);

  const [delivery, setDelivery] = useState("delivery"); // "delivery" | "pickup"
  const [promo, setPromo] = useState("");
  const [coupon, setCoupon] = useState(null); // { code, type, value, discount }
  const [promoLoading, setPromoLoading] = useState(false);

  const subtotal = cartItems.reduce((sum, i) => sum + i.qty * i.price, 0);
  const count = cartItems.reduce((sum, i) => sum + i.qty, 0);

  // Recompute the discount from the coupon rule so it stays correct as the cart
  // changes after the code was applied.
  const discount = coupon
    ? coupon.type === "percent"
      ? round2((subtotal * coupon.value) / 100)
      : Math.min(coupon.value, subtotal)
    : 0;

  const deliveryFee =
    delivery === "pickup" || subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : MIN_ZONE_FEE;
  const total = Math.max(0, subtotal - discount + deliveryFee);
  // Italian prices are VAT-inclusive — shown for information, not added.
  const vatIncluded = round2((total * 10) / 110);

  const goTo = (path) => {
    setOpen(false);
    history.push(path);
  };

  const applyPromo = async () => {
    const code = promo.trim();
    if (!code) return;
    setPromoLoading(true);
    try {
      const res = await validateCoupon(code, subtotal);
      setCoupon(res);
      toast(`Codice applicato — sconto di ${fmt(res.discount)}`, "ok");
    } catch (e) {
      setCoupon(null);
      toast(e.message || "Codice non valido", "info");
    } finally {
      setPromoLoading(false);
    }
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
            <div className="eyebrow">Il tuo carrello</div>
            <div className="display cart-drawer__count">
              {count} {count === 1 ? "pezzo" : "pezzi"}
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
              ["delivery", "Consegna"],
              ["pickup", "Ritiro"],
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
                Carrello vuoto
              </div>
              <button
                type="button"
                onClick={() => goTo("/menu")}
                className="b-btn ghost cart-drawer__empty-cta"
              >
                Vedi il menu
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
                      Rimuovi
                    </button>
                  </div>
                </div>
                <div className="display cart-drawer__line-total">
                  {fmt(item.price * item.qty)}
                </div>
              </div>
            ))
          )}
        </div>

        {cartItems.length > 0 && (
          <div className="cart-drawer__foot">
            {/* promo code */}
            <div className="cart-drawer__promo">
              <input
                className="cart-drawer__promo-input"
                value={promo}
                onChange={(e) => setPromo(e.target.value)}
                placeholder="Codice promo · BRACE10"
                onKeyDown={(e) => e.key === "Enter" && applyPromo()}
              />
              <button
                type="button"
                className="b-btn sm ghost cart-drawer__promo-apply"
                onClick={applyPromo}
                disabled={promoLoading}
              >
                {promoLoading ? "…" : "Applica"}
              </button>
            </div>

            <TotalRow label="Subtotale" value={fmt(subtotal)} />
            {discount > 0 && (
              <TotalRow label={`Sconto · ${coupon.code}`} value={"−" + fmt(discount)} accent />
            )}
            <TotalRow
              label={delivery === "delivery" ? "Consegna" : "Ritiro in negozio"}
              value={deliveryFee === 0 ? "Gratis" : fmt(deliveryFee)}
            />
            <TotalRow label="IVA inclusa" value={fmt(vatIncluded)} muted />

            <div className="cart-drawer__divider" />
            <div className="cart-drawer__total-row">
              <span className="eyebrow">Totale</span>
              <span className="display cart-drawer__total-value">
                {fmt(total)}
              </span>
            </div>
            <button
              type="button"
              onClick={() => goTo("/checkout")}
              className="b-btn ember cart-drawer__checkout"
            >
              Procedi al checkout <Icon.arrow className="arrow" />
            </button>
            <div className="cart-drawer__free">
              Consegna gratuita oltre €{FREE_DELIVERY_THRESHOLD}
            </div>
          </div>
        )}
      </aside>
    </Portal>
  );
};

export default CartDrawer;
