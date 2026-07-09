// Account dashboard for BRÀCE

const { useState: useState_a } = React;

function AccountScreen({ go }) {
  const [tab, setTab] = useState_a("orders");
  const cart = window.useCart();

  const profile = {
    name: "Marco Rossi",
    email: "marco.rossi@email.it",
    phone: "+39 348 1234 567",
    since: "Gennaio 2024",
    points: 1284,
    tier: "Antica",
    nextTier: "Maestra",
  };

  const orders = [
    { id: "BR-90432", date: "12 Mag 2026", status: "Consegnato", total: 38.50, items: ["Margherita D.O.P. ×2", "Aperol Spritz"] },
    { id: "BR-90118", date: "3 Mag 2026", status: "Consegnato", total: 52.00, items: ["Tartufo Bianco", "Bianca Romana", "Barolo 2018 (calice)"] },
    { id: "BR-89832", date: "26 Apr 2026", status: "Consegnato", total: 27.40, items: ["Diavola Nera", "Negroni"] },
    { id: "BR-89544", date: "18 Apr 2026", status: "Consegnato", total: 64.20, items: ["Fico & Prosciutto ×2", "Porcini & Anatra", "San Pellegrino"] },
  ];

  const addresses = [
    { id: "a1", label: "Casa", street: "Via Tortona 27", city: "Milano 20144", default: true },
    { id: "a2", label: "Ufficio", street: "Via Larga 15", city: "Milano 20122", default: false },
  ];

  const favorites = window.PIZZAS.slice(0, 4);

  return (
    <main style={{ paddingTop: 130, paddingBottom: 80 }}>
      <div className="container">
        {/* header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", borderBottom: "1px solid var(--line)", paddingBottom: 40 }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 18 }}>Il tuo account</div>
            <h1 className="display" style={{ fontSize: "clamp(56px, 9vw, 124px)", lineHeight: 0.92, margin: 0 }}>
              Ciao,<br/>
              <span className="it" style={{ color: "var(--gold)", fontWeight: 300 }}>{profile.name.split(" ")[0]}.</span>
            </h1>
          </div>
          <button className="btn ghost">Esci <Icon.arrow className="arrow"/></button>
        </div>

        {/* loyalty card */}
        <div style={{
          marginTop: 40, padding: 36,
          background: "var(--feature-card)",
          border: "1px solid var(--gold-deep)",
          display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 60, alignItems: "center",
          position: "relative", overflow: "hidden",
        }}>
          <div style={{
            position: "absolute", inset: 0,
            background: "radial-gradient(500px 300px at 100% 0%, rgba(212,163,115,0.18), transparent 60%)",
          }}/>
          <div style={{ position: "relative" }}>
            <div className="eyebrow" style={{ marginBottom: 14 }}>Tessera Brace · {profile.tier}</div>
            <div className="display" style={{ fontSize: 72, lineHeight: 1, color: "var(--gold)" }}>{profile.points} pt</div>
            <p style={{ color: "var(--text-dim)", marginTop: 14, maxWidth: 360 }}>
              Ancora <strong style={{ color: "var(--gold)" }}>216 punti</strong> per il livello <strong>{profile.nextTier}</strong> — pizza in regalo a ogni terzo ordine.
            </p>

            {/* progress bar */}
            <div style={{ marginTop: 24, height: 4, background: "var(--bg)", border: "1px solid var(--line-2)" }}>
              <div style={{ width: "85%", height: "100%", background: "linear-gradient(90deg, var(--accent), var(--gold))" }}/>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-faint)", letterSpacing: "0.16em", textTransform: "uppercase" }}>
              <span>{profile.tier} · 1000pt</span>
              <span>{profile.nextTier} · 1500pt</span>
            </div>
          </div>

          <div style={{ position: "relative", textAlign: "right" }}>
            <div className="mono" style={{ fontSize: 11, color: "var(--text-faint)", letterSpacing: "0.16em", textTransform: "uppercase" }}>
              Cliente dal · {profile.since}
            </div>
            <div className="display" style={{ fontSize: 48, marginTop: 14 }}>{profile.name}</div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-dim)", marginTop: 4, letterSpacing: "0.1em" }}>
              {profile.email}
            </div>

            <div style={{
              marginTop: 24, display: "inline-block",
              fontFamily: "var(--mono)", fontSize: 12, color: "var(--gold)",
              padding: "8px 16px", border: "1px solid var(--gold-deep)", borderRadius: 999,
              letterSpacing: "0.16em", textTransform: "uppercase",
            }}>
              ★ Cliente affezionato
            </div>
          </div>
        </div>

        {/* tabs */}
        <div style={{
          marginTop: 50, display: "flex", gap: 0,
          borderBottom: "1px solid var(--line)", overflowX: "auto",
        }}>
          {[
            ["orders", "Ordini", "12"],
            ["favorites", "Preferite", "4"],
            ["addresses", "Indirizzi", "2"],
            ["profile", "Profilo", ""],
            ["notifications", "Notifiche", "3"],
            ["admin", "Admin", ""],
          ].map(([k, l, c]) => (
            <button key={k} onClick={() => setTab(k)} style={{
              padding: "18px 24px", background: "none", border: "none", color: tab === k ? "var(--gold)" : "var(--text-dim)",
              cursor: "pointer", fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase",
              borderBottom: "1px solid " + (tab === k ? "var(--gold)" : "transparent"),
              marginBottom: -1, display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap",
            }}>
              {l}
              {c && <span style={{ background: "var(--bg-3)", color: "var(--text-faint)", padding: "2px 8px", borderRadius: 999, fontSize: 10 }}>{c}</span>}
            </button>
          ))}
        </div>

        <div style={{ marginTop: 48 }}>
          {tab === "orders" && <OrdersTab orders={orders} go={go} cart={cart}/>}
          {tab === "favorites" && <FavoritesTab favorites={favorites} go={go} cart={cart}/>}
          {tab === "addresses" && <AddressesTab addresses={addresses}/>}
          {tab === "profile" && <ProfileTab profile={profile}/>}
          {tab === "notifications" && <NotificationsTab/>}
          {tab === "admin" && <AdminTab/>}
        </div>
      </div>
    </main>
  );
}

function OrdersTab({ orders, go, cart }) {
  const toast = window.useToast();
  return (
    <div>
      <div style={{ border: "1px solid var(--line)" }}>
        {orders.map((o, i) => (
          <div key={o.id} style={{
            display: "grid", gridTemplateColumns: "160px 1.2fr 1fr 120px 200px",
            gap: 24, padding: "26px 28px",
            borderBottom: i < orders.length - 1 ? "1px solid var(--line)" : "none",
            background: i === 0 ? "var(--bg-2)" : "var(--bg)",
            alignItems: "center",
          }}>
            <div>
              <div className="mono" style={{ fontSize: 11, color: "var(--gold)", letterSpacing: "0.16em" }}>{o.id}</div>
              <div className="mono" style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 6, letterSpacing: "0.1em" }}>{o.date}</div>
            </div>
            <div style={{ fontSize: 14, color: "var(--text-dim)" }}>
              {o.items.join(" · ")}
            </div>
            <div className="mono" style={{ fontSize: 11, color: "var(--ok)", letterSpacing: "0.14em", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--ok)" }}/> {o.status}
            </div>
            <div className="display" style={{ fontSize: 26, color: "var(--gold)" }}>{window.fmt(o.total)}</div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button className="btn sm ghost" onClick={() => toast("Ordine ripetuto al carrello", "ok")}>Riordina</button>
              <button className="btn sm">Dettagli</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FavoritesTab({ favorites, go, cart }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 24 }}>
      {favorites.map(item => (
        <window.PizzaCard
          key={item.id} item={item}
          onClick={() => { window.__app_setProduct(item.id); go("product"); }}
          onAdd={(it) => cart.add({ itemId: it.id, variant: "14", dough: "napoletana", qty: 1 })}
        />
      ))}
    </div>
  );
}

function AddressesTab({ addresses }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
      {addresses.map(a => (
        <div key={a.id} style={{
          padding: 28, background: "var(--bg-2)",
          border: "1px solid " + (a.default ? "var(--gold-deep)" : "var(--line)"),
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 18 }}>
            <span className="eyebrow">{a.label}</span>
            {a.default && (
              <span className="mono" style={{ fontSize: 10, color: "var(--gold)", letterSpacing: "0.16em", textTransform: "uppercase" }}>Predefinito</span>
            )}
          </div>
          <div className="display" style={{ fontSize: 26 }}>{a.street}</div>
          <div className="mono" style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 8, letterSpacing: "0.08em" }}>{a.city}</div>
          <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
            <button className="btn sm ghost">Modifica</button>
            <button className="btn sm ghost">Elimina</button>
          </div>
        </div>
      ))}

      <button style={{
        padding: 28, background: "transparent",
        border: "1px dashed var(--line-2)", color: "var(--text-dim)",
        cursor: "pointer", display: "grid", placeItems: "center",
        minHeight: 200,
      }}>
        <div>
          <Icon.plus style={{ width: 24, height: 24 }}/>
          <div className="mono" style={{ fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", marginTop: 10 }}>Nuovo indirizzo</div>
        </div>
      </button>
    </div>
  );
}

function ProfileTab({ profile }) {
  return (
    <div style={{ maxWidth: 640 }}>
      <div className="eyebrow" style={{ marginBottom: 24 }}>Informazioni personali</div>
      <div style={{ display: "grid", gap: 1, background: "var(--line)", border: "1px solid var(--line)" }}>
        {[
          ["Nome completo", profile.name],
          ["Email", profile.email],
          ["Telefono", profile.phone],
          ["Cliente dal", profile.since],
          ["Password", "•••••••••••", "Modifica"],
          ["Newsletter", "Sì, una al mese", "Disattiva"],
        ].map(([k, v, action]) => (
          <div key={k} style={{
            background: "var(--bg)", padding: "22px 28px",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <div>
              <div className="mono" style={{ fontSize: 10, color: "var(--text-faint)", letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 6 }}>{k}</div>
              <div style={{ fontSize: 16 }}>{v}</div>
            </div>
            <button className="btn sm ghost">{action || "Modifica"}</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function NotificationsTab() {
  const notifs = [
    { kind: "order", title: "Il tuo ordine BR-90432 è stato consegnato", time: "12 minuti fa", unread: true },
    { kind: "promo", title: "Hai guadagnato 50 punti tessera", time: "1 ora fa", unread: true },
    { kind: "menu", title: "Nuovo arrivo · Fico & Prosciutto è di nuovo disponibile", time: "ieri", unread: true },
    { kind: "promo", title: "Codice BRACE10 — 10% di sconto sul prossimo ordine", time: "3 giorni fa", unread: false },
    { kind: "menu", title: "Le pizze stagionali d'autunno sono qui", time: "1 settimana fa", unread: false },
  ];
  return (
    <div style={{ maxWidth: 760 }}>
      {notifs.map((n, i) => (
        <div key={i} style={{
          padding: "22px 24px", display: "flex", gap: 18, alignItems: "center",
          borderBottom: "1px solid var(--line)",
          background: n.unread ? "var(--bg-2)" : "transparent",
        }}>
          <span style={{
            width: 8, height: 8, borderRadius: 999,
            background: n.unread ? "var(--gold)" : "transparent",
            border: "1px solid " + (n.unread ? "var(--gold)" : "var(--line-2)"),
          }}/>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15 }}>{n.title}</div>
            <div className="mono" style={{ fontSize: 11, color: "var(--text-faint)", letterSpacing: "0.1em", marginTop: 6 }}>
              {n.time} · {n.kind}
            </div>
          </div>
          <button style={{ background: "none", border: "none", color: "var(--text-faint)", cursor: "pointer" }}>
            <Icon.close/>
          </button>
        </div>
      ))}
    </div>
  );
}

function AdminTab() {
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
        {[
          ["€8,420", "Ricavi · oggi", "+12%"],
          ["68", "Ordini · oggi", "+4"],
          ["18 min", "Tempo medio", "−2 min"],
          ["4.9 / 5", "Soddisfazione", "127 nuove"],
        ].map(([v, l, d]) => (
          <div key={l} style={{ background: "var(--bg-2)", border: "1px solid var(--line)", padding: 28 }}>
            <div className="display" style={{ fontSize: 36, color: "var(--gold)" }}>{v}</div>
            <div className="mono" style={{ fontSize: 11, color: "var(--text-dim)", letterSpacing: "0.14em", textTransform: "uppercase", marginTop: 8 }}>{l}</div>
            <div className="mono" style={{ fontSize: 11, color: "var(--ok)", marginTop: 4, letterSpacing: "0.1em" }}>↑ {d}</div>
          </div>
        ))}
      </div>

      {/* fake chart */}
      <div style={{ background: "var(--bg-2)", border: "1px solid var(--line)", padding: 28, marginBottom: 32 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 30 }}>
          <div>
            <div className="eyebrow">Ordini · settimana</div>
            <div className="display" style={{ fontSize: 32, marginTop: 10 }}>412 ordini</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn sm ghost">7g</button>
            <button className="btn sm">30g</button>
            <button className="btn sm ghost">Anno</button>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end", height: 200, paddingTop: 20 }}>
          {[42, 38, 55, 47, 62, 78, 90].map((h, i) => (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
              <div style={{
                width: "100%", height: h + "%",
                background: i === 6 ? "var(--gold)" : "var(--bg-3)",
                border: "1px solid " + (i === 6 ? "var(--gold-deep)" : "var(--line-2)"),
              }}/>
              <div className="mono" style={{ fontSize: 10, color: "var(--text-faint)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                {["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"][i]}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        {[
          ["Prodotti", "12 attivi · 4 stagionali · 4 bevande", "Gestisci"],
          ["Coupon", "BRACE10 attivo · 3 in scadenza", "Gestisci"],
          ["Zone di consegna", "Raggio 3km · 2 zone speciali", "Gestisci"],
        ].map(([t, sub, a]) => (
          <div key={t} style={{ background: "var(--bg-2)", border: "1px solid var(--line)", padding: 24 }}>
            <div className="display" style={{ fontSize: 24, marginBottom: 8 }}>{t}</div>
            <div className="mono" style={{ fontSize: 11, color: "var(--text-dim)", letterSpacing: "0.08em", lineHeight: 1.6 }}>{sub}</div>
            <button className="btn sm" style={{ marginTop: 18 }}>{a} <Icon.arrow className="arrow"/></button>
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { AccountScreen });
