import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Message from "../brace/ui/Message";
import Loader from "../brace/ui/Loader";
import Icon from "../brace/ui/Icon";
import { AdminStatusPill, adminTh, adminTd, AdminEmptyState } from "../brace/admin/kit";
import { listUsers, deleteUser } from "../store/actions/user";

const UserListScreen = ({ history }) => {
  const dispatch = useDispatch();
  const { users, loading, error } = useSelector((state) => state.userList);
  const { userInfo } = useSelector((state) => state.userLogin);
  const { success: successDelete } = useSelector((state) => state.userDelete);

  useEffect(() => {
    if (userInfo && userInfo.isAdmin) {
      dispatch(listUsers());
    } else {
      history.push("/login");
    }
  }, [dispatch, history, userInfo, successDelete]);

  const deleteHandler = (id) => {
    if (window.confirm("Eliminare questo utente?")) {
      dispatch(deleteUser(id));
    }
  };

  return (
    <div className="b-rise">
      {loading ? (
        <Loader />
      ) : error ? (
        <Message variant="danger">{error}</Message>
      ) : !users || users.length === 0 ? (
        <AdminEmptyState icon="◉" title="Nessun utente" body="Gli account registrati compariranno qui." />
      ) : (
        <div style={{ background: "var(--bg-2)", border: "1px solid var(--line)", overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 720 }}>
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
                <th style={adminTh}>Cliente</th>
                <th style={adminTh}>Email</th>
                <th style={adminTh}>Ruolo</th>
                <th style={{ ...adminTh, width: 120 }}></th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id} style={{ borderTop: "1px solid var(--line)" }}>
                  <td style={adminTd}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: 999,
                          background: "var(--bg-3)",
                          color: "var(--gold)",
                          display: "grid",
                          placeItems: "center",
                          fontFamily: "var(--serif)",
                          fontSize: 14,
                          flexShrink: 0,
                        }}
                      >
                        {(user.name || "?").charAt(0).toUpperCase()}
                      </div>
                      <span>{user.name}</span>
                    </div>
                  </td>
                  <td style={{ ...adminTd, fontFamily: "var(--mono)", fontSize: 12, color: "var(--text-dim)" }}>
                    <a href={`mailto:${user.email}`} style={{ color: "var(--text-dim)", textDecoration: "none" }}>
                      {user.email}
                    </a>
                  </td>
                  <td style={adminTd}>
                    {user.isAdmin ? (
                      <AdminStatusPill label="Admin" color="var(--gold)" soft />
                    ) : (
                      <AdminStatusPill label="Cliente" color="var(--text-dim)" soft />
                    )}
                  </td>
                  <td style={{ ...adminTd, textAlign: "right" }}>
                    <div style={{ display: "inline-flex", gap: 8 }}>
                      <Link
                        to={`/admin/user/${user._id}/edit`}
                        className="b-btn sm ghost"
                        style={{ padding: "6px 12px" }}
                      >
                        Modifica
                      </Link>
                      <button
                        onClick={() => deleteHandler(user._id)}
                        className="b-btn sm ghost"
                        style={{ padding: "6px 12px", color: "var(--accent)", borderColor: "var(--accent)" }}
                        aria-label="Elimina"
                      >
                        <Icon.close />
                      </button>
                    </div>
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

export default UserListScreen;
