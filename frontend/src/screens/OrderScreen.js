import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import Icon from "../brace/ui/Icon";
import fmt from "../brace/ui/fmt";
import Loader from "../brace/ui/Loader";
import Message from "../brace/ui/Message";
import { getOrderDetails, payOrder, deliverOrder } from "../store/actions/order";
import * as actionTypes from "../store/actionTypes";

const Cell = ({ k, v, sub }) => (
  <div style={{ background: "var(--bg)", padding: "26px 24px", textAlign: "left" }}>
    <div
      className="mono"
      style={{
        fontSize: 10,
        color: "var(--text-faint)",
        letterSpacing: "0.16em",
        textTransform: "uppercase",
      }}
    >
      {k}
    </div>
    <div
      className="display"
      style={{ fontSize: 22, marginTop: 10, color: "var(--gold)" }}
    >
      {v}
    </div>
    {sub && (
      <div
        className="mono"
        style={{
          fontSize: 11,
          color: "var(--text-dim)",
          marginTop: 6,
          letterSpacing: "0.08em",
        }}
      >
        {sub}
      </div>
    )}
  </div>
);

const Pill = ({ ok, okLabel, offLabel }) => (
  <span
    className="mono"
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      padding: "8px 14px",
      fontSize: 11,
      letterSpacing: "0.12em",
      textTransform: "uppercase",
      background: ok ? "rgba(93,138,74,0.14)" : "var(--bg-2)",
      border: "1px solid " + (ok ? "var(--ok)" : "var(--line-2)"),
      color: ok ? "var(--ok)" : "var(--text-faint)",
    }}
  >
    <span
      style={{
        width: 6,
        height: 6,
        borderRadius: 999,
        background: ok ? "var(--ok)" : "var(--text-faint)",
      }}
    />
    {ok ? okLabel : offLabel}
  </span>
);

const OrderScreen = ({ match }) => {
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
  }, [dispatch, orderId, order, successPay, successDeliver]);

  const payHandler = () => {
    dispatch(
      payOrder(order._id, {
        id: "manual",
        status: "COMPLETED",
        update_time: new Date().toISOString(),
        payer: { email_address: order.shippingAddress?.email || "" },
      })
    );
  };

  const deliverHandler = () => dispatch(deliverOrder(order));

  if (loading)
    return (
      <main style={{ paddingTop: 160, minHeight: "70vh" }}>
        <div className="b-container">
          <Loader />
        </div>
      </main>
    );
  if (error)
    return (
      <main style={{ paddingTop: 160, minHeight: "70vh" }}>
        <div className="b-container">
          <Message variant="danger">{error}</Message>
        </div>
      </main>
    );
  if (!order) return null;

  const s = order.shippingAddress || {};
  const eta =
    (s.deliveryDate
      ? new Date(s.deliveryDate).toLocaleDateString("it-IT", {
          weekday: "short",
          day: "numeric",
          month: "short",
        })
      : "—") + (s.deliverySlot ? " · " + s.deliverySlot : "");

  return (
    <main style={{ paddingTop: 130, paddingBottom: 100, minHeight: "100vh" }}>
      <div className="b-container">
        <div
          className="b-rise"
          style={{ maxWidth: 860, margin: "0 auto", textAlign: "center" }}
        >
          <div
            style={{
              width: 88,
              height: 88,
              borderRadius: 999,
              background: "var(--bg-2)",
              border: "1px solid var(--gold-deep)",
              margin: "0 auto 32px",
              display: "grid",
              placeItems: "center",
              color: "var(--gold)",
            }}
          >
            <Icon.check style={{ width: 32, height: 32 }} />
          </div>

          <p className="it" style={{ fontSize: 24, color: "var(--text-dim)" }}>
            Grazie, {s.name || order.user?.name || "amico"}.
          </p>

          <div className="eyebrow" style={{ marginTop: 36, marginBottom: 12 }}>
            Ordine
          </div>
          <div
            className="display"
            style={{ fontSize: 44, letterSpacing: "0.04em", wordBreak: "break-all" }}
          >
            {order._id}
          </div>

          {/* status pills */}
          <div
            style={{
              display: "flex",
              gap: 12,
              justifyContent: "center",
              marginTop: 28,
            }}
          >
            <Pill ok={order.isPaid} okLabel="Pagato" offLabel="Da pagare" />
            <Pill
              ok={order.isDelivered}
              okLabel="Consegnato"
              offLabel={s.orderType === "pickup" ? "Da ritirare" : "In consegna"}
            />
          </div>

          {/* info cells */}
          <div
            style={{
              marginTop: 44,
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 1,
              background: "var(--line)",
              border: "1px solid var(--line)",
              textAlign: "left",
            }}
          >
            <Cell
              k={s.orderType === "pickup" ? "Ritiro previsto" : "Consegna prevista"}
              v={eta}
              sub={
                s.orderType === "pickup"
                  ? "Pizzeria BRÀCE"
                  : s.city || "Mogliano Veneto"
              }
            />
            <Cell
              k="Totale"
              v={fmt(order.totalPrice)}
              sub={
                order.paymentMethod +
                " · " +
                (Number(order.shippingPrice) === 0
                  ? "consegna gratis"
                  : "consegna " + fmt(order.shippingPrice))
              }
            />
            <Cell
              k={s.orderType === "pickup" ? "Punto di ritiro" : "Indirizzo"}
              v={
                s.orderType === "pickup"
                  ? "In pizzeria"
                  : [s.street, s.buildingNumber].filter(Boolean).join(" ") || "—"
              }
              sub={
                s.orderType === "pickup"
                  ? "Mogliano Veneto"
                  : [s.city, s.floor && "piano " + s.floor]
                      .filter(Boolean)
                      .join(" · ")
              }
            />
          </div>

          {/* items */}
          <div style={{ marginTop: 48, textAlign: "left" }}>
            <div className="eyebrow" style={{ marginBottom: 18 }}>
              Il tuo ordine
            </div>
            <div style={{ border: "1px solid var(--line)" }}>
              {order.orderItems.map((item, i) => (
                <div
                  key={i}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "auto 1fr auto",
                    gap: 16,
                    alignItems: "center",
                    padding: "16px 20px",
                    borderBottom:
                      i < order.orderItems.length - 1
                        ? "1px solid var(--line)"
                        : "none",
                    background: "var(--bg-2)",
                  }}
                >
                  <span
                    className="mono"
                    style={{ fontSize: 12, color: "var(--gold)" }}
                  >
                    {item.qty}×
                  </span>
                  <div>
                    <Link
                      to={`/product/${item.product}`}
                      style={{ color: "var(--text)", fontSize: 15 }}
                    >
                      {item.name}
                    </Link>
                    {item.toppings && item.toppings.length > 0 && (
                      <div
                        className="mono"
                        style={{
                          fontSize: 11,
                          color: "var(--text-faint)",
                          letterSpacing: "0.06em",
                          marginTop: 4,
                        }}
                      >
                        {item.toppings
                          .map((t) => t.name + (t.price ? ` (${fmt(t.price)})` : ""))
                          .join(" · ")}
                      </div>
                    )}
                  </div>
                  <span
                    className="mono"
                    style={{ fontSize: 13, color: "var(--text)" }}
                  >
                    {fmt(item.qty * item.price)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* notes */}
          {s.notes && (
            <div style={{ marginTop: 28, textAlign: "left" }}>
              <div className="eyebrow" style={{ marginBottom: 10 }}>
                Note
              </div>
              <p style={{ color: "var(--text-dim)", margin: 0 }}>{s.notes}</p>
            </div>
          )}

          {/* totals */}
          <div
            style={{
              marginTop: 32,
              paddingTop: 20,
              borderTop: "1px solid var(--line)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
            }}
          >
            <span className="eyebrow">Totale pagato</span>
            <span className="display" style={{ fontSize: 36, color: "var(--gold)" }}>
              {fmt(order.totalPrice)}
            </span>
          </div>

          {/* admin actions */}
          {userInfo?.isAdmin &&
            (!order.isPaid || !order.isDelivered) && (
              <div
                style={{
                  marginTop: 40,
                  paddingTop: 28,
                  borderTop: "1px solid var(--line)",
                }}
              >
                <div className="eyebrow" style={{ marginBottom: 16 }}>
                  Amministrazione
                </div>
                {(loadingPay || loadingDeliver) && <Loader />}
                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    justifyContent: "center",
                    flexWrap: "wrap",
                  }}
                >
                  {!order.isPaid && (
                    <button
                      type="button"
                      className="b-btn"
                      onClick={payHandler}
                    >
                      Segna come pagato
                    </button>
                  )}
                  {!order.isDelivered && (
                    <button
                      type="button"
                      className="b-btn ember"
                      onClick={deliverHandler}
                    >
                      Segna come consegnato
                    </button>
                  )}
                </div>
              </div>
            )}

          <div
            style={{
              display: "flex",
              gap: 12,
              justifyContent: "center",
              marginTop: 48,
            }}
          >
            <Link to="/profile" className="b-btn">
              I miei ordini
            </Link>
            <Link to="/" className="b-btn ember">
              Torna alla casa <Icon.arrow className="arrow" />
            </Link>
          </div>

          {(s.email || order.user?.email) && (
            <p
              className="mono"
              style={{
                fontSize: 11,
                color: "var(--text-faint)",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                marginTop: 56,
              }}
            >
              Conferma inviata a {s.email || order.user?.email}
            </p>
          )}
        </div>
      </div>
    </main>
  );
};

export default OrderScreen;
