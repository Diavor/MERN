import React, { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import axios from "../../api/axiosConfig";
import { googleLogin, appleLogin } from "../../store/actions/user";
import "./SocialAuth.scss";

// Load an external script once; resolves when ready. Idempotent across mounts.
const loadScript = (src) =>
  new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      if (existing.dataset.loaded) return resolve();
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", reject);
      return;
    }
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.defer = true;
    s.onload = () => {
      s.dataset.loaded = "true";
      resolve();
    };
    s.onerror = reject;
    document.head.appendChild(s);
  });

const GSI_SRC = "https://accounts.google.com/gsi/client";
const APPLE_SRC =
  "https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js";

// Social sign-in buttons. Each provider renders only when the backend reports a
// configured client id (GET /api/config/auth), so an unconfigured deployment
// shows nothing extra.
const SocialAuth = () => {
  const dispatch = useDispatch();
  const [config, setConfig] = useState(null);
  const googleBtnRef = useRef(null);

  useEffect(() => {
    let alive = true;
    axios
      .get("/api/config/auth")
      .then(({ data }) => alive && setConfig(data))
      .catch(() => alive && setConfig({ googleClientId: "", appleClientId: "" }));
    return () => {
      alive = false;
    };
  }, []);

  // Google Identity Services: render the official button, exchange the returned
  // id token for our own session.
  useEffect(() => {
    if (!config?.googleClientId || !googleBtnRef.current) return;
    let cancelled = false;
    loadScript(GSI_SRC)
      .then(() => {
        if (cancelled || !window.google || !googleBtnRef.current) return;
        window.google.accounts.id.initialize({
          client_id: config.googleClientId,
          callback: (resp) => resp?.credential && dispatch(googleLogin(resp.credential)),
        });
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: "outline",
          size: "large",
          type: "standard",
          text: "continue_with",
          shape: "pill",
          logo_alignment: "center",
          width: 320,
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [config, dispatch]);

  // Sign in with Apple: init the SDK; the button triggers the popup flow.
  useEffect(() => {
    if (!config?.appleClientId) return;
    loadScript(APPLE_SRC)
      .then(() => {
        if (!window.AppleID) return;
        window.AppleID.auth.init({
          clientId: config.appleClientId,
          scope: "name email",
          redirectURI: window.location.origin,
          usePopup: true,
        });
      })
      .catch(() => {});
  }, [config]);

  const signInApple = async () => {
    try {
      const data = await window.AppleID.auth.signIn();
      const idToken = data?.authorization?.id_token;
      // Apple returns the name only on the first authorization.
      const name = data?.user?.name
        ? `${data.user.name.firstName || ""} ${data.user.name.lastName || ""}`.trim()
        : undefined;
      if (idToken) dispatch(appleLogin(idToken, name));
    } catch {
      // User cancelled the popup — no-op.
    }
  };

  if (!config || (!config.googleClientId && !config.appleClientId)) return null;

  return (
    <div className="social-auth">
      <div className="social-auth__divider">
        <span>oppure</span>
      </div>

      <div className="social-auth__buttons">
        {config.googleClientId && (
          <div ref={googleBtnRef} className="social-auth__google" />
        )}

        {config.appleClientId && (
          <button type="button" className="social-auth__apple" onClick={signInApple}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M17.05 12.97c-.02-2.03 1.66-3 1.74-3.05-.95-1.39-2.43-1.58-2.96-1.6-1.26-.13-2.46.74-3.1.74-.64 0-1.62-.72-2.66-.7-1.37.02-2.63.8-3.34 2.02-1.42 2.47-.36 6.12 1.02 8.12.67.98 1.48 2.08 2.53 2.04 1.02-.04 1.4-.66 2.64-.66 1.23 0 1.58.66 2.66.64 1.1-.02 1.79-1 2.46-1.98.77-1.13 1.09-2.23 1.11-2.29-.02-.01-2.13-.82-2.15-3.25zM15.1 6.9c.56-.68.94-1.63.84-2.58-.81.03-1.79.54-2.37 1.22-.52.6-.98 1.56-.86 2.48.9.07 1.83-.46 2.39-1.12z" />
            </svg>
            Continua con Apple
          </button>
        )}
      </div>
    </div>
  );
};

export default SocialAuth;
