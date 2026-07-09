import React, { createContext, useCallback, useContext, useState } from "react";

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
      <div
        style={{
          position: "fixed",
          bottom: 28,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          flexDirection: "column",
          gap: 8,
          zIndex: 10000,
          pointerEvents: "none",
        }}
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className="b-rise"
            style={{
              background: t.kind === "ok" ? "rgba(20,30,18,0.95)" : "rgba(20,18,16,0.95)",
              border: "1px solid " + (t.kind === "ok" ? "#3d5a32" : "var(--line-2)"),
              color: t.kind === "ok" ? "#c9e2ba" : "var(--cream)",
              padding: "12px 18px",
              borderRadius: 999,
              fontSize: 13,
              backdropFilter: "blur(20px)",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: 999,
                background: t.kind === "ok" ? "var(--ok)" : "var(--gold)",
              }}
            />
            {t.msg}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
