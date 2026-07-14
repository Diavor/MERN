import React, { useEffect, useState } from "react";
import "./AdminZonesScreen.scss";
import Icon from "../brace/ui/Icon";
import Loader from "../brace/ui/Loader";
import Message from "../brace/ui/Message";
import { useToast } from "../brace/ui/Toast";
import usePublicSettings from "../brace/ui/usePublicSettings";
import {
  AdminModal,
  AdminFieldText,
  AdminFieldArea,
  AdminFieldSelect,
  AdminFieldToggle,
  AdminSegmented,
  AdminStatusPill,
  AdminEmptyState,
  validateRequired,
} from "../brace/admin/kit";
import {
  fetchZones,
  createZone as apiCreate,
  updateZone as apiUpdate,
} from "../brace/admin/api";
import fmt from "../brace/ui/fmt";

const PAYMENT_OPTS = [
  { id: "card", label: "Carta" },
  { id: "apple", label: "Apple Pay" },
  { id: "google", label: "Google Pay" },
  { id: "cash", label: "Contanti" },
];

const ZONE_BLANK = {
  name: "", desc: "", active: true, fee: 4.5, freeThreshold: 40, minOrder: 15,
  eta: "20–30 min", maxOrders: 25,
  useGlobalHours: true, schedule: { open: "18:00", close: "22:00" },
  holidays: false, coverage: "radius", radius: 2.0, postalCodes: "",
  restaurant: "Via dei Forni 14", payments: ["card", "apple", "google"],
  restrictions: "", notes: "",
};

const AdminZonesScreen = () => {
  const toast = useToast();
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null); // zone object | "new" | null

  const load = async () => {
    try {
      setLoading(true);
      const data = await fetchZones();
      setZones(data);
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

  const onSave = async (zone, isNew) => {
    const saved = isNew ? await apiCreate(zone) : await apiUpdate(zone._id, zone);
    setZones((prev) =>
      isNew ? [...prev, saved] : prev.map((z) => (z._id === saved._id ? saved : z))
    );
    toast(isNew ? "Zona creata" : "Zona aggiornata", "ok");
    setEditing(null);
  };

  const togglePause = async (z) => {
    try {
      const saved = await apiUpdate(z._id, { active: !z.active });
      setZones((prev) => prev.map((x) => (x._id === saved._id ? saved : x)));
      toast(saved.active ? "Zona attivata" : "Zona in pausa", "ok");
    } catch (e) {
      toast(e.message);
    }
  };

  const activeCount = zones.filter((z) => z.active).length;

  return (
    <div className="admin-zones b-rise">
      <div className="admin-zones__header">
        <div>
          <div className="eyebrow admin-zones__count">
            {activeCount} attive · {zones.length} totali
          </div>
          <div className="mono admin-zones__intro">
            Configura copertura, costi e disponibilità per zona.
          </div>
        </div>
        <button className="b-btn sm ember" onClick={() => setEditing("new")}>
          + Nuova zona
        </button>
      </div>

      {loading ? (
        <Loader />
      ) : error ? (
        <Message variant="danger">{error}</Message>
      ) : zones.length === 0 ? (
        <AdminEmptyState
          icon="◯"
          title="Nessuna zona"
          body="Crea la prima zona di consegna per iniziare a coprire l'area."
          action={
            <button className="b-btn ember" onClick={() => setEditing("new")}>
              + Nuova zona
            </button>
          }
        />
      ) : (
        <div className="admin-zones__grid">
          {zones.map((z) => (
            <div
              key={z._id}
              className={"admin-zones__card" + (z.active ? " is-active" : "")}
            >
              <div className="admin-zones__card-head">
                <div>
                  <div className="display admin-zones__card-name">{z.name}</div>
                  <div className="mono admin-zones__card-desc">
                    {z.desc}
                  </div>
                </div>
                <AdminStatusPill
                  label={z.active ? "Attiva" : "Pausa"}
                  color={z.active ? "var(--ok)" : "var(--text-faint)"}
                  soft
                />
              </div>

              <div className="admin-zones__stats">
                <Stat label="Costo" value={z.fee === 0 ? "Gratis" : fmt(z.fee)} accent />
                <Stat label="Gratis sopra" value={fmt(z.freeThreshold)} />
                <Stat label="Min ordine" value={fmt(z.minOrder)} />
                <Stat label="Tempo" value={z.eta} />
                <Stat
                  label="Copertura"
                  value={z.coverage === "radius" ? z.radius + " km" : z.coverage === "postal" ? "CAP" : "Poligono"}
                />
                <Stat label="Max ordini" value={z.maxOrders + "/h"} />
              </div>

              <div className="admin-zones__card-actions">
                <button className="b-btn sm ghost admin-zones__edit-btn" onClick={() => setEditing(z)}>
                  Modifica
                </button>
                <button className="b-btn sm ghost" onClick={() => togglePause(z)}>
                  {z.active ? "Pausa" : "Attiva"}
                </button>
              </div>
            </div>
          ))}

          <button
            onClick={() => setEditing("new")}
            className="admin-zones__add"
          >
            <div className="admin-zones__add-inner">
              <Icon.plus className="admin-zones__add-icon" />
              <div className="mono admin-zones__add-label">
                Nuova zona
              </div>
            </div>
          </button>
        </div>
      )}

      <ZoneModal
        open={!!editing}
        zone={editing === "new" ? null : editing}
        onClose={() => setEditing(null)}
        onSave={onSave}
      />
    </div>
  );
};

function Stat({ label, value, accent }) {
  return (
    <div>
      <div className="admin-zones__stat-label">{label}</div>
      <div className={"admin-zones__stat-value" + (accent ? " is-accent" : "")}>{value}</div>
    </div>
  );
}

function ZoneModal({ open, zone, onClose, onSave }) {
  const isNew = !zone;
  const toast = useToast();
  const [form, setForm] = useState(ZONE_BLANK);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (open) {
      // Migrate legacy zones (split weekday/weekend) to the single schedule.
      const schedule = zone ? zone.schedule || zone.weekday || ZONE_BLANK.schedule : ZONE_BLANK.schedule;
      setForm(zone ? { ...ZONE_BLANK, ...zone, schedule } : ZONE_BLANK);
      setErrors({});
      setDirty(false);
    }
  }, [open, zone]);

  const set = (patch) => {
    setForm((f) => ({ ...f, ...patch }));
    setDirty(true);
  };
  const setNested = (key, patch) => {
    setForm((f) => ({ ...f, [key]: { ...f[key], ...patch } }));
    setDirty(true);
  };

  // Restaurant opening hours (single source of truth, from Impostazioni). When a
  // zone follows global hours, we show these read-only instead of a custom range.
  const settings = usePublicSettings();
  const settingsHours = (settings?.hours || []).map((d) => [
    d.day,
    d.closed ? "Chiuso" : `${d.open} — ${d.close}`,
  ]);

  const submit = async () => {
    const { errors: errs, ok } = validateRequired(
      [
        { key: "name", label: "Nome", required: true },
        { key: "fee", label: "Costo", required: true, type: "number" },
        { key: "minOrder", label: "Min", required: true, type: "number" },
        { key: "eta", label: "Tempo", required: true },
      ],
      form
    );
    if (form.coverage === "postal" && !String(form.postalCodes).trim()) {
      errs.postalCodes = "Inserisci almeno un CAP";
    }
    setErrors(errs);
    if (!ok || Object.keys(errs).length) return;

    setSaving(true);
    try {
      const payload = {
        ...form,
        fee: Number(form.fee),
        minOrder: Number(form.minOrder),
        freeThreshold: Number(form.freeThreshold),
        maxOrders: Number(form.maxOrders),
        radius: Number(form.radius),
      };
      await onSave(payload, isNew);
    } catch (e) {
      toast(e.message);
    } finally {
      setSaving(false);
    }
  };

  const togglePay = (id) =>
    set({
      payments: form.payments.includes(id)
        ? form.payments.filter((p) => p !== id)
        : [...form.payments, id],
    });

  return (
    <AdminModal
      open={open}
      onClose={onClose}
      dirty={dirty}
      title={isNew ? "Nuova zona di consegna" : "Modifica · " + zone.name}
      subtitle={isNew ? "Crea zona" : "Configurazione zona"}
      width={820}
      footer={
        <>
          <span
            className={"mono admin-zones__footer-status" + (Object.keys(errors).length ? " is-error" : "")}
          >
            {Object.keys(errors).length
              ? "⚠ Correggi i campi evidenziati"
              : "Tutti i campi obbligatori compilati"}
          </span>
          <div className="admin-zones__footer-actions">
            <button className="b-btn sm ghost" onClick={onClose}>Annulla</button>
            <button
              className={"b-btn sm ember admin-zones__save-btn" + (saving ? " is-saving" : "")}
              onClick={submit}
              disabled={saving}
            >
              {saving ? "Salvataggio…" : isNew ? "Crea zona" : "Salva modifiche"}
            </button>
          </div>
        </>
      }
    >
      <ZoneSection n="01" label="Generale" />
      <div className="admin-zones__grid-2">
        <AdminFieldText label="Nome zona" value={form.name} onChange={(v) => set({ name: v })} error={errors.name} placeholder="es. Navigli" />
        <AdminFieldText label="Descrizione" value={form.desc} onChange={(v) => set({ desc: v })} placeholder="quartieri coperti" />
      </div>
      <div className="admin-zones__field-row">
        <AdminFieldToggle label="Zona attiva" value={form.active} onChange={(v) => set({ active: v })} hint="Disattiva per sospendere le consegne in questa zona" />
      </div>

      <ZoneSection n="02" label="Consegna" />
      <div className="admin-zones__grid-3">
        <AdminFieldText label="Costo consegna" value={form.fee} onChange={(v) => set({ fee: v })} prefix="€" error={errors.fee} mono />
        <AdminFieldText label="Gratis sopra" value={form.freeThreshold} onChange={(v) => set({ freeThreshold: v })} prefix="€" mono />
        <AdminFieldText label="Ordine minimo" value={form.minOrder} onChange={(v) => set({ minOrder: v })} prefix="€" error={errors.minOrder} mono />
        <AdminFieldText label="Tempo stimato" value={form.eta} onChange={(v) => set({ eta: v })} error={errors.eta} />
        <AdminFieldText label="Max ordini / ora" value={form.maxOrders} onChange={(v) => set({ maxOrders: v })} mono />
      </div>

      <ZoneSection n="03" label="Disponibilità" />
      <div className="admin-zones__field-row">
        <AdminFieldToggle
          label="Usa gli orari del ristorante"
          hint="La zona segue gli orari di apertura impostati in Impostazioni"
          value={form.useGlobalHours}
          onChange={(v) => set({ useGlobalHours: v })}
        />
      </div>
      {form.useGlobalHours ? (
        <div className="admin-zones__global-hours">
          {settingsHours.length ? (
            settingsHours.map(([day, range]) => (
              <div key={day} className="admin-zones__global-hours-row">
                <span className="admin-zones__global-hours-day">{day}</span>
                <span className="admin-zones__global-hours-range">{range}</span>
              </div>
            ))
          ) : (
            <div className="mono admin-zones__global-hours-empty">Caricamento orari…</div>
          )}
          <div className="mono admin-zones__global-hours-note">
            Gestisci questi orari in Impostazioni → Orari di apertura
          </div>
        </div>
      ) : (
        <div className="admin-zones__grid-2">
          <TimeRange label="Orario di consegna (Lun–Dom)" v={form.schedule} onChange={(p) => setNested("schedule", p)} />
        </div>
      )}
      <div className="admin-zones__field-row">
        <AdminFieldToggle label="Aperto nei festivi" value={form.holidays} onChange={(v) => set({ holidays: v })} />
      </div>

      <ZoneSection n="04" label="Copertura" />
      <div className="admin-zones__segmented-wrap">
        <AdminSegmented
          value={form.coverage}
          options={[
            { value: "radius", label: "Raggio" },
            { value: "postal", label: "CAP" },
            { value: "polygon", label: "Poligono mappa" },
          ]}
          onChange={(v) => set({ coverage: v })}
        />
      </div>
      {form.coverage === "radius" && (
        <div>
          <div className="admin-zones__radius-head">
            <span className="admin-zones__field-label admin-zones__field-label--flush">
              Raggio dalla sede
            </span>
            <span className="mono admin-zones__radius-value">{Number(form.radius).toFixed(1)} km</span>
          </div>
          <input
            type="range"
            min={0.5}
            max={6}
            step={0.5}
            value={form.radius}
            onChange={(e) => set({ radius: e.target.value })}
            className="admin-zones__range"
          />
        </div>
      )}
      {form.coverage === "postal" && (
        <AdminFieldArea label="Codici postali (CAP)" value={form.postalCodes} onChange={(v) => set({ postalCodes: v })} error={errors.postalCodes} rows={2} hint="separati da virgola" />
      )}
      {form.coverage === "polygon" && (
        <div className="admin-zones__map">
          <svg viewBox="0 0 400 170" className="admin-zones__map-svg">
            <polygon
              points="120,40 280,55 320,120 180,140 90,100"
              fill="color-mix(in srgb, var(--accent) 18%, transparent)"
              stroke="var(--accent)"
              strokeWidth="1.5"
            />
            {[[120, 40], [280, 55], [320, 120], [180, 140], [90, 100]].map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r="4" fill="var(--accent)" />
            ))}
          </svg>
          <div className="mono admin-zones__map-caption">
            Trascina i vertici · 5 punti
          </div>
        </div>
      )}

      <ZoneSection n="05" label="Sede & Pagamenti" />
      <div className="admin-zones__grid-2 admin-zones__grid-2--start">
        <AdminFieldSelect
          label="Sede assegnata"
          value={form.restaurant}
          options={["Via dei Forni 14", "Navigli 8 (apertura 2027)"]}
          onChange={(v) => set({ restaurant: v })}
          hint="multi-sede"
        />
        <div>
          <div className="admin-zones__field-label">
            Metodi di pagamento
          </div>
          <div className="admin-zones__pay-list">
            {PAYMENT_OPTS.map((o) => {
              const on = form.payments.includes(o.id);
              return (
                <button
                  key={o.id}
                  onClick={() => togglePay(o.id)}
                  className={"admin-zones__pay-btn" + (on ? " is-on" : "")}
                >
                  {o.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <ZoneSection n="06" label="Restrizioni & Note" />
      <div className="admin-zones__grid-stack">
        <AdminFieldArea label="Restrizioni" value={form.restrictions} onChange={(v) => set({ restrictions: v })} rows={2} placeholder="es. solo su prenotazione, no contanti dopo le 22:00" />
        <AdminFieldArea label="Note interne" value={form.notes} onChange={(v) => set({ notes: v })} rows={2} hint="visibili solo allo staff" />
      </div>
    </AdminModal>
  );
}

function ZoneSection({ n, label }) {
  return (
    <div className="admin-zones__section">
      <span className="mono admin-zones__section-num">· {n}</span>
      <span className="admin-zones__section-label">{label}</span>
      <span className="admin-zones__section-rule" />
    </div>
  );
}

function TimeRange({ label, v, onChange }) {
  return (
    <div>
      <div className="admin-zones__field-label">{label}</div>
      <div className="admin-zones__time-row">
        <input type="time" value={v.open} onChange={(e) => onChange({ open: e.target.value })} className="admin-zones__time-input" />
        <span className="admin-zones__time-arrow">→</span>
        <input type="time" value={v.close} onChange={(e) => onChange({ close: e.target.value })} className="admin-zones__time-input" />
      </div>
    </div>
  );
}

export default AdminZonesScreen;
