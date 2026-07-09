import React from "react";

// Drop-in replacement for the old Bootstrap spinner Loader
const Loader = () => (
  <div style={{ display: "grid", placeItems: "center", padding: "60px 0" }}>
    <div
      style={{
        width: 44,
        height: 44,
        borderRadius: "50%",
        border: "2px solid var(--line)",
        borderTopColor: "var(--accent)",
        animation: "spinSlow 0.9s linear infinite",
      }}
    />
  </div>
);

export default Loader;
