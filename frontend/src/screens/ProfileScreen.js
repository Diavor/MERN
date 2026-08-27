import "./ProfileScreen.scss";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
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
    className={`mono profile__tab${active ? " profile__tab--active" : ""}`}
  >
    {children}
  </button>
);

const Pill = ({ ok, okLabel, offLabel }) => (
  <span className={`mono profile__pill${ok ? " profile__pill--active" : ""}`}>
    {ok ? okLabel : offLabel}
  </span>
);

const ProfileScreen = ({ history }) => {
  const { t, i18n } = useTranslation();
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
      setMessage(t("auth.passwordMismatch"));
    } else {
      setMessage(null);
      dispatch(updateUserProfile({ id: user._id, name, email, password }));
    }
  };

  return (
    <main className="profile">
      <Meta title={t("profile.metaTitle")} />
      <div className="b-container">
        {/* header */}
        <div className="profile__header">
          <div>
            <div className="eyebrow profile__eyebrow">
              {t("profile.myAccount")}
            </div>
            <h1 className="display profile__title">
              {t("profile.hi")}
              <br />
              <span className="it profile__name">
                {(userInfo?.name || "").split(" ")[0] || t("profile.friend")}.
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
            {t("nav.logout")}
          </button>
        </div>

        {/* tabs */}
        <div className="profile__tabs">
          <Tab active={tab === "orders"} onClick={() => setTab("orders")}>
            {t("profile.orders")}
          </Tab>
          <Tab active={tab === "profile"} onClick={() => setTab("profile")}>
            {t("profile.profile")}
          </Tab>
          {userInfo?.isAdmin && (
            <Link to="/admin/orderlist" className="profile__admin-link">
              <Tab active={false} onClick={() => {}}>
                {t("profile.admin")} ↗
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
              <div className="profile__empty">
                <div className="display profile__empty-title">
                  {t("profile.noOrders")}
                </div>
                <p className="profile__empty-text">{t("profile.noOrdersText")}</p>
                <Link to="/menu" className="b-btn ember">
                  {t("cart.viewMenu")} <Icon.arrow className="arrow" />
                </Link>
              </div>
            ) : (
              <div className="profile__orders">
                {orders.map((order) => (
                  <Link
                    key={order._id}
                    to={`/order/${order._id}`}
                    className="profile__order"
                  >
                    <div>
                      <div className="mono profile__order-id">
                        #{order._id.slice(-8).toUpperCase()}
                      </div>
                      <div className="mono profile__order-date">
                        {order.createdAt
                          ? new Date(order.createdAt).toLocaleDateString(
                              i18n.resolvedLanguage === "en" ? "en-GB" : "it-IT",
                              { day: "numeric", month: "long", year: "numeric" }
                            )
                          : "—"}
                      </div>
                    </div>
                    <div className="profile__order-status">
                      <Pill
                        ok={order.isPaid}
                        okLabel={t("profile.paid")}
                        offLabel={t("profile.unpaid")}
                      />
                      <Pill
                        ok={order.isDelivered}
                        okLabel={t("profile.delivered")}
                        offLabel={t("profile.pending")}
                      />
                    </div>
                    <div className="display profile__order-total">
                      {fmt(order.totalPrice)}
                    </div>
                    <Icon.arrow className="profile__order-arrow" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "profile" && (
          <div className="profile__form-wrap">
            {message && (
              <div className="profile__alert">
                <Message variant="danger">{message}</Message>
              </div>
            )}
            {error && (
              <div className="profile__alert">
                <Message variant="danger">{error}</Message>
              </div>
            )}
            {success && (
              <div className="profile__alert">
                <Message variant="success">{t("profile.updated")}</Message>
              </div>
            )}
            {loading && (
              <div className="profile__alert">
                <Loader />
              </div>
            )}

            <form onSubmit={submitHandler}>
              <div className="profile__fields">
                <Field label={t("auth.fullName")} value={name} onChange={setName} />
                <Field label={t("auth.email")} value={email} onChange={setEmail} type="email" />
                <Field
                  label={t("profile.newPassword")}
                  value={password}
                  onChange={setPassword}
                  type="password"
                  autoComplete="new-password"
                />
                <Field
                  label={t("auth.confirmPassword")}
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  type="password"
                  autoComplete="new-password"
                />
              </div>
              <button
                type="submit"
                className="b-btn ember profile__submit"
              >
                {t("profile.update")} <Icon.arrow className="arrow" />
              </button>
            </form>
          </div>
        )}
      </div>
    </main>
  );
};

export default ProfileScreen;
