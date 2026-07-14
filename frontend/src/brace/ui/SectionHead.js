import React from "react";
import "./SectionHead.scss";

const SectionHead = ({ eyebrow, title, kicker, align = "left" }) => (
  <div className={"section-head" + (align === "center" ? " is-center" : "")}>
    <div className="eyebrow section-head__eyebrow">{eyebrow}</div>
    <h2 className="display section-head__title">{title}</h2>
    {kicker && <p className="it section-head__kicker">{kicker}</p>}
  </div>
);

export default SectionHead;
