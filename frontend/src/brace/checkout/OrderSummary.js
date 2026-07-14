import "./OrderSummary.scss";
import React from "react";
import fmt from "../ui/fmt";

const Row = ({ label, value, muted, accent }) => (
  <div
    className={`order-summary__row${muted ? " is-muted" : ""}${
      accent ? " is-accent" : ""
    }`}
  >
    <span>{label}</span>
    <span className="order-summary__row-value">{value}</span>
  </div>
);

// Sticky order summary fed by the real Redux cart + computed fees. The promo
// block validates against POST /api/coupons/validate (via the parent) and shows
// the applied discount as its own line.
const OrderSummary = ({
  cartItems,
  itemsPrice,
  deliveryFee,
  orderType,
  city,
  freeThreshold,
  discount = 0,
  total,
  promoCode,
  setPromoCode,
  appliedCoupon,
  onApplyPromo,
  onRemovePromo,
  promoError,
  promoLoading,
}) => {
  const deliveryLabel = orderType === "pickup" ? "Ritiro" : "Consegna";
  const deliveryValue =
    orderType === "pickup"
      ? "Gratis"
      : itemsPrice >= freeThreshold
      ? "Gratis"
      : deliveryFee > 0
      ? fmt(deliveryFee)
      : city
      ? "—"
      : "Scegli zona";

  return (
    <aside className="order-summary">
      <div className="eyebrow order-summary__eyebrow">Riepilogo</div>

      <div className="order-summary__list">
        {cartItems.map((line) => (
          <div key={line.key || line.product} className="order-summary__line">
            <div className="mono order-summary__qty">{line.qty}×</div>
            <div>
              <div className="order-summary__name">{line.name}</div>
              {(line.selectedDough || (line.toppings && line.toppings.length > 0)) && (
                <div className="mono order-summary__caption">
                  {line.selectedDough && (
                    <span className="order-summary__caption-dough">
                      Impasto: {line.selectedDough.name}
                    </span>
                  )}
                  {line.toppings && line.toppings.length > 0 && (
                    <span>+ {line.toppings.map((t) => t.name).join(", ")}</span>
                  )}
                </div>
              )}
            </div>
            <div className="mono order-summary__line-total">
              {fmt(line.qty * line.price)}
            </div>
          </div>
        ))}
      </div>

      {/* Promo code */}
      <div className="order-summary__promo">
        {appliedCoupon ? (
          <div className="order-summary__promo-applied">
            <div>
              <div className="mono order-summary__promo-code">
                {appliedCoupon.code}
              </div>
              <div className="mono order-summary__promo-hint">
                {appliedCoupon.type === "percent"
                  ? `−${appliedCoupon.value}% applicato`
                  : "Sconto applicato"}
              </div>
            </div>
            <button
              type="button"
              onClick={onRemovePromo}
              className="order-summary__promo-remove"
            >
              Rimuovi
            </button>
          </div>
        ) : (
          <>
            <div className="order-summary__promo-row">
              <input
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    onApplyPromo();
                  }
                }}
                placeholder="Codice promo"
                className="mono order-summary__promo-input"
              />
              <button
                type="button"
                onClick={onApplyPromo}
                disabled={promoLoading || !promoCode.trim()}
                className="b-btn sm ghost order-summary__promo-btn"
              >
                {promoLoading ? "…" : "Applica"}
              </button>
            </div>
            {promoError && (
              <div className="mono order-summary__promo-error">
                ↳ {promoError}
              </div>
            )}
          </>
        )}
      </div>

      <div className="order-summary__totals">
        <Row label="Subtotale" value={fmt(itemsPrice)} />
        <Row label={deliveryLabel} value={deliveryValue} />
        {discount > 0 && (
          <Row label="Sconto" value={"− " + fmt(discount)} accent />
        )}
        <div className="order-summary__divider" />
        <div className="order-summary__total">
          <span className="eyebrow">Totale</span>
          <span className="display order-summary__total-value">{fmt(total)}</span>
        </div>
      </div>
    </aside>
  );
};

export default OrderSummary;
