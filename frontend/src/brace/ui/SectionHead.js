import React from "react";

const SectionHead = ({ eyebrow, title, kicker, align = "left" }) => (
  <div style={{ textAlign: align, marginBottom: 56 }}>
    <div className="eyebrow" style={{ marginBottom: 18 }}>
      {eyebrow}
    </div>
    <h2
      className="display"
      style={{
        fontSize: "clamp(40px, 6vw, 84px)",
        lineHeight: 1.0,
        margin: 0,
        letterSpacing: "-0.005em",
      }}
    >
      {title}
    </h2>
    {kicker && (
      <p
        className="it"
        style={{
          fontSize: 22,
          color: "var(--text-dim)",
          maxWidth: 620,
          marginTop: 20,
          marginLeft: align === "center" ? "auto" : 0,
          marginRight: align === "center" ? "auto" : 0,
          lineHeight: 1.4,
        }}
      >
        {kicker}
      </p>
    )}
  </div>
);

export default SectionHead;
