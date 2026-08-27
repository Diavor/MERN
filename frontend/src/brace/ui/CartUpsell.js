import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import axios from "../../api/axiosConfig";
import Icon from "./Icon";
import fmt from "./fmt";
import ProductImage from "./ProductImage";
import { useToast } from "./Toast";
import { addToCart } from "../../store/actions/cart";
import "./CartUpsell.scss";

// Ordered upsell groups: the rail shows the FIRST group that still has
// something to offer, so the customer is nudged through drinks → dessert
// without ever leaving the cart. A group whose category has no products (e.g.
// "Dolci" before desserts are seeded) is skipped silently.
// `category` is a data value (DB category name) — never translated. The
// eyebrow/title are translation keys resolved at render time.
export const DEFAULT_GROUPS = [
  {
    category: "Bevande",
    eyebrow: "upsell.drinksEyebrow",
    title: "upsell.drinksTitle",
  },
  {
    category: "Dolci",
    eyebrow: "upsell.dessertEyebrow",
    title: "upsell.dessertTitle",
  },
];

const SKELETONS = [0, 1, 2];

/**
 * Horizontal "add to your order" rail rendered inside the cart drawer.
 *
 * @param {Array}  groups  - [{ category, eyebrow, title }] in nudge order.
 * @param {number} max     - max cards per rail.
 * @param {bool}   enabled - defer the fetch until the drawer is actually opened.
 */
const CartUpsell = ({ groups = DEFAULT_GROUPS, max = 8, enabled = true }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const toast = useToast();
  const { cartItems } = useSelector((s) => s.cart);

  // { [category]: Product[] } — fetched once, on first open.
  const [byCategory, setByCategory] = useState(null);
  const [adding, setAdding] = useState("");

  useEffect(() => {
    if (!enabled || byCategory) return;
    let alive = true;

    Promise.all(
      groups.map((g) =>
        axios
          .get(`/api/products?category=${encodeURIComponent(g.category)}`)
          .then(({ data }) => data.products || [])
          // A missing/failed category must not break the rail — treat as empty.
          .catch(() => [])
      )
    ).then((results) => {
      if (!alive) return;
      setByCategory(
        groups.reduce((acc, g, i) => ({ ...acc, [g.category]: results[i] }), {})
      );
    });

    return () => {
      alive = false;
    };
  }, [enabled, byCategory, groups]);

  const cartIds = useMemo(
    () => new Set(cartItems.map((i) => i.product)),
    [cartItems]
  );

  // First group that has products and nothing from it in the cart yet. Once a
  // drink is added the drinks rail retires and the dessert rail takes over.
  const active = useMemo(() => {
    if (!byCategory) return null;
    for (const g of groups) {
      const products = byCategory[g.category] || [];
      if (products.length === 0) continue;
      if (products.some((p) => cartIds.has(p._id))) continue;
      return { ...g, products: products.slice(0, max) };
    }
    return null;
  }, [byCategory, groups, cartIds, max]);

  const add = async (product) => {
    setAdding(product._id);
    try {
      await dispatch(addToCart(product._id, 1, [], null));
      toast(t("common.addedToCart", { name: product.name }), "ok");
    } catch (e) {
      toast(t("upsell.addFailed"), "info");
    } finally {
      setAdding("");
    }
  };

  // Loading skeleton only before the first payload; afterwards an exhausted
  // rail renders nothing rather than an empty box.
  if (enabled && !byCategory) {
    return (
      <section className="cart-upsell is-loading" aria-hidden="true">
        <div className="cart-upsell__head">
          <span className="cart-upsell__skeleton-title" />
        </div>
        <div className="cart-upsell__rail">
          {SKELETONS.map((i) => (
            <div key={i} className="cart-upsell__card is-skeleton" />
          ))}
        </div>
      </section>
    );
  }

  if (!active) return null;

  return (
    <section className="cart-upsell" aria-labelledby="cart-upsell-title">
      <div className="cart-upsell__head">
        <span className="eyebrow cart-upsell__eyebrow">{t(active.eyebrow)}</span>
        <h3 id="cart-upsell-title" className="display cart-upsell__title">
          {t(active.title)}
        </h3>
      </div>

      <ul className="no-scrollbar cart-upsell__rail">
        {active.products.map((p) => (
          <li key={p._id} className="cart-upsell__item">
            <button
              type="button"
              className="cart-upsell__card"
              disabled={adding === p._id}
              onClick={() => add(p)}
              aria-label={t("upsell.addAria", { name: p.name, price: fmt(p.price) })}
            >
              <span className="cart-upsell__thumb">
                <ProductImage
                  src={p.img}
                  alt=""
                  style={{ width: 64, height: 64 }}
                />
              </span>
              <span className="cart-upsell__name">{p.name}</span>
              <span className="mono cart-upsell__price">{fmt(p.price)}</span>
              <span className="cart-upsell__add" aria-hidden="true">
                <Icon.plus />
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default CartUpsell;
