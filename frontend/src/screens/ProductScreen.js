import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import Icon from "../brace/ui/Icon";
import fmt from "../brace/ui/fmt";
import Rating from "../brace/ui/Rating";
import Loader from "../brace/ui/Loader";
import Message from "../brace/ui/Message";
import ProductImage from "../brace/ui/ProductImage";
import PizzaCard from "../brace/ui/PizzaCard";
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
      toast("Recensione inviata. Grazie!", "ok");
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
    toast(`Aggiunto al carrello · ${product.name}`, "ok");
    cartUI.setOpen(true);
  };

  const quickAddRelated = (p) => {
    dispatch(addToCart(p._id, 1, [], null));
    toast(`Aggiunto al carrello · ${p.name}`, "ok");
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
            Casa
          </Link>
          <span>/</span>
          <Link to="/menu" className="product__breadcrumb-link">
            Menu
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
                text={`${product.numReviews} recensioni`}
              />
            </div>

            {/* Impasto */}
            {product.doughVariants && product.doughVariants.length > 0 && (
              <FieldGroup label="Impasto">
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
                      <div className="product__option-name">Standard</div>
                      <div className="mono product__option-meta">incluso</div>
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
              <FieldGroup label="Aggiunte">
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
                  aria-label="Riduci quantità"
                  className="product__qty-btn"
                >
                  <Icon.minus />
                </button>
                <span className="mono product__qty-value">{qty}</span>
                <button
                  onClick={() =>
                    setQty(Math.min(product.countInStock || 1, qty + 1))
                  }
                  aria-label="Aumenta quantità"
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
                  ? `Aggiungi al carrello — ${fmt(unitPrice * qty)}`
                  : "Esaurito"}
              </button>
            </div>

            {/* availability line */}
            <div className="product__availability">
              <span>Preparata al momento</span>
              {inStock ? (
                <span className="product__availability-status--ok">
                  ● Disponibile · forno acceso
                </span>
              ) : (
                <span className="product__availability-status--out">
                  ● Esaurito
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="product__tabs">
          <div className="product__tab-list">
            {[
              ["desc", "Descrizione"],
              ["reviews", `Recensioni (${product.numReviews || 0})`],
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
                    <Message variant="info">
                      Nessuna recensione, per ora. Sii il primo a raccontarla.
                    </Message>
                  )}
                  {(product.reviews || []).map((r) => (
                    <div key={r._id} className="product__review">
                      <div className="product__review-head">
                        <span className="display product__review-name">
                          {r.name}
                        </span>
                        <span className="mono product__review-date">
                          {new Date(r.createdAt).toLocaleDateString("it-IT")}
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
                    Scrivi una recensione
                  </div>
                  {errorReview && (
                    <div className="product__form-error">
                      <Message variant="danger">{errorReview}</Message>
                    </div>
                  )}
                  {userInfo ? (
                    <form onSubmit={submitHandler}>
                      <label className="mono product__form-label">
                        Valutazione
                      </label>
                      <select
                        value={rating}
                        onChange={(e) => setRating(e.target.value)}
                        required
                        className="product__select"
                      >
                        <option value="">Scegli…</option>
                        <option value="1">1 — Scarsa</option>
                        <option value="2">2 — Discreta</option>
                        <option value="3">3 — Buona</option>
                        <option value="4">4 — Molto buona</option>
                        <option value="5">5 — Eccellente</option>
                      </select>
                      <label className="mono product__form-label">
                        Commento
                      </label>
                      <textarea
                        rows={4}
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        required
                        className="product__textarea"
                      />
                      <button type="submit" className="b-btn solid">
                        Invia recensione
                      </button>
                    </form>
                  ) : (
                    <Message variant="info">
                      <Link to={`/login?redirect=/product/${product._id}`}>
                        Accedi
                      </Link>{" "}
                      per scrivere una recensione.
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
              Da provare anche
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
              Aggiungi {fmt(unitPrice * qty)} <Icon.arrow className="arrow" />
            </>
          ) : (
            "Esaurito"
          )}
        </button>
      </div>
    </div>
  );
};

export default ProductScreen;
