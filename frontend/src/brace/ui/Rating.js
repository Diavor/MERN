import React from "react";
import Icon from "./Icon";

// SVG star rating with fractional fill (replaces the Font Awesome version)
const Stars = ({ color }) => (
  <span style={{ display: "inline-flex", gap: 2, color }}>
    {[0, 1, 2, 3, 4].map((i) => (
      <Icon.star key={i} />
    ))}
  </span>
);

const Rating = ({ value = 0, text, color = "var(--gold)" }) => {
  const pct = Math.max(0, Math.min(100, (value / 5) * 100));
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      <span style={{ position: "relative", display: "inline-flex", lineHeight: 0 }}>
        <Stars color="var(--line)" />
        <span
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: pct + "%",
            overflow: "hidden",
            whiteSpace: "nowrap",
            lineHeight: 0,
          }}
        >
          <Stars color={color} />
        </span>
      </span>
      {text && (
        <span
          className="mono"
          style={{ fontSize: 11, color: "var(--text-faint)", letterSpacing: "0.08em" }}
        >
          {text}
        </span>
      )}
    </span>
  );
};

export default Rating;
