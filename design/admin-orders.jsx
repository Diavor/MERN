// BRÀCE — Admin Order Details page (drill-down from the Orders table).

const { useState: useS_od, useEffect: useE_od } = React;

// Rich detail records; the list passes an id, we look it up (with a fallback generator).
const ORDER_DETAILS = {
  "BR-90518": {
    id: "BR-90518", date: "12 Mag 2026 · 19:42", channel: "App", status: "in-forno", payStatus: "paid", deliveryStatus: "preparing",
    customer: { name: "Lucia Bianchi", phone: "+39 348 9921 044", email: "l.bianchi@email.it", address: "Via Tortona 27, 20144 Milano", notes: "Citofono Bianchi. Secondo piano." },
    items: [
      { name: "Margherita D.O.P.", variant: "14″ Tavola", extras: "Doppia bufala", qty: 2, unit: 16 },
      { name: "Aperol Spritz", variant: "—", extras: "—", qty: 1, unit: 12 },
    ],
    discount: 0, coupon: null, deliveryFee: 4.5, taxRate: 0.10,
    delivery: { address: "Via Tortona 27, 20144 Milano", eta: "20:08", driver: "Marco R. · Vespa 04", tracking: "preparing" },
    payment: { method: "Visa ···· 4242", txn: "ch_3PxR2bK1aJ9", invoice: "INV-90518", refund: "none" },
    timeline: [
      ["Ordine creato", "19:42", "Cliente · App", ""],
      ["Pagamento ricevuto", "19:42", "Stripe", "€44.00 autorizzati"],
      ["In preparazione", "19:44", "Cucina · Antonio", ""],
      ["In forno", "19:51", "Cucina", "Forno 2 · 485°C"],
    ],
    notes: "Cliente abituale — tessera Antica. Aggiungere biglietto di ringraziamento.",
    files: ["ricevuta-90518.pdf"],
  },
  "BR-90515": {
    id: "BR-90515", date: "12 Mag 2026 · 19:28", channel: "Telefono", status: "confermato", payStatus: "pending", deliveryStatus: "queued",
    customer: { name: "Paolo De Luca", phone: "+39 333 1145 882", email: "paolo.deluca@email.it", address: "Via Larga 15, 20122 Milano", notes: "Pagamento alla consegna." },
    items: [
      { name: "Bianca Romana", variant: "16″ Famiglia", extras: "—", qty: 3, unit: 24 },
    ],
    discount: 0, coupon: null, deliveryFee: 3.0, taxRate: 0.10,
    delivery: { address: "Via Larga 15, 20122 Milano", eta: "20:00", driver: "Non assegnato", tracking: "queued" },
    payment: { method: "Contanti alla consegna", txn: "—", invoice: "—", refund: "none" },
    timeline: [
      ["Ordine creato", "19:28", "Staff · Telefono", "Ordine telefonico"],
      ["In attesa pagamento", "19:28", "Sistema", "Alla consegna"],
    ],
    notes: "",
    files: [],
  },
};

const STATUS_FLOW = ["confermato", "in-forno", "partito", "consegnato"];
const STATUS_COLOR = { confermato: "var(--gold)", "in-forno": "var(--accent)", partito: "#6f9ae0", consegnato: "var(--ok)", annullato: "var(--text-faint)" };
const STATUS_LABEL = { confermato: "Confermato", "in-forno": "In forno", partito: "Partito", consegnato: "Consegnato", annullato: "Annullato" };

function fallbackOrder(id) {
  return {
    id, date: "12 Mag 2026", channel: "Web", status: "consegnato", payStatus: "paid", deliveryStatus: "delivered",
    customer: { name: "Cliente BRÀCE", phone: "+39 02 0000 000", email: "cliente@email.it", address: "Milano", notes: "" },
    items: [{ name: "Margherita D.O.P.", variant: "14″ Tavola", extras: "—", qty: 1, unit: 16 }],
    discount: 0, coupon: null, deliveryFee: 4.5, taxRate: 0.10,
    delivery: { address: "Milano", eta: "—", driver: "—", tracking: "delivered" },
    payment: { method: "Carta", txn: "—", invoice: "—", refund: "none" },
    timeline: [["Ordine creato", "—", "Sistema", ""], ["Consegnato", "—", "Rider", ""]],
    notes: "", files: [],
  };
}

function AdminOrderDetail({ id, onBack }) {
  const toast = window.useToast();
  const [loading, setLoading] = useS_od(true);
  const [order, setOrder] = useS_od(null);
  const [notes, setNotes] = useS_od("");
  const [status, setStatus] = useS_od(null);

  useE_od(() => {
    setLoading(true);
    const t = setTimeout(() => {
      const o = ORDER_DETAILS[id] || fallbackOrder(id);
      setOrder(o); setNotes(o.notes); setStatus(o.status); setLoading(false);
    }, 600);
    return () => clearTimeout(t);
  }, [id]);

  if (loading || !order) {
    return (
      <div>
        <button className="btn sm ghost" onClick={onBack} style={{ marginBottom: 24 }}>‹ Ordini</button>
        <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 20 }}>
          <window.AdminSkeleton rows={4}/><window.AdminSkeleton rows={4}/>
        </div>
      </div>
    );
  }

  const subtotal = order.items.reduce((s, it) => s + it.unit * it.qty, 0);
  const taxable = subtotal - order.discount;
  const tax = Math.round(taxable * order.taxRate * 100) / 100;
  const grand = taxable + order.deliveryFee + tax;

  return (
    <div>
      {/* header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20, marginBottom: 28, flexWrap: "wrap" }}>
        <div>
          <button className="btn sm ghost" onClick={onBack} style={{ marginBottom: 16 }}>‹ Tutti gli ordini</button>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <h1 className="display" style={{ fontSize: 52, margin: 0, lineHeight: 1 }}>{order.id}</h1>
            <window.AdminStatusPill label={STATUS_LABEL[status]} color={STATUS_COLOR[status]} soft/>
          </div>
          <div className="mono" style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 12, letterSpacing: "0.08em" }}>
            {order.date} · canale {order.channel}
          </div>
        </div>

        {/* actions */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, maxWidth: 460, justifyContent: "flex-end" }}>
          <button className="btn sm ghost" onClick={() => toast("Ricevuta inviata in stampa")}>Stampa ricevuta</button>
          <button className="btn sm ghost" onClick={() => toast("Ticket cucina inviato")}>Ticket cucina</button>
          <button className="btn sm ghost" onClick={() => toast("Apertura email cliente")}>Contatta cliente</button>
          <button className="btn sm ghost" onClick={() => toast("Ordine duplicato in bozza")}>Duplica</button>
          <button className="btn sm ghost" onClick={() => { if (window.confirm("Emettere rimborso totale?")) toast("Rimborso avviato · Stripe", "ok"); }} style={{ color: "var(--accent)", borderColor: "var(--accent)" }}>Rimborsa</button>
        </div>
      </div>

      {/* status changer */}
      <div style={{ background: "var(--bg-2)", border: "1px solid var(--line)", padding: "18px 24px", marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
        <div className="eyebrow">Cambia stato ordine</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {STATUS_FLOW.map(s => (
            <button key={s} onClick={() => { setStatus(s); toast("Stato → " + STATUS_LABEL[s], "ok"); }} style={{
              padding: "9px 16px", cursor: "pointer", background: status === s ? STATUS_COLOR[s] : "transparent",
              color: status === s ? "var(--bg)" : "var(--text-dim)", border: "1px solid " + (status === s ? STATUS_COLOR[s] : "var(--line)"),
              fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase",
            }}>{STATUS_LABEL[s]}</button>
          ))}
          <button onClick={() => { if (window.confirm("Annullare l'ordine?")) { setStatus("annullato"); toast("Ordine annullato"); } }} style={{
            padding: "9px 16px", cursor: "pointer", background: "transparent", color: "var(--accent)",
            border: "1px solid var(--accent)", fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase",
          }}>Annulla</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 20, alignItems: "start" }}>
        {/* LEFT */}
        <div style={{ display: "grid", gap: 20 }}>
          {/* products */}
          <Card title="Prodotti">
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ textAlign: "left", fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-faint)" }}>
                  <th style={odTh}>Prodotto</th><th style={odTh}>Variante</th><th style={odTh}>Extra</th>
                  <th style={{ ...odTh, textAlign: "center" }}>Qtà</th><th style={{ ...odTh, textAlign: "right" }}>Prezzo</th><th style={{ ...odTh, textAlign: "right" }}>Totale</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((it, i) => (
                  <tr key={i} style={{ borderTop: "1px solid var(--line)" }}>
                    <td style={{ ...odTd, fontWeight: 500 }}>{it.name}</td>
                    <td style={{ ...odTd, color: "var(--text-dim)", fontFamily: "var(--mono)", fontSize: 12 }}>{it.variant}</td>
                    <td style={{ ...odTd, color: "var(--text-dim)", fontSize: 13 }}>{it.extras}</td>
                    <td style={{ ...odTd, textAlign: "center", fontFamily: "var(--mono)" }}>{it.qty}</td>
                    <td style={{ ...odTd, textAlign: "right", fontFamily: "var(--mono)", color: "var(--text-dim)" }}>{window.fmt(it.unit)}</td>
                    <td style={{ ...odTd, textAlign: "right", fontFamily: "var(--mono)" }}>{window.fmt(it.unit * it.qty)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* totals */}
            <div style={{ borderTop: "1px solid var(--line-2)", padding: "18px 24px", display: "grid", gap: 6, maxWidth: 320, marginLeft: "auto", width: "100%" }}>
              <TotalRow label="Subtotale" value={window.fmt(subtotal)}/>
              {order.discount > 0 && <TotalRow label={"Sconto" + (order.coupon ? " · " + order.coupon : "")} value={"−" + window.fmt(order.discount)} accent/>}
              <TotalRow label="Consegna" value={order.deliveryFee === 0 ? "Gratis" : window.fmt(order.deliveryFee)}/>
              <TotalRow label="IVA (10%)" value={window.fmt(tax)} muted/>
              <div style={{ height: 1, background: "var(--line-2)", margin: "8px 0" }}/>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span className="eyebrow">Totale</span>
                <span className="display" style={{ fontSize: 30, color: "var(--gold)" }}>{window.fmt(grand)}</span>
              </div>
            </div>
          </Card>

          {/* timeline */}
          <Card title="Cronologia ordine">
            <div style={{ padding: "8px 24px 24px" }}>
              {order.timeline.map((ev, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "16px 1fr", gap: 16, paddingTop: 18 }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <span style={{ width: 11, height: 11, borderRadius: 999, background: "var(--gold)", flexShrink: 0, boxShadow: "0 0 0 4px color-mix(in srgb, var(--gold) 18%, transparent)" }}/>
                    {i < order.timeline.length - 1 && <span style={{ width: 1, flex: 1, background: "var(--line-2)", marginTop: 4, minHeight: 24 }}/>}
                  </div>
                  <div style={{ paddingBottom: 4 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                      <span style={{ fontSize: 15, fontWeight: 500 }}>{ev[0]}</span>
                      <span className="mono" style={{ fontSize: 11, color: "var(--gold)" }}>{ev[1]}</span>
                    </div>
                    <div className="mono" style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 4, letterSpacing: "0.06em" }}>
                      {ev[2]}{ev[3] ? " · " + ev[3] : ""}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* internal notes */}
          <Card title="Note interne" hint="solo staff">
            <div style={{ padding: 24 }}>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Aggiungi una nota visibile solo agli amministratori…" style={{
                width: "100%", background: "var(--bg)", border: "1px solid var(--line)", color: "var(--text)",
                fontFamily: "var(--sans)", fontSize: 14, padding: 14, outline: "none", resize: "vertical", lineHeight: 1.5,
              }}/>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  {order.files.length === 0
                    ? <span className="mono" style={{ fontSize: 11, color: "var(--text-faint)", letterSpacing: "0.08em" }}>Nessun allegato</span>
                    : order.files.map(f => <span key={f} className="mono" style={{ fontSize: 11, color: "var(--text-dim)", padding: "6px 12px", border: "1px solid var(--line)", letterSpacing: "0.06em" }}>📎 {f}</span>)}
                  <button className="btn sm ghost" onClick={() => toast("Selettore file aperto")}>+ Allega</button>
                </div>
                <button className="btn sm" onClick={() => toast("Nota salvata", "ok")}>Salva nota</button>
              </div>
            </div>
          </Card>
        </div>

        {/* RIGHT */}
        <div style={{ display: "grid", gap: 20 }}>
          <Card title="Cliente">
            <div style={{ padding: 24, display: "grid", gap: 14 }}>
              <Detail label="Nome" value={order.customer.name}/>
              <Detail label="Telefono" value={order.customer.phone} mono/>
              <Detail label="Email" value={order.customer.email} mono/>
              <Detail label="Indirizzo" value={order.customer.address}/>
              {order.customer.notes && <Detail label="Note cliente" value={order.customer.notes}/>}
            </div>
          </Card>

          <Card title="Consegna">
            <div style={{ padding: 24, display: "grid", gap: 14 }}>
              <Detail label="Indirizzo" value={order.delivery.address}/>
              <Detail label="Orario stimato" value={order.delivery.eta} accent/>
              <Detail label="Rider assegnato" value={order.delivery.driver} mono/>
              <div>
                <div style={odLbl}>Tracking</div>
                <div style={{ marginTop: 8 }}><window.AdminStatusPill label={STATUS_LABEL[status] || "—"} color={STATUS_COLOR[status]} soft/></div>
              </div>
            </div>
          </Card>

          <Card title="Pagamento">
            <div style={{ padding: 24, display: "grid", gap: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={odLbl}>Stato pagamento</span>
                <window.AdminStatusPill label={order.payStatus === "paid" ? "Pagato" : "In attesa"} color={order.payStatus === "paid" ? "var(--ok)" : "var(--gold)"} soft/>
              </div>
              <Detail label="Metodo" value={order.payment.method}/>
              <Detail label="ID transazione" value={order.payment.txn} mono/>
              <Detail label="Fattura" value={order.payment.invoice} mono/>
              <Detail label="Rimborso" value={order.payment.refund === "none" ? "Nessuno" : order.payment.refund}/>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Card({ title, hint, children }) {
  return (
    <div style={{ background: "var(--bg-2)", border: "1px solid var(--line)" }}>
      <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div className="eyebrow">{title}</div>
        {hint && <span className="mono" style={{ fontSize: 10, color: "var(--text-faint)", letterSpacing: "0.12em", textTransform: "uppercase" }}>{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function Detail({ label, value, mono, accent }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "baseline" }}>
      <span style={odLbl}>{label}</span>
      <span style={{ textAlign: "right", fontFamily: mono ? "var(--mono)" : "var(--sans)", fontSize: mono ? 12 : 14, color: accent ? "var(--gold)" : "var(--text)" }}>{value}</span>
    </div>
  );
}

function TotalRow({ label, value, muted, accent }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--mono)", fontSize: 12, color: muted ? "var(--text-faint)" : accent ? "var(--gold)" : "var(--text-dim)" }}>
      <span>{label}</span>
      <span style={{ color: accent ? "var(--gold)" : muted ? "var(--text-faint)" : "var(--text)" }}>{value}</span>
    </div>
  );
}

const odTh = { padding: "14px 24px", fontWeight: 400 };
const odTd = { padding: "16px 24px", fontSize: 14, verticalAlign: "middle" };
const odLbl = { fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-faint)", letterSpacing: "0.14em", textTransform: "uppercase" };

Object.assign(window, { AdminOrderDetail });
