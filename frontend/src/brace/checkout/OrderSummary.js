import React from "react";
import fmt from "../ui/fmt";

const Row = ({ label, value, muted, accent }) => (
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      fontFamily: "var(--mono)",
      fontSize: 12,
      padding: "6px 0",
      color: muted
        ? "var(--text-faint)"
        : accent
        ? "var(--gold)"
        : "var(--text-dim)",
    }}
  >
    <span>{label}</span>
    <span
      style={{
        color: accent
          ? "var(--gold)"
          : muted
          ? "var(--text-faint)"
          : "var(--text)",
      }}
    >
      {value}
    </span>
  </div>
);

// Sticky order summary fed by the real Redux cart + computed fees.
const OrderSummary = ({
  cartItems,
  itemsPrice,
  deliveryFee,
  orderType,
  city,
  freeThreshold,
  total,
}) => {
  const deliveryLabel =
    orderType === "pickup"
      ? "Ritiro"
      : itemsPrice >= freeThreshold
      ? "Consegna"
      : "Consegna";
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
    <aside
      style={{
        position: "sticky",
        top: 120,
        background: "var(--bg-2)",
        border: "1px solid var(--line)",
        padding: 28,
      }}
    >
      <div className="eyebrow" style={{ marginBottom: 20 }}>
        Riepilogo
      </div>

      <div style={{ maxHeight: 280, overflowY: "auto", paddingRight: 4 }}>
        {cartItems.map((line) => (
          <div
            key={line.key || line.product}
            style={{
              display: "grid",
              gridTemplateColumns: "auto 1fr auto",
              gap: 14,
              padding: "12px 0",
              borderBottom: "1px solid var(--line)",
              alignItems: "center",
            }}
          >
            <div className="mono" style={{ fontSize: 11, color: "var(--gold)" }}>
              {line.qty}×
            </div>
            <div>
              <div style={{ fontSize: 14 }}>{line.name}</div>
              {(line.selectedDough || (line.toppings && line.toppings.length > 0)) && (
                <div
                  className="mono"
                  style={{
                    fontSize: 10,
                    color: "var(--text-faint)",
                    letterSpacing: "0.06em",
                    marginTop: 4,
                    lineHeight: 1.5,
                  }}
                >
                  {line.selectedDough && (
                    <span style={{ display: "block" }}>
                      Impasto: {line.selectedDough.name}
                    </span>
                  )}
                  {line.toppings && line.toppings.length > 0 && (
                    <span>+ {line.toppings.map((t) => t.name).join(", ")}</span>
                  )}
                </div>
              )}
            </div>
            <div className="mono" style={{ fontSize: 13, color: "var(--text)" }}>
              {fmt(line.qty * line.price)}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 20 }}>
        <Row label="Subtotale" value={fmt(itemsPrice)} />
        <Row label={deliveryLabel} value={deliveryValue} />
        <div style={{ height: 1, background: "var(--line-2)", margin: "14px 0" }} />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
          }}
        >
          <span className="eyebrow">Totale</span>
          <span className="display" style={{ fontSize: 36, color: "var(--gold)" }}>
            {fmt(total)}
          </span>
        </div>
      </div>
    </aside>
  );
};

export default OrderSummary;
