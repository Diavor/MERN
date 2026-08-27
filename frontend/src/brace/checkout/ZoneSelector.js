import React from "react";
import { useTranslation } from "react-i18next";
import fmt from "../ui/fmt";
import FieldSelect from "../ui/FieldSelect";
import "./ZoneSelector.scss";

// Delivery-zone picker over the live admin-managed zones (GET /api/zones?
// activeOnly=true). Each zone carries its own fee, free-delivery threshold,
// minimum order and ETA, so the card reflects the real rules per area.
// Controlled: `value` is the selected zone name, `onChange` receives that name.
const ZoneSelector = ({ zones, value, onChange, subtotal, loading }) => {
  const { t } = useTranslation();
  const selected = zones.find((z) => z.name === value);
  const free = selected && subtotal >= selected.freeThreshold;
  const belowMin = selected && selected.minOrder > 0 && subtotal < selected.minOrder;

  return (
    <div className="zone-selector">
      <FieldSelect
        value={value}
        onChange={onChange}
        required
        disabled={loading}
        ariaLabel={t("zone.aria")}
        className="zone-selector__select"
        placeholder={loading ? t("zone.loading") : t("zone.select")}
        options={zones.map((z) => ({
          value: z.name,
          label: `${z.name} — ${z.fee === 0 ? t("summary.free") : "€ " + z.fee.toFixed(2)}`,
        }))}
      />

      {/* Selected-zone summary card */}
      {selected && (
        <div className="zone-selector__card">
          <div>
            <div className="eyebrow zone-selector__eyebrow">
              {t("zone.selectedZone")}
            </div>
            <div className="display zone-selector__city">
              {selected.name}
            </div>
            {selected.eta && (
              <div className="mono zone-selector__eta">
                {t("cart.delivery")} {selected.eta}
              </div>
            )}
          </div>
          <div className="zone-selector__cost">
            <div className="mono zone-selector__cost-label">
              {t("zone.deliveryCost")}
            </div>
            <div
              className={
                "display zone-selector__cost-value" +
                (free ? " is-free" : "")
              }
            >
              {free ? t("summary.free") : "€ " + selected.fee.toFixed(2)}
            </div>
            {free ? (
              <div className="mono zone-selector__free-note">
                {t("zone.freeReached", { amount: fmt(selected.freeThreshold) })}
              </div>
            ) : (
              <div className="mono zone-selector__free-note">
                {t("zone.freeFrom", { amount: fmt(selected.freeThreshold) })}
              </div>
            )}
          </div>
        </div>
      )}

      {belowMin && (
        <div className="mono zone-selector__min-note">
          ↳ {t("zone.minOrder", { min: fmt(selected.minOrder) })}
        </div>
      )}
    </div>
  );
};

export default ZoneSelector;
