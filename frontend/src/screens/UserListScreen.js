import "./UserListScreen.scss";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Message from "../brace/ui/Message";
import Loader from "../brace/ui/Loader";
import Icon from "../brace/ui/Icon";
import { AdminStatusPill, AdminEmptyState } from "../brace/admin/kit";
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
    <div className="b-rise user-list">
      {loading ? (
        <Loader />
      ) : error ? (
        <Message variant="danger">{error}</Message>
      ) : !users || users.length === 0 ? (
        <AdminEmptyState icon="◉" title="Nessun utente" body="Gli account registrati compariranno qui." />
      ) : (
        <div className="user-list__panel">
          <table className="user-list__table admin-table">
            <thead>
              <tr className="user-list__head-row">
                <th>Cliente</th>
                <th>Email</th>
                <th>Ruolo</th>
                <th className="user-list__th--action"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id} className="user-list__row">
                  <td className="is-lead">
                    <div className="user-list__cust">
                      <div className="user-list__avatar">
                        {(user.name || "?").charAt(0).toUpperCase()}
                      </div>
                      <span>{user.name}</span>
                    </div>
                  </td>
                  <td data-label="Email" className="user-list__td--email is-sm">
                    <a href={`mailto:${user.email}`} className="user-list__email">
                      {user.email}
                    </a>
                  </td>
                  <td data-label="Ruolo">
                    {user.isAdmin ? (
                      <AdminStatusPill label="Admin" color="var(--gold)" soft />
                    ) : (
                      <AdminStatusPill label="Cliente" color="var(--text-dim)" soft />
                    )}
                  </td>
                  <td className="user-list__td--actions">
                    <div className="user-list__actions">
                      <Link
                        to={`/admin/user/${user._id}/edit`}
                        className="b-btn sm ghost user-list__btn"
                      >
                        Modifica
                      </Link>
                      <button
                        onClick={() => deleteHandler(user._id)}
                        className="b-btn sm ghost user-list__btn user-list__btn--del"
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
