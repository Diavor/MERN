import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import Message from "../brace/ui/Message";
import { useToast } from "../brace/ui/Toast";
import { listOrders, updateOrderStatus } from "../store/actions/order";
import { ORDER_STATUS_RESET } from "../store/actionTypes";
import {
  STATUS,
  DELIVERY_STATUSES,
  labelOf,
  colorOf,
  shortId,
  minsSince,
} from "../brace/admin/orderStatus";
import useOrderStream from "../brace/admin/useOrderStream";
import { printReceipt } from "../services/print";
import usePublicSettings from "../brace/ui/usePublicSettings";
import "./KitchenScreen.scss";

const isPickup = (o) => o.shippingAddress?.orderType === "pickup";

const fullAddress = (a = {}) =>
  [a.street, a.buildingNumber, a.floor && "piano " + a.floor, a.city].filter(Boolean).join(", ");

// Courier actions depend on order type: delivery orders go READY → OUT_FOR_DELIVERY
// → COMPLETED; pickup orders are handed to the customer at READY (→ COMPLETED).
const actionsFor = (o) => {
  if (o.status === STATUS.READY) return isPickup(o) ? [STATUS.COMPLETED] : [STATUS.OUT_FOR_DELIVERY];
  if (o.status === STATUS.PACKED) return [STATUS.OUT_FOR_DELIVERY];
  if (o.status === STATUS.OUT_FOR_DELIVERY) return [STATUS.COMPLETED];
  return [];
};

const actionLabel = (o, s) => {
  if (s === STATUS.OUT_FOR_DELIVERY) return "In consegna";
  if (s === STATUS.COMPLETED) return isPickup(o) ? "Consegnato al cliente" : "Consegnato";
  return labelOf(s);
};

const DeliveryScreen = () => {
  const dispatch = useDispatch();
  const toast = useToast();
  const settings = usePublicSettings();
  const { orders, loading, error } = useSelector((s) => s.orderList);
  const { success: statusOk } = useSelector((s) => s.orderStatus);

  const load = () => dispatch(listOrders());
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  // Live: react to kitchen hand-offs (an order turning READY) and rider updates.
  useOrderStream({
    onEvent: () => load(),
    sound: false, // the kitchen board owns the new-order chime
  });

  useEffect(() => {
    if (statusOk) {
      dispatch({ type: ORDER_STATUS_RESET });
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusOk, dispatch]);

  // Ready/dispatching first, then already-in-transit; oldest first within a group.
  const queue = useMemo(
    () =>
      (orders || [])
        .filter((o) => DELIVERY_STATUSES.includes(o.status))
        .sort(
          (a, b) =>
            DELIVERY_STATUSES.indexOf(a.status) - DELIVERY_STATUSES.indexOf(b.status) ||
            new Date(a.createdAt) - new Date(b.createdAt)
        ),
    [orders]
  );

  const advance = (o, s) => dispatch(updateOrderStatus(o._id, s));

  return (
    <div className="kds">
      <div className="kds__bar">
        <div className="kds__title">Consegne · Corriere</div>
        <div className="kds__count">{queue.length} da consegnare</div>
      </div>

      {error && <Message variant="danger">{error}</Message>}
      {!loading && !queue.length && (
        <div className="kds__empty">Nessun ordine pronto per la consegna</div>
      )}

      <div className="kds__grid">
        {queue.map((o) => {
          const a = o.shippingAddress || {};
          const pickup = isPickup(o);
          const mins = minsSince(o.createdAt);
          const urgent = mins >= 35;
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
                  {pickup ? "RITIRO" : "CONSEGNA"}
                  {a.deliverySlot ? " · " + a.deliverySlot : ""}
                </span>
              </div>

              {pickup ? (
                <div className="kds__addr">
                  Ritiro in sede{o.pickupCode ? " · codice " + o.pickupCode : ""}
                </div>
              ) : (
                <div className="kds__addr">{fullAddress(a) || "—"}</div>
              )}
              <div className="kds__cust">
                {a.name || "—"}
                {a.phone && (
                  <a className="kds__phone" href={"tel:" + a.phone}>
                    {a.phone}
                  </a>
                )}
              </div>
              {a.notes && <div className="kds__notes">NOTE: {a.notes}</div>}

              <div className="kds__actions">
                {actionsFor(o).map((s) => (
                  <button key={s} className="kds__btn" onClick={() => advance(o, s)}>
                    → {actionLabel(o, s)}
                  </button>
                ))}
                <button
                  className="kds__btn kds__btn--ghost"
                  onClick={() => printReceipt(o, settings) === false && toast("Consenti i popup per stampare")}
                >
                  Ricevuta
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DeliveryScreen;
