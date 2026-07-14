import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Icon from "../brace/ui/Icon";
import Field from "../brace/ui/Field";
import Loader from "../brace/ui/Loader";
import Message from "../brace/ui/Message";
import SocialAuth from "../brace/ui/SocialAuth";
import Meta from "../components/Meta";
import { register } from "../store/actions/user";
import "./RegisterScreen.scss";

const RegisterScreen = ({ location, history }) => {
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
      setMessage("Le password non coincidono");
    } else {
      setMessage(null);
      dispatch(register(name, email, password));
    }
  };

  return (
    <main className="register">
      <Meta title="Registrati · Grani Antichi" />
      <div className="b-container">
        <div className="register__inner">
          <div className="eyebrow register__eyebrow">
            Nuovo account
          </div>
          <h1 className="display register__title">
            Unisciti
            <br />
            <span className="it register__title-it">
              a noi.
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
                label="Nome e cognome"
                value={name}
                onChange={setName}
                autoComplete="name"
                required
              />
              <Field
                label="Email"
                value={email}
                onChange={setEmail}
                type="email"
                autoComplete="email"
                required
              />
              <Field
                label="Password"
                value={password}
                onChange={setPassword}
                type="password"
                autoComplete="new-password"
                required
              />
              <Field
                label="Conferma password"
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
              Crea account <Icon.arrow className="arrow" />
            </button>
          </form>

          <SocialAuth />

          <div className="register__footer">
            Hai già un account?{" "}
            <Link
              to={redirect ? `/login?redirect=${redirect}` : "/login"}
              className="register__footer-link"
            >
              Accedi
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
};

export default RegisterScreen;
