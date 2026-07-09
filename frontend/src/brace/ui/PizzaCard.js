import React, { useState } from "react";
import Icon from "./Icon";
import fmt from "./fmt";
import Rating from "./Rating";
import ProductImage from "./ProductImage";

// Product card in the BRÀCE design language, driven by a real product doc.
const PizzaCard = ({ product, onClick, onAdd }) => {
  const [hover, setHover] = useState(false);
  return (
    <article
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onClick}
      style={{
        background: "var(--bg-2)",
        border: "1px solid " + (hover ? "var(--line-2)" : "var(--line)"),
        padding: 28,
        cursor: "pointer",
        position: "relative",
        transition: "all .35s ease",
        transform: hover ? "translateY(-4px)" : "translateY(0)",
        overflow: "hidden",
      }}
    >
      <div style={{ position: "relative", marginBottom: 22 }}>
        <div
          style={{
            maxWidth: 220,
            margin: "0 auto",
            transform: hover ? "rotate(6deg) scale(1.04)" : "rotate(0) scale(1)",
            transition: "transform .6s cubic-bezier(.2,.7,.2,1)",
          }}
        >
          <ProductImage src={product.img} alt={product.name} />
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 6,
          gap: 14,
        }}
      >
        <h3
          className="display"
          style={{ fontSize: 26, margin: 0, letterSpacing: 0, lineHeight: 1.05, flex: 1, minWidth: 0 }}
        >
          {product.name}
        </h3>
        <span className="display" style={{ fontSize: 22, color: "var(--gold)", whiteSpace: "nowrap" }}>
          {fmt(product.price)}
        </span>
      </div>

      <div style={{ marginBottom: 12 }}>
        <Rating value={product.rating} text={`${product.numReviews} recensioni`} />
      </div>

      <p
        className="it"
        style={{
          fontSize: 16,
          color: "var(--text-dim)",
          margin: "0 0 14px",
          lineHeight: 1.4,
          minHeight: 44,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {product.description}
      </p>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 22,
          paddingTop: 18,
          borderTop: "1px solid var(--line)",
        }}
      >
        <span
          style={{
            fontFamily: "var(--mono)",
            fontSize: 11,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "var(--text-dim)",
          }}
        >
          Vedi dettaglio
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAdd(product);
          }}
          aria-label={`Aggiungi ${product.name} al carrello`}
          style={{
            background: hover ? "var(--gold)" : "var(--bg-3)",
            color: hover ? "var(--bg)" : "var(--text)",
            border: "none",
            width: 38,
            height: 38,
            borderRadius: 999,
            cursor: "pointer",
            display: "grid",
            placeItems: "center",
            transition: "all .25s ease",
          }}
        >
          <Icon.plus />
        </button>
      </div>
    </article>
  );
};

export default PizzaCard;
