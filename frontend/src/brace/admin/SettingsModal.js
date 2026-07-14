import React, { useEffect, useRef, useState } from "react";
import { AdminModal } from "./kit";

// Reusable building blocks for the Impostazioni edit modals. Every settings
// section (Restaurant, Hours, Payments, Notifications) shares the same lifecycle
// — preload current values, track dirtiness, validate, block double submits,
// show a saving state, keep values on failure, close only on success — so that
// lifecycle lives here once and each modal only declares its fields + validation.

/**
 * Form state + submit lifecycle for a single settings section.
 *
 * @param {object}  params
 * @param {object}  params.initial  Current section values, used to (re)seed the form on open.
 * @param {boolean} params.open     Whether the owning modal is open; the form reseeds on each open.
 * @returns {{
 *   form: object, set: (patch: object) => void, setForm: Function,
 *   dirty: boolean, errors: object, saving: boolean,
 *   submit: (opts: object) => Promise<void>
 * }}
 */
export function useSettingsForm({ initial, open }) {
  const [form, setForm] = useState(initial || {});
  const [dirty, setDirty] = useState(false);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Keep the freshest `initial` without making it an effect dependency (it is a
  // new object each render and would otherwise reseed the form mid-edit).
  const initialRef = useRef(initial);
  initialRef.current = initial;

  useEffect(() => {
    if (!open) return;
    setForm(initialRef.current || {});
    setErrors({});
    setDirty(false);
  }, [open]);

  const set = (patch) => {
    setForm((f) => ({ ...f, ...patch }));
    setDirty(true);
  };

  /**
   * Validate, then persist. Keeps the modal open and values intact on validation
   * failure; closes only after a successful save. Guards against double submits.
   *
   * @param {object}   opts
   * @param {Function} [opts.validate] (form) => errors object; truthy keys block the save.
   * @param {Function} [opts.build]    (form) => payload to send (defaults to the form itself).
   * @param {Function} opts.onSave     (payload) => Promise, performs the write.
   * @param {Function} opts.onClose    Called once the save resolves.
   * @param {Function} [opts.onError]  (error) => void, e.g. surface a toast.
   */
  const submit = async ({ validate, build, onSave, onClose, onError }) => {
    if (saving) return;
    const errs = validate ? validate(form) : {};
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSaving(true);
    try {
      await onSave(build ? build(form) : form);
      onClose();
    } catch (e) {
      if (onError) onError(e);
    } finally {
      setSaving(false);
    }
  };

  return { form, set, setForm, dirty, errors, saving, submit };
}

/**
 * Modal shell for a settings section: wraps AdminModal with the shared footer
 * (status line + Annulla / Salva) and standard save affordances. Callers pass
 * only the fields as children plus save wiring.
 */
export function SettingsModal({
  open,
  onClose,
  title,
  subtitle = "Impostazioni",
  width = 620,
  dirty,
  saving,
  errors = {},
  onSubmit,
  submitLabel = "Salva modifiche",
  children,
}) {
  const hasErrors = Object.keys(errors).length > 0;
  return (
    <AdminModal
      open={open}
      onClose={onClose}
      dirty={dirty}
      title={title}
      subtitle={subtitle}
      width={width}
      footer={
        <>
          <span className={"mono admin-settings__footer-status" + (hasErrors ? " is-error" : "")}>
            {hasErrors ? "⚠ Correggi i campi evidenziati" : "Tutte le modifiche sono pronte"}
          </span>
          <div className="admin-settings__footer-actions">
            <button className="b-btn sm ghost" onClick={onClose} disabled={saving}>
              Annulla
            </button>
            <button
              className={"b-btn sm ember" + (saving ? " is-saving" : "")}
              onClick={onSubmit}
              disabled={saving}
            >
              {saving ? "Salvataggio…" : submitLabel}
            </button>
          </div>
        </>
      }
    >
      {children}
    </AdminModal>
  );
}
