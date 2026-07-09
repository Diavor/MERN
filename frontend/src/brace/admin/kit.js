// BRÀCE — shared admin primitives, ported from design/admin-shared.jsx.
// MediaLibrary and autosave logic intentionally dropped. Real ES module exports,
// wired to brace.css tokens + the shared Icon set.

import React, { useState, useEffect } from "react";
import Icon from "../ui/Icon";

// ---------------- MODAL ----------------
// Single overlay + panel used for create/edit flows.
export function AdminModal({ open, onClose, title, subtitle, width = 760, footer, children, dirty }) {
  const attemptClose = () => {
    if (dirty && !window.confirm("Ci sono modifiche non salvate. Chiudere comunque?")) return;
    onClose();
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") attemptClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, dirty]);

  if (!open) return null;
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 500,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "60px 24px",
        overflowY: "auto",
      }}
    >
      <div
        onClick={attemptClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "var(--scrim-overlay)",
          backdropFilter: "blur(4px)",
          animation: "fade .2s ease both",
        }}
      />
      <div
        className="b-rise"
        style={{
          position: "relative",
          width: "100%",
          maxWidth: width,
          background: "var(--bg-2)",
          border: "1px solid var(--line-2)",
          boxShadow: "0 30px 80px rgba(40,28,10,0.35)",
          display: "flex",
          flexDirection: "column",
          maxHeight: "calc(100vh - 120px)",
        }}
      >
        <div
          style={{
            padding: "24px 28px",
            borderBottom: "1px solid var(--line)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            position: "sticky",
            top: 0,
            background: "var(--bg-2)",
            zIndex: 2,
          }}
        >
          <div>
            {subtitle && <div className="eyebrow" style={{ marginBottom: 8 }}>{subtitle}</div>}
            <div className="display" style={{ fontSize: 30, lineHeight: 1 }}>{title}</div>
          </div>
          <button
            onClick={attemptClose}
            style={{
              background: "none",
              border: "1px solid var(--line-2)",
              color: "var(--text)",
              width: 38,
              height: 38,
              borderRadius: 999,
              cursor: "pointer",
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
            }}
          >
            <Icon.close />
          </button>
        </div>

        <div style={{ padding: 28, overflowY: "auto", flex: 1 }}>{children}</div>

        {footer && (
          <div
            style={{
              padding: "18px 28px",
              borderTop: "1px solid var(--line)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 16,
              position: "sticky",
              bottom: 0,
              background: "var(--bg-2)",
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------- FORM FIELDS ----------------
const shLabel = (error, focus) => ({
  fontFamily: "var(--mono)",
  fontSize: 10,
  color: error ? "var(--accent)" : focus ? "var(--gold)" : "var(--text-faint)",
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  marginBottom: 8,
  transition: "color .15s ease",
  display: "flex",
  justifyContent: "space-between",
  gap: 10,
});
const shBox = (error, focus) => ({
  background: "var(--bg)",
  border: "1px solid " + (error ? "var(--accent)" : focus ? "var(--gold-deep)" : "var(--line)"),
  display: "flex",
  alignItems: "center",
  gap: 10,
  transition: "border-color .15s ease",
});

export function AdminFieldText({ label, value, onChange, placeholder, error, type = "text", hint, span, prefix, mono }) {
  const [focus, setFocus] = useState(false);
  return (
    <label style={{ gridColumn: span ? "span " + span : "auto", display: "block" }}>
      <div style={shLabel(error, focus)}>
        <span>{label}</span>
        {hint && <span style={{ color: "var(--text-faint)", letterSpacing: "0.08em" }}>{hint}</span>}
      </div>
      <div style={{ ...shBox(error, focus), padding: "0 14px" }}>
        {prefix && <span className="mono" style={{ color: "var(--text-faint)", fontSize: 13 }}>{prefix}</span>}
        <input
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          style={{
            width: "100%",
            padding: "13px 0",
            background: "none",
            border: "none",
            outline: "none",
            color: "var(--text)",
            fontFamily: mono ? "var(--mono)" : "var(--sans)",
            fontSize: 14,
          }}
        />
      </div>
      {error && (
        <div className="mono" style={{ fontSize: 10, color: "var(--accent)", marginTop: 6, letterSpacing: "0.06em" }}>
          ↳ {error}
        </div>
      )}
    </label>
  );
}

export function AdminFieldArea({ label, value, onChange, placeholder, error, rows = 3, span, hint }) {
  const [focus, setFocus] = useState(false);
  return (
    <label style={{ gridColumn: span ? "span " + span : "auto", display: "block" }}>
      <div style={shLabel(error, focus)}>
        <span>{label}</span>
        {hint && <span style={{ color: "var(--text-faint)" }}>{hint}</span>}
      </div>
      <div style={{ ...shBox(error, focus), padding: 12 }}>
        <textarea
          value={value}
          placeholder={placeholder}
          rows={rows}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          style={{
            width: "100%",
            background: "none",
            border: "none",
            outline: "none",
            resize: "vertical",
            color: "var(--text)",
            fontFamily: "var(--sans)",
            fontSize: 14,
            lineHeight: 1.5,
          }}
        />
      </div>
      {error && <div className="mono" style={{ fontSize: 10, color: "var(--accent)", marginTop: 6 }}>↳ {error}</div>}
    </label>
  );
}

export function AdminFieldSelect({ label, value, options, onChange, error, span, hint }) {
  return (
    <label style={{ gridColumn: span ? "span " + span : "auto", display: "block" }}>
      <div style={shLabel(error, false)}>
        <span>{label}</span>
        {hint && <span style={{ color: "var(--text-faint)" }}>{hint}</span>}
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          padding: "13px 14px",
          background: "var(--bg)",
          border: "1px solid " + (error ? "var(--accent)" : "var(--line)"),
          color: "var(--text)",
          fontFamily: "var(--mono)",
          fontSize: 13,
          appearance: "none",
          cursor: "pointer",
          backgroundImage:
            "linear-gradient(45deg, transparent 50%, var(--gold) 50%), linear-gradient(135deg, var(--gold) 50%, transparent 50%)",
          backgroundPosition: "calc(100% - 22px) 50%, calc(100% - 16px) 50%",
          backgroundSize: "6px 6px",
          backgroundRepeat: "no-repeat",
          paddingRight: 44,
        }}
      >
        {options.map((o) => {
          const v = typeof o === "object" ? o.value : o;
          const l = typeof o === "object" ? o.label : o;
          return (
            <option key={v} value={v}>
              {l}
            </option>
          );
        })}
      </select>
    </label>
  );
}
// Alias kept for the name referenced in the brief.
export const AdminSelect = AdminFieldSelect;

export function AdminToggle({ label, value, onChange, hint }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "14px 16px",
        background: "var(--bg)",
        border: "1px solid var(--line)",
      }}
    >
      <div>
        <div style={{ fontSize: 14, color: "var(--text)" }}>{label}</div>
        {hint && (
          <div className="mono" style={{ fontSize: 10, color: "var(--text-faint)", marginTop: 4, letterSpacing: "0.08em" }}>
            {hint}
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={() => onChange(!value)}
        style={{
          width: 44,
          height: 24,
          borderRadius: 999,
          border: "none",
          cursor: "pointer",
          position: "relative",
          background: value ? "var(--accent)" : "var(--line-2)",
          transition: "background .2s ease",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 3,
            left: value ? 23 : 3,
            width: 18,
            height: 18,
            borderRadius: 999,
            background: "var(--cream)",
            transition: "left .2s ease",
          }}
        />
      </button>
    </div>
  );
}

export function AdminSegmented({ value, options, onChange, size = "md" }) {
  return (
    <div style={{ display: "inline-flex", background: "var(--bg)", border: "1px solid var(--line)", padding: 3, borderRadius: 4 }}>
      {options.map((o) => {
        const v = typeof o === "object" ? o.value : o;
        const l = typeof o === "object" ? o.label : o;
        const active = v === value;
        return (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            style={{
              padding: size === "sm" ? "6px 12px" : "9px 16px",
              border: "none",
              cursor: "pointer",
              background: active ? "var(--text)" : "transparent",
              color: active ? "var(--bg)" : "var(--text-dim)",
              fontFamily: "var(--mono)",
              fontSize: 10,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              transition: "all .15s ease",
              borderRadius: 2,
            }}
          >
            {l}
          </button>
        );
      })}
    </div>
  );
}

// ---------------- STATUS PILL ----------------
export function AdminStatusPill({ label, color = "var(--gold)", soft }) {
  // For soft pills we set an rgba() fallback BEFORE the color-mix line so engines
  // without color-mix support still render a visible chip. React applies the keys
  // in insertion order: backgroundColor (fallback) first, then the background
  // shorthand — a valid color-mix overrides it, an unsupported one is dropped.
  const style = {
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    padding: "5px 11px",
    borderRadius: 999,
    ...(soft
      ? {
          backgroundColor: "rgba(110, 73, 32, 0.12)",
          background: "color-mix(in srgb, " + color + " 14%, transparent)",
          border: "none",
        }
      : { background: "transparent", border: "1px solid " + color }),
    color,
    fontFamily: "var(--mono)",
    fontSize: 10,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
  };
  return (
    <span style={style}>
      <span style={{ width: 5, height: 5, borderRadius: 999, background: color }} />
      {label}
    </span>
  );
}

// ---------------- SKELETON ----------------
function SkelBar({ w, flex }) {
  return (
    <div
      style={{
        height: 12,
        width: flex ? "auto" : w,
        flex: flex ? 1 : "none",
        borderRadius: 3,
        background: "linear-gradient(90deg, var(--bg-3) 0%, var(--line) 50%, var(--bg-3) 100%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.4s ease infinite",
      }}
    />
  );
}

export function AdminSkeleton({ rows = 5 }) {
  return (
    <div style={{ background: "var(--bg-2)", border: "1px solid var(--line)" }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            gap: 24,
            padding: "20px 24px",
            borderTop: i ? "1px solid var(--line)" : "none",
            alignItems: "center",
          }}
        >
          <SkelBar w={120} />
          <SkelBar w={200} flex />
          <SkelBar w={80} />
          <SkelBar w={60} />
        </div>
      ))}
    </div>
  );
}

// ---------------- EMPTY STATE ----------------
export function AdminEmptyState({ icon = "○", title, body, action }) {
  return (
    <div
      style={{
        padding: "80px 40px",
        textAlign: "center",
        background: "var(--bg-2)",
        border: "1px dashed var(--line-2)",
      }}
    >
      <div style={{ fontSize: 40, color: "var(--text-faint)", lineHeight: 1 }}>{icon}</div>
      <div className="display" style={{ fontSize: 30, marginTop: 18 }}>{title}</div>
      {body && <p style={{ color: "var(--text-dim)", maxWidth: 420, margin: "12px auto 0" }}>{body}</p>}
      {action && <div style={{ marginTop: 24 }}>{action}</div>}
    </div>
  );
}

// ---------------- SHARED TABLE STYLES ----------------
export const adminTh = { padding: "16px 24px", fontWeight: 400 };
export const adminTd = { padding: "18px 24px", fontSize: 14, verticalAlign: "middle" };
