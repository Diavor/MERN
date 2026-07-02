import React, { useState, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addToCart, removeCart } from "../store/actions/cart";
import { Link } from "react-router-dom";
import {
  Row, Col, ListGroup, Image, Form, Button, Card,
} from "react-bootstrap";
import Message from "../components/Message";

const LABEL = {
  fontSize: "0.75rem", fontWeight: 600, color: "#666",
  textTransform: "uppercase", letterSpacing: "0.05em",
  padding: "4px 14px", borderBottom: "1px solid #f0f0f0", marginBottom: 2,
};
const DIVIDER = { borderBottom: "1px solid #f0f0f0", margin: "4px 0" };

const VariantDropdown = ({ item, onToggleTopping, onChangeDough }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const toppingCount = item.toppings?.length || 0;
  const hasDough = !!item.selectedDough;
  const total = toppingCount + (hasDough ? 1 : 0);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <Button
        variant="outline-secondary"
        size="sm"
        onClick={() => setOpen((o) => !o)}
        style={{ width: "100%", textAlign: "left" }}
      >
        {total > 0 ? `${total} variant${total > 1 ? "s" : ""} selected` : "Customize"}
        <span style={{ float: "right" }}>{open ? "▲" : "▼"}</span>
      </Button>

      {open && (
        <div style={{
          position: "absolute", top: "100%", left: 0, zIndex: 999,
          background: "#fff", border: "1px solid #dee2e6", borderRadius: 4,
          minWidth: 230, padding: "8px 0", boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        }}>

          {/* ── Impasto Speciale ── */}
          {item.availableDoughVariants?.length > 0 && (
            <>
              <div style={LABEL}>Impasto Speciale</div>
              {[{ name: "Standard (incluso)", price: 0 }, ...item.availableDoughVariants].map((dough) => (
                <div key={dough.name} style={{ padding: "5px 14px" }} onMouseDown={(e) => e.preventDefault()}>
                  <Form.Check
                    type="radio"
                    name={`dough-${item.product}`}
                    id={`${item.product}-dough-${dough.name}`}
                    checked={dough.price === 0 ? !item.selectedDough : item.selectedDough?.name === dough.name}
                    onChange={() => onChangeDough(item, dough.price === 0 ? null : dough)}
                    label={
                      <span style={{ fontSize: "0.88rem" }}>
                        {dough.name}{" "}
                        {dough.price > 0 && <span style={{ color: "#888" }}>+€{dough.price.toFixed(2)}</span>}
                      </span>
                    }
                  />
                </div>
              ))}
              <div style={DIVIDER} />
            </>
          )}

          {/* ── Extras ── */}
          {item.availableToppings?.length > 0 && (
            <>
              <div style={LABEL}>Extras</div>
              {item.availableToppings.map((topping) => {
                const checked = !!item.toppings?.find((t) => t.name === topping.name);
                return (
                  <div key={topping.name} style={{ padding: "5px 14px" }} onMouseDown={(e) => e.preventDefault()}>
                    <Form.Check
                      type="checkbox"
                      id={`${item.product}-${topping.name}`}
                      checked={checked}
                      onChange={() => onToggleTopping(item, topping)}
                      label={
                        <span style={{ fontSize: "0.88rem" }}>
                          {topping.name}{" "}
                          <span style={{ color: "#888" }}>+€{topping.price.toFixed(2)}</span>
                        </span>
                      }
                    />
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
};

const CartScreen = ({ history }) => {
  const dispatch = useDispatch();
  const { cartItems } = useSelector((state) => state.cart);

  const removeFromCart = (id) => dispatch(removeCart(id));
  const checkoutHandler = () => history.push("/checkout");

  const toggleTopping = (item, topping) => {
    const already = item.toppings?.find((t) => t.name === topping.name);
    const newToppings = already
      ? item.toppings.filter((t) => t.name !== topping.name)
      : [...(item.toppings || []), topping];
    dispatch(addToCart(item.product, item.qty, newToppings, item.selectedDough));
  };

  const changeDough = (item, dough) => {
    dispatch(addToCart(item.product, item.qty, item.toppings || [], dough));
  };

  return (
    <Row>
      <Col md={8}>
        <h1>Shopping Cart</h1>
        {cartItems.length === 0 ? (
          <Message>Your cart is empty — <Link to="/">Go Back</Link></Message>
        ) : (
          <ListGroup variant="flush">
            {cartItems.map((item) => (
              <ListGroup.Item key={item.product} className="py-3">
                <Row className="align-items-center">

                  <Col md={2}>
                    <Image src={item.image} alt={item.name} fluid rounded />
                  </Col>

                  <Col md={3}>
                    <Link to={`/product/${item.product}`}><strong>{item.name}</strong></Link>
                    {item.selectedDough && (
                      <small className="d-block text-muted mt-1">
                        Impasto: {item.selectedDough.name}
                      </small>
                    )}
                    {item.toppings?.map((t) => (
                      <small key={t.name} className="d-block text-muted">
                        + {t.name}
                      </small>
                    ))}
                  </Col>

                  <Col md={3}>
                    {(item.availableDoughVariants?.length > 0 || item.availableToppings?.length > 0) && (
                      <VariantDropdown
                        item={item}
                        onToggleTopping={toggleTopping}
                        onChangeDough={changeDough}
                      />
                    )}
                  </Col>

                  <Col md={2} className="text-center">
                    <div className="fw-bold">€{item.price.toFixed(2)}</div>
                    {(item.price - item.basePrice) > 0 && (
                      <small className="text-muted">base €{item.basePrice?.toFixed(2)}</small>
                    )}
                  </Col>

                  <Col md={1}>
                    <Form.Control
                      as="select"
                      size="sm"
                      value={item.qty}
                      onChange={(e) =>
                        dispatch(addToCart(item.product, Number(e.target.value), item.toppings, item.selectedDough))
                      }
                    >
                      {[...Array(item.countInStock).keys()].map((k) => (
                        <option key={k + 1} value={k + 1}>{k + 1}</option>
                      ))}
                    </Form.Control>
                  </Col>

                  <Col md={1} className="text-center">
                    <Button type="button" variant="light" size="sm" onClick={() => removeFromCart(item.product)}>
                      <i className="fas fa-trash"></i>
                    </Button>
                  </Col>

                </Row>
              </ListGroup.Item>
            ))}
          </ListGroup>
        )}
      </Col>

      <Col md={4}>
        <Card>
          <ListGroup variant="flush">
            <ListGroup.Item>
              <h2 className="mb-1">
                Subtotal ({cartItems.reduce((acc, item) => acc + item.qty, 0)} items)
              </h2>
              <span className="fs-5 fw-bold">
                €{cartItems.reduce((acc, item) => acc + item.qty * item.price, 0).toFixed(2)}
              </span>
            </ListGroup.Item>
            <ListGroup.Item>
              <Button
                type="button"
                className="btn-block w-100"
                variant="danger"
                disabled={cartItems.length === 0}
                onClick={checkoutHandler}
              >
                Proceed to Checkout
              </Button>
            </ListGroup.Item>
          </ListGroup>
        </Card>
      </Col>
    </Row>
  );
};

export default CartScreen;
