// Checkout flow + Story page for BRÀCE

const { useState: useState_c, useEffect: useEffect_c } = React;

function CheckoutScreen({ go }) {
  const cart = window.useCart();
  const toast = window.useToast();
  const [step, setStep] = useState_c(1);
  const [mode, setMode] = useState_c("guest"); // guest | login

  const [form, setForm] = useState_c({
    email: "marco.rossi@email.it",
    firstName: "Marco",
    lastName: "Rossi",
    phone: "+39 348 1234 567",
    address: "Via Tortona 27",
    city: "Milano",
    zip: "20144",
    notes: "Citofono Rossi. Lasciare al portone se non rispondo.",
  });

  const [payment, setPayment] = useState_c("card");
  const [card, setCard] = useState_c({ number: "4242 4242 4242 4242", exp: "12 / 28", cvc: "424", name: "MARCO ROSSI" });

  const totalSteps = 3;
  const stepLabels = ["Contatti", "Pagamento", "Conferma"];

  if (cart.lines.length === 0 && step < 3) {
    return (
      <main style={{ paddingTop: 200, minHeight: "70vh", textAlign: "center" }}>
        <div className="container">
          <div className="eyebrow" style={{ marginBottom: 18 }}>Checkout</div>
          <h1 className="display" style={{ fontSize: 80 }}>Carrello vuoto.</h1>
          <p className="it" style={{ fontSize: 22, color: "var(--text-dim)" }}>Non c'è niente da pagare. Vai al menu.</p>
          <button onClick={() => go("menu")} className="btn ember" style={{ marginTop: 30 }}>Vedi il menu <Icon.arrow/></button>
        </div>
      </main>
    );
  }

  return (
    <main style={{ paddingTop: 130, paddingBottom: 80, minHeight: "100vh" }}>
      <div className="container">
        {/* progress */}
        <div style={{ marginBottom: 60 }}>
          <div className="eyebrow" style={{ marginBottom: 18 }}>Checkout · Passo {step} di {totalSteps}</div>
          <h1 className="display" style={{ fontSize: 72, lineHeight: 0.98, margin: 0 }}>
            {step === 1 && <>Dove ti<br/><span className="it" style={{ color: "var(--gold)", fontWeight: 300 }}>troviamo?</span></>}
            {step === 2 && <>Come<br/><span className="it" style={{ color: "var(--gold)", fontWeight: 300 }}>vuoi pagare?</span></>}
            {step === 3 && <>Ordine<br/><span className="it" style={{ color: "var(--gold)", fontWeight: 300 }}>confermato.</span></>}
          </h1>

          {/* stepper */}
          <div style={{ display: "flex", gap: 4, marginTop: 40 }}>
            {stepLabels.map((l, i) => (
              <div key={l} style={{
                flex: 1, paddingTop: 14,
                borderTop: "2px solid " + (i + 1 <= step ? "var(--gold)" : "var(--line-2)"),
              }}>
                <div style={{
                  fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase",
                  color: i + 1 <= step ? "var(--gold)" : "var(--text-faint)",
                  display: "flex", alignItems: "center", gap: 8,
                }}>
                  <span>0{i + 1}</span>
                  <span>{l}</span>
                  {i + 1 < step && <Icon.check style={{ color: "var(--gold)" }}/>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {step < 3 ? (
          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 80, alignItems: "start" }}>
            <div>
              {step === 1 && (
                <Step1 form={form} setForm={setForm} mode={mode} setMode={setMode} cart={cart}/>
              )}
              {step === 2 && (
                <Step2 payment={payment} setPayment={setPayment} card={card} setCard={setCard}/>
              )}

              <div style={{
                marginTop: 48, display: "flex", justifyContent: "space-between",
                paddingTop: 32, borderTop: "1px solid var(--line)",
              }}>
                <button onClick={() => step > 1 ? setStep(step - 1) : go("menu")} className="btn ghost">
                  <Icon.arrow style={{ transform: "rotate(180deg)" }}/> {step === 1 ? "Continua a comprare" : "Indietro"}
                </button>
                <button onClick={() => {
                  if (step === 2) { toast("Pagamento autorizzato", "ok"); }
                  setStep(step + 1);
                }} className="btn ember">
                  {step === 1 ? "Continua al pagamento" : "Paga " + window.fmt(cart.total)} <Icon.arrow className="arrow"/>
                </button>
              </div>
            </div>

            <OrderSummary cart={cart} compact={false}/>
          </div>
        ) : (
          <Confirmation cart={cart} form={form} go={go}/>
        )}
      </div>
    </main>
  );
}

// ----- STEP 1: CONTACT + ADDRESS -----
function Step1({ form, setForm, mode, setMode, cart }) {
  return (
    <div>
      {/* guest / login toggle */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0,
        background: "var(--bg-2)", border: "1px solid var(--line)", padding: 4, borderRadius: 999, maxWidth: 380,
      }}>
        {["guest", "login"].map(k => (
          <button key={k} onClick={() => setMode(k)} style={{
            padding: "12px 14px", borderRadius: 999, border: "none",
            background: mode === k ? "var(--text)" : "transparent",
            color: mode === k ? "var(--bg)" : "var(--text-dim)",
            cursor: "pointer", fontFamily: "var(--mono)", fontSize: 11,
            letterSpacing: "0.14em", textTransform: "uppercase",
          }}>{k === "guest" ? "Continua come ospite" : "Accedi"}</button>
        ))}
      </div>

      {/* delivery toggle */}
      <SectionLabel n="01" label={cart.delivery === "delivery" ? "Indirizzo di consegna" : "Punto di ritiro"} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 28 }}>
        {[
          ["delivery", "Consegna a casa", "Entro 3km · 18–28 min"],
          ["pickup", "Ritiro in negozio", "Via dei Forni 14 · 15 min"],
        ].map(([k, l, sub]) => (
          <button key={k} onClick={() => cart.setDelivery(k)} style={{
            padding: 20, textAlign: "left", cursor: "pointer", color: "var(--text)",
            background: cart.delivery === k ? "var(--bg-3)" : "var(--bg-2)",
            border: "1px solid " + (cart.delivery === k ? "var(--gold-deep)" : "var(--line)"),
          }}>
            <div style={{ fontWeight: 500, marginBottom: 6 }}>{l}</div>
            <div className="mono" style={{ fontSize: 11, color: "var(--text-faint)", letterSpacing: "0.1em" }}>{sub}</div>
          </button>
        ))}
      </div>

      {/* fields */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 32 }}>
        <Field label="Email" v={form.email} on={v => setForm({ ...form, email: v })} span={2}/>
        <Field label="Nome" v={form.firstName} on={v => setForm({ ...form, firstName: v })}/>
        <Field label="Cognome" v={form.lastName} on={v => setForm({ ...form, lastName: v })}/>
        <Field label="Telefono" v={form.phone} on={v => setForm({ ...form, phone: v })} span={2}/>

        {cart.delivery === "delivery" && (
          <>
            <SectionLabel n="02" label="Indirizzo" span={2} top/>
            <Field label="Indirizzo · autocomplete" v={form.address} on={v => setForm({ ...form, address: v })} span={2} icon="📍"/>
            <Field label="Città" v={form.city} on={v => setForm({ ...form, city: v })}/>
            <Field label="CAP" v={form.zip} on={v => setForm({ ...form, zip: v })}/>

            <SectionLabel n="03" label="Zona di consegna" span={2} top/>
            <div style={{ gridColumn: "1/-1" }}>
              <ZoneSelector cart={cart}/>
            </div>

            <SectionLabel n="04" label="Quando ti serviamo" span={2} top/>
            <div style={{ gridColumn: "1/-1", display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 24 }}>
              <DatePicker cart={cart}/>
              <TimeSlotPicker cart={cart}/>
            </div>

            <SectionLabel n="05" label="Note per il rider" span={2} top/>
            <Field label="Note" v={form.notes} on={v => setForm({ ...form, notes: v })} span={2} multiline/>
          </>
        )}

        {cart.delivery === "pickup" && (
          <>
            <SectionLabel n="02" label="Quando vieni a ritirare" span={2} top/>
            <div style={{ gridColumn: "1/-1", display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 24 }}>
              <DatePicker cart={cart}/>
              <TimeSlotPicker cart={cart}/>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function PickupSlots() {
  const slots = ["18:30", "18:45", "19:00", "19:15", "19:30", "19:45", "20:00", "20:15"];
  const [sel, setSel] = useState_c("19:15");
  return (
    <div style={{ gridColumn: "1/-1", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
      {slots.map(s => (
        <button key={s} onClick={() => setSel(s)} style={{
          padding: "16px 0",
          background: sel === s ? "var(--bg-3)" : "var(--bg-2)",
          border: "1px solid " + (sel === s ? "var(--gold)" : "var(--line)"),
          color: sel === s ? "var(--gold)" : "var(--text)",
          cursor: "pointer", fontFamily: "var(--mono)", fontSize: 14, letterSpacing: "0.04em",
        }}>{s}</button>
      ))}
    </div>
  );
}

// --- Zone selector --------------------------------------------------------
function ZoneSelector({ cart }) {
  const zones = window.DELIVERY_ZONES;
  return (
    <div>
      {/* dropdown-style select */}
      <select value={cart.zoneId} onChange={e => cart.setZoneId(e.target.value)} style={{
        width: "100%", padding: "16px 18px",
        background: "var(--bg-2)", border: "1px solid var(--line)",
        color: "var(--text)", fontFamily: "var(--mono)", fontSize: 13,
        letterSpacing: "0.04em", appearance: "none",
        backgroundImage: "linear-gradient(45deg, transparent 50%, var(--gold) 50%), linear-gradient(135deg, var(--gold) 50%, transparent 50%)",
        backgroundPosition: "calc(100% - 22px) 50%, calc(100% - 16px) 50%",
        backgroundSize: "6px 6px",
        backgroundRepeat: "no-repeat",
        paddingRight: 44,
        outline: "none",
      }}>
        {zones.map(z => (
          <option key={z.id} value={z.id}>
            {z.label} — {z.eta} — {z.fee === 0 ? "Gratis" : "€ " + z.fee.toFixed(2)}
          </option>
        ))}
      </select>

      {/* Selected-zone summary card */}
      <SelectedZoneCard cart={cart}/>

      {/* Visual zone strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 4, marginTop: 16 }}>
        {zones.map(z => {
          const active = z.id === cart.zoneId;
          return (
            <button key={z.id} onClick={() => cart.setZoneId(z.id)} style={{
              padding: "14px 8px", textAlign: "left", cursor: "pointer",
              background: active ? "var(--bg-3)" : "var(--bg-2)",
              border: "1px solid " + (active ? "var(--gold-deep)" : "var(--line)"),
              color: "var(--text)",
            }}>
              <div className="mono" style={{
                fontSize: 10, color: active ? "var(--gold)" : "var(--text-faint)",
                letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6,
              }}>{z.radius}</div>
              <div style={{ fontSize: 12, lineHeight: 1.25, fontWeight: 500 }}>
                {z.label.split(" · ")[0]}
              </div>
              <div className="mono" style={{ fontSize: 12, color: active ? "var(--gold)" : "var(--text-dim)", marginTop: 8 }}>
                {z.fee === 0 ? "Gratis" : "€ " + z.fee.toFixed(2)}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SelectedZoneCard({ cart }) {
  const z = cart.zone;
  const free = cart.subtotal >= 40;
  return (
    <div style={{
      marginTop: 14, padding: "18px 20px",
      background: "var(--bg-2)", border: "1px solid var(--gold-deep)",
      display: "grid", gridTemplateColumns: "1fr auto", gap: 24, alignItems: "center",
    }}>
      <div>
        <div className="eyebrow" style={{ marginBottom: 8 }}>Zona selezionata</div>
        <div className="display" style={{ fontSize: 22, lineHeight: 1.1 }}>{z.label}</div>
        <div className="mono" style={{ fontSize: 11, color: "var(--text-dim)", letterSpacing: "0.08em", marginTop: 6 }}>
          {z.sub} · {z.eta} · raggio {z.radius}
        </div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div className="mono" style={{ fontSize: 10, color: "var(--text-faint)", letterSpacing: "0.16em", textTransform: "uppercase" }}>Costo consegna</div>
        <div className="display" style={{ fontSize: 32, color: free ? "var(--ok)" : "var(--gold)", marginTop: 4 }}>
          {free ? "Gratis" : "€ " + z.fee.toFixed(2)}
        </div>
        {free && (
          <div className="mono" style={{ fontSize: 10, color: "var(--ok)", letterSpacing: "0.1em", marginTop: 4 }}>
            ↑ ordine ≥ €40
          </div>
        )}
      </div>
    </div>
  );
}

// --- Date picker (inline mini-calendar) ----------------------------------
function DatePicker({ cart }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + 14);

  const [view, setView] = useState_c(() => new Date(today.getFullYear(), today.getMonth(), 1));

  const monthName = view.toLocaleDateString("it-IT", { month: "long", year: "numeric" });

  // build the 6-week grid
  const firstDay = new Date(view.getFullYear(), view.getMonth(), 1);
  // 0 = Sun, but we want Mon as first day
  const offset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(view.getFullYear(), view.getMonth(), d));
  while (cells.length % 7 !== 0) cells.push(null);

  const sel = cart.scheduleDate;
  const fmtKey = (d) => d.toISOString().slice(0, 10);

  const canPrev = view.getFullYear() > today.getFullYear() ||
                  (view.getFullYear() === today.getFullYear() && view.getMonth() > today.getMonth());
  const canNext = view.getFullYear() < maxDate.getFullYear() ||
                  (view.getFullYear() === maxDate.getFullYear() && view.getMonth() < maxDate.getMonth());

  return (
    <div style={{
      background: "var(--bg-2)", border: "1px solid var(--line)", padding: 22,
    }}>
      <div className="eyebrow" style={{ marginBottom: 14 }}>Data</div>

      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18,
      }}>
        <button onClick={() => canPrev && setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))}
          disabled={!canPrev}
          style={calNavBtn(canPrev)}>‹</button>
        <div className="display" style={{
          fontSize: 20, textTransform: "capitalize", letterSpacing: 0,
        }}>{monthName}</div>
        <button onClick={() => canNext && setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))}
          disabled={!canNext}
          style={calNavBtn(canNext)}>›</button>
      </div>

      {/* dow */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4,
        fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-faint)",
        letterSpacing: "0.16em", textTransform: "uppercase", textAlign: "center",
        marginBottom: 8,
      }}>
        {["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"].map(d => <div key={d}>{d}</div>)}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
        {cells.map((d, i) => {
          if (!d) return <div key={i}/>;
          const key = fmtKey(d);
          const disabled = d < today || d > maxDate;
          const isSelected = key === sel;
          const isToday = d.getTime() === today.getTime();
          return (
            <button key={i}
              disabled={disabled}
              onClick={() => cart.setScheduleDate(key)}
              style={{
                aspectRatio: "1/1",
                background: isSelected ? "var(--gold)" : (isToday ? "var(--bg-3)" : "transparent"),
                color: disabled ? "var(--text-faint)" : isSelected ? "var(--bg)" : "var(--text)",
                border: "1px solid " + (isSelected ? "var(--gold)" : isToday ? "var(--gold-deep)" : "transparent"),
                cursor: disabled ? "not-allowed" : "pointer",
                opacity: disabled ? 0.25 : 1,
                fontFamily: "var(--mono)", fontSize: 13,
                transition: "all .15s ease",
              }}>
              {d.getDate()}
            </button>
          );
        })}
      </div>

      <div style={{
        marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--line)",
        display: "flex", justifyContent: "space-between",
        fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.08em",
      }}>
        <span style={{ color: "var(--text-faint)" }}>Selezionato</span>
        <span style={{ color: "var(--gold)" }}>
          {new Date(sel).toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" })}
        </span>
      </div>
    </div>
  );
}

const calNavBtn = (enabled) => ({
  width: 32, height: 32, borderRadius: 999,
  background: "transparent", border: "1px solid var(--line-2)",
  color: enabled ? "var(--text)" : "var(--text-faint)",
  cursor: enabled ? "pointer" : "not-allowed",
  fontSize: 16, lineHeight: 1, padding: 0,
  opacity: enabled ? 1 : 0.4,
});

// --- Time slot picker ----------------------------------------------------
function TimeSlotPicker({ cart }) {
  const slots = window.TIME_SLOTS;
  const sel = cart.scheduleTime;
  // Make 19:00 and 20:00 visually "busy" — just for realism
  const busy = new Set(["18:30", "20:30"]);

  return (
    <div style={{ background: "var(--bg-2)", border: "1px solid var(--line)", padding: 22 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div className="eyebrow">Orario</div>
        <div className="mono" style={{ fontSize: 10, color: "var(--text-faint)", letterSpacing: "0.14em", textTransform: "uppercase" }}>
          18:00 – 21:00 · ogni 15 min
        </div>
      </div>

      <div style={{
        display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 4,
        maxHeight: 240, overflowY: "auto", paddingRight: 4,
      }}>
        {slots.map(t => {
          const active = t === sel;
          const isBusy = busy.has(t);
          return (
            <button key={t}
              disabled={isBusy}
              onClick={() => cart.setScheduleTime(t)}
              style={{
                padding: "14px 0",
                background: active ? "var(--gold)" : isBusy ? "transparent" : "var(--bg-3)",
                color: active ? "var(--bg)" : isBusy ? "var(--text-faint)" : "var(--text)",
                border: "1px solid " + (active ? "var(--gold)" : isBusy ? "var(--line)" : "var(--line-2)"),
                cursor: isBusy ? "not-allowed" : "pointer",
                fontFamily: "var(--mono)", fontSize: 13, letterSpacing: "0.04em",
                position: "relative",
                opacity: isBusy ? 0.4 : 1,
                transition: "all .15s ease",
              }}>
              {t}
              {isBusy && (
                <span style={{
                  position: "absolute", top: 2, right: 4,
                  fontSize: 8, color: "var(--text-faint)", letterSpacing: "0.1em",
                }}>—</span>
              )}
            </button>
          );
        })}
      </div>

      <div style={{
        marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--line)",
        display: "flex", justifyContent: "space-between",
        fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.08em",
      }}>
        <span style={{ color: "var(--text-faint)" }}>Selezionato</span>
        <span style={{ color: "var(--gold)" }}>Alle {sel}</span>
      </div>
    </div>
  );
}

// ----- STEP 2: PAYMENT -----
function Step2({ payment, setPayment, card, setCard }) {
  return (
    <div>
      <SectionLabel n="01" label="Metodo di pagamento"/>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
        {[
          { id: "card", label: "Carta", sub: "Visa · Mastercard · Amex", icon: "💳" },
          { id: "apple", label: "Apple Pay", sub: "Touch ID o Face ID", icon: "" },
          { id: "google", label: "Google Pay", sub: "Veloce e sicuro", icon: "G" },
          { id: "cash", label: "Contanti", sub: "Solo per ritiro", icon: "€" },
        ].map(opt => (
          <button key={opt.id} onClick={() => setPayment(opt.id)} style={{
            padding: 20, textAlign: "left", cursor: "pointer", color: "var(--text)",
            background: payment === opt.id ? "var(--bg-3)" : "var(--bg-2)",
            border: "1px solid " + (payment === opt.id ? "var(--gold-deep)" : "var(--line)"),
            display: "flex", alignItems: "center", gap: 16,
          }}>
            <span style={{
              width: 44, height: 30, display: "grid", placeItems: "center",
              background: "var(--bg)", border: "1px solid var(--line-2)",
              fontFamily: opt.id === "apple" ? "system-ui" : "var(--mono)", fontSize: 14, color: "var(--gold)",
            }}>{opt.icon}</span>
            <div>
              <div style={{ fontWeight: 500 }}>{opt.label}</div>
              <div className="mono" style={{ fontSize: 11, color: "var(--text-faint)", letterSpacing: "0.1em", marginTop: 4 }}>{opt.sub}</div>
            </div>
          </button>
        ))}
      </div>

      {payment === "card" && (
        <div style={{ marginTop: 36 }}>
          <SectionLabel n="02" label="Dettagli carta · Stripe"/>

          {/* card visual */}
          <div style={{
            background: "var(--feature-card)",
            border: "1px solid var(--line-2)", padding: 32, position: "relative", overflow: "hidden",
            marginBottom: 28,
            color: "#f3ece2",
          }}>
            <div style={{
              position: "absolute", inset: 0,
              background: "radial-gradient(400px 200px at 80% 30%, rgba(212,163,115,0.18), transparent 70%)",
            }}/>
            <div style={{ position: "relative" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="display" style={{ fontSize: 22, letterSpacing: "0.3em", color: "#d4a373" }}>BRÀCE</span>
                <span className="mono" style={{ fontSize: 11, color: "rgba(243,236,226,0.5)", letterSpacing: "0.16em", textTransform: "uppercase" }}>Stripe · Test mode</span>
              </div>
              <div className="mono" style={{ fontSize: 22, letterSpacing: "0.12em", marginTop: 60, color: "#f3ece2" }}>
                {card.number}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 28 }}>
                <div>
                  <div className="mono" style={{ fontSize: 9, color: "rgba(243,236,226,0.5)", letterSpacing: "0.18em" }}>TITOLARE</div>
                  <div className="mono" style={{ fontSize: 12, marginTop: 4 }}>{card.name}</div>
                </div>
                <div>
                  <div className="mono" style={{ fontSize: 9, color: "rgba(243,236,226,0.5)", letterSpacing: "0.18em" }}>SCADENZA</div>
                  <div className="mono" style={{ fontSize: 12, marginTop: 4 }}>{card.exp}</div>
                </div>
                <div>
                  <div className="mono" style={{ fontSize: 9, color: "rgba(243,236,226,0.5)", letterSpacing: "0.18em" }}>CVC</div>
                  <div className="mono" style={{ fontSize: 12, marginTop: 4 }}>{card.cvc}</div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 12 }}>
            <Field label="Numero carta" v={card.number} on={v => setCard({ ...card, number: v })}/>
            <Field label="Scadenza" v={card.exp} on={v => setCard({ ...card, exp: v })}/>
            <Field label="CVC" v={card.cvc} on={v => setCard({ ...card, cvc: v })}/>
            <Field label="Titolare" v={card.name} on={v => setCard({ ...card, name: v })} span={3}/>
          </div>

          <div style={{
            marginTop: 24, padding: "14px 18px", background: "var(--bg-2)",
            border: "1px solid var(--line)", display: "flex", alignItems: "center", gap: 12,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--ok)" }}/>
            <span className="mono" style={{ fontSize: 11, color: "var(--text-dim)", letterSpacing: "0.1em" }}>
              Pagamento protetto · 3D Secure · PCI-DSS L1
            </span>
          </div>
        </div>
      )}

      {payment === "apple" && (
        <ApplePaySimulator/>
      )}
      {payment === "google" && (
        <PayWalletInfo title="Google Pay" sub="Conferma il pagamento sul telefono dopo il prossimo passo."/>
      )}
      {payment === "cash" && (
        <PayWalletInfo title="Contanti al ritiro" sub="Tieni pronto il taglio. Non abbiamo POS al banco per i piccoli ordini."/>
      )}
    </div>
  );
}

function ApplePaySimulator() {
  return (
    <div style={{
      marginTop: 36, padding: 40, background: "var(--bg-2)", border: "1px solid var(--line)",
      textAlign: "center",
    }}>
      <div className="display" style={{ fontSize: 28, marginBottom: 14 }}>Apple Pay</div>
      <p style={{ color: "var(--text-dim)", maxWidth: 400, margin: "0 auto 24px" }}>
        Avvicina il tuo iPhone o Apple Watch dopo aver premuto "Paga". Useremo il portafoglio predefinito.
      </p>
      <div className="mono" style={{ fontSize: 11, color: "var(--text-faint)", letterSpacing: "0.16em", textTransform: "uppercase" }}>
        Touch ID · Face ID · Watch
      </div>
    </div>
  );
}

function PayWalletInfo({ title, sub }) {
  return (
    <div style={{ marginTop: 36, padding: 40, background: "var(--bg-2)", border: "1px solid var(--line)" }}>
      <div className="display" style={{ fontSize: 28, marginBottom: 12 }}>{title}</div>
      <p style={{ color: "var(--text-dim)", margin: 0, maxWidth: 500 }}>{sub}</p>
    </div>
  );
}

// ----- ORDER SUMMARY -----
function OrderSummary({ cart, compact }) {
  return (
    <aside style={{
      position: "sticky", top: 120,
      background: "var(--bg-2)", border: "1px solid var(--line)",
      padding: 28,
    }}>
      <div className="eyebrow" style={{ marginBottom: 20 }}>Riepilogo</div>

      <div style={{ maxHeight: 280, overflowY: "auto", paddingRight: 4 }}>
        {cart.lines.map(line => (
          <div key={line.uid} style={{
            display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 14,
            padding: "12px 0", borderBottom: "1px solid var(--line)", alignItems: "center",
          }}>
            <div className="mono" style={{ fontSize: 11, color: "var(--gold)" }}>{line.qty}×</div>
            <div>
              <div style={{ fontSize: 14 }}>{line.item.name}</div>
              <div className="mono" style={{ fontSize: 10, color: "var(--text-faint)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                {(window.VARIANTS.find(v => v.id === line.variant) || {}).label || ""}
              </div>
            </div>
            <div className="mono" style={{ fontSize: 13, color: "var(--text)" }}>{window.fmt(line.total)}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 20 }}>
        <Row label="Subtotale" value={window.fmt(cart.subtotal)}/>
        {cart.promoDiscount > 0 && <Row label="Sconto" value={"−" + window.fmt(cart.promoDiscount)} accent/>}
        <Row label={cart.delivery === "delivery" ? "Consegna" : "Ritiro"} value={cart.deliveryFee === 0 ? "Gratis" : window.fmt(cart.deliveryFee)}/>
        <Row label="IVA" value={window.fmt(cart.tax)} muted/>
        <div style={{ height: 1, background: "var(--line-2)", margin: "14px 0" }}/>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span className="eyebrow">Totale</span>
          <span className="display" style={{ fontSize: 36, color: "var(--gold)" }}>{window.fmt(cart.total)}</span>
        </div>
      </div>
    </aside>
  );
}

function Row({ label, value, muted, accent }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between",
      fontFamily: "var(--mono)", fontSize: 12, padding: "6px 0",
      color: muted ? "var(--text-faint)" : accent ? "var(--gold)" : "var(--text-dim)",
    }}>
      <span>{label}</span>
      <span style={{ color: accent ? "var(--gold)" : muted ? "var(--text-faint)" : "var(--text)" }}>{value}</span>
    </div>
  );
}

// ----- CONFIRMATION -----
function Confirmation({ cart, form, go }) {
  const orderId = "BR-" + Math.floor(80000 + Math.random() * 20000);
  const date = new Date(cart.scheduleDate);
  const dateStr = date.toLocaleDateString("it-IT", { weekday: "short", day: "numeric", month: "short" });
  const eta = `${dateStr} · ${cart.scheduleTime}`;

  return (
    <div className="rise" style={{ textAlign: "center", maxWidth: 720, margin: "0 auto", padding: "20px 0" }}>
      <div style={{
        width: 88, height: 88, borderRadius: 999,
        background: "var(--bg-2)", border: "1px solid var(--gold-deep)",
        margin: "0 auto 36px", display: "grid", placeItems: "center",
        color: "var(--gold)",
      }}>
        <Icon.check style={{ width: 32, height: 32 }}/>
      </div>

      <p className="it" style={{ fontSize: 24, color: "var(--text-dim)" }}>
        Grazie, {form.firstName}.
      </p>

      <div className="eyebrow" style={{ marginTop: 40, marginBottom: 12 }}>Ordine</div>
      <div className="display" style={{ fontSize: 56, letterSpacing: "0.05em" }}>{orderId}</div>

      <div style={{
        marginTop: 48, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1,
        background: "var(--line)", border: "1px solid var(--line)",
      }}>
        {[
          [cart.delivery === "delivery" ? "Consegna prevista" : "Ritiro previsto", eta, cart.delivery === "delivery" ? cart.zone.label : "Via dei Forni 14"],
          ["Totale pagato", window.fmt(cart.total), "Stripe · ricevuta inviata"],
          [cart.delivery === "delivery" ? "Indirizzo" : "Punto di ritiro",
           cart.delivery === "delivery" ? form.address : "Via dei Forni 14",
           cart.delivery === "delivery" ? form.city + " · " + form.zip : "20121 Milano"],
        ].map(([k, v, sub]) => (
          <div key={k} style={{ background: "var(--bg)", padding: "28px 24px", textAlign: "left" }}>
            <div className="mono" style={{ fontSize: 10, color: "var(--text-faint)", letterSpacing: "0.16em", textTransform: "uppercase" }}>{k}</div>
            <div className="display" style={{ fontSize: 22, marginTop: 10, color: "var(--gold)" }}>{v}</div>
            <div className="mono" style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 6, letterSpacing: "0.08em" }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* status timeline */}
      <div style={{ marginTop: 48 }}>
        <div className="eyebrow" style={{ marginBottom: 16, textAlign: "left" }}>Stato</div>
        <div style={{ display: "flex", gap: 0, border: "1px solid var(--line)", background: "var(--bg-2)" }}>
          {[
            ["Confermato", true],
            ["In forno", true],
            ["Partito", false],
            ["Consegnato", false],
          ].map(([l, done], i) => (
            <div key={l} style={{
              flex: 1, padding: "20px 16px", textAlign: "left",
              borderRight: i < 3 ? "1px solid var(--line)" : "none",
              background: done ? "var(--bg-3)" : "transparent",
            }}>
              <div style={{
                width: 10, height: 10, borderRadius: 999,
                background: done ? "var(--gold)" : "var(--line-2)", marginBottom: 12,
                boxShadow: done ? "0 0 0 4px rgba(212,163,115,0.15)" : "none",
              }}/>
              <div className="mono" style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: done ? "var(--gold)" : "var(--text-faint)" }}>{l}</div>
              <div className="mono" style={{ fontSize: 10, color: "var(--text-faint)", marginTop: 6 }}>
                {done ? "✓ ora" : "—"}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 48 }}>
        <button onClick={() => { cart.clear(); go("account"); }} className="btn">Vedi i miei ordini</button>
        <button onClick={() => { cart.clear(); go("home"); }} className="btn ember">Torna alla casa <Icon.arrow className="arrow"/></button>
      </div>

      <p className="mono" style={{
        fontSize: 11, color: "var(--text-faint)", letterSpacing: "0.14em", textTransform: "uppercase", marginTop: 60,
      }}>
        Una mail di conferma è stata inviata a {form.email}
      </p>
    </div>
  );
}

// ----- HELPERS -----
function Field({ label, v, on, span, multiline, icon }) {
  const [focus, setFocus] = useState_c(false);
  return (
    <label style={{ gridColumn: span ? "span " + span : "auto", display: "block" }}>
      <div className="mono" style={{ fontSize: 10, color: focus ? "var(--gold)" : "var(--text-faint)", letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 8, transition: "color .2s ease" }}>
        {label}
      </div>
      <div style={{
        background: "var(--bg-2)",
        border: "1px solid " + (focus ? "var(--gold-deep)" : "var(--line)"),
        padding: multiline ? 14 : "0 14px",
        display: "flex", alignItems: "center", gap: 10,
        transition: "border-color .2s ease",
      }}>
        {icon && <span style={{ color: "var(--gold)" }}>{icon}</span>}
        {multiline ? (
          <textarea value={v} onChange={e => on(e.target.value)} onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
            rows={3} style={{
              width: "100%", background: "none", border: "none", outline: "none",
              color: "var(--text)", fontFamily: "var(--sans)", fontSize: 14, resize: "vertical",
            }}/>
        ) : (
          <input value={v} onChange={e => on(e.target.value)} onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
            style={{
              width: "100%", padding: "14px 0",
              background: "none", border: "none", outline: "none",
              color: "var(--text)", fontFamily: "var(--sans)", fontSize: 14,
            }}/>
        )}
      </div>
    </label>
  );
}

function SectionLabel({ n, label, span, top }) {
  return (
    <div style={{
      gridColumn: span ? "span " + span : "auto",
      marginTop: top ? 40 : 32, marginBottom: 14,
      display: "flex", alignItems: "center", gap: 14,
    }}>
      <span className="mono" style={{ fontSize: 10, color: "var(--gold)", letterSpacing: "0.2em" }}>· {n}</span>
      <span style={{ fontFamily: "var(--mono)", fontSize: 12, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--text)" }}>
        {label}
      </span>
      <span style={{ flex: 1, height: 1, background: "var(--line)" }}/>
    </div>
  );
}

// ----- DOUGH / STORY ANCHOR PAGE -----
function StoryScreen({ go }) {
  return (
    <main style={{ paddingTop: 140 }}>
      <div className="container">
        <div className="eyebrow" style={{ marginBottom: 20 }}>Manifesto</div>
        <h1 className="display" style={{ fontSize: "clamp(72px, 12vw, 168px)", lineHeight: 0.9, margin: 0, letterSpacing: "-0.015em" }}>
          Un impasto.<br/>
          <span className="it" style={{ color: "var(--gold)", fontWeight: 300 }}>Tre giorni.</span>
        </h1>
        <p className="it" style={{ fontSize: 26, color: "var(--text-dim)", marginTop: 36, maxWidth: 760, lineHeight: 1.4 }}>
          BRÀCE è una pizzeria piccola, in via dei Forni, vicino al Naviglio. Apriamo cinque sere a settimana. Cuociamo a 485 gradi in un forno a legna che abbiamo costruito noi, mattone su mattone, nell'estate del 2019.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24, marginTop: 100 }}>
          {[
            ["01", "Farina", "Tipo 0 antica, macinata a pietra in un piccolo mulino pugliese."],
            ["02", "Tempo", "Settantadue ore di lievitazione a freddo. Niente scorciatoie."],
            ["03", "Forno", "Faggio e quercia. 485 gradi. Novanta secondi. Mai un secondo di più."],
          ].map(([n, t, d]) => (
            <div key={n} style={{ borderTop: "1px solid var(--gold-deep)", paddingTop: 24 }}>
              <div className="mono" style={{ color: "var(--gold)", fontSize: 11, letterSpacing: "0.2em" }}>· {n}</div>
              <h3 className="display" style={{ fontSize: 44, margin: "16px 0 18px" }}>{t}</h3>
              <p style={{ color: "var(--text-dim)", fontSize: 15, lineHeight: 1.7 }}>{d}</p>
            </div>
          ))}
        </div>

        <div style={{
          marginTop: 120, padding: "80px 60px", textAlign: "center",
          background: "var(--bg-2)", border: "1px solid var(--line)",
        }}>
          <p className="it" style={{ fontSize: "clamp(28px, 4vw, 48px)", lineHeight: 1.3, maxWidth: 880, margin: "0 auto", fontWeight: 300, fontFamily: "var(--serif-2)" }}>
            "La pizza non è un piatto complicato. È un piatto preciso. La differenza non è negli ingredienti — è nel tempo che ci metti."
          </p>
          <div style={{ marginTop: 36, fontFamily: "var(--mono)", fontSize: 12, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--text-dim)" }}>
            Antonio Sannino · Pizzaiolo · Fondatore
          </div>
        </div>
      </div>
    </main>
  );
}

Object.assign(window, { CheckoutScreen, StoryScreen });
