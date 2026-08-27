import React, { useEffect } from "react";
import "./OrderScreen.scss";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Icon from "../brace/ui/Icon";
import fmt from "../brace/ui/fmt";
import Loader from "../brace/ui/Loader";
import Message from "../brace/ui/Message";
import { getOrderDetails, payOrder, deliverOrder } from "../store/actions/order";
import * as actionTypes from "../store/actionTypes";

const Cell = ({ k, v, sub }) => (
  <div className="order__cell">
    <div className="mono order__cell-key">{k}</div>
    <div className="display order__cell-value">{v}</div>
    {sub && <div className="mono order__cell-sub">{sub}</div>}
  </div>
);

const Pill = ({ ok, okLabel, offLabel }) => (
  <span className={"mono order__pill" + (ok ? " is-ok" : "")}>
    <span className="order__pill-dot" />
    {ok ? okLabel : offLabel}
  </span>
);

const OrderScreen = ({ match }) => {
  const { t, i18n } = useTranslation();
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
      <main className="order order--pending">
        <div className="b-container">
          <Loader />
        </div>
      </main>
    );
  if (error)
    return (
      <main className="order order--pending">
        <div className="b-container">
          <Message variant="danger">{error}</Message>
        </div>
      </main>
    );
  if (!order) return null;

  const s = order.shippingAddress || {};
  // Prefer the stored discount; for orders placed before it was persisted,
  // derive it from the totals (items + shipping − total).
  const discount =
    Number(order.discountPrice) ||
    Math.max(
      0,
      Number(order.itemsPrice) + Number(order.shippingPrice) - Number(order.totalPrice)
    );
  const eta =
    (s.deliveryDate
      ? new Date(s.deliveryDate).toLocaleDateString(
          i18n.resolvedLanguage === "en" ? "en-GB" : "it-IT",
          { weekday: "short", day: "numeric", month: "short" }
        )
      : "—") + (s.deliverySlot ? " · " + s.deliverySlot : "");

  return (
    <main className="order">
      <div className="b-container">
        <div className="b-rise order__card">
          <div className="order__badge">
            <Icon.check style={{ width: 32, height: 32 }} />
          </div>

          <p className="it order__thanks">
            {t("order.thanks", { name: s.name || order.user?.name || t("profile.friend") })}
          </p>

          <div className="eyebrow order__eyebrow">{t("order.order")}</div>
          <div className="display order__id">{order._id}</div>

          {/* status pills */}
          <div className="order__pills">
            <Pill
              ok={order.isPaid}
              okLabel={t("profile.paid")}
              offLabel={t("profile.unpaid")}
            />
            <Pill
              ok={order.isDelivered}
              okLabel={t("profile.delivered")}
              offLabel={s.orderType === "pickup" ? t("order.toPickup") : t("order.inDelivery")}
            />
          </div>

          {/* info cells */}
          <div className="order__cells">
            <Cell
              k={s.orderType === "pickup" ? t("order.pickupEta") : t("order.deliveryEta")}
              v={eta}
              sub={
                s.orderType === "pickup"
                  ? "Pizzeria Grani Antichi"
                  : s.city || "Mogliano Veneto"
              }
            />
            <Cell
              k={t("cart.total")}
              v={fmt(order.totalPrice)}
              sub={
                order.paymentMethod +
                " · " +
                (Number(order.shippingPrice) === 0
                  ? t("order.freeShippingSub")
                  : t("order.shippingSub", { price: fmt(order.shippingPrice) }))
              }
            />
            <Cell
              k={s.orderType === "pickup" ? t("order.pickupPoint") : t("order.address")}
              v={
                s.orderType === "pickup"
                  ? t("order.atPizzeria")
                  : [s.street, s.buildingNumber].filter(Boolean).join(" ") || "—"
              }
              sub={
                s.orderType === "pickup"
                  ? "Mogliano Veneto"
                  : [s.city, s.floor && t("order.floorSub", { floor: s.floor })]
                      .filter(Boolean)
                      .join(" · ")
              }
            />
          </div>

          {/* items */}
          <div className="order__items">
            <div className="eyebrow order__items-label">{t("order.yourOrder")}</div>
            <div className="order__list">
              {order.orderItems.map((item, i) => (
                <div
                  key={i}
                  className={
                    "order__item" +
                    (i < order.orderItems.length - 1 ? "" : " order__item--last")
                  }
                >
                  <span className="mono order__item-qty">{item.qty}×</span>
                  <div>
                    <Link
                      to={`/product/${item.product}`}
                      className="order__item-name"
                    >
                      {item.name}
                    </Link>
                    {item.toppings && item.toppings.length > 0 && (
                      <div className="mono order__item-toppings">
                        {item.toppings
                          .map((t) => t.name + (t.price ? ` (${fmt(t.price)})` : ""))
                          .join(" · ")}
                      </div>
                    )}
                  </div>
                  <span className="mono order__item-total">
                    {fmt(item.qty * item.price)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* notes */}
          {s.notes && (
            <div className="order__notes">
              <div className="eyebrow order__notes-label">{t("order.notes")}</div>
              <p className="order__notes-text">{s.notes}</p>
            </div>
          )}

          {/* totals */}
          {discount > 0 && (
            <div className="order__breakdown">
              <div className="order__breakdown-row">
                <span>{t("summary.subtotal")}</span>
                <span>{fmt(order.itemsPrice)}</span>
              </div>
              <div className="order__breakdown-row is-discount">
                <span>
                  {t("summary.discount")}
                  {order.couponCode ? ` · ${order.couponCode}` : ""}
                </span>
                <span>−{fmt(discount)}</span>
              </div>
              <div className="order__breakdown-row">
                <span>{t("cart.delivery")}</span>
                <span>
                  {Number(order.shippingPrice) === 0
                    ? t("summary.free")
                    : fmt(order.shippingPrice)}
                </span>
              </div>
            </div>
          )}
          <div className="order__totals">
            <span className="eyebrow">{t("order.totalPaid")}</span>
            <span className="display order__totals-value">
              {fmt(order.totalPrice)}
            </span>
          </div>

          {/* admin actions */}
          {userInfo?.isAdmin &&
            (!order.isPaid || !order.isDelivered) && (
              <div className="order__admin">
                <div className="eyebrow order__admin-label">{t("profile.admin")}</div>
                {(loadingPay || loadingDeliver) && <Loader />}
                <div className="order__admin-actions">
                  {!order.isPaid && (
                    <button
                      type="button"
                      className="b-btn"
                      onClick={payHandler}
                    >
                      {t("order.markPaid")}
                    </button>
                  )}
                  {!order.isDelivered && (
                    <button
                      type="button"
                      className="b-btn ember"
                      onClick={deliverHandler}
                    >
                      {t("order.markDelivered")}
                    </button>
                  )}
                </div>
              </div>
            )}

          <div className="order__actions">
            <Link to="/profile" className="b-btn">
              {t("order.myOrders")}
            </Link>
            <Link to="/" className="b-btn ember">
              {t("order.backHome")} <Icon.arrow className="arrow" />
            </Link>
          </div>

          {(s.email || order.user?.email) && (
            <p className="mono order__confirm">
              {t("order.confirmSent", { email: s.email || order.user?.email })}
            </p>
          )}
        </div>
      </div>
    </main>
  );
};

export default OrderScreen;
