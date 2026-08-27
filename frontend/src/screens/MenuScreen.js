import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import axios from "../api/axiosConfig";
import Icon from "../brace/ui/Icon";
import Loader from "../brace/ui/Loader";
import Message from "../brace/ui/Message";
import PizzaCard from "../brace/ui/PizzaCard";
import FieldSelect from "../brace/ui/FieldSelect";
import { useToast } from "../brace/ui/Toast";
import { useCartUI } from "../brace/ui/CartUI";
import Paginate from "../components/Paginate";
import Meta from "../components/Meta";
import { listProducts } from "../store/actions/products";
import { addToCart } from "../store/actions/cart";
import "./MenuScreen.scss";

const MenuScreen = ({ history, match }) => {
  const { t } = useTranslation();
  const keyword = match.params.keyword || "";
  const pageNumber = match.params.pageNumber || 1;

  const dispatch = useDispatch();
  const toast = useToast();
  const cartUI = useCartUI();

  const { loading, error, products, page, pages } = useSelector(
    (state) => state.productList
  );

  const [cat, setCat] = useState("all");
  const [q, setQ] = useState(keyword);
  const [sort, setSort] = useState("default");
  const [categories, setCategories] = useState([]);

  // Reset to "all" when the search term or page changes.
  useEffect(() => {
    setCat("all");
    setQ(keyword);
  }, [keyword, pageNumber]);

  // Fetch the category set once (drives the filter tabs, incl. "Bevande").
  useEffect(() => {
    let alive = true;
    axios
      .get("/api/products/categories")
      .then(({ data }) => alive && setCategories(data))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  // Products are filtered server-side by category so paginated catalogs (pizzas
  // on one page, drinks on another) filter correctly.
  useEffect(() => {
    dispatch(listProducts(keyword, pageNumber, cat));
  }, [dispatch, keyword, pageNumber, cat]);

  const items = useMemo(() => {
    let xs = (products || []).slice();
    if (sort === "price-asc") xs.sort((a, b) => a.price - b.price);
    if (sort === "price-desc") xs.sort((a, b) => b.price - a.price);
    return xs;
  }, [products, sort]);

  const submitSearch = (e) => {
    e.preventDefault();
    const term = q.trim();
    history.push(term ? `/menu/search/${term}` : "/menu");
  };

  const quickAdd = (product) => {
    dispatch(addToCart(product._id, 1, [], null));
    toast(t("common.addedToCart", { name: product.name }), "ok");
    cartUI.setOpen(true);
  };

  return (
    <div className="menu">
      <Meta title={t("menu.metaTitle")} />
      <div className="b-container">
        {/* Header */}
        <div className="menu__header">
          <div className="eyebrow menu__eyebrow">
            {t("menu.eyebrow")}
          </div>
          <h1 className="display menu__title">
            {t("menu.title")}
            <br />
            <span className="it menu__title-accent">
              {t("menu.titleAccent")}
            </span>
          </h1>
          <p className="menu__lede">{t("menu.lede")}</p>
        </div>

        {/* Sticky filter bar */}
        <div className="menu__bar">
          {categories.length >= 2 ? (
            <div className="no-scrollbar menu__pills">
              <button
                onClick={() => setCat("all")}
                className={`menu__pill${cat === "all" ? " is-active" : ""}`}
              >
                {t("menu.all")}
              </button>
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setCat(c)}
                  className={`menu__pill${cat === c ? " is-active" : ""}`}
                >
                  {c}
                </button>
              ))}
            </div>
          ) : (
            <span />
          )}

          <div className="menu__controls">
            <form onSubmit={submitSearch} className="menu__search">
              <Icon.search className="menu__search-icon" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t("menu.searchPlaceholder")}
                aria-label={t("menu.searchAria")}
                className="menu__search-input"
              />
            </form>
            <FieldSelect
              value={sort}
              onChange={setSort}
              ariaLabel={t("menu.sortAria")}
              variant="pill"
              className="menu__sort"
              options={[
                { value: "default", label: t("menu.sortDefault") },
                { value: "price-asc", label: t("menu.sortPriceAsc") },
                { value: "price-desc", label: t("menu.sortPriceDesc") },
              ]}
            />
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="menu__loading">
            <Loader />
          </div>
        ) : error ? (
          <div className="menu__error">
            <Message variant="danger">{error}</Message>
          </div>
        ) : (
          <>
            <div className="menu__grid">
              {items.length === 0 ? (
                <div className="menu__empty">
                  <div className="display menu__empty-title">
                    {t("menu.emptyTitle")}
                  </div>
                  <p className="menu__empty-text">{t("menu.emptyText")}</p>
                  <button
                    className="b-btn ghost menu__empty-btn"
                    onClick={() => {
                      setCat("all");
                      setSort("default");
                      history.push("/menu");
                    }}
                  >
                    {t("menu.showAll")}
                  </button>
                </div>
              ) : (
                items.map((product) => (
                  <PizzaCard
                    key={product._id}
                    product={product}
                    onClick={() => history.push(`/product/${product._id}`)}
                    onAdd={quickAdd}
                  />
                ))
              )}
            </div>

            <div className="menu__pager">
              <Paginate pages={pages} page={page} keyword={keyword} />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MenuScreen;
