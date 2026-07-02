import React, { useEffect } from "react";
import { Row, Col, ListGroup, Image, Card, Button, Badge } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import Loader from "../components/Loader";
import Message from "../components/Message";
import { Link } from "react-router-dom";
import { getOrderDetails, payOrder, deliverOrder } from "../store/actions/order";
import * as actionTypes from "../store/actionTypes";

const OrderScreen = ({ match, history }) => {
  const orderId = match.params.id;
  const dispatch = useDispatch();

  const { loading, order, error } = useSelector((state) => state.orderDetails);
  const { loading: loadingPay, success: successPay } = useSelector(
    (state) => state.orderPay
  );
  const { loading: loadingDeliver, success: successDeliver } = useSelector(
    (state) => state.orderDeliver
  );
  const { userInfo } = useSelector((state) => state.userLogin);

  useEffect(() => {
    if (!order || successPay || successDeliver || order._id !== orderId) {
      dispatch({ type: actionTypes.ORDER_PAY_RESET });
      dispatch({ type: actionTypes.ORDER_DELIVER_RESET });
      dispatch(getOrderDetails(orderId));
    }
  }, [dispatch, orderId, order, successPay, successDeliver, history, userInfo]);

  const payHandler = () => {
    dispatch(payOrder(order._id, { id: "manual", status: "COMPLETED", update_time: new Date().toISOString(), payer: { email_address: order.shippingAddress?.email || "" } }));
  };

  const deliverHandler = () => {
    dispatch(deliverOrder(order));
  };

  if (loading) return <Loader />;
  if (error) return <Message variant="danger">{error}</Message>;
  if (!order) return null;

  const s = order.shippingAddress;

  return (
    <>
      <h1 className="mb-1">Order</h1>
      <p className="text-muted mb-4" style={{ fontSize: "0.85rem" }}>
        #{order._id}
      </p>

      <Row>
        {/* ── LEFT ─────────────────────────────────────────────── */}
        <Col md={8}>
          <ListGroup variant="flush">

            {/* Contact */}
            <ListGroup.Item className="pb-4">
              <h5 className="mb-3">Contact</h5>
              <Row>
                <Col sm={4} className="text-muted">Name</Col>
                <Col>{s.name || order.user?.name || "—"}</Col>
              </Row>
              <Row className="mt-1">
                <Col sm={4} className="text-muted">Phone</Col>
                <Col>{s.phone || "—"}</Col>
              </Row>
              <Row className="mt-1">
                <Col sm={4} className="text-muted">Email</Col>
                <Col>
                  <a href={`mailto:${s.email || order.user?.email}`}>
                    {s.email || order.user?.email || "—"}
                  </a>
                </Col>
              </Row>
            </ListGroup.Item>

            {/* Order Type & Address */}
            <ListGroup.Item className="pb-4">
              <h5 className="mb-3">
                Delivery
                <Badge
                  bg={s.orderType === "pickup" ? "secondary" : "danger"}
                  className="ms-2"
                  style={{ fontSize: "0.75rem" }}
                >
                  {s.orderType === "pickup" ? "Pickup" : "Delivery"}
                </Badge>
              </h5>

              {s.orderType === "pickup" ? (
                <p className="text-muted mb-0">Customer will pick up from the restaurant.</p>
              ) : (
                <>
                  <Row>
                    <Col sm={4} className="text-muted">City</Col>
                    <Col>{s.city || "—"}</Col>
                  </Row>
                  <Row className="mt-1">
                    <Col sm={4} className="text-muted">Street</Col>
                    <Col>{s.street || "—"}</Col>
                  </Row>
                  <Row className="mt-1">
                    <Col sm={4} className="text-muted">Number</Col>
                    <Col>{s.buildingNumber || "—"}</Col>
                  </Row>
                  {s.floor && (
                    <Row className="mt-1">
                      <Col sm={4} className="text-muted">Floor</Col>
                      <Col>{s.floor}</Col>
                    </Row>
                  )}
                </>
              )}

              <Row className="mt-1">
                <Col sm={4} className="text-muted">Date</Col>
                <Col>{s.deliveryDate || "—"}</Col>
              </Row>
              <Row className="mt-1">
                <Col sm={4} className="text-muted">Time slot</Col>
                <Col>{s.deliverySlot || "—"}</Col>
              </Row>

              <div className="mt-3">
                {order.isDelivered ? (
                  <Message variant="success">
                    Delivered on {new Date(order.deliveredAt).toLocaleString()}
                  </Message>
                ) : (
                  <Message variant="warning">Not yet delivered</Message>
                )}
              </div>
            </ListGroup.Item>

            {/* Payment */}
            <ListGroup.Item className="pb-4">
              <h5 className="mb-3">Payment</h5>
              <Row>
                <Col sm={4} className="text-muted">Method</Col>
                <Col>{order.paymentMethod || "—"}</Col>
              </Row>
              <div className="mt-3">
                {order.isPaid ? (
                  <Message variant="success">
                    Paid on {new Date(order.paidAt).toLocaleString()}
                  </Message>
                ) : (
                  <Message variant="warning">Not yet paid</Message>
                )}
              </div>
            </ListGroup.Item>

            {/* Notes */}
            {s.notes && (
              <ListGroup.Item className="pb-4">
                <h5 className="mb-3">Notes</h5>
                <p className="mb-0">{s.notes}</p>
              </ListGroup.Item>
            )}

            {/* Items */}
            <ListGroup.Item className="pb-4">
              <h5 className="mb-3">Order Items</h5>
              {order.orderItems.length === 0 ? (
                <Message>Order is empty</Message>
              ) : (
                <ListGroup variant="flush">
                  {order.orderItems.map((item, i) => (
                    <ListGroup.Item key={i}>
                      <Row className="align-items-center">
                        <Col md={1}>
                          <Image src={item.image} alt={item.name} fluid rounded />
                        </Col>
                        <Col>
                          <Link to={`/product/${item.product}`}>{item.name}</Link>
                          {item.toppings && item.toppings.length > 0 && (
                            <div>
                              {item.toppings.map((t) => (
                                <small key={t.name} className="d-block text-muted">
                                  + {t.name} (€{t.price?.toFixed(2)})
                                </small>
                              ))}
                            </div>
                          )}
                        </Col>
                        <Col md={4} className="text-end">
                          {item.qty} × €{Number(item.price).toFixed(2)} ={" "}
                          <strong>€{(item.qty * item.price).toFixed(2)}</strong>
                        </Col>
                      </Row>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
            </ListGroup.Item>

          </ListGroup>
        </Col>

        {/* ── RIGHT: Summary ───────────────────────────────────── */}
        <Col md={4}>
          <Card>
            <ListGroup variant="flush">
              <ListGroup.Item>
                <h5 className="mb-0">Order Summary</h5>
              </ListGroup.Item>
              <ListGroup.Item>
                <Row>
                  <Col className="text-muted">Items ({order.itemsNum})</Col>
                  <Col className="text-end">€{Number(order.itemsPrice).toFixed(2)}</Col>
                </Row>
              </ListGroup.Item>
              <ListGroup.Item>
                <Row>
                  <Col className="text-muted">Delivery</Col>
                  <Col className="text-end">
                    {Number(order.shippingPrice) === 0
                      ? "Free"
                      : `€${Number(order.shippingPrice).toFixed(2)}`}
                  </Col>
                </Row>
              </ListGroup.Item>
              <ListGroup.Item>
                <Row>
                  <Col>
                    <strong>Total</strong>
                  </Col>
                  <Col className="text-end">
                    <strong>€{Number(order.totalPrice).toFixed(2)}</strong>
                  </Col>
                </Row>
              </ListGroup.Item>

              {(loadingPay || loadingDeliver) && (
                <ListGroup.Item>
                  <Loader />
                </ListGroup.Item>
              )}

              {userInfo?.isAdmin && !order.isPaid && (
                <ListGroup.Item>
                  <Button
                    type="button"
                    className="btn-block w-100"
                    variant="warning"
                    onClick={payHandler}
                  >
                    Mark As Paid
                  </Button>
                </ListGroup.Item>
              )}

              {userInfo?.isAdmin && !order.isDelivered && (
                <ListGroup.Item>
                  <Button
                    type="button"
                    className="btn-block w-100"
                    variant="success"
                    onClick={deliverHandler}
                  >
                    Mark As Delivered
                  </Button>
                </ListGroup.Item>
              )}
            </ListGroup>
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default OrderScreen;
