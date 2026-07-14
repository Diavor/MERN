import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Icon from "../brace/ui/Icon";
import Field from "../brace/ui/Field";
import Loader from "../brace/ui/Loader";
import Message from "../brace/ui/Message";
import SocialAuth from "../brace/ui/SocialAuth";
import Meta from "../components/Meta";
import { login } from "../store/actions/user";
import "./LoginScreen.scss";

const LoginScreen = ({ location, history }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const dispatch = useDispatch();
  const { loading, error, userInfo } = useSelector((state) => state.userLogin);

  const redirect = location.search ? location.search.split("=")[1] : "/";

  useEffect(() => {
    if (userInfo) history.push(redirect);
  }, [history, userInfo, redirect]);

  const submitHandler = (e) => {
    e.preventDefault();
    dispatch(login(email, password));
  };

  return (
    <main className="login">
      <Meta title="Accedi · Grani Antichi" />
      <div className="b-container">
        <div className="login__inner">
          <div className="eyebrow login__eyebrow">
            Il tuo account
          </div>
          <h1 className="display login__title">
            Bentornato.
          </h1>

          {error && (
            <div className="login__alert">
              <Message variant="danger">{error}</Message>
            </div>
          )}
          {loading && (
            <div className="login__alert">
              <Loader />
            </div>
          )}

          <form onSubmit={submitHandler}>
            <div className="login__fields">
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
                autoComplete="current-password"
                required
              />
            </div>

            <button
              type="submit"
              className="b-btn ember login__submit"
              disabled={loading}
            >
              Accedi <Icon.arrow className="arrow" />
            </button>
          </form>

          <SocialAuth />

          <div className="login__footer">
            Non hai un account?{" "}
            <Link
              to={redirect ? `/register?redirect=${redirect}` : "/register"}
              className="login__register"
            >
              Registrati
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
};

export default LoginScreen;
