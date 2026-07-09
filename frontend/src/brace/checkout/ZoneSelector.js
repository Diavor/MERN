import React from "react";
import fmt from "../ui/fmt";

// Delivery-zone picker over the real Mogliano Veneto zones ({ city, price }).
// Controlled: `value` is the selected city, `onChange` receives a city string.
const ZoneSelector = ({ zones, value, onChange, subtotal, freeThreshold }) => {
  const selected = zones.find((z) => z.city === value);
  const free = subtotal >= freeThreshold;

  return (
    <div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        style={{
          width: "100%",
          padding: "16px 44px 16px 18px",
          background: "var(--bg-2)",
          border: "1px solid var(--line)",
          color: value ? "var(--text)" : "var(--text-faint)",
          fontFamily: "var(--mono)",
          fontSize: 13,
          letterSpacing: "0.04em",
          appearance: "none",
          backgroundImage:
            "linear-gradient(45deg, transparent 50%, var(--gold) 50%), linear-gradient(135deg, var(--gold) 50%, transparent 50%)",
          backgroundPosition:
            "calc(100% - 22px) 50%, calc(100% - 16px) 50%",
          backgroundSize: "6px 6px",
          backgroundRepeat: "no-repeat",
          outline: "none",
        }}
      >
        <option value="">Seleziona la tua zona…</option>
        {zones.map((z) => (
          <option key={z.city} value={z.city}>
            {z.city} — {z.price === 0 ? "Gratis" : "€ " + z.price.toFixed(2)}
          </option>
        ))}
      </select>

      {/* Selected-zone summary card */}
      {selected && (
        <div
          style={{
            marginTop: 14,
            padding: "18px 20px",
            background: "var(--bg-2)",
            border: "1px solid var(--gold-deep)",
            display: "grid",
            gridTemplateColumns: "1fr auto",
            gap: 24,
            alignItems: "center",
          }}
        >
          <div>
            <div className="eyebrow" style={{ marginBottom: 8 }}>
              Zona selezionata
            </div>
            <div className="display" style={{ fontSize: 22, lineHeight: 1.1 }}>
              {selected.city}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div
              className="mono"
              style={{
                fontSize: 10,
                color: "var(--text-faint)",
                letterSpacing: "0.16em",
                textTransform: "uppercase",
              }}
            >
              Costo consegna
            </div>
            <div
              className="display"
              style={{
                fontSize: 32,
                color: free ? "var(--ok)" : "var(--gold)",
                marginTop: 4,
              }}
            >
              {free ? "Gratis" : "€ " + selected.price.toFixed(2)}
            </div>
            {free && (
              <div
                className="mono"
                style={{
                  fontSize: 10,
                  color: "var(--ok)",
                  letterSpacing: "0.1em",
                  marginTop: 4,
                }}
              >
                ↑ ordine ≥ {fmt(freeThreshold)}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ZoneSelector;
