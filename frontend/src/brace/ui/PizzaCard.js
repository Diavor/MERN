import React from "react";
import { useTranslation } from "react-i18next";
import Icon from "./Icon";
import fmt from "./fmt";
import Rating from "./Rating";
import ProductImage from "./ProductImage";
import "./PizzaCard.scss";

// Product card in the Grani Antichi design language, driven by a real product doc.
const PizzaCard = ({ product, onClick, onAdd }) => {
  const { t } = useTranslation();
  return (
    <article className="pizza-card" onClick={onClick}>
      <div className="pizza-card__media">
        <div className="pizza-card__media-inner">
          <ProductImage src={product.img} alt={product.name} />
        </div>
      </div>

      <div className="pizza-card__head">
        <h3 className="display pizza-card__name">{product.name}</h3>
        <span className="display pizza-card__price">{fmt(product.price)}</span>
      </div>

      <div className="pizza-card__rating">
        <Rating
          value={product.rating}
          text={t("common.reviews", { count: product.numReviews })}
        />
      </div>

      <p className="it pizza-card__desc">{product.description}</p>

      <div className="pizza-card__foot">
        <span className="pizza-card__foot-label">{t("common.viewDetail")}</span>
        <button
          type="button"
          className="pizza-card__add"
          aria-label={t("common.addToCartAria", { name: product.name })}
          onClick={(e) => {
            e.stopPropagation();
            onAdd(product);
          }}
        >
          <Icon.plus />
        </button>
      </div>
    </article>
  );
};

export default PizzaCard;
