import React, { useState } from "react";

const calNavBtn = (enabled) => ({
  width: 32,
  height: 32,
  borderRadius: 999,
  background: "transparent",
  border: "1px solid var(--line-2)",
  color: enabled ? "var(--text)" : "var(--text-faint)",
  cursor: enabled ? "pointer" : "not-allowed",
  fontSize: 16,
  lineHeight: 1,
  padding: 0,
  opacity: enabled ? 1 : 0.4,
});

const fmtKey = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

// Inline mini-calendar. Controlled: `value` is "YYYY-MM-DD", `onChange` gets one.
// Selectable window is today .. today + 14 days.
const DatePicker = ({ value, onChange }) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + 14);

  const [view, setView] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1)
  );

  const monthName = view.toLocaleDateString("it-IT", {
    month: "long",
    year: "numeric",
  });

  const firstDay = new Date(view.getFullYear(), view.getMonth(), 1);
  const offset = (firstDay.getDay() + 6) % 7; // Monday-first
  const daysInMonth = new Date(
    view.getFullYear(),
    view.getMonth() + 1,
    0
  ).getDate();

  const cells = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++)
    cells.push(new Date(view.getFullYear(), view.getMonth(), d));
  while (cells.length % 7 !== 0) cells.push(null);

  const canPrev =
    view.getFullYear() > today.getFullYear() ||
    (view.getFullYear() === today.getFullYear() &&
      view.getMonth() > today.getMonth());
  const canNext =
    view.getFullYear() < maxDate.getFullYear() ||
    (view.getFullYear() === maxDate.getFullYear() &&
      view.getMonth() < maxDate.getMonth());

  return (
    <div
      style={{
        background: "var(--bg-2)",
        border: "1px solid var(--line)",
        padding: 22,
      }}
    >
      <div className="eyebrow" style={{ marginBottom: 14 }}>
        Data
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 18,
        }}
      >
        <button
          type="button"
          onClick={() =>
            canPrev &&
            setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))
          }
          disabled={!canPrev}
          style={calNavBtn(canPrev)}
        >
          ‹
        </button>
        <div
          className="display"
          style={{ fontSize: 20, textTransform: "capitalize", letterSpacing: 0 }}
        >
          {monthName}
        </div>
        <button
          type="button"
          onClick={() =>
            canNext &&
            setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))
          }
          disabled={!canNext}
          style={calNavBtn(canNext)}
        >
          ›
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 4,
          fontFamily: "var(--mono)",
          fontSize: 10,
          color: "var(--text-faint)",
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          textAlign: "center",
          marginBottom: 8,
        }}
      >
        {["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 4,
        }}
      >
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const key = fmtKey(d);
          const disabled = d < today || d > maxDate;
          const isSelected = key === value;
          const isToday = d.getTime() === today.getTime();
          return (
            <button
              type="button"
              key={i}
              disabled={disabled}
              onClick={() => onChange(key)}
              style={{
                aspectRatio: "1/1",
                background: isSelected
                  ? "var(--gold)"
                  : isToday
                  ? "var(--bg-3)"
                  : "transparent",
                color: disabled
                  ? "var(--text-faint)"
                  : isSelected
                  ? "var(--bg)"
                  : "var(--text)",
                border:
                  "1px solid " +
                  (isSelected
                    ? "var(--gold)"
                    : isToday
                    ? "var(--gold-deep)"
                    : "transparent"),
                cursor: disabled ? "not-allowed" : "pointer",
                opacity: disabled ? 0.25 : 1,
                fontFamily: "var(--mono)",
                fontSize: 13,
                transition: "all .15s ease",
              }}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>

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
          <span style={{ color: "var(--gold)" }}>
            {new Date(value).toLocaleDateString("it-IT", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </span>
        </div>
      )}
    </div>
  );
};

export default DatePicker;
