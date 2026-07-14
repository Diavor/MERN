import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import Message from "../brace/ui/Message";
import { useToast } from "../brace/ui/Toast";
import { listOrders, updateOrderStatus } from "../store/actions/order";
import { ORDER_STATUS_RESET } from "../store/actionTypes";
import { STATUS, KITCHEN_STATUSES, labelOf, colorOf, nextStates } from "../brace/admin/orderStatus";
import useOrderStream from "../brace/admin/useOrderStream";
import { printKitchenTicket } from "../services/print";
import "./KitchenScreen.scss";

const shortId = (o) => "BR-" + String(o._id || "").slice(-8).toUpperCase();
const minsSince = (d) => Math.max(0, Math.round((Date.now() - new Date(d).getTime()) / 60000));

// The kitchen only advances cooking states, ending at READY (which hands the
// order off to the delivery board). Payment/cancel/complete live elsewhere.
const KITCHEN_NEXT = [STATUS.PREPARING, STATUS.READY];

const KitchenScreen = () => {
  const dispatch = useDispatch();
  const toast = useToast();
  const { orders, loading, error } = useSelector((s) => s.orderList);
  const { success: statusOk } = useSelector((s) => s.orderStatus);

  const load = () => dispatch(listOrders());
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  // Live updates: any order event refreshes the queue (and chimes on new orders).
  useOrderStream({
    onEvent: (e) => {
      if (e.type === "created") toast("Nuovo ordine ricevuto", "ok");
      load();
    },
  });

  useEffect(() => {
    if (statusOk) {
      dispatch({ type: ORDER_STATUS_RESET });
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusOk, dispatch]);

  // Active queue: accepted but not yet handed off, oldest first (FIFO cooking).
  const queue = useMemo(
    () =>
      (orders || [])
        .filter((o) => KITCHEN_STATUSES.includes(o.status))
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)),
    [orders]
  );

  const advance = (o, s) => dispatch(updateOrderStatus(o._id, s));

  return (
    <div className="kds">
      <div className="kds__bar">
        <div className="kds__title">Cucina · Display</div>
        <div className="kds__count">{queue.length} in coda</div>
      </div>

      {error && <Message variant="danger">{error}</Message>}
      {!loading && !queue.length && (
        <div className="kds__empty">Nessun ordine in preparazione</div>
      )}

      <div className="kds__grid">
        {queue.map((o) => {
          const mins = minsSince(o.createdAt);
          const urgent = mins >= 20;
          return (
            <div key={o._id} className={"kds__card is-" + o.status + (urgent ? " is-urgent" : "")}>
              <div className="kds__card-head">
                <span className="kds__card-id">{shortId(o)}</span>
                <span className="kds__card-timer">{mins}′</span>
              </div>
              <div className="kds__card-meta">
                <span className="kds__pill" style={{ color: colorOf(o.status) }}>
                  {labelOf(o.status)}
                </span>
                <span className="kds__type">
                  {o.shippingAddress?.orderType === "pickup" ? "RITIRO" : "CONSEGNA"}
                  {o.shippingAddress?.deliverySlot ? " · " + o.shippingAddress.deliverySlot : ""}
                </span>
              </div>

              <ul className="kds__items">
                {(o.orderItems || []).map((it, i) => (
                  <li key={i} className="kds__item">
                    <span className="kds__qty">{it.qty}×</span>
                    <span className="kds__name">{it.name}</span>
                    {it.toppings && it.toppings.length > 0 && (
                      <div className="kds__extra">+ {it.toppings.map((t) => t.name).join(", ")}</div>
                    )}
                  </li>
                ))}
              </ul>

              {o.shippingAddress?.notes && (
                <div className="kds__notes">NOTE: {o.shippingAddress.notes}</div>
              )}

              <div className="kds__actions">
                {nextStates(o.status)
                  .filter((s) => KITCHEN_NEXT.includes(s))
                  .map((s) => (
                    <button key={s} className="kds__btn" onClick={() => advance(o, s)}>
                      → {labelOf(s)}
                    </button>
                  ))}
                <button className="kds__btn kds__btn--ghost" onClick={() => printKitchenTicket(o)}>
                  Stampa
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default KitchenScreen;
