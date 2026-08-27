import "./OrderSummary.scss";
import React from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
  const deliveryLabel = orderType === "pickup" ? t("cart.pickup") : t("cart.delivery");
  const deliveryValue =
    orderType === "pickup"
      ? t("summary.free")
      : itemsPrice >= freeThreshold
      ? t("summary.free")
      : deliveryFee > 0
      ? fmt(deliveryFee)
      : city
      ? "—"
      : t("summary.chooseZone");

  return (
    <aside className="order-summary">
      <div className="eyebrow order-summary__eyebrow">{t("summary.title")}</div>

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
                      {t("product.dough")}: {line.selectedDough.name}
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
                  ? t("summary.percentApplied", { value: appliedCoupon.value })
                  : t("summary.discountApplied")}
              </div>
            </div>
            <button
              type="button"
              onClick={onRemovePromo}
              className="order-summary__promo-remove"
            >
              {t("cart.remove")}
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
                placeholder={t("summary.promoPlaceholder")}
                className="mono order-summary__promo-input"
              />
              <button
                type="button"
                onClick={onApplyPromo}
                disabled={promoLoading || !promoCode.trim()}
                className="b-btn sm ghost order-summary__promo-btn"
              >
                {promoLoading ? "…" : t("summary.apply")}
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
        <Row label={t("summary.subtotal")} value={fmt(itemsPrice)} />
        <Row label={deliveryLabel} value={deliveryValue} />
        {discount > 0 && (
          <Row label={t("summary.discount")} value={"− " + fmt(discount)} accent />
        )}
        <div className="order-summary__divider" />
        <div className="order-summary__total">
          <span className="eyebrow">{t("cart.total")}</span>
          <span className="display order-summary__total-value">{fmt(total)}</span>
        </div>
      </div>
    </aside>
  );
};

export default OrderSummary;
