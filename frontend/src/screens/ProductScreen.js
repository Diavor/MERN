import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Icon from "../brace/ui/Icon";
import fmt from "../brace/ui/fmt";
import Rating from "../brace/ui/Rating";
import Loader from "../brace/ui/Loader";
import Message from "../brace/ui/Message";
import ProductImage from "../brace/ui/ProductImage";
import PizzaCard from "../brace/ui/PizzaCard";
import Field from "../brace/ui/Field";
import FieldSelect from "../brace/ui/FieldSelect";
import { useToast } from "../brace/ui/Toast";
import { useCartUI } from "../brace/ui/CartUI";
import Meta from "../components/Meta";
import {
  listProductDetails,
  createProductReview,
} from "../store/actions/product";
import { listProducts } from "../store/actions/products";
import { addToCart } from "../store/actions/cart";
import { PRODUCT_CREATE_REVIEW_RESET } from "../store/actionTypes";
import "./ProductScreen.scss";

const FieldGroup = ({ label, children }) => (
  <div className="product__field">
    <div className="eyebrow product__field-label">{label}</div>
    {children}
  </div>
);

const ProductScreen = ({ history, match }) => {
  const { t, i18n } = useTranslation();
  const [qty, setQty] = useState(1);
  const [selectedToppings, setSelectedToppings] = useState([]);
  const [selectedDough, setSelectedDough] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [tab, setTab] = useState("desc");

  const dispatch = useDispatch();
  const toast = useToast();
  const cartUI = useCartUI();

  const { loading, error, product } = useSelector(
    (state) => state.productDetails
  );
  const { success: successReview, error: errorReview } = useSelector(
    (state) => state.productReviewCreate
  );
  const { userInfo } = useSelector((state) => state.userLogin);
  const { products: listedProducts } = useSelector(
    (state) => state.productList
  );

  useEffect(() => {
    if (successReview) {
      toast(t("product.reviewSent"), "ok");
      setRating(0);
      setComment("");
      dispatch({ type: PRODUCT_CREATE_REVIEW_RESET });
    }
    dispatch(listProductDetails(match.params.id));
  }, [match, dispatch, successReview, toast]);

  // reset configuration when switching product
  useEffect(() => {
    setQty(1);
    setSelectedToppings([]);
    setSelectedDough(null);
    setTab("desc");
  }, [match.params.id]);

  // for the "related" strip — fetch once on mount. Deliberately NOT keyed on
  // listedProducts: the LIST_REQUEST/LIST_FAIL reducer cases replace `products`
  // with a fresh []/undefined on every call, so depending on it here would make
  // this effect re-fire on its own result and loop (hammering the API into 429s).
  useEffect(() => {
    dispatch(listProducts());
  }, [dispatch]);

  const toggleTopping = (topping) => {
    setSelectedToppings((prev) =>
      prev.find((t) => t.name === topping.name)
        ? prev.filter((t) => t.name !== topping.name)
        : [...prev, topping]
    );
  };

  const toppingsTotal = selectedToppings.reduce((acc, t) => acc + t.price, 0);
  const doughExtra = selectedDough ? selectedDough.price : 0;
  const unitPrice = (product.price || 0) + toppingsTotal + doughExtra;
  const inStock = product.countInStock > 0;

  const addToCartHandler = () => {
    dispatch(addToCart(product._id, qty, selectedToppings, selectedDough));
    toast(t("common.addedToCart", { name: product.name }), "ok");
    cartUI.setOpen(true);
  };

  const quickAddRelated = (p) => {
    dispatch(addToCart(p._id, 1, [], null));
    toast(t("common.addedToCart", { name: p.name }), "ok");
    cartUI.setOpen(true);
  };

  const submitHandler = (e) => {
    e.preventDefault();
    dispatch(createProductReview(match.params.id, { rating, comment }));
  };

  const related = (listedProducts || [])
    .filter((p) => p._id !== product._id)
    .slice(0, 3);

  if (loading) {
    return (
      <div className="product product--pending">
        <div className="b-container">
          <Loader />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="product product--pending">
        <div className="b-container">
          <Message variant="danger">{error}</Message>
        </div>
      </div>
    );
  }

  return (
    <div className="product">
      <Meta title={product.name} />
      <div className="b-container">
        {/* Breadcrumb */}
        <div className="product__breadcrumb">
          <Link to="/" className="product__breadcrumb-link">
            {t("nav.home")}
          </Link>
          <span>/</span>
          <Link to="/menu" className="product__breadcrumb-link">
            {t("nav.menu")}
          </Link>
          <span>/</span>
          <span className="product__breadcrumb-current">{product.name}</span>
        </div>

        <div className="product__layout">
          {/* Gallery */}
          <div className="product__gallery">
            <div className="product__gallery-glow" />
            <div className="product__gallery-media">
              <ProductImage src={product.img} alt={product.name} />
            </div>

            {/* corner annotations */}
            <div className="product__tag product__tag--code">
              BR · {(product._id || "").slice(-6).toUpperCase()}
            </div>
            <div className="product__tag product__tag--category">
              {product.category}
            </div>
          </div>

          {/* Sticky configurator */}
          <div className="product__config">
            <div className="eyebrow">{product.category}</div>
            <h1 className="display product__title">{product.name}</h1>

            <div className="product__price-row">
              <span className="display product__price">{fmt(unitPrice)}</span>
              {toppingsTotal + doughExtra > 0 && (
                <span className="mono product__price-old">
                  {fmt(product.price)}
                </span>
              )}
            </div>

            <div className="product__rating">
              <Rating
                value={product.rating}
                text={t("common.reviews", { count: product.numReviews })}
              />
            </div>

            {/* Impasto */}
            {product.doughVariants && product.doughVariants.length > 0 && (
              <FieldGroup label={t("product.dough")}>
                <div className="product__options">
                  <button
                    onClick={() => setSelectedDough(null)}
                    className={
                      "product__option" + (!selectedDough ? " is-selected" : "")
                    }
                  >
                    <span className="product__radio">
                      {!selectedDough && (
                        <span className="product__radio-dot" />
                      )}
                    </span>
                    <div className="product__option-body">
                      <div className="product__option-name">{t("product.standardDough")}</div>
                      <div className="mono product__option-meta">{t("product.included")}</div>
                    </div>
                  </button>
                  {product.doughVariants.map((d) => {
                    const active = selectedDough?.name === d.name;
                    return (
                      <button
                        key={d.name}
                        onClick={() => setSelectedDough(d)}
                        className={
                          "product__option" + (active ? " is-selected" : "")
                        }
                      >
                        <span className="product__radio">
                          {active && <span className="product__radio-dot" />}
                        </span>
                        <div className="product__option-body">
                          <div className="product__option-name">{d.name}</div>
                          <div className="mono product__option-meta">
                            +{fmt(d.price)}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </FieldGroup>
            )}

            {/* Aggiunte */}
            {product.toppings && product.toppings.length > 0 && (
              <FieldGroup label={t("product.toppings")}>
                <div className="product__toppings">
                  {product.toppings.map((t) => {
                    const checked = !!selectedToppings.find(
                      (s) => s.name === t.name
                    );
                    return (
                      <button
                        key={t.name}
                        onClick={() => toggleTopping(t)}
                        className={
                          "product__option" + (checked ? " is-selected" : "")
                        }
                      >
                        <span className="product__check">
                          {checked && <Icon.check />}
                        </span>
                        <div className="product__option-body product__option-body--tight">
                          <div className="product__option-name product__option-name--sm">
                            {t.name}
                          </div>
                          <div className="mono product__option-meta">
                            +{fmt(t.price)}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </FieldGroup>
            )}

            {/* Qty + add */}
            <div className="product__actions">
              <div className="product__qty">
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  aria-label={t("product.qtyDec")}
                  className="product__qty-btn"
                >
                  <Icon.minus />
                </button>
                <span className="mono product__qty-value">{qty}</span>
                <button
                  onClick={() =>
                    setQty(Math.min(product.countInStock || 1, qty + 1))
                  }
                  aria-label={t("product.qtyInc")}
                  className="product__qty-btn"
                >
                  <Icon.plus />
                </button>
              </div>
              <button
                onClick={addToCartHandler}
                disabled={!inStock}
                className="b-btn ember product__add-btn"
              >
                {inStock
                  ? t("product.addWithPrice", { price: fmt(unitPrice * qty) })
                  : t("product.soldOut")}
              </button>
            </div>

            {/* availability line */}
            <div className="product__availability">
              <span>{t("product.freshMade")}</span>
              {inStock ? (
                <span className="product__availability-status--ok">
                  ● {t("product.available")}
                </span>
              ) : (
                <span className="product__availability-status--out">
                  ● {t("product.soldOut")}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="product__tabs">
          <div className="product__tab-list">
            {[
              ["desc", t("product.descTab")],
              ["reviews", t("product.reviewsTab", { count: product.numReviews || 0 })],
            ].map(([k, l]) => (
              <button
                key={k}
                onClick={() => setTab(k)}
                className={"product__tab" + (tab === k ? " is-active" : "")}
              >
                {l}
              </button>
            ))}
          </div>

          <div className="product__tab-panel">
            {tab === "desc" && (
              <p className="it product__desc">{product.description}</p>
            )}

            {tab === "reviews" && (
              <div className="product__reviews">
                {/* review list */}
                <div>
                  {(!product.reviews || product.reviews.length === 0) && (
                    <Message variant="info">{t("product.noReviews")}</Message>
                  )}
                  {(product.reviews || []).map((r) => (
                    <div key={r._id} className="product__review">
                      <div className="product__review-head">
                        <span className="display product__review-name">
                          {r.name}
                        </span>
                        <span className="mono product__review-date">
                          {new Date(r.createdAt).toLocaleDateString(
                            i18n.resolvedLanguage === "en" ? "en-GB" : "it-IT"
                          )}
                        </span>
                      </div>
                      <div className="product__review-rating">
                        <Rating value={r.rating} />
                      </div>
                      <p className="product__review-comment">{r.comment}</p>
                    </div>
                  ))}
                </div>

                {/* review form */}
                <div>
                  <div className="eyebrow product__form-title">
                    {t("product.writeReview")}
                  </div>
                  {errorReview && (
                    <div className="product__form-error">
                      <Message variant="danger">{errorReview}</Message>
                    </div>
                  )}
                  {userInfo ? (
                    <form onSubmit={submitHandler} className="product__review-form">
                      <FieldSelect
                        label={t("product.ratingLabel")}
                        value={rating}
                        onChange={setRating}
                        required
                        placeholder={t("product.choose")}
                        options={[
                          { value: "1", label: t("product.rating1") },
                          { value: "2", label: t("product.rating2") },
                          { value: "3", label: t("product.rating3") },
                          { value: "4", label: t("product.rating4") },
                          { value: "5", label: t("product.rating5") },
                        ]}
                      />
                      <Field
                        label={t("product.comment")}
                        multiline
                        value={comment}
                        onChange={setComment}
                        required
                        placeholder={t("product.commentPlaceholder")}
                      />
                      <button type="submit" className="b-btn solid product__review-submit">
                        {t("product.submitReview")}
                      </button>
                    </form>
                  ) : (
                    <Message variant="info">
                      <Link to={`/login?redirect=/product/${product._id}`}>
                        {t("nav.login")}
                      </Link>{" "}
                      {t("product.loginToReview")}
                    </Message>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <div className="product__related">
            <div className="eyebrow product__related-title">
              {t("product.related")}
            </div>
            <div className="product__related-grid">
              {related.map((r) => (
                <PizzaCard
                  key={r._id}
                  product={r}
                  onClick={() => {
                    history.push(`/product/${r._id}`);
                    window.scrollTo({ top: 0 });
                  }}
                  onAdd={quickAddRelated}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sticky quick-add bar */}
      <div className="b-rise product__bar">
        <div className="product__bar-info">
          <div className="product__bar-thumb">
            <ProductImage src={product.img} alt={product.name} />
          </div>
          <div className="product__bar-text">
            <div className="product__bar-category">{product.category}</div>
            <div className="display product__bar-name">{product.name}</div>
          </div>
        </div>
        <button
          onClick={addToCartHandler}
          disabled={!inStock}
          className="b-btn ember"
        >
          {inStock ? (
            <>
              {t("product.addShort", { price: fmt(unitPrice * qty) })}{" "}
              <Icon.arrow className="arrow" />
            </>
          ) : (
            t("product.soldOut")
          )}
        </button>
      </div>
    </div>
  );
};

export default ProductScreen;
