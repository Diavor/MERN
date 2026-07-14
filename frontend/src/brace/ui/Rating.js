import React from "react";
import Icon from "./Icon";
import "./Rating.scss";

// SVG star rating with fractional fill (replaces the Font Awesome version)
const Stars = ({ color }) => (
  <span className="rating__stars" style={{ color }}>
    {[0, 1, 2, 3, 4].map((i) => (
      <Icon.star key={i} />
    ))}
  </span>
);

const Rating = ({ value = 0, text, color = "var(--gold)" }) => {
  const pct = Math.max(0, Math.min(100, (value / 5) * 100));
  return (
    <span className="rating">
      <span className="rating__track">
        <Stars color="var(--line)" />
        <span className="rating__fill" style={{ width: pct + "%" }}>
          <Stars color={color} />
        </span>
      </span>
      {text && (
        <span className="rating__text mono">{text}</span>
      )}
    </span>
  );
};

export default Rating;
