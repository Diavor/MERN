import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import Icon from "../brace/ui/Icon";
import Field from "../brace/ui/Field";
import Loader from "../brace/ui/Loader";
import Message from "../brace/ui/Message";
import SocialAuth from "../brace/ui/SocialAuth";
import Meta from "../components/Meta";
import { register } from "../store/actions/user";
import "./RegisterScreen.scss";

const RegisterScreen = ({ location, history }) => {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState(null);

  const dispatch = useDispatch();
  const { loading, error, userInfo } = useSelector(
    (state) => state.userRegister
  );

  const redirect = location.search ? location.search.split("=")[1] : "/";

  useEffect(() => {
    if (userInfo) history.push(redirect);
  }, [history, userInfo, redirect]);

  const submitHandler = (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setMessage(t("auth.passwordMismatch"));
    } else {
      setMessage(null);
      dispatch(register(name, email, password));
    }
  };

  return (
    <main className="register">
      <Meta title={t("auth.metaRegister")} />
      <div className="b-container">
        <div className="register__inner">
          <div className="eyebrow register__eyebrow">
            {t("auth.newAccount")}
          </div>
          <h1 className="display register__title">
            {t("auth.joinTitle")}
            <br />
            <span className="it register__title-it">
              {t("auth.joinAccent")}
            </span>
          </h1>

          {message && (
            <div className="register__alert">
              <Message variant="danger">{message}</Message>
            </div>
          )}
          {error && (
            <div className="register__alert">
              <Message variant="danger">{error}</Message>
            </div>
          )}
          {loading && (
            <div className="register__alert">
              <Loader />
            </div>
          )}

          <form onSubmit={submitHandler}>
            <div className="register__fields">
              <Field
                label={t("auth.fullName")}
                value={name}
                onChange={setName}
                autoComplete="name"
                required
              />
              <Field
                label={t("auth.email")}
                value={email}
                onChange={setEmail}
                type="email"
                autoComplete="email"
                required
              />
              <Field
                label={t("auth.password")}
                value={password}
                onChange={setPassword}
                type="password"
                autoComplete="new-password"
                required
              />
              <Field
                label={t("auth.confirmPassword")}
                value={confirmPassword}
                onChange={setConfirmPassword}
                type="password"
                autoComplete="new-password"
                required
              />
            </div>

            <button
              type="submit"
              className="b-btn ember register__submit"
              disabled={loading}
            >
              {t("auth.createAccount")} <Icon.arrow className="arrow" />
            </button>
          </form>

          <SocialAuth />

          <div className="register__footer">
            {t("auth.haveAccount")}{" "}
            <Link
              to={redirect ? `/login?redirect=${redirect}` : "/login"}
              className="register__footer-link"
            >
              {t("nav.login")}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
};

export default RegisterScreen;
