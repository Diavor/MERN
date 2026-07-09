import React from "react";

// Time-slot grid fed by GET /api/slots?date= → [{ time, available }].
// Controlled: `value` is the chosen time, `onChange` receives a time string.
const TimeSlotPicker = ({ slots, value, onChange, loading, date }) => {
  return (
    <div
      style={{
        background: "var(--bg-2)",
        border: "1px solid var(--line)",
        padding: 22,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 14,
        }}
      >
        <div className="eyebrow">Orario</div>
        <div
          className="mono"
          style={{
            fontSize: 10,
            color: "var(--text-faint)",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
          }}
        >
          ogni 15 min
        </div>
      </div>

      {!date ? (
        <div
          className="mono"
          style={{
            fontSize: 12,
            color: "var(--text-faint)",
            letterSpacing: "0.06em",
            padding: "40px 0",
            textAlign: "center",
          }}
        >
          Scegli prima una data
        </div>
      ) : loading ? (
        <div
          className="mono"
          style={{
            fontSize: 12,
            color: "var(--text-faint)",
            letterSpacing: "0.06em",
            padding: "40px 0",
            textAlign: "center",
          }}
        >
          Carico gli orari…
        </div>
      ) : slots.length === 0 ? (
        <div
          className="mono"
          style={{
            fontSize: 12,
            color: "var(--text-faint)",
            letterSpacing: "0.06em",
            padding: "40px 0",
            textAlign: "center",
          }}
        >
          Nessun orario disponibile
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 4,
            maxHeight: 240,
            overflowY: "auto",
            paddingRight: 4,
          }}
        >
          {slots.map((slot) => {
            const active = slot.time === value;
            const full = slot.available === 0;
            const low = slot.available > 0 && slot.available < 6;
            return (
              <button
                type="button"
                key={slot.time}
                disabled={full}
                onClick={() => onChange(slot.time)}
                style={{
                  padding: "14px 0",
                  background: active
                    ? "var(--gold)"
                    : full
                    ? "transparent"
                    : "var(--bg-3)",
                  color: active
                    ? "var(--bg)"
                    : full
                    ? "var(--text-faint)"
                    : "var(--text)",
                  border:
                    "1px solid " +
                    (active
                      ? "var(--gold)"
                      : full
                      ? "var(--line)"
                      : low
                      ? "var(--gold-deep)"
                      : "var(--line-2)"),
                  cursor: full ? "not-allowed" : "pointer",
                  fontFamily: "var(--mono)",
                  fontSize: 13,
                  letterSpacing: "0.04em",
                  position: "relative",
                  opacity: full ? 0.4 : 1,
                  transition: "all .15s ease",
                }}
              >
                {slot.time}
                {low && (
                  <span
                    style={{
                      position: "absolute",
                      top: 3,
                      right: 5,
                      fontSize: 8,
                      color: active ? "var(--bg)" : "var(--gold)",
                      letterSpacing: 0,
                    }}
                  >
                    {slot.available}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {value && (
        <div
          style={{
            marginTop: 16,
            paddingTop: 14,
            borderTop: "1px solid var(--line)",
            display: "flex",
            justifyContent: "space-between",
            fontFamily: "var(--mono)",
            fontSize: 11,
            letterSpacing: "0.08em",
          }}
        >
          <span style={{ color: "var(--text-faint)" }}>Selezionato</span>
          <span style={{ color: "var(--gold)" }}>Alle {value}</span>
        </div>
      )}
    </div>
  );
};

export default TimeSlotPicker;
