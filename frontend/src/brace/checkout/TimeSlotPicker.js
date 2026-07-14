import React from "react";
import "./TimeSlotPicker.scss";

// Time-slot grid fed by GET /api/slots?date= → [{ time, available }].
// Controlled: `value` is the chosen time, `onChange` receives a time string.
const TimeSlotPicker = ({ slots, value, onChange, loading, date }) => {
  return (
    <div className="slot-picker">
      <div className="slot-picker__head">
        <div className="eyebrow">Orario</div>
        <div className="mono slot-picker__cadence">ogni 15 min</div>
      </div>

      {!date ? (
        <div className="mono slot-picker__empty">Scegli prima una data</div>
      ) : loading ? (
        <div className="mono slot-picker__empty">Carico gli orari…</div>
      ) : slots.length === 0 ? (
        <div className="mono slot-picker__empty">Nessun orario disponibile</div>
      ) : (
        <div className="slot-picker__grid">
          {slots.map((slot) => {
            const active = slot.time === value;
            const full = slot.available === 0;
            const low = slot.available > 0 && slot.available < 6;
            const className = [
              "slot-picker__slot",
              active && "is-selected",
              full && "is-full is-disabled",
              low && "is-low",
              !full && !active && "is-available",
            ]
              .filter(Boolean)
              .join(" ");
            return (
              <button
                type="button"
                key={slot.time}
                disabled={full}
                onClick={() => onChange(slot.time)}
                className={className}
              >
                {slot.time}
                {low && <span className="slot-picker__count">{slot.available}</span>}
              </button>
            );
          })}
        </div>
      )}

      {value && (
        <div className="slot-picker__footer">
          <span className="slot-picker__footer-label">Selezionato</span>
          <span className="slot-picker__footer-value">Alle {value}</span>
        </div>
      )}
    </div>
  );
};

export default TimeSlotPicker;
