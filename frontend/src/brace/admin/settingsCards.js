import React from "react";
import {
  AdminFieldText,
  AdminFieldSelect,
  AdminFieldToggle,
  validateRequired,
} from "./kit";
import { SettingsModal, useSettingsForm } from "./SettingsModal";
import { useToast } from "../ui/Toast";

// Declarative registry of the Impostazioni cards. Each entry pairs a read-only
// row projection (shown on the card) with an edit modal for that section. The
// screen renders this list generically, so adding a new editable card is purely
// a new entry here — no changes to the screen or the modal system.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CASH_OPTIONS = [
  { value: "off", label: "Disattivato" },
  { value: "pickup", label: "Solo ritiro" },
  { value: "all", label: "Sempre attivo" },
];
const CASH_LABEL = Object.fromEntries(CASH_OPTIONS.map((o) => [o.value, o.label]));

// ---- Pure display projections (section object -> [label, value] rows) -------

/** @param {object} r restaurant section @returns {Array<[string,string]>} */
export const restaurantRows = (r) => [
  ["Nome attività", r.name],
  ["P.IVA", r.vat],
  ["Indirizzo", r.address],
  ["Telefono", r.phone],
  ["Email", r.email],
];

/** @param {string} open @param {string} close @returns {string} */
const formatRange = (open, close) => `${open} — ${close}`;

/** @param {Array<object>} hours @returns {Array<[string,string]>} */
export const hoursRows = (hours) =>
  hours.map((d) => [d.day, d.closed ? "Chiuso" : formatRange(d.open, d.close)]);

/** @param {object} p payments section @returns {Array<[string,string]>} */
export const paymentsRows = (p) => [
  ["Stripe", p.stripe ? "Connesso ●" : "Non connesso"],
  ["Apple Pay", p.apple ? "Attivo" : "—"],
  ["Google Pay", p.google ? "Attivo" : "—"],
  ["Contanti", CASH_LABEL[p.cash] || "—"],
];

/** @param {object} n notifications section @returns {Array<[string,string]>} */
export const notificationsRows = (n) => [
  ["Email nuovi ordini", n.emailNewOrders ? "On" : "Off"],
  ["SMS rider", n.smsRider ? "On" : "Off"],
  ["Push customer", n.pushCustomer ? "On" : "Off"],
  ["Riepilogo giornaliero", n.dailySummary],
];

// Printer ids are edited as a comma-separated list — they're short slugs
// ("fiscal", "bar") shared with the till's print-agent/printers.config.json,
// so a tag editor would be more machinery than the content warrants.
const idsToText = (ids) => (Array.isArray(ids) ? ids.join(", ") : "");
const textToIds = (text) =>
  String(text || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

/** @param {object} p printing section @returns {Array<[string,string]>} */
export const printingRows = (p = {}) => [
  ["Print agent", p.agentUrl || "— non configurato"],
  ["Stampanti ricevuta", idsToText(p.receiptPrinterIds) || "—"],
  ["Copia non fiscale", idsToText(p.nonFiscalPrinterIds) || "— disattivata"],
];

// ---- Section edit modals ----------------------------------------------------
// Each receives the current section (`value`), a `save(patch)` writer, and
// `onClose`. They reuse `useSettingsForm` for the whole submit lifecycle.

function RestaurantModal({ open, value, save, onClose }) {
  const toast = useToast();
  const { form, set, dirty, errors, saving, submit } = useSettingsForm({ initial: value, open });

  const onSubmit = () =>
    submit({
      validate: (f) => {
        const { errors: e } = validateRequired(
          [
            { key: "name", label: "Nome attività", required: true },
            { key: "email", label: "Email", required: true, pattern: EMAIL_RE },
            { key: "phone", label: "Telefono", required: true },
          ],
          f
        );
        return e;
      },
      build: (f) => ({ restaurant: f }),
      onSave: save,
      onClose,
      onError: (err) => toast(err.message),
    });

  return (
    <SettingsModal
      open={open}
      onClose={onClose}
      title="Modifica · Ristorante"
      width={620}
      dirty={dirty}
      saving={saving}
      errors={errors}
      onSubmit={onSubmit}
    >
      <div className="admin-settings__form">
        <AdminFieldText label="Nome attività" value={form.name} onChange={(v) => set({ name: v })} error={errors.name} />
        <AdminFieldText label="P.IVA" value={form.vat} onChange={(v) => set({ vat: v })} mono />
        <AdminFieldText label="Indirizzo" value={form.address} onChange={(v) => set({ address: v })} hint="via, CAP, città" />
        <AdminFieldText label="Telefono" value={form.phone} onChange={(v) => set({ phone: v })} error={errors.phone} />
        <AdminFieldText label="Email" value={form.email} onChange={(v) => set({ email: v })} error={errors.email} type="email" />
      </div>
    </SettingsModal>
  );
}

function HoursModal({ open, value, save, onClose }) {
  const toast = useToast();
  const { form, setForm, dirty, errors, saving, submit } = useSettingsForm({ initial: value, open });
  const days = form.days || [];

  // Update a single day by index without mutating the array.
  const setDay = (i, patch) =>
    setForm((f) => ({
      ...f,
      days: f.days.map((d, idx) => (idx === i ? { ...d, ...patch } : d)),
    }));

  const onSubmit = () =>
    submit({
      build: (f) => ({ hours: f.days }),
      onSave: save,
      onClose,
      onError: (err) => toast(err.message),
    });

  return (
    <SettingsModal
      open={open}
      onClose={onClose}
      title="Modifica · Orari di apertura"
      width={620}
      dirty={dirty}
      saving={saving}
      errors={errors}
      onSubmit={onSubmit}
    >
      <div className="admin-settings__hours">
        {days.map((d, i) => (
          <div key={d.day} className="admin-settings__hours-row">
            <span className="admin-settings__hours-day">{d.day}</span>
            <div className="admin-settings__hours-controls">
              <AdminFieldToggle
                label={d.closed ? "Chiuso" : "Aperto"}
                value={!d.closed}
                onChange={(openVal) => setDay(i, { closed: !openVal })}
              />
              <div className={"admin-settings__hours-times" + (d.closed ? " is-disabled" : "")}>
                <input
                  type="time"
                  className="admin-settings__time-input"
                  value={d.open}
                  disabled={d.closed}
                  onChange={(e) => setDay(i, { open: e.target.value })}
                />
                <span className="admin-settings__time-arrow">→</span>
                <input
                  type="time"
                  className="admin-settings__time-input"
                  value={d.close}
                  disabled={d.closed}
                  onChange={(e) => setDay(i, { close: e.target.value })}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </SettingsModal>
  );
}

function PaymentsModal({ open, value, save, onClose }) {
  const toast = useToast();
  const { form, set, dirty, errors, saving, submit } = useSettingsForm({ initial: value, open });

  const onSubmit = () =>
    submit({
      build: (f) => ({ payments: f }),
      onSave: save,
      onClose,
      onError: (err) => toast(err.message),
    });

  return (
    <SettingsModal
      open={open}
      onClose={onClose}
      title="Modifica · Pagamenti"
      width={560}
      dirty={dirty}
      saving={saving}
      errors={errors}
      onSubmit={onSubmit}
    >
      <div className="admin-settings__form">
        <AdminFieldToggle label="Stripe" hint="Pagamenti con carta online" value={form.stripe} onChange={(v) => set({ stripe: v })} />
        <AdminFieldToggle label="Apple Pay" value={form.apple} onChange={(v) => set({ apple: v })} />
        <AdminFieldToggle label="Google Pay" value={form.google} onChange={(v) => set({ google: v })} />
        <AdminFieldSelect label="Contanti" value={form.cash} options={CASH_OPTIONS} onChange={(v) => set({ cash: v })} />
      </div>
    </SettingsModal>
  );
}

function NotificationsModal({ open, value, save, onClose }) {
  const toast = useToast();
  const { form, set, dirty, errors, saving, submit } = useSettingsForm({ initial: value, open });

  const onSubmit = () =>
    submit({
      build: (f) => ({ notifications: f }),
      onSave: save,
      onClose,
      onError: (err) => toast(err.message),
    });

  return (
    <SettingsModal
      open={open}
      onClose={onClose}
      title="Modifica · Notifiche"
      width={560}
      dirty={dirty}
      saving={saving}
      errors={errors}
      onSubmit={onSubmit}
    >
      <div className="admin-settings__form">
        <AdminFieldToggle label="Email nuovi ordini" value={form.emailNewOrders} onChange={(v) => set({ emailNewOrders: v })} />
        <AdminFieldToggle label="SMS rider" value={form.smsRider} onChange={(v) => set({ smsRider: v })} />
        <AdminFieldToggle label="Push customer" value={form.pushCustomer} onChange={(v) => set({ pushCustomer: v })} />
        <AdminFieldText label="Riepilogo giornaliero" type="time" value={form.dailySummary} onChange={(v) => set({ dailySummary: v })} />
      </div>
    </SettingsModal>
  );
}

function PrintingModal({ open, value, save, onClose }) {
  const toast = useToast();
  const { form, set, dirty, errors, saving, submit } = useSettingsForm({ initial: value, open });

  const onSubmit = () =>
    submit({
      validate: (f) => {
        const e = {};
        // Empty is legitimate — it disables agent printing and falls back to
        // the browser dialog. Only a *malformed* URL is an error.
        if (f.agentUrl && !/^https?:\/\/[^\s]+$/i.test(f.agentUrl.trim())) {
          e.agentUrl = "Deve essere un URL http(s), es. http://localhost:9100";
        }
        return e;
      },
      build: (f) => ({
        printing: {
          agentUrl: (f.agentUrl || "").trim().replace(/\/+$/, ""),
          receiptPrinterIds: textToIds(f.receiptPrinterIds),
          nonFiscalPrinterIds: textToIds(f.nonFiscalPrinterIds),
        },
      }),
      onSave: save,
      onClose,
      onError: (err) => toast(err.message),
    });

  return (
    <SettingsModal
      open={open}
      onClose={onClose}
      title="Modifica · Stampa"
      width={620}
      dirty={dirty}
      saving={saving}
      errors={errors}
      onSubmit={onSubmit}
    >
      <div className="admin-settings__form">
        <AdminFieldText
          label="Indirizzo print agent"
          value={form.agentUrl}
          onChange={(v) => set({ agentUrl: v })}
          error={errors.agentUrl}
          mono
          placeholder="http://localhost:9100"
          hint="Servizio locale sul PC cassa. Vuoto = stampa dal browser."
        />
        <AdminFieldText
          label="Stampanti ricevuta"
          value={form.receiptPrinterIds}
          onChange={(v) => set({ receiptPrinterIds: v })}
          mono
          placeholder="fiscal"
          hint="Id separati da virgola, come in printers.config.json"
        />
        <AdminFieldText
          label="Stampanti copia non fiscale"
          value={form.nonFiscalPrinterIds}
          onChange={(v) => set({ nonFiscalPrinterIds: v })}
          mono
          placeholder="bar"
          hint="Ricevono una copia marcata DOCUMENTO NON FISCALE. Vuoto = nessuna copia."
        />
      </div>
    </SettingsModal>
  );
}

// ---- Registry ---------------------------------------------------------------
// `section`  key on the settings document this card reads/writes.
// `rows`     projects the section into read-only card rows.
// `Modal`    edit dialog; `getValue` maps the settings doc to the modal's input.
export const SETTINGS_CARDS = [
  {
    key: "restaurant",
    title: "Ristorante",
    rows: (s) => restaurantRows(s.restaurant),
    getValue: (s) => s.restaurant,
    Modal: RestaurantModal,
  },
  {
    key: "hours",
    title: "Orari di apertura",
    rows: (s) => hoursRows(s.hours),
    // The hours modal edits a `days` array; keep the wire shape (`hours`) separate.
    getValue: (s) => ({ days: s.hours }),
    Modal: HoursModal,
  },
  {
    key: "payments",
    title: "Pagamenti",
    rows: (s) => paymentsRows(s.payments),
    getValue: (s) => s.payments,
    Modal: PaymentsModal,
  },
  {
    key: "notifications",
    title: "Notifiche",
    rows: (s) => notificationsRows(s.notifications),
    getValue: (s) => s.notifications,
    Modal: NotificationsModal,
  },
  {
    key: "printing",
    title: "Stampa",
    rows: (s) => printingRows(s.printing),
    // The modal edits the id lists as comma-separated text; the section is
    // also absent on documents created before this feature, hence the guard.
    getValue: (s) => ({
      agentUrl: s.printing?.agentUrl || "",
      receiptPrinterIds: idsToText(s.printing?.receiptPrinterIds),
      nonFiscalPrinterIds: idsToText(s.printing?.nonFiscalPrinterIds),
    }),
    Modal: PrintingModal,
  },
];
