import React from "react";
import "./Message.scss";

const COLORS = {
  danger: { border: "var(--accent)", color: "var(--accent)" },
  success: { border: "var(--ok)", color: "var(--ok)" },
  info: { border: "var(--gold)", color: "var(--gold)" },
};

// Drop-in replacement for the old Bootstrap Alert Message ({variant, children})
const Message = ({ variant = "info", children }) => {
  const mod = COLORS[variant] ? variant : "info";
  return (
    <div className={"message message--" + mod}>
      <span className="mono message__text">{children}</span>
    </div>
  );
};

export default Message;
