// Grani Antichi — shared admin primitives, ported from design/admin-shared.jsx.
// MediaLibrary and autosave logic intentionally dropped. Real ES module exports,
// wired to brace.css tokens + the shared Icon set.

import React, { useState, useEffect } from "react";
import Icon from "../ui/Icon";
import Portal from "../ui/Portal";
import "./kit.scss";

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
    <Portal>
      <div className="akit-modal">
        <div onClick={attemptClose} className="akit-modal__scrim" />
        <div className="b-rise akit-modal__panel" style={{ maxWidth: width }}>
          <div className="akit-modal__header">
            <div>
              {subtitle && <div className="eyebrow akit-modal__subtitle">{subtitle}</div>}
              <div className="display akit-modal__title">{title}</div>
            </div>
            <button onClick={attemptClose} className="akit-modal__close">
              <Icon.close />
            </button>
          </div>

          <div className="akit-modal__body">{children}</div>

          {footer && <div className="akit-modal__footer">{footer}</div>}
        </div>
      </div>
    </Portal>
  );
}

// ---------------- FORM FIELDS ----------------
export function AdminFieldText({ label, value, onChange, placeholder, error, type = "text", hint, span, prefix, mono }) {
  const [focus, setFocus] = useState(false);
  return (
    <label className="akit-field" style={{ gridColumn: span ? "span " + span : "auto" }}>
      <div className={"akit-field__label" + (focus ? " is-focus" : "") + (error ? " is-error" : "")}>
        <span>{label}</span>
        {hint && <span className="akit-field__hint akit-field__hint--spaced">{hint}</span>}
      </div>
      <div className={"akit-field__box akit-field__box--inline" + (focus ? " is-focus" : "") + (error ? " is-error" : "")}>
        {prefix && <span className="mono akit-field__prefix">{prefix}</span>}
        <input
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          className={"akit-field__input" + (mono ? " is-mono" : "")}
        />
      </div>
      {error && (
        <div className="mono akit-field__error akit-field__error--spaced">
          ↳ {error}
        </div>
      )}
    </label>
  );
}

export function AdminFieldArea({ label, value, onChange, placeholder, error, rows = 3, span, hint }) {
  const [focus, setFocus] = useState(false);
  return (
    <label className="akit-field" style={{ gridColumn: span ? "span " + span : "auto" }}>
      <div className={"akit-field__label" + (focus ? " is-focus" : "") + (error ? " is-error" : "")}>
        <span>{label}</span>
        {hint && <span className="akit-field__hint">{hint}</span>}
      </div>
      <div className={"akit-field__box akit-field__box--block" + (focus ? " is-focus" : "") + (error ? " is-error" : "")}>
        <textarea
          value={value}
          placeholder={placeholder}
          rows={rows}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          className="akit-field__area"
        />
      </div>
      {error && <div className="mono akit-field__error">↳ {error}</div>}
    </label>
  );
}

export function AdminFieldSelect({ label, value, options, onChange, error, span, hint }) {
  return (
    <label className="akit-field" style={{ gridColumn: span ? "span " + span : "auto" }}>
      <div className={"akit-field__label" + (error ? " is-error" : "")}>
        <span>{label}</span>
        {hint && <span className="akit-field__hint">{hint}</span>}
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={"akit-field__select" + (error ? " is-error" : "")}
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
export const AdminFieldToggle = AdminToggle;

// ---------------- VALIDATION ----------------
// Collect all errors up front (required + numeric + slug pattern), so the caller
// can block submit and render per-field inline errors + an aggregate banner.
export function validateRequired(specs, form) {
  const errors = {};
  specs.forEach(({ key, label, required, type, pattern }) => {
    const raw = form[key];
    const empty = raw === undefined || raw === null || String(raw).trim() === "";
    if (required && empty) {
      errors[key] = `${label} obbligatorio`;
      return;
    }
    if (!empty && type === "number" && isNaN(Number(raw))) {
      errors[key] = `${label} deve essere un numero`;
    }
    if (!empty && pattern && !pattern.test(String(raw))) {
      errors[key] = `${label} non valido`;
    }
  });
  return { errors, ok: Object.keys(errors).length === 0 };
}

export function AdminToggle({ label, value, onChange, hint }) {
  return (
    <div className="akit-toggle">
      <div>
        <div className="akit-toggle__text">{label}</div>
        {hint && <div className="mono akit-toggle__hint">{hint}</div>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={"akit-toggle__switch" + (value ? " is-on" : "")}
      >
        <span className="akit-toggle__knob" />
      </button>
    </div>
  );
}

export function AdminSegmented({ value, options, onChange, size = "md" }) {
  return (
    <div className="akit-segmented">
      {options.map((o) => {
        const v = typeof o === "object" ? o.value : o;
        const l = typeof o === "object" ? o.label : o;
        const active = v === value;
        return (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            className={"akit-segmented__btn" + (size === "sm" ? " is-sm" : "") + (active ? " is-active" : "")}
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
  // For soft pills the SCSS sets an rgba() fallback BEFORE the color-mix line so
  // engines without color-mix support still render a visible chip. The chip tint
  // comes from the `color` prop, passed through as the --pill-color custom prop.
  return (
    <span className={"akit-pill " + (soft ? "is-soft" : "is-solid")} style={{ "--pill-color": color }}>
      <span className="akit-pill__dot" />
      {label}
    </span>
  );
}

// ---------------- SKELETON ----------------
function SkelBar({ w, flex }) {
  return (
    <div
      className={"akit-skel__bar" + (flex ? " is-flex" : "")}
      style={{ width: flex ? "auto" : w }}
    />
  );
}

export function AdminSkeleton({ rows = 5 }) {
  return (
    <div className="akit-skel">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="akit-skel__row">
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
    <div className="akit-empty">
      <div className="akit-empty__icon">{icon}</div>
      <div className="display akit-empty__title">{title}</div>
      {body && <p className="akit-empty__body">{body}</p>}
      {action && <div className="akit-empty__action">{action}</div>}
    </div>
  );
}

// Shared admin table cell styling now lives in kit.scss as the `.admin-table`
// class + `.is-*` cell modifiers (formerly the adminTh / adminTd style objects).
