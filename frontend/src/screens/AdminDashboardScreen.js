import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Message from "../brace/ui/Message";
import Loader from "../brace/ui/Loader";
import Icon from "../brace/ui/Icon";
import fmt from "../brace/ui/fmt";
import { AdminStatusPill, adminTh, adminTd, AdminEmptyState } from "../brace/admin/kit";
import { listOrders } from "../store/actions/order";

const KpiCard = ({ label, value, sub, accent }) => (
  <div
    style={{
      background: "var(--bg-2)",
      border: "1px solid var(--line)",
      padding: 24,
      overflow: "hidden",
    }}
  >
    <div className="eyebrow" style={{ marginBottom: 14 }}>{label}</div>
    <div className="display" style={{ fontSize: 44, lineHeight: 1, color: accent ? "var(--gold)" : "var(--text)" }}>
      {value}
    </div>
    {sub && (
      <div className="mono" style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 16, letterSpacing: "0.08em" }}>
        {sub}
      </div>
    )}
  </div>
);

const AdminDashboardScreen = ({ history }) => {
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

  const list = orders || [];
  const todayStr = new Date().toDateString();
  const todays = list.filter((o) => o.createdAt && new Date(o.createdAt).toDateString() === todayStr);
  const revenueToday = todays.reduce((acc, o) => acc + (o.totalPrice || 0), 0);
  const ordersToday = todays.length;
  const unpaid = list.filter((o) => !o.isPaid).length;
  const undelivered = list.filter((o) => !o.isDelivered).length;
  const latest = [...list]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 10);

  return (
    <div className="b-rise">
      {loading ? (
        <Loader />
      ) : error ? (
        <Message variant="danger">{error}</Message>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
            <KpiCard label="Ricavi · oggi" value={fmt(revenueToday)} sub={`${ordersToday} ordini oggi`} accent />
            <KpiCard label="Ordini · oggi" value={ordersToday} sub={`${list.length} totali`} />
            <KpiCard label="Da pagare" value={unpaid} sub="in sospeso" />
            <KpiCard label="Da consegnare" value={undelivered} sub="in attesa" />
          </div>

          <div style={{ background: "var(--bg-2)", border: "1px solid var(--line)" }}>
            <div
              style={{
                padding: "20px 28px",
                borderBottom: "1px solid var(--line)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span className="display" style={{ fontSize: 22 }}>Ordini recenti</span>
              <Link to="/admin/orderlist" className="b-btn sm ghost">
                Tutti gli ordini <Icon.arrow className="arrow" />
              </Link>
            </div>

            {latest.length === 0 ? (
              <AdminEmptyState icon="◷" title="Nessun ordine" body="Gli ordini dei clienti compariranno qui." />
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}>
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
                      <th style={adminTh}>Cliente</th>
                      <th style={adminTh}>Data</th>
                      <th style={adminTh}>Stato</th>
                      <th style={{ ...adminTh, textAlign: "right" }}>Totale</th>
                      <th style={{ ...adminTh, width: 90 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {latest.map((o) => (
                      <tr key={o._id} style={{ borderTop: "1px solid var(--line)" }}>
                        <td style={{ ...adminTd, fontFamily: "var(--mono)", color: "var(--gold)", fontSize: 12 }}>
                          {o._id.slice(-8).toUpperCase()}
                        </td>
                        <td style={adminTd}>{o.user && o.user.name}</td>
                        <td style={{ ...adminTd, color: "var(--text-dim)", fontFamily: "var(--mono)", fontSize: 12 }}>
                          {o.createdAt ? o.createdAt.substring(0, 10) : "—"}
                        </td>
                        <td style={adminTd}>
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                            {o.isPaid ? (
                              <AdminStatusPill label="Pagato" color="var(--ok)" soft />
                            ) : (
                              <AdminStatusPill label="Da pagare" color="var(--accent)" soft />
                            )}
                            {o.isDelivered ? (
                              <AdminStatusPill label="Consegnato" color="var(--ok)" soft />
                            ) : (
                              <AdminStatusPill label="In attesa" color="var(--gold)" soft />
                            )}
                          </div>
                        </td>
                        <td style={{ ...adminTd, textAlign: "right", fontFamily: "var(--mono)" }}>{fmt(o.totalPrice)}</td>
                        <td style={{ ...adminTd, textAlign: "right" }}>
                          <Link to={`/order/${o._id}`} className="b-btn sm ghost" style={{ padding: "6px 12px" }}>
                            <Icon.arrow />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboardScreen;
