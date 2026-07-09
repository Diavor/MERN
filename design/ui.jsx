// Shared UI primitives for BRÀCE

const { useState, useEffect, useRef, useMemo, useCallback, createContext, useContext } = React;

// ------------------- CART CONTEXT -------------------
const CartCtx = createContext(null);
const useCart = () => useContext(CartCtx);

function CartProvider({ children }) {
  const [items, setItems] = useState([
    // seed with one item so the cart isn't empty on first view
    { uid: "seed-1", itemId: "margherita-dop", variant: "14", dough: "napoletana", qty: 1 },
  ]);
  const [open, setOpen] = useState(false);
  const [promo, setPromo] = useState("");
  const [delivery, setDelivery] = useState("delivery"); // "delivery" | "pickup"
  const [zoneId, setZoneId] = useState("navigli");
  const [scheduleDate, setScheduleDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.toISOString().slice(0, 10);
  });
  const [scheduleTime, setScheduleTime] = useState("19:15");

  const add = useCallback((entry) => {
    setItems(prev => {
      const existing = prev.find(p => p.itemId === entry.itemId && p.variant === entry.variant && p.dough === entry.dough);
      if (existing) {
        return prev.map(p => p === existing ? { ...p, qty: p.qty + entry.qty } : p);
      }
      return [...prev, { ...entry, uid: "u-" + Math.random().toString(36).slice(2, 8) }];
    });
    setOpen(true);
  }, []);

  const update = useCallback((uid, qty) => {
    setItems(prev => qty <= 0
      ? prev.filter(p => p.uid !== uid)
      : prev.map(p => p.uid === uid ? { ...p, qty } : p)
    );
  }, []);

  const remove = useCallback((uid) => {
    setItems(prev => prev.filter(p => p.uid !== uid));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const computed = useMemo(() => {
    const lines = items.map(line => {
      const item = window.ALL_ITEMS.find(i => i.id === line.itemId);
      if (!item) return null;
      const v = window.VARIANTS.find(x => x.id === line.variant);
      const variantDelta = v ? v.priceDelta : 0;
      const doughDelta = line.dough === "senza" ? 3 : 0;
      const unit = item.price + variantDelta + doughDelta;
      return { ...line, item, unit, total: unit * line.qty };
    }).filter(Boolean);
    const subtotal = lines.reduce((s, l) => s + l.total, 0);
    const promoDiscount = promo.toUpperCase() === "BRACE10" ? subtotal * 0.10 : 0;
    const zone = window.DELIVERY_ZONES.find(z => z.id === zoneId) || window.DELIVERY_ZONES[1];
    const deliveryFee = delivery === "delivery"
      ? (subtotal >= 40 ? 0 : zone.fee)
      : 0;
    const tax = Math.round((subtotal - promoDiscount) * 0.10 * 100) / 100;
    const total = Math.max(0, subtotal - promoDiscount + deliveryFee + tax);
    const count = lines.reduce((s, l) => s + l.qty, 0);
    return { lines, subtotal, promoDiscount, deliveryFee, tax, total, count, zone };
  }, [items, promo, delivery, zoneId]);

  return (
    <CartCtx.Provider value={{
      items, ...computed, open, setOpen, add, update, remove, clear,
      promo, setPromo, delivery, setDelivery,
      zoneId, setZoneId,
      scheduleDate, setScheduleDate,
      scheduleTime, setScheduleTime,
    }}>
      {children}
    </CartCtx.Provider>
  );
}

// ------------------- TOAST -------------------
const ToastCtx = createContext(null);
const useToast = () => useContext(ToastCtx);

function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((msg, kind = "info") => {
    const id = Math.random().toString(36).slice(2, 8);
    setToasts(t => [...t, { id, msg, kind }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3200);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div style={{
        position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)",
        display: "flex", flexDirection: "column", gap: 8, zIndex: 10000,
        pointerEvents: "none",
      }}>
        {toasts.map(t => (
          <div key={t.id} className="rise" style={{
            background: t.kind === "ok" ? "rgba(20,30,18,0.95)" : "rgba(20,18,16,0.95)",
            border: "1px solid " + (t.kind === "ok" ? "#3d5a32" : "var(--line-2)"),
            color: t.kind === "ok" ? "#c9e2ba" : "var(--text)",
            padding: "12px 18px",
            borderRadius: 999,
            fontSize: 13,
            backdropFilter: "blur(20px)",
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: 999,
              background: t.kind === "ok" ? "var(--ok)" : "var(--gold)",
            }}/>
            {t.msg}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

// ------------------- ICONS -------------------
const Icon = {
  bag: (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...p}><path d="M5 8h14l-1 12H6L5 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>,
  user: (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...p}><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/></svg>,
  search: (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...p}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>,
  close: (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...p}><path d="M6 6l12 12M18 6 6 18"/></svg>,
  menu: (p) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...p}><path d="M4 7h16M4 12h16M4 17h16"/></svg>,
  arrow: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...p}><path d="M5 12h14M13 6l6 6-6 6"/></svg>,
  minus: (p) => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}><path d="M5 12h14"/></svg>,
  plus: (p) => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}><path d="M12 5v14M5 12h14"/></svg>,
  star: (p) => <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" {...p}><path d="m12 2 3 7 7 .7-5.3 4.7L18 22l-6-3.5L6 22l1.3-7.6L2 9.7 9 9z"/></svg>,
  heart: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...p}><path d="M12 21s-7-4.5-9-9c-1.3-3 .7-6 4-6 2 0 3.5 1.2 5 3 1.5-1.8 3-3 5-3 3.3 0 5.3 3 4 6-2 4.5-9 9-9 9z"/></svg>,
  check: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}><path d="m5 12 5 5L20 7"/></svg>,
  flame: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...p}><path d="M12 3s4 4 4 8a4 4 0 1 1-8 0c0-1 .5-2 1-3 0 2 1 3 2 3 0-3-1-5 1-8z"/></svg>,
  leaf: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...p}><path d="M20 4c0 8-5 14-13 14C5 18 4 13 4 11c0-3 2-7 8-7 4 0 8 0 8 0z"/><path d="M4 20c4-4 8-8 16-16"/></svg>,
};

// ------------------- PRICE -------------------
const fmt = (n) => "€" + n.toFixed(2).replace(/\.00$/, "");

// ------------------- NAV -------------------
function Nav({ route, go }) {
  const cart = useCart();
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      borderBottom: "1px solid " + (scrolled ? "var(--line)" : "transparent"),
      background: scrolled ? "var(--scrim-blur)" : "transparent",
      backdropFilter: scrolled ? "blur(20px) saturate(140%)" : "none",
      transition: "all .35s ease",
    }}>
      <div className="container" style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: scrolled ? "16px 56px" : "26px 56px",
        transition: "padding .35s ease",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 36 }}>
          <button onClick={() => go("home")} style={{
            background: "none", border: "none", padding: 0, cursor: "pointer",
            color: "var(--text)", display: "flex", alignItems: "center", gap: 10,
          }}>
            <Mark size={28} />
            <span className="display" style={{
              fontSize: 22, letterSpacing: "0.34em", lineHeight: 1, paddingTop: 2,
            }}>BRÀCE</span>
          </button>
        </div>

        <nav style={{
          display: "flex", gap: 36, alignItems: "center",
          fontSize: 12, letterSpacing: "0.18em", textTransform: "uppercase",
          fontFamily: "var(--mono)",
        }}>
          {[
            ["home", "Casa"],
            ["menu", "Menu"],
            ["story", "Dough"],
            ["account", "Account"],
          ].map(([id, label]) => (
            <button key={id} onClick={() => go(id)} style={{
              background: "none", border: "none", padding: 0, cursor: "pointer",
              color: route === id || (id === "menu" && route === "product") ? "var(--gold)" : "var(--text-dim)",
              fontFamily: "inherit", fontSize: "inherit", letterSpacing: "inherit", textTransform: "inherit",
              position: "relative",
            }}>
              {label}
              {(route === id || (id === "menu" && route === "product")) && (
                <span style={{
                  position: "absolute", left: 0, right: 0, bottom: -8, height: 1,
                  background: "var(--gold)",
                }}/>
              )}
            </button>
          ))}
        </nav>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button onClick={() => go("menu")} className="btn sm ghost" style={{ padding: "10px 16px" }}>
            <Icon.search /> Cerca
          </button>
          <button onClick={() => cart.setOpen(true)} style={{
            position: "relative", background: "none", border: "1px solid var(--line-2)",
            color: "var(--text)", padding: "10px 16px", borderRadius: 999,
            cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
            fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase",
          }}>
            <Icon.bag /> Carrello
            {cart.count > 0 && (
              <span style={{
                background: "var(--accent)", color: "var(--cream)",
                padding: "2px 7px", borderRadius: 999, fontSize: 10, fontWeight: 600,
                fontFamily: "var(--sans)", letterSpacing: 0,
              }}>{cart.count}</span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}

// Brand mark — original geometric ember/flame mark
function Mark({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <circle cx="20" cy="20" r="19" stroke="var(--gold)" strokeWidth="1"/>
      <path d="M20 9 C24 14, 26 17, 26 22 C26 26, 23 29, 20 29 C17 29, 14 26, 14 22 C14 19, 16 17, 17 19 C17 16, 18 13, 20 9 Z"
            fill="var(--accent)" opacity="0.95"/>
      <circle cx="20" cy="23" r="3" fill="var(--gold)"/>
    </svg>
  );
}

// ------------------- FOOTER -------------------
function Footer({ go }) {
  return (
    <footer style={{
      borderTop: "1px solid var(--line)",
      marginTop: 120,
      paddingTop: 80, paddingBottom: 60,
      background: "var(--bg)",
    }}>
      <div className="container">
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 1fr", gap: 56, marginBottom: 80 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
              <Mark size={32}/>
              <span className="display" style={{ fontSize: 28, letterSpacing: "0.34em" }}>BRÀCE</span>
            </div>
            <p className="it" style={{ fontSize: 22, lineHeight: 1.4, color: "var(--text-dim)", maxWidth: 360, margin: 0 }}>
              Una pizzeria di quartiere, in un forno a 485°C, con due mani che sanno cosa fanno.
            </p>
          </div>

          <div>
            <div className="eyebrow" style={{ marginBottom: 18 }}>Orari</div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, fontFamily: "var(--mono)", fontSize: 12, color: "var(--text-dim)" }}>
              {window.HOURS.map(([day, hours]) => (
                <li key={day} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px dashed var(--line)" }}>
                  <span style={{ color: "var(--text)" }}>{day}</span>
                  <span>{hours}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="eyebrow" style={{ marginBottom: 18 }}>Contatto</div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--text-dim)", lineHeight: 2 }}>
              <div style={{ color: "var(--text)" }}>Via dei Forni 14</div>
              <div>20121 Milano</div>
              <div style={{ marginTop: 14 }}>+39 02 5500 8412</div>
              <div>ciao@brace.it</div>
              <div style={{ marginTop: 14, color: "var(--gold)" }}>@brace.milano</div>
            </div>
          </div>

          <div>
            <div className="eyebrow" style={{ marginBottom: 18 }}>Newsletter</div>
            <p style={{ fontSize: 13, color: "var(--text-dim)", marginTop: 0 }}>
              Stagionali e dropping menu, una mail al mese. Niente di più.
            </p>
            <form onSubmit={e => e.preventDefault()} style={{
              display: "flex", borderBottom: "1px solid var(--line-2)", paddingBottom: 6,
            }}>
              <input placeholder="email@cucina.it" style={{
                flex: 1, background: "none", border: "none", outline: "none",
                color: "var(--text)", fontFamily: "var(--mono)", fontSize: 12, padding: "8px 0",
              }}/>
              <button style={{ background: "none", border: "none", color: "var(--gold)", cursor: "pointer" }}>
                <Icon.arrow />
              </button>
            </form>
          </div>
        </div>

        <div className="hr" />
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          paddingTop: 28, fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-faint)",
          letterSpacing: "0.1em",
        }}>
          <div>© 2026 BRÀCE Pizzeria SRL — P.IVA 12345678901</div>
          <div style={{ display: "flex", gap: 24 }}>
            <a style={{ color: "inherit" }}>Privacy</a>
            <a style={{ color: "inherit" }}>Cookies</a>
            <a style={{ color: "inherit" }}>Allergeni</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ------------------- CART DRAWER -------------------
function CartDrawer({ go }) {
  const cart = useCart();
  const toast = useToast();

  return (
    <>
      {/* backdrop */}
      <div onClick={() => cart.setOpen(false)} style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "var(--scrim-overlay)",
        opacity: cart.open ? 1 : 0,
        pointerEvents: cart.open ? "auto" : "none",
        transition: "opacity .3s ease",
        backdropFilter: cart.open ? "blur(4px)" : "none",
      }}/>

      {/* drawer */}
      <aside style={{
        position: "fixed", top: 0, right: 0, bottom: 0,
        width: 460, maxWidth: "92vw",
        background: "var(--bg-2)",
        borderLeft: "1px solid var(--line)",
        zIndex: 201,
        transform: cart.open ? "translateX(0)" : "translateX(100%)",
        transition: "transform .45s cubic-bezier(.2,.7,.2,1)",
        display: "flex", flexDirection: "column",
      }}>
        <div style={{
          padding: "26px 28px", display: "flex", alignItems: "center", justifyContent: "space-between",
          borderBottom: "1px solid var(--line)",
        }}>
          <div>
            <div className="eyebrow">Il tuo carrello</div>
            <div className="display" style={{ fontSize: 28, marginTop: 4 }}>
              {cart.count} {cart.count === 1 ? "pezzo" : "pezzi"}
            </div>
          </div>
          <button onClick={() => cart.setOpen(false)} style={{
            background: "none", border: "1px solid var(--line-2)", color: "var(--text)",
            width: 38, height: 38, borderRadius: 999, cursor: "pointer",
            display: "grid", placeItems: "center",
          }}><Icon.close /></button>
        </div>

        {/* delivery toggle */}
        <div style={{ padding: "20px 28px", borderBottom: "1px solid var(--line)" }}>
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0,
            background: "var(--bg-3)", borderRadius: 999, padding: 4,
          }}>
            {["delivery", "pickup"].map(k => (
              <button key={k} onClick={() => cart.setDelivery(k)} style={{
                padding: "10px 14px", borderRadius: 999, border: "none", cursor: "pointer",
                background: cart.delivery === k ? "var(--text)" : "transparent",
                color: cart.delivery === k ? "var(--bg)" : "var(--text-dim)",
                fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase",
                transition: "all .2s ease",
              }}>{k === "delivery" ? "Consegna" : "Ritiro"}</button>
            ))}
          </div>
        </div>

        {/* items */}
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 28px" }}>
          {cart.lines.length === 0 ? (
            <div style={{ textAlign: "center", padding: "80px 0", color: "var(--text-faint)" }}>
              <Icon.bag size={32}/>
              <div className="display" style={{ fontSize: 24, marginTop: 18, color: "var(--text-dim)" }}>Carrello vuoto</div>
              <button onClick={() => { cart.setOpen(false); go("menu"); }} className="btn ghost" style={{ marginTop: 24 }}>
                Vedi il menu
              </button>
            </div>
          ) : cart.lines.map(line => (
            <div key={line.uid} style={{
              display: "grid", gridTemplateColumns: "60px 1fr auto", gap: 16,
              padding: "20px 0", borderBottom: "1px solid var(--line)", alignItems: "center",
            }}>
              <div style={{ width: 60, height: 60, position: "relative" }}>
                <div className="pizza-plate" style={{ width: 60, height: 60 }}>
                  <div className="crust-glow"/>
                </div>
              </div>
              <div>
                <div className="display" style={{ fontSize: 17, marginBottom: 4 }}>{line.item.name}</div>
                <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-faint)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  {(window.VARIANTS.find(v => v.id === line.variant) || {}).label} · {(window.DOUGHS.find(d => d.id === line.dough) || {}).label}
                </div>
                <div style={{
                  display: "flex", alignItems: "center", gap: 8, marginTop: 10,
                }}>
                  <button onClick={() => cart.update(line.uid, line.qty - 1)} style={qtyBtn}><Icon.minus/></button>
                  <span style={{ minWidth: 16, textAlign: "center", fontFamily: "var(--mono)", fontSize: 12 }}>{line.qty}</span>
                  <button onClick={() => cart.update(line.uid, line.qty + 1)} style={qtyBtn}><Icon.plus/></button>
                  <button onClick={() => cart.remove(line.uid)} style={{
                    marginLeft: 6, background: "none", border: "none", color: "var(--text-faint)",
                    cursor: "pointer", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase",
                    fontFamily: "var(--mono)",
                  }}>Rimuovi</button>
                </div>
              </div>
              <div className="display" style={{ fontSize: 18 }}>{fmt(line.total)}</div>
            </div>
          ))}
        </div>

        {/* totals */}
        {cart.lines.length > 0 && (
          <div style={{ padding: "20px 28px", borderTop: "1px solid var(--line)", background: "var(--bg)" }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              <input value={cart.promo} onChange={e => cart.setPromo(e.target.value)} placeholder="Codice promo · BRACE10"
                style={{
                  flex: 1, background: "var(--bg-3)", border: "1px solid var(--line)",
                  color: "var(--text)", padding: "12px 14px", borderRadius: 8,
                  fontFamily: "var(--mono)", fontSize: 12, outline: "none",
                }}/>
              <button onClick={() => toast(cart.promoDiscount > 0 ? "Codice applicato — 10% di sconto" : "Codice non valido", cart.promoDiscount > 0 ? "ok" : "info")}
                className="btn sm ghost">Applica</button>
            </div>

            <Row label="Subtotale" value={fmt(cart.subtotal)} />
            {cart.promoDiscount > 0 && <Row label="Sconto" value={"−" + fmt(cart.promoDiscount)} accent />}
            <Row label={cart.delivery === "delivery" ? "Consegna" : "Ritiro in negozio"} value={cart.deliveryFee === 0 ? "Gratis" : fmt(cart.deliveryFee)} />
            <Row label="IVA inclusa" value={fmt(cart.tax)} muted />
            <div style={{ height: 1, background: "var(--line-2)", margin: "12px 0" }}/>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 18 }}>
              <span className="eyebrow">Totale</span>
              <span className="display" style={{ fontSize: 32 }}>{fmt(cart.total)}</span>
            </div>
            <button onClick={() => { cart.setOpen(false); go("checkout"); }} className="btn ember"
              style={{ width: "100%", justifyContent: "center", padding: "16px 22px", fontSize: 12 }}>
              Procedi al checkout <Icon.arrow/>
            </button>
            <div style={{
              marginTop: 12, fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-faint)",
              textAlign: "center", letterSpacing: "0.12em", textTransform: "uppercase",
            }}>
              Consegna gratuita oltre €40
            </div>
          </div>
        )}
      </aside>
    </>
  );
}

const qtyBtn = {
  width: 24, height: 24, borderRadius: 999,
  border: "1px solid var(--line-2)", background: "transparent",
  color: "var(--text)", cursor: "pointer",
  display: "grid", placeItems: "center",
};

function Row({ label, value, muted, accent }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between",
      fontFamily: "var(--mono)", fontSize: 12,
      padding: "6px 0",
      color: muted ? "var(--text-faint)" : accent ? "var(--gold)" : "var(--text-dim)",
    }}>
      <span>{label}</span>
      <span style={{ color: accent ? "var(--gold)" : muted ? "var(--text-faint)" : "var(--text)" }}>{value}</span>
    </div>
  );
}

// ------------------- FLOATING CART BUTTON (mobile-ish) -------------------
function FloatingCart() {
  const cart = useCart();
  if (cart.count === 0 || cart.open) return null;
  return (
    <button onClick={() => cart.setOpen(true)} style={{
      position: "fixed", bottom: 28, right: 28, zIndex: 90,
      background: "var(--accent)", color: "var(--cream)",
      border: "none", borderRadius: 999, padding: "14px 22px",
      display: "flex", alignItems: "center", gap: 10,
      boxShadow: "0 16px 40px rgba(192,57,43,0.35), 0 0 0 1px rgba(255,255,255,0.06) inset",
      cursor: "pointer", fontFamily: "var(--mono)", fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase",
    }}>
      <Icon.bag/>
      <span style={{ fontFamily: "var(--sans)", fontWeight: 600 }}>{cart.count}</span>
      <span style={{ width: 1, height: 14, background: "rgba(255,255,255,0.3)" }}/>
      <span>{fmt(cart.total)}</span>
    </button>
  );
}

// ------------------- PIZZA CARD -------------------
function PizzaCard({ item, onClick, onAdd }) {
  const [hover, setHover] = useState(false);
  return (
    <article
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onClick}
      style={{
        background: "var(--bg-2)",
        border: "1px solid " + (hover ? "var(--line-2)" : "var(--line)"),
        padding: 28,
        cursor: "pointer",
        position: "relative",
        transition: "all .35s ease",
        transform: hover ? "translateY(-4px)" : "translateY(0)",
        overflow: "hidden",
      }}>
      {item.badge && (
        <div style={{
          position: "absolute", top: 18, right: 18,
          fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase",
          color: "var(--gold)", border: "1px solid var(--gold-deep)",
          padding: "4px 10px", borderRadius: 999,
        }}>{item.badge}</div>
      )}

      <div style={{ position: "relative", marginBottom: 22 }}>
        <div className="pizza-plate" style={{
          maxWidth: 220, margin: "0 auto",
          transform: hover ? "rotate(6deg) scale(1.04)" : "rotate(0) scale(1)",
          transition: "transform .6s cubic-bezier(.2,.7,.2,1)",
        }}>
          <div className="crust-glow"/>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6, gap: 14 }}>
        <h3 className="display" style={{ fontSize: 26, margin: 0, letterSpacing: 0, lineHeight: 1.05, flex: 1, minWidth: 0 }}>{item.name}</h3>
        <span className="display" style={{ fontSize: 22, color: "var(--gold)", whiteSpace: "nowrap" }}>{fmt(item.price)}</span>
      </div>

      <p className="it" style={{ fontSize: 16, color: "var(--text-dim)", margin: "0 0 14px", lineHeight: 1.4 }}>
        {item.tagline}
      </p>

      <div style={{
        fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-faint)",
        letterSpacing: "0.08em", lineHeight: 1.8,
        minHeight: 40,
      }}>
        {item.ingredients.slice(0, 3).join(" · ")}
      </div>

      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginTop: 22, paddingTop: 18, borderTop: "1px solid var(--line)",
      }}>
        <span style={{ fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-dim)" }}>
          Vedi dettaglio
        </span>
        <button onClick={(e) => { e.stopPropagation(); onAdd(item); }} style={{
          background: hover ? "var(--gold)" : "var(--bg-3)",
          color: hover ? "var(--bg)" : "var(--text)",
          border: "none", width: 38, height: 38, borderRadius: 999,
          cursor: "pointer", display: "grid", placeItems: "center",
          transition: "all .25s ease",
        }}>
          <Icon.plus/>
        </button>
      </div>
    </article>
  );
}

// ------------------- SECTION HEADING -------------------
function SectionHead({ eyebrow, title, kicker, align = "left" }) {
  return (
    <div style={{ textAlign: align, marginBottom: 56 }}>
      <div className="eyebrow" style={{ marginBottom: 18 }}>{eyebrow}</div>
      <h2 className="display" style={{
        fontSize: "clamp(40px, 6vw, 84px)",
        lineHeight: 1.0,
        margin: 0,
        letterSpacing: "-0.005em",
      }}>{title}</h2>
      {kicker && (
        <p className="it" style={{
          fontSize: 22, color: "var(--text-dim)", maxWidth: 620,
          marginTop: 20, marginLeft: align === "center" ? "auto" : 0, marginRight: align === "center" ? "auto" : 0,
          lineHeight: 1.4,
        }}>{kicker}</p>
      )}
    </div>
  );
}

Object.assign(window, {
  CartProvider, useCart, ToastProvider, useToast,
  Nav, Footer, CartDrawer, FloatingCart,
  PizzaCard, SectionHead, Mark, Icon, fmt,
});
