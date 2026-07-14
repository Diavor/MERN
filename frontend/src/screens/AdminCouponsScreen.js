import React, { useEffect, useState } from "react";
import "./AdminCouponsScreen.scss";
import Loader from "../brace/ui/Loader";
import Message from "../brace/ui/Message";
import { useToast } from "../brace/ui/Toast";
import {
  AdminFieldText,
  AdminFieldSelect,
  AdminStatusPill,
  AdminEmptyState,
  validateRequired,
} from "../brace/admin/kit";
import {
  fetchCoupons,
  createCoupon as apiCreate,
  updateCoupon as apiUpdate,
  deleteCoupon as apiDelete,
} from "../brace/admin/api";

const STATUS = {
  active: { color: "var(--ok)", label: "Attivo" },
  expiring: { color: "var(--gold)", label: "In scadenza" },
  expired: { color: "var(--text-faint)", label: "Scaduto" },
};

const BLANK = { code: "", type: "percent", value: "", minOrder: "", maxUses: "", expiresAt: "" };

const fmtValue = (c) => (c.type === "percent" ? `${c.value}%` : `€${Number(c.value).toFixed(2)}`);
const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "numeric" })
    : "—";
const fmtUses = (c) => `${c.uses || 0} / ${c.maxUses == null ? "∞" : c.maxUses}`;

const AdminCouponsScreen = () => {
  const toast = useToast();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      setCoupons(await fetchCoupons());
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const submit = async () => {
    const { errors: errs, ok } = validateRequired(
      [
        { key: "code", label: "Codice", required: true, pattern: /^[A-Za-z0-9]+$/ },
        { key: "value", label: "Valore", required: true, type: "number" },
      ],
      form
    );
    setErrors(errs);
    if (!ok) return;
    setSaving(true);
    try {
      const created = await apiCreate({
        code: form.code.toUpperCase(),
        type: form.type,
        value: Number(form.value),
        minOrder: form.minOrder ? Number(form.minOrder) : 0,
        maxUses: form.maxUses ? Number(form.maxUses) : null,
        expiresAt: form.expiresAt || null,
      });
      setCoupons((prev) => [created, ...prev]);
      setForm(BLANK);
      toast("Coupon creato", "ok");
    } catch (e) {
      toast(e.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (c) => {
    try {
      const saved = await apiUpdate(c._id, { active: !c.active });
      setCoupons((prev) => prev.map((x) => (x._id === saved._id ? saved : x)));
    } catch (e) {
      toast(e.message);
    }
  };

  const remove = async (c) => {
    if (!window.confirm(`Eliminare il coupon ${c.code}?`)) return;
    try {
      await apiDelete(c._id);
      setCoupons((prev) => prev.filter((x) => x._id !== c._id));
      toast("Coupon eliminato", "ok");
    } catch (e) {
      toast(e.message);
    }
  };

  const activeCount = coupons.filter((c) => c.status !== "expired").length;

  return (
    <div className="b-rise admin-coupons">
      <div className="admin-coupons__table-card">
        <div className="admin-coupons__card-head">
          <div className="eyebrow">Codici attivi · {activeCount}</div>
        </div>

        {loading ? (
          <div className="admin-coupons__loading"><Loader /></div>
        ) : error ? (
          <div className="admin-coupons__error"><Message variant="danger">{error}</Message></div>
        ) : coupons.length === 0 ? (
          <AdminEmptyState icon="✦" title="Nessun coupon" body="Crea il primo codice promo usando il pannello a lato." />
        ) : (
          <div className="admin-coupons__table-wrap">
            <table className="admin-coupons__table admin-table">
              <thead>
                <tr className="admin-coupons__thead">
                  <th>Codice</th>
                  <th>Tipo</th>
                  <th>Valore</th>
                  <th>Utilizzi</th>
                  <th>Scadenza</th>
                  <th>Stato</th>
                  <th className="is-w120"></th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((c) => {
                  const s = STATUS[c.status] || STATUS.active;
                  return (
                    <tr key={c._id} className="admin-coupons__row">
                      <td className="is-mono is-gold is-spaced">{c.code}</td>
                      <td className="is-dim">{c.type === "percent" ? "Percentuale" : "Importo"}</td>
                      <td className="is-mono">{fmtValue(c)}</td>
                      <td className="is-mono is-sm is-dim">{fmtUses(c)}</td>
                      <td className="is-mono is-sm">{fmtDate(c.expiresAt)}</td>
                      <td>
                        <AdminStatusPill label={s.label} color={s.color} soft />
                      </td>
                      <td className="is-right is-nowrap">
                        <button className="b-btn sm ghost admin-coupons__toggle" onClick={() => toggleActive(c)}>
                          {c.active ? "Pausa" : "Attiva"}
                        </button>{" "}
                        <button
                          onClick={() => remove(c)}
                          className="admin-coupons__delete"
                        >
                          Elimina
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New coupon form */}
      <div className="admin-coupons__form">
        <div className="eyebrow admin-coupons__form-eyebrow">Nuovo coupon</div>
        <p className="admin-coupons__form-note">
          Crea un codice promo che i clienti possono usare al checkout.
        </p>
        <div className="admin-coupons__fields">
          <AdminFieldText label="Codice" value={form.code} onChange={(v) => set({ code: v.toUpperCase() })} error={errors.code} placeholder="ESTATE26" mono />
          <AdminFieldSelect
            label="Tipo"
            value={form.type}
            options={[{ value: "percent", label: "Percentuale (%)" }, { value: "fixed", label: "Importo (€)" }]}
            onChange={(v) => set({ type: v })}
          />
          <AdminFieldText label="Valore" value={form.value} onChange={(v) => set({ value: v })} error={errors.value} prefix={form.type === "percent" ? "%" : "€"} mono />
          <AdminFieldText label="Ordine minimo" value={form.minOrder} onChange={(v) => set({ minOrder: v })} prefix="€" mono hint="opzionale" />
          <AdminFieldText label="Utilizzi massimi" value={form.maxUses} onChange={(v) => set({ maxUses: v })} mono hint="vuoto = illimitati" />
          <AdminFieldText label="Scadenza" value={form.expiresAt} onChange={(v) => set({ expiresAt: v })} type="date" mono hint="opzionale" />
        </div>
        <button
          className={`b-btn ember admin-coupons__submit${saving ? " is-saving" : ""}`}
          disabled={saving}
          onClick={submit}
        >
          {saving ? "Creazione…" : "Crea coupon"}
        </button>
      </div>
    </div>
  );
};

export default AdminCouponsScreen;
