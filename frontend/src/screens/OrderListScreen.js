import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Message from "../brace/ui/Message";
import Loader from "../brace/ui/Loader";
import Icon from "../brace/ui/Icon";
import fmt from "../brace/ui/fmt";
import { AdminStatusPill, AdminEmptyState } from "../brace/admin/kit";
import { listOrders } from "../store/actions/order";
import { useToast } from "../brace/ui/Toast";
import useOrderStream from "../brace/admin/useOrderStream";
import { labelOf, colorOf } from "../brace/admin/orderStatus";
import "./OrderListScreen.scss";

// Filter tabs mapped onto the backend's paid/delivered booleans.
const TABS = [
  { key: "all", label: "Tutti", test: () => true },
  { key: "unpaid", label: "Da pagare", test: (o) => !o.isPaid },
  { key: "cooking", label: "In corso", test: (o) => o.isPaid && !o.isDelivered },
  { key: "delivered", label: "Consegnati", test: (o) => o.isDelivered },
];

const OrderListScreen = ({ history }) => {
  const dispatch = useDispatch();
  const toast = useToast();
  const { orders, loading, error } = useSelector((state) => state.orderList);
  const { userInfo } = useSelector((state) => state.userLogin);
  const [tab, setTab] = useState("all");

  useEffect(() => {
    if (userInfo && userInfo.isAdmin) {
      dispatch(listOrders());
    } else {
      history.push("/login");
    }
  }, [dispatch, history, userInfo]);

  // Live: new/updated orders refresh the list (and chime on arrival).
  useOrderStream({
    onEvent: (e) => {
      if (e.type === "created") toast("Nuovo ordine ricevuto", "ok");
      dispatch(listOrders());
    },
  });

  const activeTab = TABS.find((t) => t.key === tab) || TABS[0];
  const filtered = (orders || []).filter(activeTab.test);

  return (
    <div className="b-rise">
      {!loading && !error && orders && orders.length > 0 && (
        <div className="order-list__tabs">
          {TABS.map((t) => {
            const count = (orders || []).filter(t.test).length;
            const on = t.key === tab;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={"order-list__tab" + (on ? " is-on" : "")}
              >
                {t.label} <span className="order-list__tab-count">{count}</span>
              </button>
            );
          })}
        </div>
      )}
      {loading ? (
        <Loader />
      ) : error ? (
        <Message variant="danger">{error}</Message>
      ) : !orders || orders.length === 0 ? (
        <AdminEmptyState icon="◷" title="Nessun ordine" body="Gli ordini dei clienti compariranno qui." />
      ) : (
        <div className="order-list__table-wrap">
          <table className="order-list__table admin-table">
            <thead>
              <tr className="order-list__head-row">
                <th>Ordine</th>
                <th>Utente</th>
                <th>Data</th>
                <th className="is-right">Totale</th>
                <th>Pagamento</th>
                <th>Consegna</th>
                <th className="is-w90"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((order) => (
                <tr key={order._id} className="order-list__row">
                  <td data-label="Ordine" className="is-mono is-gold is-sm">
                    {order._id.slice(-8).toUpperCase()}
                  </td>
                  <td data-label="Utente">{order.user && order.user.name}</td>
                  <td data-label="Data" className="is-dim is-mono is-sm">
                    {order.createdAt.substring(0, 10)}
                  </td>
                  <td data-label="Totale" className="is-right is-mono">
                    {fmt(order.totalPrice)}
                  </td>
                  <td data-label="Pagamento">
                    {order.isPaid ? (
                      <AdminStatusPill label="Pagato" color="var(--ok)" soft />
                    ) : (
                      <AdminStatusPill label="Da pagare" color="var(--accent)" soft />
                    )}
                  </td>
                  <td data-label="Consegna">
                    <AdminStatusPill label={labelOf(order.status)} color={colorOf(order.status)} soft />
                  </td>
                  <td className="is-right">
                    <Link to={`/admin/orders/${order._id}`} className="b-btn sm ghost order-list__detail-btn">
                      Dettagli <Icon.arrow className="arrow" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default OrderListScreen;
