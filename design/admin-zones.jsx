// BRÀCE — Admin Delivery Zones with a single create/edit modal (reused for both).

const { useState: useS_oz, useEffect: useE_oz } = React;

const ADMIN_ZONES_SEED = [
  { id: "z1", name: "Centro storico", desc: "Duomo · Brera · Quadrilatero", active: true,
    fee: 3.0, freeThreshold: 40, minOrder: 15, eta: "12–18 min", maxOrders: 40,
    weekday: { open: "18:00", close: "23:00" }, weekend: { open: "12:00", close: "00:00" }, holidays: false,
    coverage: "radius", radius: 1.5, postalCodes: "20121, 20122, 20123", restaurant: "Via dei Forni 14",
    payments: ["card", "apple", "google", "cash"], restrictions: "", notes: "Zona ad alta densità, priorità rider serale." },
  { id: "z2", name: "Navigli · Tortona", desc: "Naviglio Grande · Porta Genova", active: true,
    fee: 4.5, freeThreshold: 40, minOrder: 18, eta: "15–22 min", maxOrders: 30,
    weekday: { open: "18:00", close: "23:00" }, weekend: { open: "12:00", close: "00:00" }, holidays: true,
    coverage: "radius", radius: 2.0, postalCodes: "20143, 20144", restaurant: "Via dei Forni 14",
    payments: ["card", "apple", "google"], restrictions: "No contanti dopo le 22:00.", notes: "" },
  { id: "z3", name: "Città Studi", desc: "Politecnico · Lambrate", active: false,
    fee: 6.5, freeThreshold: 50, minOrder: 20, eta: "25–35 min", maxOrders: 15,
    weekday: { open: "19:00", close: "22:30" }, weekend: { open: "19:00", close: "23:00" }, holidays: false,
    coverage: "postal", radius: 3.0, postalCodes: "20131, 20133", restaurant: "Via dei Forni 14",
    payments: ["card"], restrictions: "Solo su prenotazione.", notes: "In pausa: copertura rider insufficiente." },
];

const PAYMENT_OPTS = [
  { id: "card", label: "Carta" }, { id: "apple", label: "Apple Pay" },
  { id: "google", label: "Google Pay" }, { id: "cash", label: "Contanti" },
];
const DAYS_IT = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];

function AdminZonesV2() {
  const toast = window.useToast();
  const [zones, setZones] = useS_oz(ADMIN_ZONES_SEED);
  const [editing, setEditing] = useS_oz(null); // zone object | "new" | null

  const onSave = (zone, isNew) => {
    setZones(prev => isNew ? [...prev, { ...zone, id: "z" + (prev.length + 1) }] : prev.map(z => z.id === zone.id ? zone : z));
    toast(isNew ? "Zona creata" : "Zona aggiornata", "ok");
    setEditing(null);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 6 }}>{zones.filter(z => z.active).length} attive · {zones.length} totali</div>
          <div className="mono" style={{ fontSize: 12, color: "var(--text-dim)", letterSpacing: "0.06em" }}>Configura copertura, costi e disponibilità per zona.</div>
        </div>
        <button className="btn sm ember" onClick={() => setEditing("new")}>+ Nuova zona</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
        {zones.map(z => (
          <div key={z.id} style={{
            background: "var(--bg-2)", border: "1px solid " + (z.active ? "var(--gold-deep)" : "var(--line)"), padding: 24,
            display: "flex", flexDirection: "column", gap: 16,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div className="display" style={{ fontSize: 26, lineHeight: 1 }}>{z.name}</div>
                <div className="mono" style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 6, letterSpacing: "0.06em" }}>{z.desc}</div>
              </div>
              <window.AdminStatusPill label={z.active ? "Attiva" : "Pausa"} color={z.active ? "var(--ok)" : "var(--text-faint)"} soft/>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontFamily: "var(--mono)", fontSize: 11 }}>
              <Stat label="Costo" value={z.fee === 0 ? "Gratis" : "€ " + z.fee.toFixed(2)} accent/>
              <Stat label="Gratis sopra" value={"€ " + z.freeThreshold}/>
              <Stat label="Min ordine" value={"€ " + z.minOrder}/>
              <Stat label="Tempo" value={z.eta}/>
              <Stat label="Copertura" value={z.coverage === "radius" ? z.radius + " km" : z.coverage === "postal" ? "CAP" : "Poligono"}/>
              <Stat label="Max ordini" value={z.maxOrders + "/h"}/>
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: "auto", paddingTop: 8 }}>
              <button className="btn sm ghost" style={{ flex: 1, justifyContent: "center" }} onClick={() => setEditing(z)}>Modifica</button>
              <button className="btn sm ghost" onClick={() => setZones(prev => prev.map(x => x.id === z.id ? { ...x, active: !x.active } : x))}>{z.active ? "Pausa" : "Attiva"}</button>
            </div>
          </div>
        ))}

        <button onClick={() => setEditing("new")} style={{
          minHeight: 240, border: "1px dashed var(--line-2)", background: "transparent", cursor: "pointer",
          display: "grid", placeItems: "center", color: "var(--text-dim)",
        }}>
          <div style={{ textAlign: "center" }}>
            <Icon.plus style={{ width: 24, height: 24 }}/>
            <div className="mono" style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", marginTop: 10 }}>Nuova zona</div>
          </div>
        </button>
      </div>

      <ZoneModal open={!!editing} zone={editing === "new" ? null : editing} onClose={() => setEditing(null)} onSave={onSave}/>
    </div>
  );
}

function Stat({ label, value, accent }) {
  return (
    <div>
      <div style={{ color: "var(--text-faint)", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase" }}>{label}</div>
      <div style={{ color: accent ? "var(--gold)" : "var(--text)", marginTop: 3, fontSize: 13 }}>{value}</div>
    </div>
  );
}

// ---------------- CREATE / EDIT MODAL ----------------
const ZONE_BLANK = {
  name: "", desc: "", active: true, fee: 4.5, freeThreshold: 40, minOrder: 15, eta: "20–30 min", maxOrders: 25,
  weekday: { open: "18:00", close: "23:00" }, weekend: { open: "12:00", close: "00:00" }, holidays: false,
  coverage: "radius", radius: 2.0, postalCodes: "", restaurant: "Via dei Forni 14",
  payments: ["card", "apple", "google"], restrictions: "", notes: "",
};

function ZoneModal({ open, zone, onClose, onSave }) {
  const isNew = !zone;
  const [form, setForm] = useS_oz(ZONE_BLANK);
  const [errors, setErrors] = useS_oz({});
  const [saving, setSaving] = useS_oz(false);
  const [dirty, setDirty] = useS_oz(false);

  useE_oz(() => { if (open) { setForm(zone || ZONE_BLANK); setErrors({}); setDirty(false); } }, [open, zone]);

  const set = (patch) => { setForm(f => ({ ...f, ...patch })); setDirty(true); };
  const setNested = (key, patch) => { setForm(f => ({ ...f, [key]: { ...f[key], ...patch } })); setDirty(true); };

  const submit = () => {
    const { errors: errs, ok } = window.validateRequired([
      { key: "name", label: "Nome", required: true },
      { key: "fee", label: "Costo", required: true, type: "number" },
      { key: "minOrder", label: "Min", required: true, type: "number" },
      { key: "eta", label: "Tempo", required: true },
    ], form);
    if (form.coverage === "postal" && !String(form.postalCodes).trim()) errs.postalCodes = "Inserisci almeno un CAP";
    setErrors(errs);
    if (!ok || Object.keys(errs).length) return;
    setSaving(true);
    setTimeout(() => { setSaving(false); onSave({ ...form, fee: Number(form.fee), minOrder: Number(form.minOrder), freeThreshold: Number(form.freeThreshold), maxOrders: Number(form.maxOrders), radius: Number(form.radius), id: zone ? zone.id : undefined }, isNew); }, 700);
  };

  const togglePay = (id) => set({ payments: form.payments.includes(id) ? form.payments.filter(p => p !== id) : [...form.payments, id] });

  return (
    <window.AdminModal open={open} onClose={onClose} dirty={dirty}
      title={isNew ? "Nuova zona di consegna" : "Modifica · " + zone.name}
      subtitle={isNew ? "Crea zona" : "Configurazione zona"} width={820}
      footer={<>
        <span className="mono" style={{ fontSize: 11, color: Object.keys(errors).length ? "var(--accent)" : "var(--text-faint)", letterSpacing: "0.08em" }}>
          {Object.keys(errors).length ? "⚠ Correggi i campi evidenziati" : "Tutti i campi obbligatori compilati"}
        </span>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn sm ghost" onClick={onClose}>Annulla</button>
          <button className="btn sm ember" onClick={submit} disabled={saving} style={{ opacity: saving ? 0.6 : 1, minWidth: 130, justifyContent: "center" }}>
            {saving ? "Salvataggio…" : isNew ? "Crea zona" : "Salva modifiche"}
          </button>
        </div>
      </>}>

      <ZoneSection n="01" label="Generale"/>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <window.AdminFieldText label="Nome zona" value={form.name} onChange={v => set({ name: v })} error={errors.name} placeholder="es. Navigli"/>
        <window.AdminFieldText label="Descrizione" value={form.desc} onChange={v => set({ desc: v })} placeholder="quartieri coperti"/>
      </div>
      <div style={{ marginTop: 14 }}>
        <window.AdminFieldToggle label="Zona attiva" value={form.active} onChange={v => set({ active: v })} hint="Disattiva per sospendere le consegne in questa zona"/>
      </div>

      <ZoneSection n="02" label="Consegna"/>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
        <window.AdminFieldText label="Costo consegna" value={form.fee} onChange={v => set({ fee: v })} prefix="€" error={errors.fee} mono/>
        <window.AdminFieldText label="Gratis sopra" value={form.freeThreshold} onChange={v => set({ freeThreshold: v })} prefix="€" mono/>
        <window.AdminFieldText label="Ordine minimo" value={form.minOrder} onChange={v => set({ minOrder: v })} prefix="€" error={errors.minOrder} mono/>
        <window.AdminFieldText label="Tempo stimato" value={form.eta} onChange={v => set({ eta: v })} error={errors.eta}/>
        <window.AdminFieldText label="Max ordini / ora" value={form.maxOrders} onChange={v => set({ maxOrders: v })} mono/>
      </div>

      <ZoneSection n="03" label="Disponibilità"/>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <TimeRange label="Feriali (Lun–Ven)" v={form.weekday} onChange={p => setNested("weekday", p)}/>
        <TimeRange label="Weekend (Sab–Dom)" v={form.weekend} onChange={p => setNested("weekend", p)}/>
      </div>
      <div style={{ marginTop: 14 }}>
        <window.AdminFieldToggle label="Aperto nei festivi" value={form.holidays} onChange={v => set({ holidays: v })}/>
      </div>

      <ZoneSection n="04" label="Copertura"/>
      <div style={{ marginBottom: 14 }}>
        <window.AdminSegmented value={form.coverage} options={[{ value: "radius", label: "Raggio" }, { value: "postal", label: "CAP" }, { value: "polygon", label: "Poligono mappa" }]} onChange={v => set({ coverage: v })}/>
      </div>
      {form.coverage === "radius" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-faint)", letterSpacing: "0.16em", textTransform: "uppercase" }}>Raggio dalla sede</span>
            <span className="mono" style={{ fontSize: 11, color: "var(--gold)" }}>{Number(form.radius).toFixed(1)} km</span>
          </div>
          <input type="range" min={0.5} max={6} step={0.5} value={form.radius} onChange={e => set({ radius: e.target.value })} style={{ width: "100%", accentColor: "var(--accent)" }}/>
        </div>
      )}
      {form.coverage === "postal" && (
        <window.AdminFieldArea label="Codici postali (CAP)" value={form.postalCodes} onChange={v => set({ postalCodes: v })} error={errors.postalCodes} rows={2} hint="separati da virgola"/>
      )}
      {form.coverage === "polygon" && (
        <div style={{ aspectRatio: "21/9", position: "relative", overflow: "hidden", border: "1px solid var(--line-2)",
          background: "repeating-linear-gradient(0deg, var(--grid-line) 0 1px, transparent 1px 28px), repeating-linear-gradient(90deg, var(--grid-line) 0 1px, transparent 1px 28px), var(--bg-3)" }}>
          <svg viewBox="0 0 400 170" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
            <polygon points="120,40 280,55 320,120 180,140 90,100" fill="color-mix(in srgb, var(--accent) 18%, transparent)" stroke="var(--accent)" strokeWidth="1.5"/>
            {[[120,40],[280,55],[320,120],[180,140],[90,100]].map(([x,y],i)=><circle key={i} cx={x} cy={y} r="4" fill="var(--accent)"/>)}
          </svg>
          <div className="mono" style={{ position: "absolute", bottom: 10, left: 12, fontSize: 10, color: "var(--text-faint)", letterSpacing: "0.12em", textTransform: "uppercase" }}>Trascina i vertici · 5 punti</div>
        </div>
      )}

      <ZoneSection n="05" label="Sede & Pagamenti"/>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, alignItems: "start" }}>
        <window.AdminFieldSelect label="Sede assegnata" value={form.restaurant} options={["Via dei Forni 14", "Navigli 8 (apertura 2027)"]} onChange={v => set({ restaurant: v })} hint="multi-sede"/>
        <div>
          <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-faint)", letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 8 }}>Metodi di pagamento</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {PAYMENT_OPTS.map(o => {
              const on = form.payments.includes(o.id);
              return <button key={o.id} onClick={() => togglePay(o.id)} style={{
                padding: "9px 14px", cursor: "pointer", background: on ? "var(--text)" : "transparent", color: on ? "var(--bg)" : "var(--text-dim)",
                border: "1px solid " + (on ? "var(--text)" : "var(--line)"), fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.08em",
              }}>{o.label}</button>;
            })}
          </div>
        </div>
      </div>

      <ZoneSection n="06" label="Restrizioni & Note"/>
      <div style={{ display: "grid", gap: 14 }}>
        <window.AdminFieldArea label="Restrizioni" value={form.restrictions} onChange={v => set({ restrictions: v })} rows={2} placeholder="es. solo su prenotazione, no contanti dopo le 22:00"/>
        <window.AdminFieldArea label="Note interne" value={form.notes} onChange={v => set({ notes: v })} rows={2} hint="visibili solo allo staff"/>
      </div>
    </window.AdminModal>
  );
}

function ZoneSection({ n, label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "28px 0 16px" }}>
      <span className="mono" style={{ fontSize: 10, color: "var(--gold)", letterSpacing: "0.2em" }}>· {n}</span>
      <span style={{ fontFamily: "var(--mono)", fontSize: 12, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--text)" }}>{label}</span>
      <span style={{ flex: 1, height: 1, background: "var(--line)" }}/>
    </div>
  );
}

function TimeRange({ label, v, onChange }) {
  return (
    <div>
      <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-faint)", letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 8 }}>{label}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <input type="time" value={v.open} onChange={e => onChange({ open: e.target.value })} style={timeInput}/>
        <span style={{ color: "var(--text-faint)" }}>→</span>
        <input type="time" value={v.close} onChange={e => onChange({ close: e.target.value })} style={timeInput}/>
      </div>
    </div>
  );
}
const timeInput = { flex: 1, background: "var(--bg)", border: "1px solid var(--line)", color: "var(--text)", fontFamily: "var(--mono)", fontSize: 13, padding: "11px 12px", outline: "none" };

Object.assign(window, { AdminZonesV2 });
