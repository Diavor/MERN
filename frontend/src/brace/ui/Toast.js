import React, { createContext, useCallback, useContext, useState } from "react";
import "./Toast.scss";

const ToastCtx = createContext(null);
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((msg, kind = "info") => {
    const id = Math.random().toString(36).slice(2, 8);
    setToasts((t) => [...t, { id, msg, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="toast">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={"b-rise toast__item" + (t.kind === "ok" ? " toast__item--ok" : "")}
          >
            <span className="toast__dot" />
            {t.msg}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
