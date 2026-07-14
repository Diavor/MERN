import React, { useEffect, useMemo } from "react";
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
import "./AdminDashboardScreen.scss";

const KpiCard = ({ label, value, sub, delta, fill, accent }) => (
  <div className="admin-dashboard__kpi">
    <div className="eyebrow admin-dashboard__kpi-label">{label}</div>
    <div className={`display admin-dashboard__kpi-value${accent ? " admin-dashboard__kpi-value--accent" : ""}`}>{value}</div>
    <div className="admin-dashboard__kpi-meta">
      {delta ? <span className="admin-dashboard__kpi-delta">↑ {delta}</span> : <span />}
      <span className="admin-dashboard__kpi-sub">{sub}</span>
    </div>
    <div className="admin-dashboard__kpi-track">
      <div className="admin-dashboard__kpi-bar" style={{ width: Math.max(4, Math.min(100, fill)) + "%" }} />
    </div>
  </div>
);

// SVG area/line chart of daily revenue over the last 14 days.
const RevenueChart = ({ series }) => {
  const w = 720;
  const h = 200;
  const pad = 16;
  const data = series.length ? series.map((d) => d.value) : [0, 0];
  const max = Math.max(...data, 1);
  const pts = data.map((v, i) => {
    const x = pad + (i / Math.max(1, data.length - 1)) * (w - pad * 2);
    const y = h - pad - (v / max) * (h - pad * 2);
    return [x, y];
  });
  const path = pts.map(([x, y], i) => (i === 0 ? "M" : "L") + x.toFixed(1) + " " + y.toFixed(1)).join(" ");
  const fillPath = pts.length
    ? path + ` L ${pts[pts.length - 1][0]} ${h - pad} L ${pts[0][0]} ${h - pad} Z`
    : "";

  return (
    <div className="admin-dashboard__chart">
      <svg viewBox={`0 0 ${w} ${h}`} className="admin-dashboard__chart-svg">
        <defs>
          <linearGradient id="rev-area" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--gold)" stopOpacity="0.45" />
            <stop offset="100%" stopColor="var(--gold)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((t) => (
          <line key={t} x1={pad} x2={w - pad} y1={pad + t * (h - pad * 2)} y2={pad + t * (h - pad * 2)} stroke="var(--line)" strokeDasharray="2 4" />
        ))}
        {fillPath && <path d={fillPath} fill="url(#rev-area)" />}
        <path d={path} fill="none" stroke="var(--gold)" strokeWidth="1.5" />
        {pts.map(([x, y], i) =>
          i === pts.length - 1 ? (
            <g key={i}>
              <circle cx={x} cy={y} r="4" fill="var(--accent)" />
              <circle cx={x} cy={y} r="9" fill="var(--accent)" fillOpacity="0.2" />
            </g>
          ) : null
        )}
      </svg>
      <div className="admin-dashboard__chart-labels">
        {series.length ? (
          <>
            <span>{series[0].label}</span>
            <span>{series[Math.floor(series.length / 2)].label}</span>
            <span>oggi</span>
          </>
        ) : (
          <span>Nessun dato</span>
        )}
      </div>
    </div>
  );
};

const AdminDashboardScreen = ({ history }) => {
  const dispatch = useDispatch();
  const toast = useToast();
  const { orders, loading, error } = useSelector((state) => state.orderList);
  const { userInfo } = useSelector((state) => state.userLogin);

  useEffect(() => {
    if (userInfo && userInfo.isAdmin) {
      dispatch(listOrders());
    } else {
      history.push("/login");
    }
  }, [dispatch, history, userInfo]);

  // Live: refresh the dashboard when orders arrive/change (chimes on new ones).
  useOrderStream({
    onEvent: (e) => {
      if (e.type === "created") toast("Nuovo ordine ricevuto", "ok");
      dispatch(listOrders());
    },
  });

  const list = useMemo(() => orders || [], [orders]);
  const todayStr = new Date().toDateString();
  const todays = list.filter((o) => o.createdAt && new Date(o.createdAt).toDateString() === todayStr);
  const revenueToday = todays.reduce((acc, o) => acc + (o.totalPrice || 0), 0);
  const ordersToday = todays.length;
  const unpaid = list.filter((o) => !o.isPaid).length;
  const undelivered = list.filter((o) => !o.isPaid ? false : !o.isDelivered).length;

  // 14-day daily revenue series.
  const series = useMemo(() => {
    const days = [];
    const now = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = d.toDateString();
      const value = list
        .filter((o) => o.createdAt && new Date(o.createdAt).toDateString() === key)
        .reduce((s, o) => s + (o.totalPrice || 0), 0);
      days.push({ label: d.toLocaleDateString("it-IT", { day: "2-digit", month: "short" }), value });
    }
    return days;
  }, [list]);
  const revenue14 = series.reduce((s, d) => s + d.value, 0);

  // Top products by units sold across all orders.
  const topProducts = useMemo(() => {
    const map = {};
    list.forEach((o) => (o.orderItems || []).forEach((it) => {
      map[it.name] = (map[it.name] || 0) + (it.qty || 0);
    }));
    const arr = Object.entries(map).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 5);
    const max = arr.length ? arr[0].count : 1;
    return arr.map((x) => ({ ...x, w: x.count / max }));
  }, [list]);

  const latest = [...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 8);

  return (
    <div className="admin-dashboard b-rise">
      {loading ? (
        <Loader />
      ) : error ? (
        <Message variant="danger">{error}</Message>
      ) : (
        <>
          <div className="admin-dashboard__kpis">
            <KpiCard label="Ricavi · oggi" value={fmt(revenueToday)} sub={`${ordersToday} ordini oggi`} fill={Math.min(100, revenueToday / 5)} accent />
            <KpiCard label="Ordini · oggi" value={ordersToday} sub={`${list.length} totali`} fill={Math.min(100, ordersToday * 8)} />
            <KpiCard label="Da pagare" value={unpaid} sub="in sospeso" fill={list.length ? (unpaid / list.length) * 100 : 0} />
            <KpiCard label="Da consegnare" value={undelivered} sub="in preparazione" fill={list.length ? (undelivered / list.length) * 100 : 0} />
          </div>

          <div className="admin-dashboard__panels">
            <div className="admin-dashboard__panel">
              <div className="admin-dashboard__panel-head">
                <div>
                  <div className="eyebrow admin-dashboard__panel-eyebrow">Ricavi · ultimi 14 giorni</div>
                  <div className="display admin-dashboard__panel-value">{fmt(revenue14)}</div>
                </div>
              </div>
              <RevenueChart series={series} />
            </div>

            <div className="admin-dashboard__panel">
              <div className="eyebrow admin-dashboard__top-eyebrow">Top prodotti</div>
              {topProducts.length === 0 ? (
                <div className="mono admin-dashboard__top-empty">Nessun dato ancora.</div>
              ) : (
                topProducts.map((p, i) => (
                  <div key={p.name} className="admin-dashboard__product">
                    <div className="admin-dashboard__product-meta">
                      <span className="admin-dashboard__product-name">{i + 1}. {p.name}</span>
                      <span className="admin-dashboard__product-count">{p.count}</span>
                    </div>
                    <div className="admin-dashboard__product-track">
                      <div className={`admin-dashboard__product-bar${i === 0 ? " admin-dashboard__product-bar--lead" : ""}`} style={{ width: p.w * 100 + "%" }} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="admin-dashboard__orders">
            <div className="admin-dashboard__orders-head">
              <span className="display admin-dashboard__orders-title">Ordini recenti</span>
              <Link to="/admin/orderlist" className="b-btn sm ghost">
                Tutti gli ordini <Icon.arrow className="arrow" />
              </Link>
            </div>

            {latest.length === 0 ? (
              <AdminEmptyState icon="◷" title="Nessun ordine" body="Gli ordini dei clienti compariranno qui." />
            ) : (
              <div className="admin-dashboard__table-wrap">
                <table className="admin-dashboard__table admin-table">
                  <thead>
                    <tr className="admin-dashboard__table-head">
                      <th>Ordine</th>
                      <th>Cliente</th>
                      <th>Data</th>
                      <th>Stato</th>
                      <th className="is-right">Totale</th>
                      <th className="is-w90"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {latest.map((o) => (
                      <tr key={o._id} className="admin-dashboard__row">
                        <td className="is-mono is-gold is-sm">{o._id.slice(-8).toUpperCase()}</td>
                        <td>{o.user && o.user.name}</td>
                        <td className="is-dim is-mono is-sm">{o.createdAt ? o.createdAt.substring(0, 10) : "—"}</td>
                        <td>
                          <div className="admin-dashboard__pills">
                            {o.isPaid ? <AdminStatusPill label="Pagato" color="var(--ok)" soft /> : <AdminStatusPill label="Da pagare" color="var(--accent)" soft />}
                            {o.isDelivered ? <AdminStatusPill label="Consegnato" color="var(--ok)" soft /> : <AdminStatusPill label="In attesa" color="var(--gold)" soft />}
                          </div>
                        </td>
                        <td className="is-right is-mono">{fmt(o.totalPrice)}</td>
                        <td className="is-right">
                          <Link to={`/admin/orders/${o._id}`} className="b-btn sm ghost admin-dashboard__detail-btn">
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
