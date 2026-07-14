import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Message from "../brace/ui/Message";
import { useToast } from "../brace/ui/Toast";
import { AdminSkeleton, AdminStatusPill } from "../brace/admin/kit";
import fmt from "../brace/ui/fmt";
import usePublicSettings from "../brace/ui/usePublicSettings";
import { getOrderDetails, payOrder, updateOrderStatus } from "../store/actions/order";
import { ORDER_PAY_RESET, ORDER_STATUS_RESET } from "../store/actionTypes";
import { labelOf, colorOf, nextStates } from "../brace/admin/orderStatus";
import { printReceipt, printKitchenTicket } from "../services/print";
import "./AdminOrderDetailScreen.scss";

const fmtDateTime = (d) =>
  d
    ? new Date(d).toLocaleString("it-IT", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";
const fmtTime = (d) =>
  d ? new Date(d).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }) : "—";

const AdminOrderDetailScreen = ({ match, history }) => {
  const orderId = match.params.id;
  const dispatch = useDispatch();
  const toast = useToast();

  const settings = usePublicSettings();
  const { order, loading, error } = useSelector((s) => s.orderDetails);
  const { success: statusOk, loading: statusLoading, error: statusErr } = useSelector((s) => s.orderStatus);
  const { success: payOk } = useSelector((s) => s.orderPay);

  const status = order?.status;
  const [notes, setNotes] = useState("");

  useEffect(() => {
    dispatch(getOrderDetails(orderId));
  }, [dispatch, orderId]);

  useEffect(() => {
    if (order && order._id === orderId) setNotes(order.shippingAddress?.notes || "");
  }, [order, orderId]);

  useEffect(() => {
    if (statusOk || payOk) {
      dispatch({ type: ORDER_STATUS_RESET });
      dispatch({ type: ORDER_PAY_RESET });
      dispatch(getOrderDetails(orderId));
    }
  }, [statusOk, payOk, dispatch, orderId]);

  useEffect(() => {
    if (statusErr) {
      toast(statusErr);
      dispatch({ type: ORDER_STATUS_RESET });
    }
  }, [statusErr, toast, dispatch]);

  const back = () => history.push("/admin/orderlist");

  const changeStatus = (s) => {
    dispatch(updateOrderStatus(orderId, s));
    toast("Stato → " + labelOf(s), "ok");
    // Auto-print the kitchen ticket the moment an order is accepted.
    if (s === "CONFIRMED" && order) printKitchenTicket(order);
  };

  const markPaid = () => {
    if (!order) return;
    dispatch(
      payOrder(order._id, {
        id: "manual-" + Date.now(),
        status: "COMPLETED",
        update_time: new Date().toISOString(),
        email_address: order.shippingAddress?.email || "",
      })
    );
    toast("Pagamento registrato", "ok");
  };

  if (loading || !order || order._id !== orderId) {
    return (
      <div className="b-rise admin-order-detail">
        <button className="b-btn sm ghost admin-order-detail__back" onClick={back}>‹ Ordini</button>
        <div className="admin-order-detail__skel-grid">
          <AdminSkeleton rows={4} />
          <AdminSkeleton rows={4} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="b-rise admin-order-detail">
        <button className="b-btn sm ghost admin-order-detail__back" onClick={back}>‹ Ordini</button>
        <Message variant="danger">{error}</Message>
      </div>
    );
  }

  const addr = order.shippingAddress || {};
  const fullAddress = [addr.street, addr.buildingNumber, addr.city].filter(Boolean).join(", ") || "—";
  const items = order.orderItems || [];
  const subtotal = order.itemsPrice || items.reduce((s, it) => s + it.price * it.qty, 0);
  const shortId = order._id.slice(-8).toUpperCase();

  // Timeline is the real status audit trail; fall back to creation time for
  // legacy orders that predate statusHistory.
  const timeline =
    order.statusHistory && order.statusHistory.length
      ? order.statusHistory.map((h) => [labelOf(h.status), fmtTime(h.at), h.note || "", ""])
      : [["Ordine creato", fmtTime(order.createdAt), addr.orderType === "pickup" ? "Ritiro" : "Consegna", ""]];

  return (
    <div className="b-rise admin-order-detail">
      {/* header */}
      <div className="admin-order-detail__header">
        <div>
          <button className="b-btn sm ghost admin-order-detail__back--header" onClick={back}>‹ Tutti gli ordini</button>
          <div className="admin-order-detail__title-row">
            <h1 className="display admin-order-detail__title">BR-{shortId}</h1>
            <AdminStatusPill label={labelOf(status)} color={colorOf(status)} soft />
            {order.pickupCode && (
              <AdminStatusPill label={"Ritiro " + order.pickupCode} color="var(--ok)" soft />
            )}
          </div>
          <div className="admin-order-detail__meta">
            {fmtDateTime(order.createdAt)} · {addr.orderType === "pickup" ? "Ritiro" : "Consegna"}
          </div>
        </div>

        {/* actions */}
        <div className="admin-order-detail__actions">
          <button
            className="b-btn sm ghost"
            onClick={() => printReceipt(order, settings) === false && toast("Consenti i popup per stampare")}
          >
            Stampa ricevuta
          </button>
          <button
            className="b-btn sm ghost"
            onClick={() => printKitchenTicket(order) === false && toast("Consenti i popup per stampare")}
          >
            Ticket cucina
          </button>
          <a className="b-btn sm ghost" href={`mailto:${addr.email || ""}`}>Contatta cliente</a>
          <button
            className="b-btn sm ghost admin-order-detail__refund"
            onClick={() => {
              if (window.confirm("Emettere rimborso totale?")) toast("Rimborso avviato", "ok");
            }}
          >
            Rimborsa
          </button>
        </div>
      </div>

      {/* status changer */}
      <div className="admin-order-detail__status-bar">
        <div className="eyebrow">Cambia stato ordine {statusLoading && "· salvataggio…"}</div>
        <div className="admin-order-detail__status-btns">
          {nextStates(status).length ? (
            nextStates(status).map((s) => (
              <button
                key={s}
                onClick={() => changeStatus(s)}
                disabled={statusLoading}
                className="admin-order-detail__status-btn"
                style={{ borderColor: colorOf(s), color: colorOf(s) }}
              >
                {labelOf(s)}
              </button>
            ))
          ) : (
            <span className="admin-order-detail__status-final">
              Stato finale · {labelOf(status)}
            </span>
          )}
        </div>
      </div>

      <div className="admin-order-detail__grid">
        {/* LEFT */}
        <div className="admin-order-detail__col">
          <Card title="Prodotti">
            <div className="admin-order-detail__table-wrap">
              <table className="admin-order-detail__table">
                <thead>
                  <tr className="admin-order-detail__thead-row">
                    <th className="admin-order-detail__th">Prodotto</th>
                    <th className="admin-order-detail__th">Extra</th>
                    <th className="admin-order-detail__th admin-order-detail__th--center">Qtà</th>
                    <th className="admin-order-detail__th admin-order-detail__th--right">Prezzo</th>
                    <th className="admin-order-detail__th admin-order-detail__th--right">Totale</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, i) => (
                    <tr key={i} className="admin-order-detail__row">
                      <td className="admin-order-detail__td admin-order-detail__td--name">{it.name}</td>
                      <td className="admin-order-detail__td admin-order-detail__td--extra">
                        {it.toppings && it.toppings.length ? it.toppings.map((t) => t.name).join(", ") : "—"}
                      </td>
                      <td className="admin-order-detail__td admin-order-detail__td--qty">{it.qty}</td>
                      <td className="admin-order-detail__td admin-order-detail__td--price">{fmt(it.price)}</td>
                      <td className="admin-order-detail__td admin-order-detail__td--total">{fmt(it.price * it.qty)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="admin-order-detail__totals">
              <TotalRow label="Subtotale" value={fmt(subtotal)} />
              <TotalRow label="Consegna" value={order.shippingPrice === 0 ? "Gratis" : fmt(order.shippingPrice)} />
              <TotalRow label="IVA" value={fmt(order.taxPrice)} muted />
              <div className="admin-order-detail__totals-rule" />
              <div className="admin-order-detail__total-line">
                <span className="eyebrow">Totale</span>
                <span className="display admin-order-detail__total-amount">{fmt(order.totalPrice)}</span>
              </div>
            </div>
          </Card>

          <Card title="Cronologia ordine">
            <div className="admin-order-detail__timeline">
              {timeline.map((ev, i) => (
                <div key={i} className="admin-order-detail__tl-item">
                  <div className="admin-order-detail__tl-marker">
                    <span className="admin-order-detail__tl-dot" />
                    {i < timeline.length - 1 && <span className="admin-order-detail__tl-line" />}
                  </div>
                  <div className="admin-order-detail__tl-body">
                    <div className="admin-order-detail__tl-row">
                      <span className="admin-order-detail__tl-title">{ev[0]}</span>
                      <span className="admin-order-detail__tl-time">{ev[1]}</span>
                    </div>
                    <div className="admin-order-detail__tl-sub">
                      {ev[2]}{ev[3] ? " · " + ev[3] : ""}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Note interne" hint="solo staff">
            <div className="admin-order-detail__notes">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Aggiungi una nota visibile solo agli amministratori…"
                className="admin-order-detail__textarea"
              />
              <div className="admin-order-detail__notes-foot">
                <button className="b-btn sm" onClick={() => toast("Nota salvata", "ok")}>Salva nota</button>
              </div>
            </div>
          </Card>
        </div>

        {/* RIGHT */}
        <div className="admin-order-detail__col">
          <Card title="Cliente">
            <div className="admin-order-detail__card-body">
              <Detail label="Nome" value={addr.name || (order.user && order.user.name) || "—"} />
              <Detail label="Telefono" value={addr.phone || "—"} mono />
              <Detail label="Email" value={addr.email || (order.user && order.user.email) || "—"} mono />
              <Detail label="Indirizzo" value={fullAddress} />
              {addr.notes && <Detail label="Note cliente" value={addr.notes} />}
            </div>
          </Card>

          <Card title="Consegna">
            <div className="admin-order-detail__card-body">
              <Detail label="Tipo" value={addr.orderType === "pickup" ? "Ritiro in sede" : "Consegna a domicilio"} />
              <Detail label="Indirizzo" value={addr.orderType === "pickup" ? "Via dei Forni 14" : fullAddress} />
              <Detail label="Data / orario" value={[addr.deliveryDate, addr.deliverySlot].filter(Boolean).join(" · ") || "—"} accent />
              <div>
                <div className="admin-order-detail__lbl">Tracking</div>
                <div className="admin-order-detail__tracking">
                  <AdminStatusPill label={labelOf(status)} color={colorOf(status)} soft />
                </div>
              </div>
            </div>
          </Card>

          <Card title="Pagamento">
            <div className="admin-order-detail__card-body">
              <div className="admin-order-detail__pay-row">
                <span className="admin-order-detail__lbl">Stato pagamento</span>
                <AdminStatusPill label={order.isPaid ? "Pagato" : "In attesa"} color={order.isPaid ? "var(--ok)" : "var(--gold)"} soft />
              </div>
              <Detail label="Metodo" value={order.paymentMethod || "—"} />
              <Detail label="ID transazione" value={(order.paymentResult && order.paymentResult.id) || "—"} mono />
              <Detail label="Pagato il" value={fmtDateTime(order.paidAt)} mono />
              {!order.isPaid && (
                <button className="b-btn sm ember admin-order-detail__pay-btn" onClick={markPaid}>
                  Segna come pagato
                </button>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

function Card({ title, hint, children }) {
  return (
    <div className="admin-order-detail__card">
      <div className="admin-order-detail__card-head">
        <div className="eyebrow">{title}</div>
        {hint && <span className="admin-order-detail__card-hint">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function Detail({ label, value, mono, accent }) {
  return (
    <div className="admin-order-detail__detail">
      <span className="admin-order-detail__lbl">{label}</span>
      <span className={`admin-order-detail__detail-val${mono ? " is-mono" : ""}${accent ? " is-accent" : ""}`}>{value}</span>
    </div>
  );
}

function TotalRow({ label, value, muted, accent }) {
  return (
    <div className={`admin-order-detail__total-row${muted ? " is-muted" : ""}${accent ? " is-accent" : ""}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

export default AdminOrderDetailScreen;
