import React from "react";
import "./Field.scss";

// Grani Antichi text field with an uppercase mono label that turns gold on focus.
// `onChange` receives the raw value (not the event).
const Field = ({
  label,
  value,
  onChange,
  type = "text",
  span,
  multiline = false,
  icon,
  placeholder,
  required,
  autoComplete,
}) => {
  return (
    <label
      className="field"
      // "1 / -1" = full row: unlike "span N" it can't force implicit columns
      // when the parent grid collapses to a single column on mobile
      style={{ gridColumn: span ? "1 / -1" : "auto" }}
    >
      <div className="field__label mono">
        {label}
        {required && <span className="field__required"> ·</span>}
      </div>
      <div className={"field__box" + (multiline ? " is-multiline" : "")}>
        {icon && <span className="field__icon">{icon}</span>}
        {multiline ? (
          <textarea
            className="field__control field__textarea"
            value={value}
            placeholder={placeholder}
            onChange={(e) => onChange(e.target.value)}
            rows={3}
          />
        ) : (
          <input
            className="field__control field__input"
            type={type}
            value={value}
            placeholder={placeholder}
            required={required}
            autoComplete={autoComplete}
            onChange={(e) => onChange(e.target.value)}
          />
        )}
      </div>
    </label>
  );
};

export default Field;
