import React, { useState } from "react";

// BRÀCE text field with an uppercase mono label that turns gold on focus.
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
  const [focus, setFocus] = useState(false);
  return (
    <label
      style={{ gridColumn: span ? "span " + span : "auto", display: "block" }}
    >
      <div
        className="mono"
        style={{
          fontSize: 10,
          color: focus ? "var(--gold)" : "var(--text-faint)",
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          marginBottom: 8,
          transition: "color .2s ease",
        }}
      >
        {label}
        {required && <span style={{ color: "var(--gold)" }}> ·</span>}
      </div>
      <div
        style={{
          background: "var(--bg-2)",
          border:
            "1px solid " + (focus ? "var(--gold-deep)" : "var(--line)"),
          padding: multiline ? 14 : "0 14px",
          display: "flex",
          alignItems: "center",
          gap: 10,
          transition: "border-color .2s ease",
        }}
      >
        {icon && <span style={{ color: "var(--gold)" }}>{icon}</span>}
        {multiline ? (
          <textarea
            value={value}
            placeholder={placeholder}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setFocus(true)}
            onBlur={() => setFocus(false)}
            rows={3}
            style={{
              width: "100%",
              background: "none",
              border: "none",
              outline: "none",
              color: "var(--text)",
              fontFamily: "var(--sans)",
              fontSize: 14,
              resize: "vertical",
            }}
          />
        ) : (
          <input
            type={type}
            value={value}
            placeholder={placeholder}
            required={required}
            autoComplete={autoComplete}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setFocus(true)}
            onBlur={() => setFocus(false)}
            style={{
              width: "100%",
              padding: "14px 0",
              background: "none",
              border: "none",
              outline: "none",
              color: "var(--text)",
              fontFamily: "var(--sans)",
              fontSize: 14,
            }}
          />
        )}
      </div>
    </label>
  );
};

export default Field;
