import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Row,
  Col,
  Form,
  Button,
  Card,
  ListGroup,
  Image,
  Alert,
  Spinner,
} from "react-bootstrap";
import axios from "axios";
import { createOrder } from "../store/actions/order";

const DELIVERY_ZONES = [
  { city: "Mogliano Veneto", price: 2.5 },
  { city: "Zerman", price: 2.5 },
  { city: "Preganziol", price: 3.0 },
  { city: "Campocroce", price: 3.0 },
  { city: "Conscio", price: 3.0 },
  { city: "Gaggio", price: 3.0 },
  { city: "Marcon", price: 3.0 },
  { city: "Lughignano", price: 3.0 },
  { city: "San Liberale", price: 3.0 },
];

const CheckoutScreen = ({ history }) => {
  const dispatch = useDispatch();

  const { cartItems } = useSelector((state) => state.cart);
  const { userInfo } = useSelector((state) => state.userLogin);
  const {
    success,
    order,
    error,
    loading,
  } = useSelector((state) => state.orderCreate);

  // Contact
  const [name, setName] = useState(userInfo?.name || "");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState(userInfo?.email || "");

  // Order type
  const [orderType, setOrderType] = useState("delivery");

  // Delivery address
  const [city, setCity] = useState("");
  const [street, setStreet] = useState("");
  const [buildingNumber, setBuildingNumber] = useState("");
  const [floor, setFloor] = useState("");

  // Schedule
  const [selectedDate, setSelectedDate] = useState("");
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotError, setSlotError] = useState(false);

  // Payment
  const [paymentMethod, setPaymentMethod] = useState("Contanti");

  // Notes
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!cartItems || cartItems.length === 0) {
      history.push("/");
    }
  }, [cartItems, history]);

  useEffect(() => {
    if (success) {
      history.push(`/order/${order._id}`);
    }
  }, [success, order, history]);

  useEffect(() => {
    if (!selectedDate) return;
    setLoadingSlots(true);
    setSelectedSlot("");
    setSlots([]);
    axios
      .get(`/api/slots?date=${selectedDate}`)
      .then(({ data }) => setSlots(data))
      .catch(() => {})
      .finally(() => setLoadingSlots(false));
  }, [selectedDate]);

  const itemsPrice = cartItems.reduce(
    (acc, item) => acc + item.qty * item.price,
    0
  );

  const deliveryFee =
    orderType === "pickup" || itemsPrice >= 39
      ? 0
      : DELIVERY_ZONES.find((z) => z.city === city)?.price || 0;

  const totalPrice = (itemsPrice + deliveryFee).toFixed(2);
  const today = new Date().toISOString().split("T")[0];

  const submitHandler = (e) => {
    e.preventDefault();
    if (!selectedSlot) {
      setSlotError(true);
      return;
    }
    setSlotError(false);
    dispatch(
      createOrder({
        orderItems: cartItems,
        shippingAddress: {
          name,
          phone,
          email,
          orderType,
          country: "Italy",
          city: orderType === "delivery" ? city : "Pickup",
          street: orderType === "delivery" ? street : "",
          buildingNumber: orderType === "delivery" ? buildingNumber : "",
          floor: orderType === "delivery" ? floor : "",
          deliveryDate: selectedDate,
          deliverySlot: selectedSlot,
          deliveryPrice: deliveryFee,
          notes,
        },
        paymentMethod,
        itemsNum: cartItems.reduce((acc, item) => acc + item.qty, 0),
        itemsPrice: itemsPrice.toFixed(2),
        shippingPrice: deliveryFee.toFixed(2),
        taxPrice: "0.00",
        totalPrice,
      })
    );
  };

  return (
    <Row>
      {/* ── LEFT: Form ─────────────────────────────────────────── */}
      <Col md={8}>
        <h1 className="mb-4">Checkout</h1>

        <Form onSubmit={submitHandler}>
          {/* Contact */}
          <Card className="mb-4">
            <Card.Header>
              <strong>Contact Information</strong>
            </Card.Header>
            <Card.Body>
              <Form.Group controlId="name" className="mb-3">
                <Form.Label>Name</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </Form.Group>
              <Row>
                <Col md={6}>
                  <Form.Group controlId="phone" className="mb-3">
                    <Form.Label>Phone Number</Form.Label>
                    <Form.Control
                      type="tel"
                      placeholder="+39 000 000 0000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group controlId="email" className="mb-0">
                    <Form.Label>Email Address</Form.Label>
                    <Form.Control
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Order Type */}
          <Card className="mb-4">
            <Card.Header>
              <strong>Order Type</strong>
            </Card.Header>
            <Card.Body className="d-flex gap-4">
              <Form.Check
                type="radio"
                id="delivery"
                label="Delivery"
                name="orderType"
                checked={orderType === "delivery"}
                onChange={() => setOrderType("delivery")}
              />
              <Form.Check
                type="radio"
                id="pickup"
                label="Pick up from restaurant"
                name="orderType"
                checked={orderType === "pickup"}
                onChange={() => setOrderType("pickup")}
              />
            </Card.Body>
          </Card>

          {/* Delivery Address */}
          {orderType === "delivery" && (
            <Card className="mb-4">
              <Card.Header>
                <strong>Delivery Address</strong>
              </Card.Header>
              <Card.Body>
                <Form.Group controlId="city" className="mb-3">
                  <Form.Label>City</Form.Label>
                  <Form.Control
                    as="select"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required={orderType === "delivery"}
                  >
                    <option value="">-- Select delivery city --</option>
                    <optgroup label="Delivery €2.50">
                      {DELIVERY_ZONES.filter((z) => z.price === 2.5).map(
                        (z) => (
                          <option key={z.city} value={z.city}>
                            {z.city}
                          </option>
                        )
                      )}
                    </optgroup>
                    <optgroup label="Delivery €3.00">
                      {DELIVERY_ZONES.filter((z) => z.price === 3.0).map(
                        (z) => (
                          <option key={z.city} value={z.city}>
                            {z.city}
                          </option>
                        )
                      )}
                    </optgroup>
                  </Form.Control>
                </Form.Group>

                <Row>
                  <Col md={6}>
                    <Form.Group controlId="street" className="mb-3">
                      <Form.Label>Street</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Street name"
                        value={street}
                        onChange={(e) => setStreet(e.target.value)}
                        required={orderType === "delivery"}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group controlId="buildingNumber" className="mb-3">
                      <Form.Label>Number</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="No."
                        value={buildingNumber}
                        onChange={(e) => setBuildingNumber(e.target.value)}
                        required={orderType === "delivery"}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group controlId="floor" className="mb-0">
                      <Form.Label>Floor</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Optional"
                        value={floor}
                        onChange={(e) => setFloor(e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          )}

          {/* Schedule */}
          <Card className="mb-4">
            <Card.Header>
              <strong>Schedule</strong>
            </Card.Header>
            <Card.Body>
              <Form.Group controlId="date" className="mb-3">
                <Form.Label>Date</Form.Label>
                <Form.Control
                  type="date"
                  min={today}
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setSlotError(false);
                  }}
                  required
                />
              </Form.Group>

              {selectedDate && (
                <Form.Group>
                  <Form.Label>Time Slot</Form.Label>
                  {loadingSlots ? (
                    <div>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Loading available slots...
                    </div>
                  ) : (
                    <div className="d-flex flex-wrap gap-1">
                      {slots.map((slot) => (
                        <Button
                          key={slot.time}
                          type="button"
                          size="sm"
                          variant={
                            slot.available === 0
                              ? "danger"
                              : selectedSlot === slot.time
                              ? slot.available >= 6 ? "success" : "warning"
                              : slot.available >= 6 ? "outline-success" : "outline-warning"
                          }
                          disabled={slot.available === 0}
                          onClick={() => {
                            setSelectedSlot(slot.time);
                            setSlotError(false);
                          }}
                        >
                          {slot.time}
                          {slot.available < 10 && slot.available > 0 && (
                            <span
                              className="ms-1"
                              style={{ fontSize: "0.7rem" }}
                            >
                              ({slot.available})
                            </span>
                          )}
                        </Button>
                      ))}
                    </div>
                  )}
                  {slotError && (
                    <div className="text-danger mt-1" style={{ fontSize: "0.875rem" }}>
                      Please select a time slot.
                    </div>
                  )}
                </Form.Group>
              )}
            </Card.Body>
          </Card>

          {/* Payment Method */}
          <Card className="mb-4">
            <Card.Header>
              <strong>Payment Method</strong>
            </Card.Header>
            <Card.Body className="d-flex gap-4">
              <Form.Check
                type="radio"
                id="contanti"
                label="Contanti (Cash)"
                name="paymentMethod"
                checked={paymentMethod === "Contanti"}
                onChange={() => setPaymentMethod("Contanti")}
              />
              <Form.Check
                type="radio"
                id="bancomat"
                label="Bancomat (Card)"
                name="paymentMethod"
                checked={paymentMethod === "Bancomat"}
                onChange={() => setPaymentMethod("Bancomat")}
              />
            </Card.Body>
          </Card>

          {/* Additional Info */}
          <Card className="mb-4">
            <Card.Header>
              <strong>Additional Info</strong>
            </Card.Header>
            <Card.Body>
              <Form.Group controlId="notes">
                <Form.Label>Notes about your order</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="Allergies, special requests, gate code..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </Form.Group>
            </Card.Body>
          </Card>

          {error && <Alert variant="danger">{error}</Alert>}

          <Button
            type="submit"
            variant="danger"
            size="lg"
            className="w-100 mb-5"
            disabled={loading}
          >
            {loading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Placing Order...
              </>
            ) : (
              "Place Order"
            )}
          </Button>
        </Form>
      </Col>

      {/* ── RIGHT: Order Summary ────────────────────────────────── */}
      <Col md={4}>
        <Card style={{ position: "sticky", top: "20px" }}>
          <Card.Header>
            <strong>Order Summary</strong>
          </Card.Header>
          <ListGroup variant="flush">
            {cartItems.map((item, i) => (
              <ListGroup.Item key={i}>
                <Row className="align-items-center">
                  <Col xs={2}>
                    <Image src={item.image} alt={item.name} fluid rounded />
                  </Col>
                  <Col>
                    <div style={{ fontSize: "0.9rem" }}>
                      {item.name}{" "}
                      <span className="text-muted">× {item.qty}</span>
                    </div>
                    {item.toppings && item.toppings.length > 0 && (
                      <small className="text-muted">
                        + {item.toppings.map((t) => t.name).join(", ")}
                      </small>
                    )}
                  </Col>
                  <Col xs={3} className="text-end" style={{ fontSize: "0.9rem" }}>
                    €{(item.qty * item.price).toFixed(2)}
                  </Col>
                </Row>
              </ListGroup.Item>
            ))}

            <ListGroup.Item>
              <Row>
                <Col className="text-muted">Subtotal</Col>
                <Col className="text-end">€{itemsPrice.toFixed(2)}</Col>
              </Row>
            </ListGroup.Item>

            <ListGroup.Item>
              <Row>
                <Col className="text-muted">Delivery</Col>
                <Col className="text-end">
                  {orderType === "pickup"
                    ? "Free (pickup)"
                    : itemsPrice >= 39
                    ? "Free (order ≥ €39)"
                    : deliveryFee > 0
                    ? `€${deliveryFee.toFixed(2)}`
                    : city
                    ? "—"
                    : "Select city"}
                </Col>
              </Row>
            </ListGroup.Item>

            <ListGroup.Item>
              <Row>
                <Col className="text-muted">Payment</Col>
                <Col className="text-end">{paymentMethod}</Col>
              </Row>
            </ListGroup.Item>

            <ListGroup.Item>
              <Row>
                <Col>
                  <strong>Total</strong>
                </Col>
                <Col className="text-end">
                  <strong>€{totalPrice}</strong>
                </Col>
              </Row>
            </ListGroup.Item>
          </ListGroup>
        </Card>
      </Col>
    </Row>
  );
};

export default CheckoutScreen;
