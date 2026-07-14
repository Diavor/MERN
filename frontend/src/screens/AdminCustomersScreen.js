import "./AdminCustomersScreen.scss";
import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import Loader from "../brace/ui/Loader";
import Message from "../brace/ui/Message";
import fmt from "../brace/ui/fmt";
import { AdminEmptyState } from "../brace/admin/kit";
import { listUsers } from "../store/actions/user";
import { listOrders } from "../store/actions/order";

// Loyalty tier derived from lifetime spend (matches the tier names in the design).
const tierFor = (spend) => (spend >= 1000 ? "Maestra" : spend >= 500 ? "Antica" : "Tavola");
const tierMod = { Maestra: "maestra", Antica: "antica", Tavola: "tavola" };

const AdminCustomersScreen = ({ history }) => {
  const dispatch = useDispatch();
  const { users, loading, error } = useSelector((s) => s.userList);
  const { orders } = useSelector((s) => s.orderList);
  const { userInfo } = useSelector((s) => s.userLogin);

  useEffect(() => {
    if (userInfo && userInfo.isAdmin) {
      dispatch(listUsers());
      dispatch(listOrders());
    } else {
      history.push("/login");
    }
  }, [dispatch, history, userInfo]);

  // Aggregate order count + lifetime spend + last order date per user id.
  const stats = useMemo(() => {
    const map = {};
    (orders || []).forEach((o) => {
      const uid = o.user && (o.user._id || o.user);
      if (!uid) return;
      if (!map[uid]) map[uid] = { orders: 0, spend: 0, last: null };
      map[uid].orders += 1;
      map[uid].spend += o.totalPrice || 0;
      const d = o.createdAt ? new Date(o.createdAt) : null;
      if (d && (!map[uid].last || d > map[uid].last)) map[uid].last = d;
    });
    return map;
  }, [orders]);

  const rows = (users || []).map((u) => {
    const s = stats[u._id] || { orders: 0, spend: 0, last: null };
    return { ...u, ...s, tier: tierFor(s.spend) };
  });

  return (
    <div className="b-rise admin-customers">
      {loading ? (
        <Loader />
      ) : error ? (
        <Message variant="danger">{error}</Message>
      ) : rows.length === 0 ? (
        <AdminEmptyState icon="◉" title="Nessun cliente" body="I clienti registrati compariranno qui." />
      ) : (
        <div className="admin-customers__panel">
          <table className="admin-customers__table admin-table">
            <thead>
              <tr className="admin-customers__head-row">
                <th>Cliente</th>
                <th>Email</th>
                <th>Tessera</th>
                <th>Ordini</th>
                <th>Speso</th>
                <th>Ultimo ordine</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c._id} className="admin-customers__row">
                  <td>
                    <div className="admin-customers__cust">
                      <div className="admin-customers__avatar">
                        {(c.name || "?").charAt(0).toUpperCase()}
                      </div>
                      <span>{c.name}</span>
                    </div>
                  </td>
                  <td className="admin-customers__td--email is-sm">{c.email}</td>
                  <td>
                    <span className={`admin-customers__tier admin-customers__tier--${tierMod[c.tier]}`}>
                      {c.tier}
                    </span>
                  </td>
                  <td className="admin-customers__td--num">{c.orders}</td>
                  <td className="admin-customers__td--spend">{fmt(c.spend)}</td>
                  <td className="admin-customers__td--last is-sm">
                    {c.last ? c.last.toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
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

export default AdminCustomersScreen;
