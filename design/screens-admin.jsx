// BRÀCE — Admin dashboard (its own route, distinct chrome from customer app)

const { useState: useState_ad, useMemo: useMemo_ad } = React;

function AdminScreen({ go }) {
  const [section, setSection] = useState_ad("dashboard");
  const [orderId, setOrderId] = useState_ad(null);

  const openSection = (s) => { setOrderId(null); setSection(s); };

  return (
    <div style={{
      paddingTop: 78, minHeight: "100vh",
      background: "var(--bg)",
      display: "grid", gridTemplateColumns: "260px 1fr",
    }}>
      <AdminSidebar section={section} setSection={openSection} go={go}/>
      <div style={{ borderLeft: "1px solid var(--line)" }}>
        <AdminTopBar section={section} orderId={orderId}/>
        <div style={{ padding: "40px 48px" }}>
          {section === "dashboard"  && <AdminDashboard openOrder={(id) => { setSection("orders"); setOrderId(id); }}/>}
          {section === "orders"     && (orderId
            ? <window.AdminOrderDetail id={orderId} onBack={() => setOrderId(null)}/>
            : <AdminOrders openOrder={setOrderId}/>)}
          {section === "products"   && <AdminProducts/>}
          {section === "pages"      && <window.AdminPages/>}
          {section === "coupons"    && <AdminCoupons/>}
          {section === "zones"      && <window.AdminZonesV2/>}
          {section === "customers"  && <AdminCustomers/>}
          {section === "settings"   && <AdminSettings/>}
        </div>
      </div>
    </div>
  );
}

// ---------------- SIDEBAR ----------------
function AdminSidebar({ section, setSection, go }) {
  const items = [
    { id: "dashboard",  label: "Dashboard",     icon: "▦", count: null },
    { id: "orders",     label: "Ordini",        icon: "◷", count: 12 },
    { id: "products",   label: "Prodotti",      icon: "◐", count: 16 },
    { id: "pages",      label: "Pagine",        icon: "▱", count: 7 },
    { id: "coupons",    label: "Coupon",        icon: "✦", count: 3 },
    { id: "zones",      label: "Zone consegna", icon: "◯", count: null },
    { id: "customers",  label: "Clienti",       icon: "◉", count: 847 },
    { id: "settings",   label: "Impostazioni",  icon: "◇", count: null },
  ];

  return (
    <aside style={{
      position: "sticky", top: 78, height: "calc(100vh - 78px)",
      background: "var(--bg-2)", padding: "30px 0",
      display: "flex", flexDirection: "column",
    }}>
      <div style={{ padding: "0 28px 28px", borderBottom: "1px solid var(--line)" }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>Console · v2.4</div>
        <div className="display" style={{ fontSize: 26, lineHeight: 1, letterSpacing: "0.02em" }}>Amministrazione</div>
        <div className="mono" style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 10, letterSpacing: "0.08em" }}>
          Sannino, A. · Owner
        </div>
      </div>

      <nav style={{ padding: "20px 12px", flex: 1 }}>
        {items.map(it => (
          <button key={it.id} onClick={() => setSection(it.id)} style={{
            width: "100%", display: "flex", alignItems: "center", gap: 14,
            padding: "12px 16px", marginBottom: 2,
            background: section === it.id ? "var(--bg-3)" : "transparent",
            border: "1px solid " + (section === it.id ? "var(--line-2)" : "transparent"),
            color: section === it.id ? "var(--gold)" : "var(--text-dim)",
            cursor: "pointer", textAlign: "left",
            fontFamily: "var(--mono)", fontSize: 12, letterSpacing: "0.06em",
            textTransform: "uppercase",
            transition: "all .15s ease",
          }}>
            <span style={{ width: 18, textAlign: "center", color: section === it.id ? "var(--gold)" : "var(--text-faint)" }}>{it.icon}</span>
            <span style={{ flex: 1 }}>{it.label}</span>
            {it.count !== null && (
              <span style={{
                background: section === it.id ? "var(--accent)" : "var(--bg)",
                color: section === it.id ? "var(--cream)" : "var(--text-faint)",
                padding: "2px 8px", borderRadius: 999, fontSize: 10,
                fontFamily: "var(--sans)", letterSpacing: 0,
              }}>{it.count}</span>
            )}
          </button>
        ))}
      </nav>

      <div style={{ padding: "20px 28px", borderTop: "1px solid var(--line)" }}>
        <button onClick={() => go("home")} className="btn sm ghost" style={{ width: "100%", justifyContent: "center" }}>
          ← Torna al sito
        </button>
      </div>
    </aside>
  );
}

// ---------------- TOP BAR ----------------
function AdminTopBar({ section, orderId }) {
  const titles = {
    dashboard: "Panoramica",
    orders: orderId ? "Dettaglio ordine" : "Tutti gli ordini",
    products: "Catalogo prodotti",
    pages: "Pagine del sito",
    coupons: "Codici sconto",
    zones: "Zone di consegna",
    customers: "Clienti",
    settings: "Impostazioni",
  };
  return (
    <div style={{
      padding: "26px 48px", borderBottom: "1px solid var(--line)",
      display: "flex", justifyContent: "space-between", alignItems: "center",
      background: "var(--scrim-blur)", backdropFilter: "blur(20px)",
      position: "sticky", top: 78, zIndex: 30,
    }}>
      <div>
        <div className="eyebrow" style={{ marginBottom: 6 }}>{section}</div>
        <h1 className="display" style={{ fontSize: 32, margin: 0, lineHeight: 1 }}>{titles[section]}</h1>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "10px 16px", border: "1px solid var(--line)", borderRadius: 999,
          minWidth: 280,
        }}>
          <Icon.search style={{ color: "var(--text-faint)" }}/>
          <input placeholder="Cerca ordini, prodotti, clienti…" style={{
            flex: 1, background: "none", border: "none", outline: "none", color: "var(--text)",
            fontFamily: "var(--mono)", fontSize: 12,
          }}/>
          <span className="mono" style={{ fontSize: 10, color: "var(--text-faint)", border: "1px solid var(--line-2)", padding: "2px 6px", borderRadius: 4 }}>⌘K</span>
        </div>
        <button className="btn sm ghost" style={{ position: "relative" }}>
          <Icon.flame/> Live · 8 attivi
          <span style={{
            position: "absolute", top: -3, right: -3, width: 8, height: 8, borderRadius: 999,
            background: "var(--accent)", boxShadow: "0 0 0 3px rgba(192,57,43,0.25)",
          }}/>
        </button>
        <div style={{
          width: 36, height: 36, borderRadius: 999, background: "var(--gold)",
          color: "var(--bg)", display: "grid", placeItems: "center",
          fontFamily: "var(--serif)", fontSize: 18,
        }}>A</div>
      </div>
    </div>
  );
}

// ---------------- DASHBOARD ----------------
function AdminDashboard({ openOrder }) {
  const live = [
    { id: "BR-90518", time: "ora",         status: "in-forno",   customer: "L. Bianchi",  items: "Margherita ×2", total: 32.00 },
    { id: "BR-90517", time: "2 min fa",    status: "partito",    customer: "G. Conti",    items: "Diavola Nera, Cacio e Pepe", total: 35.00 },
    { id: "BR-90516", time: "4 min fa",    status: "in-forno",   customer: "S. Romano",   items: "Tartufo Bianco, Negroni", total: 46.00 },
    { id: "BR-90515", time: "8 min fa",    status: "confermato", customer: "P. De Luca",  items: "Bianca Romana ×3", total: 48.00 },
    { id: "BR-90514", time: "12 min fa",   status: "consegnato", customer: "A. Ferrara",  items: "Fico & Prosciutto", total: 22.00 },
    { id: "BR-90513", time: "18 min fa",   status: "consegnato", customer: "M. Greco",    items: "Zucca & Salvia ×2, Spritz", total: 52.00 },
  ];

  const statusColor = {
    "confermato": ["var(--gold)", "rgba(212,163,115,0.12)"],
    "in-forno":   ["var(--accent)", "rgba(192,57,43,0.15)"],
    "partito":    ["#6f9ae0", "rgba(111,154,224,0.12)"],
    "consegnato": ["var(--ok)", "rgba(127,174,108,0.12)"],
  };

  return (
    <>
      {/* KPI row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
        {[
          ["Ricavi · oggi",   "€ 8.420",   "+12%",  "vs. 7gg",  68],
          ["Ordini · oggi",   "68",        "+4",    "ieri 64",  72],
          ["Tempo medio",     "18 min",    "−2 min", "consegna", 85],
          ["NPS",             "78",        "+6",     "questa sett.", 78],
        ].map(([t, v, d, sub, fill]) => (
          <div key={t} style={{
            background: "var(--bg-2)", border: "1px solid var(--line)", padding: 24,
            position: "relative", overflow: "hidden",
          }}>
            <div className="eyebrow" style={{ marginBottom: 14 }}>{t}</div>
            <div className="display" style={{ fontSize: 44, lineHeight: 1, color: "var(--text)" }}>{v}</div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 18, fontFamily: "var(--mono)", fontSize: 11 }}>
              <span style={{ color: "var(--ok)" }}>↑ {d}</span>
              <span style={{ color: "var(--text-faint)" }}>{sub}</span>
            </div>
            <div style={{ marginTop: 12, height: 3, background: "var(--bg-3)" }}>
              <div style={{ width: fill + "%", height: "100%", background: "var(--gold)" }}/>
            </div>
          </div>
        ))}
      </div>

      {/* Chart + top products */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 28 }}>
        <div style={{ background: "var(--bg-2)", border: "1px solid var(--line)", padding: 28 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 30 }}>
            <div>
              <div className="eyebrow" style={{ marginBottom: 10 }}>Ricavi · ultime 4 settimane</div>
              <div className="display" style={{ fontSize: 40, lineHeight: 1 }}>€ 38.140</div>
              <div className="mono" style={{ fontSize: 11, color: "var(--ok)", marginTop: 6, letterSpacing: "0.1em" }}>↑ +18% mese su mese</div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button className="btn sm ghost">7g</button>
              <button className="btn sm">30g</button>
              <button className="btn sm ghost">Anno</button>
            </div>
          </div>

          {/* Line/area chart */}
          <RevenueChart/>
        </div>

        <div style={{ background: "var(--bg-2)", border: "1px solid var(--line)", padding: 28 }}>
          <div className="eyebrow" style={{ marginBottom: 22 }}>Top prodotti · settimana</div>
          {[
            ["Margherita D.O.P.",   118, 0.92],
            ["Diavola Nera",         86, 0.74],
            ["Bianca Romana",        62, 0.54],
            ["Tartufo Bianco",       41, 0.36],
            ["Fico & Prosciutto",    38, 0.32],
          ].map(([n, c, w], i) => (
            <div key={n} style={{ marginBottom: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--mono)", fontSize: 11, marginBottom: 6 }}>
                <span style={{ color: "var(--text)" }}>{i + 1}. {n}</span>
                <span style={{ color: "var(--gold)" }}>{c}</span>
              </div>
              <div style={{ height: 4, background: "var(--bg-3)" }}>
                <div style={{ width: (w * 100) + "%", height: "100%", background: i === 0 ? "var(--accent)" : "var(--gold-deep)" }}/>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Live orders feed */}
      <div style={{ background: "var(--bg-2)", border: "1px solid var(--line)" }}>
        <div style={{
          padding: "20px 28px", borderBottom: "1px solid var(--line)",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{
              width: 8, height: 8, borderRadius: 999, background: "var(--accent)",
              boxShadow: "0 0 0 4px rgba(192,57,43,0.2)",
              animation: "float 1.6s ease-in-out infinite",
            }}/>
            <span className="display" style={{ fontSize: 22 }}>Live feed</span>
            <span className="mono" style={{ fontSize: 11, color: "var(--text-faint)", letterSpacing: "0.14em", textTransform: "uppercase" }}>aggiornato ora</span>
          </div>
          <button onClick={() => openOrder && openOrder("BR-90518")} className="btn sm ghost">Vedi tutti gli ordini <Icon.arrow className="arrow"/></button>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--text-faint)" }}>
              <th style={th}>Ordine</th>
              <th style={th}>Quando</th>
              <th style={th}>Cliente</th>
              <th style={th}>Articoli</th>
              <th style={th}>Stato</th>
              <th style={{ ...th, textAlign: "right" }}>Totale</th>
              <th style={{ ...th, width: 60 }}></th>
            </tr>
          </thead>
          <tbody>
            {live.map(o => {
              const [color, bg] = statusColor[o.status];
              return (
                <tr key={o.id} style={{ borderTop: "1px solid var(--line)" }}>
                  <td style={{ ...td, fontFamily: "var(--mono)", color: "var(--gold)" }}>{o.id}</td>
                  <td style={{ ...td, color: "var(--text-dim)" }}>{o.time}</td>
                  <td style={td}>{o.customer}</td>
                  <td style={{ ...td, color: "var(--text-dim)" }}>{o.items}</td>
                  <td style={td}>
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: 8,
                      padding: "5px 10px", background: bg, color,
                      fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase",
                      borderRadius: 999,
                    }}>
                      <span style={{ width: 5, height: 5, borderRadius: 999, background: color }}/>
                      {o.status.replace("-", " ")}
                    </span>
                  </td>
                  <td style={{ ...td, textAlign: "right", fontFamily: "var(--mono)" }}>{window.fmt(o.total)}</td>
                  <td style={td}><button onClick={() => openOrder && openOrder(o.id)} style={{ background: "none", border: "none", color: "var(--text-faint)", cursor: "pointer" }}><Icon.arrow/></button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

function RevenueChart() {
  // simple SVG area chart
  const data = [42, 38, 55, 47, 62, 51, 78, 68, 72, 81, 76, 92, 86, 102, 95, 110, 104, 118, 112, 124, 128, 121, 134, 142, 138, 152, 148, 165];
  const w = 720, h = 200, pad = 16;
  const max = Math.max(...data);
  const pts = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2);
    const y = h - pad - (v / max) * (h - pad * 2);
    return [x, y];
  });
  const path = pts.map(([x, y], i) => (i === 0 ? "M" : "L") + x.toFixed(1) + " " + y.toFixed(1)).join(" ");
  const fill = path + ` L ${pts[pts.length-1][0]} ${h-pad} L ${pts[0][0]} ${h-pad} Z`;

  return (
    <div style={{ width: "100%", overflow: "hidden" }}>
      <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: 240, display: "block" }}>
        <defs>
          <linearGradient id="rev-area" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--gold)" stopOpacity="0.45"/>
            <stop offset="100%" stopColor="var(--gold)" stopOpacity="0"/>
          </linearGradient>
        </defs>
        {/* gridlines */}
        {[0.25, 0.5, 0.75].map(t => (
          <line key={t} x1={pad} x2={w-pad} y1={pad + t*(h-pad*2)} y2={pad + t*(h-pad*2)}
                stroke="var(--line)" strokeDasharray="2 4"/>
        ))}
        <path d={fill} fill="url(#rev-area)"/>
        <path d={path} fill="none" stroke="var(--gold)" strokeWidth="1.5"/>
        {pts.map(([x, y], i) => i === pts.length - 1 && (
          <g key={i}>
            <circle cx={x} cy={y} r="4" fill="var(--accent)"/>
            <circle cx={x} cy={y} r="9" fill="var(--accent)" fillOpacity="0.2"/>
          </g>
        ))}
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-faint)", letterSpacing: "0.14em", textTransform: "uppercase", marginTop: 10 }}>
        <span>15 Apr</span><span>22 Apr</span><span>29 Apr</span><span>6 Mag</span><span>oggi</span>
      </div>
    </div>
  );
}

// ---------------- ORDERS ----------------
function AdminOrders({ openOrder }) {
  const [filter, setFilter] = useState_ad("all");
  const orders = [
    { id: "BR-90518", time: "12 Mag · 19:42", customer: "L. Bianchi",  items: 2, status: "in-forno",   total: 32.00, channel: "App" },
    { id: "BR-90517", time: "12 Mag · 19:38", customer: "G. Conti",    items: 2, status: "partito",    total: 35.00, channel: "Web" },
    { id: "BR-90516", time: "12 Mag · 19:32", customer: "S. Romano",   items: 2, status: "in-forno",   total: 46.00, channel: "App" },
    { id: "BR-90515", time: "12 Mag · 19:28", customer: "P. De Luca",  items: 3, status: "confermato", total: 48.00, channel: "Tel." },
    { id: "BR-90514", time: "12 Mag · 19:14", customer: "A. Ferrara",  items: 1, status: "consegnato", total: 22.00, channel: "Web" },
    { id: "BR-90513", time: "12 Mag · 18:58", customer: "M. Greco",    items: 3, status: "consegnato", total: 52.00, channel: "App" },
    { id: "BR-90512", time: "12 Mag · 18:42", customer: "F. Russo",    items: 2, status: "consegnato", total: 41.00, channel: "App" },
    { id: "BR-90511", time: "12 Mag · 18:30", customer: "C. Marino",   items: 4, status: "consegnato", total: 68.50, channel: "Web" },
  ];
  const filtered = filter === "all" ? orders : orders.filter(o => o.status === filter);

  return (
    <div>
      {/* filter tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
        {[
          ["all", "Tutti", 68],
          ["confermato", "Confermati", 4],
          ["in-forno", "In forno", 6],
          ["partito", "Partiti", 2],
          ["consegnato", "Consegnati", 56],
        ].map(([k, l, c]) => (
          <button key={k} onClick={() => setFilter(k)} style={{
            padding: "10px 18px", borderRadius: 999, cursor: "pointer",
            background: filter === k ? "var(--text)" : "transparent",
            color: filter === k ? "var(--bg)" : "var(--text-dim)",
            border: "1px solid " + (filter === k ? "var(--text)" : "var(--line)"),
            fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase",
            display: "flex", alignItems: "center", gap: 8,
          }}>
            {l} <span style={{ opacity: 0.5 }}>{c}</span>
          </button>
        ))}
      </div>

      <div style={{ background: "var(--bg-2)", border: "1px solid var(--line)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--text-faint)" }}>
              <th style={th}>Ordine</th>
              <th style={th}>Quando</th>
              <th style={th}>Cliente</th>
              <th style={th}>Canale</th>
              <th style={th}>Articoli</th>
              <th style={th}>Stato</th>
              <th style={{ ...th, textAlign: "right" }}>Totale</th>
              <th style={{ ...th, width: 80 }}></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(o => {
              const colors = {
                "confermato": "var(--gold)",
                "in-forno":   "var(--accent)",
                "partito":    "#6f9ae0",
                "consegnato": "var(--ok)",
              };
              return (
                <tr key={o.id} style={{ borderTop: "1px solid var(--line)" }}>
                  <td style={{ ...td, fontFamily: "var(--mono)", color: "var(--gold)" }}>{o.id}</td>
                  <td style={{ ...td, color: "var(--text-dim)", fontFamily: "var(--mono)", fontSize: 12 }}>{o.time}</td>
                  <td style={td}>{o.customer}</td>
                  <td style={{ ...td, fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-faint)", letterSpacing: "0.08em" }}>{o.channel}</td>
                  <td style={td}>{o.items}</td>
                  <td style={td}>
                    <span style={{ color: colors[o.status], fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <span style={{ width: 5, height: 5, borderRadius: 999, background: colors[o.status] }}/>
                      {o.status.replace("-", " ")}
                    </span>
                  </td>
                  <td style={{ ...td, textAlign: "right", fontFamily: "var(--mono)" }}>{window.fmt(o.total)}</td>
                  <td style={{ ...td, textAlign: "right" }}>
                    <button className="btn sm ghost" style={{ padding: "4px 10px", fontSize: 10 }} onClick={() => openOrder && openOrder(o.id)}>Dettagli</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------- PRODUCTS ----------------
function AdminProducts() {
  const [selected, setSelected] = useState_ad(window.PIZZAS[0].id);
  const sel = window.ALL_ITEMS.find(p => p.id === selected);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 24 }}>
      <div style={{ background: "var(--bg-2)", border: "1px solid var(--line)" }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div className="eyebrow">Catalogo · {window.ALL_ITEMS.length} prodotti</div>
          <button className="btn sm ember">+ Nuovo prodotto</button>
        </div>
        <div style={{ maxHeight: 720, overflowY: "auto" }}>
          {window.ALL_ITEMS.map(p => (
            <button key={p.id} onClick={() => setSelected(p.id)} style={{
              width: "100%", textAlign: "left", cursor: "pointer",
              display: "grid", gridTemplateColumns: "44px 1fr auto auto", gap: 16,
              padding: "16px 24px", alignItems: "center",
              background: selected === p.id ? "var(--bg-3)" : "transparent",
              border: "none", borderBottom: "1px solid var(--line)",
              color: "var(--text)",
            }}>
              <div className="pizza-plate" style={{ width: 44, height: 44 }}><div className="crust-glow"/></div>
              <div>
                <div style={{ fontSize: 15 }}>{p.name}</div>
                <div className="mono" style={{ fontSize: 10, color: "var(--text-faint)", letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 4 }}>
                  {p.category} · {p.id}
                </div>
              </div>
              <div className="mono" style={{ fontSize: 11, color: "var(--ok)", letterSpacing: "0.12em", textTransform: "uppercase" }}>● Attivo</div>
              <div className="display" style={{ fontSize: 20, color: "var(--gold)" }}>{window.fmt(p.price)}</div>
            </button>
          ))}
        </div>
      </div>

      <div style={{ background: "var(--bg-2)", border: "1px solid var(--line)", padding: 28, position: "sticky", top: 200, alignSelf: "start" }}>
        <div className="eyebrow" style={{ marginBottom: 12 }}>Modifica prodotto</div>
        <div className="display" style={{ fontSize: 32, lineHeight: 1, marginBottom: 24 }}>{sel.name}</div>

        <div className="pizza-plate" style={{ width: 160, height: 160, margin: "0 auto 24px" }}><div className="crust-glow"/></div>

        <AdminField label="Nome" value={sel.name}/>
        <AdminField label="Categoria" value={sel.category}/>
        <AdminField label="Prezzo base" value={"€ " + sel.price.toFixed(2)}/>
        <AdminField label="Tagline" value={sel.tagline || ""}/>
        <AdminField label="Ingredienti" value={(sel.ingredients || []).join(", ")} multi/>

        <div style={{
          display: "flex", justifyContent: "space-between", marginTop: 20,
          padding: "14px 0", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)",
        }}>
          <span className="mono" style={{ fontSize: 11, color: "var(--text-dim)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Disponibile</span>
          <span style={{
            width: 38, height: 22, borderRadius: 999, background: "var(--gold)", position: "relative",
          }}>
            <span style={{
              position: "absolute", top: 2, right: 2, width: 18, height: 18, borderRadius: 999, background: "var(--bg)",
            }}/>
          </span>
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
          <button className="btn ember" style={{ flex: 1, justifyContent: "center" }}>Salva modifiche</button>
          <button className="btn ghost">Elimina</button>
        </div>
      </div>
    </div>
  );
}

function AdminField({ label, value, multi }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div className="mono" style={{ fontSize: 10, color: "var(--text-faint)", letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 6 }}>
        {label}
      </div>
      <div style={{
        background: "var(--bg)", border: "1px solid var(--line)",
        padding: multi ? "10px 12px" : "10px 12px", fontSize: 13,
        color: "var(--text)", lineHeight: 1.5,
      }}>{value}</div>
    </div>
  );
}

// ---------------- COUPONS ----------------
function AdminCoupons() {
  const coupons = [
    { code: "BRACE10",     type: "Percentuale", value: "10%", uses: "247 / ∞",  expires: "31 Dic 2026", status: "active" },
    { code: "WELCOME15",   type: "Percentuale", value: "15%", uses: "892 / 5000", expires: "31 Dic 2026", status: "active" },
    { code: "STAGIONE",    type: "Importo",     value: "€5",  uses: "118 / 500",  expires: "30 Nov 2026", status: "active" },
    { code: "FAMIGLIA20",  type: "Percentuale", value: "20%", uses: "42 / 100",   expires: "15 Mag 2026", status: "expiring" },
    { code: "NATALE2025",  type: "Percentuale", value: "25%", uses: "1240 / —",   expires: "26 Dic 2025", status: "expired" },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 24 }}>
      <div style={{ background: "var(--bg-2)", border: "1px solid var(--line)" }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div className="eyebrow">Codici attivi · {coupons.filter(c => c.status !== "expired").length}</div>
          <button className="btn sm ember">+ Nuovo coupon</button>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--text-faint)" }}>
              <th style={th}>Codice</th>
              <th style={th}>Tipo</th>
              <th style={th}>Valore</th>
              <th style={th}>Utilizzi</th>
              <th style={th}>Scadenza</th>
              <th style={th}>Stato</th>
              <th style={{ ...th, width: 60 }}></th>
            </tr>
          </thead>
          <tbody>
            {coupons.map(c => {
              const colors = { active: "var(--ok)", expiring: "var(--gold)", expired: "var(--text-faint)" };
              const labels = { active: "Attivo", expiring: "In scadenza", expired: "Scaduto" };
              return (
                <tr key={c.code} style={{ borderTop: "1px solid var(--line)" }}>
                  <td style={{ ...td, fontFamily: "var(--mono)", color: "var(--gold)", letterSpacing: "0.12em" }}>{c.code}</td>
                  <td style={{ ...td, color: "var(--text-dim)" }}>{c.type}</td>
                  <td style={{ ...td, fontFamily: "var(--mono)" }}>{c.value}</td>
                  <td style={{ ...td, fontFamily: "var(--mono)", fontSize: 12, color: "var(--text-dim)" }}>{c.uses}</td>
                  <td style={{ ...td, fontFamily: "var(--mono)", fontSize: 12 }}>{c.expires}</td>
                  <td style={td}>
                    <span style={{ color: colors[c.status], fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                      ● {labels[c.status]}
                    </span>
                  </td>
                  <td style={td}><button style={{ background: "none", border: "none", color: "var(--text-faint)", cursor: "pointer" }}>···</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* New coupon form */}
      <div style={{ background: "var(--bg-2)", border: "1px solid var(--line)", padding: 28 }}>
        <div className="eyebrow" style={{ marginBottom: 14 }}>Nuovo coupon</div>
        <p style={{ color: "var(--text-dim)", fontSize: 13, marginTop: 0 }}>
          Crea un codice promo che i clienti possono usare al checkout.
        </p>
        <AdminField label="Codice" value="ESTATE26"/>
        <AdminField label="Tipo" value="Percentuale"/>
        <AdminField label="Valore" value="15%"/>
        <AdminField label="Ordine minimo" value="€ 25"/>
        <AdminField label="Utilizzi massimi" value="500"/>
        <AdminField label="Scadenza" value="31 Ago 2026"/>
        <button className="btn ember" style={{ width: "100%", justifyContent: "center", marginTop: 16 }}>Crea coupon</button>
      </div>
    </div>
  );
}

// ---------------- ZONES ----------------
function AdminZones() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 24 }}>
      <div style={{ background: "var(--bg-2)", border: "1px solid var(--line)", padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div className="eyebrow">Mappa zone</div>
          <button className="btn sm ghost">+ Nuova zona</button>
        </div>
        {/* Mock map */}
        <div style={{
          aspectRatio: "16/11", position: "relative", overflow: "hidden",
          background:
            "repeating-linear-gradient(0deg, var(--grid-line) 0 1px, transparent 1px 32px)," +
            "repeating-linear-gradient(90deg, var(--grid-line) 0 1px, transparent 1px 32px)," +
            "radial-gradient(circle at 50% 50%, var(--bg-2), var(--bg-3))",
          border: "1px solid var(--line)",
        }}>
          {/* zones (concentric) */}
          <div style={{
            position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)",
            width: "92%", aspectRatio: "1/1", borderRadius: 999,
            border: "1px dashed color-mix(in srgb, var(--gold) 35%, transparent)",
            background: "radial-gradient(circle, color-mix(in srgb, var(--gold) 6%, transparent), transparent 60%)",
          }}/>
          <div style={{
            position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)",
            width: "60%", aspectRatio: "1/1", borderRadius: 999,
            border: "1px solid var(--gold-deep)",
            background: "radial-gradient(circle, color-mix(in srgb, var(--gold) 12%, transparent), transparent 60%)",
          }}/>
          <div style={{
            position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)",
            width: "30%", aspectRatio: "1/1", borderRadius: 999,
            border: "1px solid var(--accent)",
            background: "radial-gradient(circle, color-mix(in srgb, var(--accent) 20%, transparent), transparent 60%)",
          }}/>
          {/* center pin */}
          <div style={{
            position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)",
            width: 12, height: 12, borderRadius: 999, background: "var(--accent)",
            boxShadow: "0 0 0 4px rgba(192,57,43,0.3)",
          }}/>
          {/* Labels */}
          <span style={zoneLabel(true, "30%", "50%")}>Zona A · €0</span>
          <span style={zoneLabel(false, "70%", "50%")}>Zona B · €4.50</span>
          <span style={zoneLabel(false, "92%", "50%")}>Zona C · solo ritiro</span>

          <div style={{
            position: "absolute", bottom: 14, left: 14,
            fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-faint)",
            letterSpacing: "0.16em", textTransform: "uppercase",
          }}>Via dei Forni 14 · Milano</div>
        </div>
      </div>

      <div>
        {[
          { name: "Zona A · Centrale", radius: "1.5 km", fee: "Gratis", time: "12–18 min", active: 1820 },
          { name: "Zona B · Estesa",   radius: "3.0 km", fee: "€ 4.50", time: "20–32 min", active: 612 },
          { name: "Zona C · Esterna",  radius: "5.0 km", fee: "Solo ritiro", time: "—", active: 0 },
        ].map((z, i) => (
          <div key={z.name} style={{
            padding: 22, marginBottom: 14,
            background: "var(--bg-2)", border: "1px solid " + (i === 0 ? "var(--accent)" : i === 1 ? "var(--gold-deep)" : "var(--line)"),
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div className="display" style={{ fontSize: 22 }}>{z.name}</div>
              <span className="mono" style={{ fontSize: 10, color: i < 2 ? "var(--ok)" : "var(--text-faint)", letterSpacing: "0.14em", textTransform: "uppercase" }}>
                ● {i < 2 ? "Attiva" : "Pausa"}
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, fontFamily: "var(--mono)", fontSize: 11 }}>
              <div><span style={{ color: "var(--text-faint)" }}>Raggio</span><div style={{ color: "var(--text)", marginTop: 2 }}>{z.radius}</div></div>
              <div><span style={{ color: "var(--text-faint)" }}>Costo</span><div style={{ color: "var(--gold)", marginTop: 2 }}>{z.fee}</div></div>
              <div><span style={{ color: "var(--text-faint)" }}>Tempo</span><div style={{ color: "var(--text)", marginTop: 2 }}>{z.time}</div></div>
              <div><span style={{ color: "var(--text-faint)" }}>Clienti attivi</span><div style={{ color: "var(--text)", marginTop: 2 }}>{z.active}</div></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const zoneLabel = (a, l, t) => ({
  position: "absolute", left: l, top: t, transform: "translate(-50%, -50%)",
  background: "var(--scrim-blur-strong)", padding: "6px 12px",
  border: "1px solid " + (a ? "var(--accent)" : "var(--line-2)"),
  fontFamily: "var(--mono)", fontSize: 10, color: a ? "var(--accent)" : "var(--text-dim)",
  letterSpacing: "0.12em", textTransform: "uppercase",
});

// ---------------- CUSTOMERS ----------------
function AdminCustomers() {
  const customers = [
    { name: "Marco Rossi",       email: "marco.rossi@email.it",     orders: 23, total: 814.50, tier: "Antica",   last: "12 Mag 2026" },
    { name: "Lucia Bianchi",     email: "l.bianchi@email.it",        orders: 18, total: 642.20, tier: "Antica",   last: "12 Mag 2026" },
    { name: "Giuseppe Conti",    email: "g.conti@email.it",          orders: 31, total: 1124.00, tier: "Maestra", last: "12 Mag 2026" },
    { name: "Sara Romano",       email: "sara.romano@email.it",      orders: 14, total: 488.00, tier: "Tavola",   last: "12 Mag 2026" },
    { name: "Paolo De Luca",     email: "paolo.deluca@email.it",     orders: 47, total: 1842.50, tier: "Maestra", last: "12 Mag 2026" },
    { name: "Anna Ferrara",      email: "a.ferrara@email.it",        orders: 9,  total: 312.00, tier: "Tavola",   last: "12 Mag 2026" },
    { name: "Marta Greco",       email: "marta.greco@email.it",      orders: 22, total: 768.00, tier: "Antica",   last: "12 Mag 2026" },
  ];
  const tierColor = { "Maestra": "var(--accent)", "Antica": "var(--gold)", "Tavola": "var(--text-dim)" };

  return (
    <div style={{ background: "var(--bg-2)", border: "1px solid var(--line)" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "left", fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--text-faint)" }}>
            <th style={th}>Cliente</th>
            <th style={th}>Email</th>
            <th style={th}>Tessera</th>
            <th style={th}>Ordini</th>
            <th style={th}>Speso</th>
            <th style={th}>Ultimo ordine</th>
            <th style={{ ...th, width: 60 }}></th>
          </tr>
        </thead>
        <tbody>
          {customers.map(c => (
            <tr key={c.email} style={{ borderTop: "1px solid var(--line)" }}>
              <td style={td}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: 999, background: "var(--bg-3)",
                    color: "var(--gold)", display: "grid", placeItems: "center",
                    fontFamily: "var(--serif)", fontSize: 14,
                  }}>{c.name.charAt(0)}</div>
                  <span>{c.name}</span>
                </div>
              </td>
              <td style={{ ...td, color: "var(--text-dim)", fontFamily: "var(--mono)", fontSize: 12 }}>{c.email}</td>
              <td style={td}>
                <span style={{
                  color: tierColor[c.tier],
                  fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase",
                  border: "1px solid " + tierColor[c.tier], padding: "3px 10px", borderRadius: 999,
                }}>{c.tier}</span>
              </td>
              <td style={{ ...td, fontFamily: "var(--mono)" }}>{c.orders}</td>
              <td style={{ ...td, color: "var(--gold)", fontFamily: "var(--mono)" }}>{window.fmt(c.total)}</td>
              <td style={{ ...td, color: "var(--text-dim)", fontFamily: "var(--mono)", fontSize: 12 }}>{c.last}</td>
              <td style={td}><button className="btn sm ghost" style={{ padding: "4px 10px", fontSize: 10 }}>Profilo</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------- SETTINGS ----------------
function AdminSettings() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 24, maxWidth: 1100 }}>
      {[
        { t: "Ristorante", rows: [
          ["Nome attività", "BRÀCE Pizzeria SRL"],
          ["P.IVA", "12345678901"],
          ["Indirizzo", "Via dei Forni 14, 20121 Milano"],
          ["Telefono", "+39 02 5500 8412"],
        ]},
        { t: "Orari di apertura", rows: window.HOURS },
        { t: "Pagamenti", rows: [
          ["Stripe", "Connesso ●"],
          ["Apple Pay", "Attivo"],
          ["Google Pay", "Attivo"],
          ["Contanti", "Solo ritiro"],
        ]},
        { t: "Notifiche", rows: [
          ["Email nuovi ordini", "On"],
          ["SMS rider", "On"],
          ["Push customer", "On"],
          ["Riepilogo giornaliero", "08:00"],
        ]},
      ].map(panel => (
        <div key={panel.t} style={{ background: "var(--bg-2)", border: "1px solid var(--line)", padding: 28 }}>
          <div className="eyebrow" style={{ marginBottom: 18 }}>{panel.t}</div>
          {panel.rows.map(([k, v]) => (
            <div key={k} style={{
              display: "flex", justifyContent: "space-between", padding: "14px 0",
              borderBottom: "1px solid var(--line)",
              fontFamily: "var(--mono)", fontSize: 12,
            }}>
              <span style={{ color: "var(--text-dim)", letterSpacing: "0.06em" }}>{k}</span>
              <span style={{ color: "var(--text)" }}>{v}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ---------------- shared table styles ----------------
const th = { padding: "16px 24px", fontWeight: 400 };
const td = { padding: "18px 24px", fontSize: 14, verticalAlign: "middle" };

Object.assign(window, { AdminScreen });
