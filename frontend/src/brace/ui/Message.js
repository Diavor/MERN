import React from "react";

const COLORS = {
  danger: { border: "var(--accent)", color: "var(--accent)" },
  success: { border: "var(--ok)", color: "var(--ok)" },
  info: { border: "var(--gold)", color: "var(--gold)" },
};

// Drop-in replacement for the old Bootstrap Alert Message ({variant, children})
const Message = ({ variant = "info", children }) => {
  const c = COLORS[variant] || COLORS.info;
  return (
    <div
      style={{
        border: "1px solid var(--line)",
        borderLeft: "3px solid " + c.border,
        background: "var(--bg-2)",
        padding: "14px 18px",
        margin: "12px 0",
        fontSize: 13,
      }}
    >
      <span className="mono" style={{ color: c.color, fontSize: 12 }}>
        {children}
      </span>
    </div>
  );
};

export default Message;
