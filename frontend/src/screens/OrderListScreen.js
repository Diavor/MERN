import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Message from "../brace/ui/Message";
import Loader from "../brace/ui/Loader";
import Icon from "../brace/ui/Icon";
import fmt from "../brace/ui/fmt";
import { AdminStatusPill, adminTh, adminTd, AdminEmptyState } from "../brace/admin/kit";
import { listOrders } from "../store/actions/order";

const OrderListScreen = ({ history }) => {
  const dispatch = useDispatch();
  const { orders, loading, error } = useSelector((state) => state.orderList);
  const { userInfo } = useSelector((state) => state.userLogin);

  useEffect(() => {
    if (userInfo && userInfo.isAdmin) {
      dispatch(listOrders());
    } else {
      history.push("/login");
    }
  }, [dispatch, history, userInfo]);

  return (
    <div className="b-rise">
      {loading ? (
        <Loader />
      ) : error ? (
        <Message variant="danger">{error}</Message>
      ) : !orders || orders.length === 0 ? (
        <AdminEmptyState icon="◷" title="Nessun ordine" body="Gli ordini dei clienti compariranno qui." />
      ) : (
        <div style={{ background: "var(--bg-2)", border: "1px solid var(--line)", overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 820 }}>
            <thead>
              <tr
                style={{
                  textAlign: "left",
                  fontFamily: "var(--mono)",
                  fontSize: 10,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: "var(--text-faint)",
                }}
              >
                <th style={adminTh}>Ordine</th>
                <th style={adminTh}>Utente</th>
                <th style={adminTh}>Data</th>
                <th style={{ ...adminTh, textAlign: "right" }}>Totale</th>
                <th style={adminTh}>Pagamento</th>
                <th style={adminTh}>Consegna</th>
                <th style={{ ...adminTh, width: 90 }}></th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order._id} style={{ borderTop: "1px solid var(--line)" }}>
                  <td style={{ ...adminTd, fontFamily: "var(--mono)", color: "var(--gold)", fontSize: 12 }}>
                    {order._id.slice(-8).toUpperCase()}
                  </td>
                  <td style={adminTd}>{order.user && order.user.name}</td>
                  <td style={{ ...adminTd, color: "var(--text-dim)", fontFamily: "var(--mono)", fontSize: 12 }}>
                    {order.createdAt.substring(0, 10)}
                  </td>
                  <td style={{ ...adminTd, textAlign: "right", fontFamily: "var(--mono)" }}>{fmt(order.totalPrice)}</td>
                  <td style={adminTd}>
                    {order.isPaid ? (
                      <AdminStatusPill label="Pagato" color="var(--ok)" soft />
                    ) : (
                      <AdminStatusPill label="Da pagare" color="var(--accent)" soft />
                    )}
                  </td>
                  <td style={adminTd}>
                    {order.isDelivered ? (
                      <AdminStatusPill label="Consegnato" color="var(--ok)" soft />
                    ) : (
                      <AdminStatusPill label="In attesa" color="var(--gold)" soft />
                    )}
                  </td>
                  <td style={{ ...adminTd, textAlign: "right" }}>
                    <Link to={`/order/${order._id}`} className="b-btn sm ghost" style={{ padding: "6px 12px" }}>
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
