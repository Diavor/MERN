import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import "./DatePicker.scss";

const WEEKDAY_KEYS = [
  "date.mon",
  "date.tue",
  "date.wed",
  "date.thu",
  "date.fri",
  "date.sat",
  "date.sun",
];

const fmtKey = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

// Inline mini-calendar. Controlled: `value` is "YYYY-MM-DD", `onChange` gets one.
// Selectable window is today .. today + 14 days.
const DatePicker = ({ value, onChange }) => {
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.resolvedLanguage === "en" ? "en-GB" : "it-IT";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + 14);

  const [view, setView] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1)
  );

  const monthName = view.toLocaleDateString(dateLocale, {
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
    <div className="date-picker">
      <div className="eyebrow date-picker__eyebrow">{t("date.date")}</div>

      <div className="date-picker__nav">
        <button
          type="button"
          className="date-picker__nav-btn"
          onClick={() =>
            canPrev &&
            setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))
          }
          disabled={!canPrev}
        >
          ‹
        </button>
        <div className="display date-picker__month">{monthName}</div>
        <button
          type="button"
          className="date-picker__nav-btn"
          onClick={() =>
            canNext &&
            setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))
          }
          disabled={!canNext}
        >
          ›
        </button>
      </div>

      <div className="date-picker__weekdays">
        {WEEKDAY_KEYS.map((d) => (
          <div key={d}>{t(d)}</div>
        ))}
      </div>

      <div className="date-picker__grid">
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
              className={`date-picker__day${isSelected ? " is-selected" : ""}${
                isToday ? " is-today" : ""
              }${disabled ? " is-disabled" : ""}`}
              disabled={disabled}
              onClick={() => onChange(key)}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>

      {value && (
        <div className="date-picker__summary">
          <span className="date-picker__summary-label">{t("common.selected")}</span>
          <span className="date-picker__summary-value">
            {new Date(value).toLocaleDateString(dateLocale, {
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
