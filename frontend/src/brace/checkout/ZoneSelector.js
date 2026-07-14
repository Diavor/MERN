import React from "react";
import fmt from "../ui/fmt";
import "./ZoneSelector.scss";

// Delivery-zone picker over the live admin-managed zones (GET /api/zones?
// activeOnly=true). Each zone carries its own fee, free-delivery threshold,
// minimum order and ETA, so the card reflects the real rules per area.
// Controlled: `value` is the selected zone name, `onChange` receives that name.
const ZoneSelector = ({ zones, value, onChange, subtotal, loading }) => {
  const selected = zones.find((z) => z.name === value);
  const free = selected && subtotal >= selected.freeThreshold;
  const belowMin = selected && selected.minOrder > 0 && subtotal < selected.minOrder;

  return (
    <div className="zone-selector">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        disabled={loading}
        className={
          "zone-selector__select" + (value ? "" : " is-placeholder")
        }
      >
        <option value="">
          {loading ? "Carico le zone…" : "Seleziona la tua zona…"}
        </option>
        {zones.map((z) => (
          <option key={z._id || z.name} value={z.name}>
            {z.name} — {z.fee === 0 ? "Gratis" : "€ " + z.fee.toFixed(2)}
          </option>
        ))}
      </select>

      {/* Selected-zone summary card */}
      {selected && (
        <div className="zone-selector__card">
          <div>
            <div className="eyebrow zone-selector__eyebrow">
              Zona selezionata
            </div>
            <div className="display zone-selector__city">
              {selected.name}
            </div>
            {selected.eta && (
              <div className="mono zone-selector__eta">
                Consegna {selected.eta}
              </div>
            )}
          </div>
          <div className="zone-selector__cost">
            <div className="mono zone-selector__cost-label">
              Costo consegna
            </div>
            <div
              className={
                "display zone-selector__cost-value" +
                (free ? " is-free" : "")
              }
            >
              {free ? "Gratis" : "€ " + selected.fee.toFixed(2)}
            </div>
            {free ? (
              <div className="mono zone-selector__free-note">
                ↑ ordine ≥ {fmt(selected.freeThreshold)}
              </div>
            ) : (
              <div className="mono zone-selector__free-note">
                Gratis da {fmt(selected.freeThreshold)}
              </div>
            )}
          </div>
        </div>
      )}

      {belowMin && (
        <div className="mono zone-selector__min-note">
          ↳ Ordine minimo {fmt(selected.minOrder)} per questa zona
        </div>
      )}
    </div>
  );
};

export default ZoneSelector;
