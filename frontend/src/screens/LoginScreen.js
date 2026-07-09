import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Icon from "../brace/ui/Icon";
import Field from "../brace/ui/Field";
import Loader from "../brace/ui/Loader";
import Message from "../brace/ui/Message";
import Meta from "../components/Meta";
import { login } from "../store/actions/user";

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
    <main style={{ paddingTop: 150, paddingBottom: 120, minHeight: "100vh" }}>
      <Meta title="Accedi · BRÀCE" />
      <div className="b-container">
        <div style={{ maxWidth: 460, margin: "0 auto" }}>
          <div className="eyebrow" style={{ marginBottom: 18 }}>
            Il tuo account
          </div>
          <h1
            className="display"
            style={{ fontSize: 64, lineHeight: 0.95, margin: "0 0 36px" }}
          >
            Bentornato.
          </h1>

          {error && (
            <div style={{ marginBottom: 20 }}>
              <Message variant="danger">{error}</Message>
            </div>
          )}
          {loading && (
            <div style={{ marginBottom: 20 }}>
              <Loader />
            </div>
          )}

          <form onSubmit={submitHandler}>
            <div style={{ display: "grid", gap: 16 }}>
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
              className="b-btn ember"
              disabled={loading}
              style={{ marginTop: 28, width: "100%", justifyContent: "center" }}
            >
              Accedi <Icon.arrow className="arrow" />
            </button>
          </form>

          <div
            style={{
              marginTop: 28,
              paddingTop: 24,
              borderTop: "1px solid var(--line)",
              fontSize: 14,
              color: "var(--text-dim)",
            }}
          >
            Non hai un account?{" "}
            <Link
              to={redirect ? `/register?redirect=${redirect}` : "/register"}
              style={{ color: "var(--gold)" }}
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
