import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Icon from "../brace/ui/Icon";
import fmt from "../brace/ui/fmt";
import Field from "../brace/ui/Field";
import Loader from "../brace/ui/Loader";
import Message from "../brace/ui/Message";
import Meta from "../components/Meta";
import { getUserDetails, updateUserProfile, logout } from "../store/actions/user";
import { listMyOrders } from "../store/actions/order";
import * as actionTypes from "../store/actionTypes";

const Tab = ({ active, onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    className="mono"
    style={{
      padding: "12px 20px",
      background: active ? "var(--text)" : "transparent",
      color: active ? "var(--bg)" : "var(--text-dim)",
      border: "1px solid " + (active ? "var(--text)" : "var(--line)"),
      borderRadius: 999,
      cursor: "pointer",
      fontSize: 11,
      letterSpacing: "0.14em",
      textTransform: "uppercase",
    }}
  >
    {children}
  </button>
);

const Pill = ({ ok, okLabel, offLabel }) => (
  <span
    className="mono"
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "5px 10px",
      fontSize: 10,
      letterSpacing: "0.1em",
      textTransform: "uppercase",
      background: ok ? "rgba(93,138,74,0.14)" : "var(--bg-2)",
      border: "1px solid " + (ok ? "var(--ok)" : "var(--line-2)"),
      color: ok ? "var(--ok)" : "var(--text-faint)",
    }}
  >
    {ok ? okLabel : offLabel}
  </span>
);

const ProfileScreen = ({ history }) => {
  const [tab, setTab] = useState("orders");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState(null);

  const dispatch = useDispatch();

  const { loading, error, user } = useSelector((state) => state.userDetails);
  const { userInfo } = useSelector((state) => state.userLogin);
  const { success } = useSelector((state) => state.userUpdateProfile);
  const {
    loading: loadingOrders,
    error: errorOrders,
    orders,
  } = useSelector((state) => state.orderListMy);

  useEffect(() => {
    if (!userInfo) {
      history.push("/login");
    } else if (!user || !user.name || success) {
      dispatch({ type: actionTypes.USER_UPDATE_RESET });
      dispatch(getUserDetails("profile"));
      dispatch(listMyOrders());
    } else {
      setName(user.name);
      setEmail(user.email);
    }
  }, [history, userInfo, user, dispatch, success]);

  const submitHandler = (e) => {
    e.preventDefault();
    if (password && password !== confirmPassword) {
      setMessage("Le password non coincidono");
    } else {
      setMessage(null);
      dispatch(updateUserProfile({ id: user._id, name, email, password }));
    }
  };

  return (
    <main style={{ paddingTop: 130, paddingBottom: 100, minHeight: "100vh" }}>
      <Meta title="Il mio account · BRÀCE" />
      <div className="b-container">
        {/* header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            flexWrap: "wrap",
            gap: 20,
            marginBottom: 40,
          }}
        >
          <div>
            <div className="eyebrow" style={{ marginBottom: 16 }}>
              Il mio account
            </div>
            <h1 className="display" style={{ fontSize: 72, lineHeight: 0.95, margin: 0 }}>
              Ciao,
              <br />
              <span className="it" style={{ color: "var(--gold)", fontWeight: 300 }}>
                {(userInfo?.name || "").split(" ")[0] || "amico"}.
              </span>
            </h1>
          </div>
          <button
            type="button"
            className="b-btn ghost"
            onClick={() => {
              dispatch(logout());
              history.push("/");
            }}
          >
            Esci
          </button>
        </div>

        {/* tabs */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 40 }}>
          <Tab active={tab === "orders"} onClick={() => setTab("orders")}>
            Ordini
          </Tab>
          <Tab active={tab === "profile"} onClick={() => setTab("profile")}>
            Profilo
          </Tab>
          {userInfo?.isAdmin && (
            <Link to="/admin/orderlist" style={{ textDecoration: "none" }}>
              <Tab active={false} onClick={() => {}}>
                Amministrazione ↗
              </Tab>
            </Link>
          )}
        </div>

        {tab === "orders" && (
          <div>
            {loadingOrders ? (
              <Loader />
            ) : errorOrders ? (
              <Message variant="danger">{errorOrders}</Message>
            ) : !orders || orders.length === 0 ? (
              <div
                style={{
                  padding: "80px 40px",
                  textAlign: "center",
                  border: "1px solid var(--line)",
                  background: "var(--bg-2)",
                }}
              >
                <div className="display" style={{ fontSize: 28, marginBottom: 12 }}>
                  Nessun ordine, ancora.
                </div>
                <p style={{ color: "var(--text-dim)", marginBottom: 24 }}>
                  Quando ordini una pizza, la ritrovi qui.
                </p>
                <Link to="/menu" className="b-btn ember">
                  Vedi il menu <Icon.arrow className="arrow" />
                </Link>
              </div>
            ) : (
              <div style={{ border: "1px solid var(--line)" }}>
                {orders.map((order, i) => (
                  <Link
                    key={order._id}
                    to={`/order/${order._id}`}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1.4fr 1fr auto auto",
                      gap: 16,
                      alignItems: "center",
                      padding: "18px 22px",
                      borderBottom:
                        i < orders.length - 1 ? "1px solid var(--line)" : "none",
                      background: "var(--bg-2)",
                      color: "var(--text)",
                      textDecoration: "none",
                    }}
                  >
                    <div>
                      <div
                        className="mono"
                        style={{
                          fontSize: 11,
                          color: "var(--gold)",
                          letterSpacing: "0.06em",
                        }}
                      >
                        #{order._id.slice(-8).toUpperCase()}
                      </div>
                      <div
                        className="mono"
                        style={{
                          fontSize: 11,
                          color: "var(--text-faint)",
                          marginTop: 4,
                        }}
                      >
                        {order.createdAt
                          ? new Date(order.createdAt).toLocaleDateString("it-IT", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })
                          : "—"}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <Pill ok={order.isPaid} okLabel="Pagato" offLabel="Da pagare" />
                      <Pill
                        ok={order.isDelivered}
                        okLabel="Consegnato"
                        offLabel="In attesa"
                      />
                    </div>
                    <div
                      className="display"
                      style={{ fontSize: 22, color: "var(--gold)" }}
                    >
                      {fmt(order.totalPrice)}
                    </div>
                    <Icon.arrow style={{ color: "var(--text-faint)" }} />
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "profile" && (
          <div style={{ maxWidth: 480 }}>
            {message && (
              <div style={{ marginBottom: 20 }}>
                <Message variant="danger">{message}</Message>
              </div>
            )}
            {error && (
              <div style={{ marginBottom: 20 }}>
                <Message variant="danger">{error}</Message>
              </div>
            )}
            {success && (
              <div style={{ marginBottom: 20 }}>
                <Message variant="success">Profilo aggiornato</Message>
              </div>
            )}
            {loading && (
              <div style={{ marginBottom: 20 }}>
                <Loader />
              </div>
            )}

            <form onSubmit={submitHandler}>
              <div style={{ display: "grid", gap: 16 }}>
                <Field label="Nome e cognome" value={name} onChange={setName} />
                <Field label="Email" value={email} onChange={setEmail} type="email" />
                <Field
                  label="Nuova password · lascia vuoto per non cambiarla"
                  value={password}
                  onChange={setPassword}
                  type="password"
                  autoComplete="new-password"
                />
                <Field
                  label="Conferma password"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  type="password"
                  autoComplete="new-password"
                />
              </div>
              <button
                type="submit"
                className="b-btn ember"
                style={{ marginTop: 28 }}
              >
                Aggiorna profilo <Icon.arrow className="arrow" />
              </button>
            </form>
          </div>
        )}
      </div>
    </main>
  );
};

export default ProfileScreen;
