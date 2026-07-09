// Home screen for BRÀCE

const { useState: useState_h, useEffect: useEffect_h, useRef: useRef_h } = React;

function HomeScreen({ go }) {
  return (
    <main>
      <Hero go={go} />
      <FeaturedCarousel go={go} />
      <DoughStory go={go} />
      <Seasonal go={go} />
      <Ingredients />
      <Delivery />
      <Testimonials />
    </main>
  );
}

// --------------- HERO ---------------
function Hero({ go }) {
  const cart = window.useCart();
  return (
    <section style={{
      position: "relative",
      minHeight: "100vh",
      display: "flex", alignItems: "center",
      paddingTop: 140, paddingBottom: 80,
      overflow: "hidden",
    }}>
      {/* background radial */}
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(900px 600px at 78% 50%, color-mix(in srgb, var(--accent) 16%, transparent), transparent 60%), radial-gradient(700px 500px at 20% 80%, color-mix(in srgb, var(--gold) 12%, transparent), transparent 70%)",
        pointerEvents: "none",
      }}/>

      {/* huge rotating pizza */}
      <div style={{
        position: "absolute", right: -180, top: "50%", transform: "translateY(-50%)",
        width: 820, height: 820,
        animation: "spinSlow 90s linear infinite",
      }}>
        <div className="pizza-plate" style={{ width: "100%", height: "100%" }}>
          <div className="crust-glow"/>
        </div>
      </div>

      {/* ember spark dots */}
      <Embers />

      <div className="container" style={{ position: "relative", zIndex: 2 }}>
        <div className="rise" style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 30 }}>
          <span style={{ width: 32, height: 1, background: "var(--gold)" }}/>
          <span className="eyebrow">Pizzeria Napoletana · Milano · dal 2019</span>
        </div>

        <h1 className="display rise" style={{
          fontSize: "clamp(72px, 12vw, 188px)",
          lineHeight: 0.92,
          margin: 0,
          letterSpacing: "-0.015em",
          animationDelay: "0.05s",
        }}>
          Pizza,<br/>
          <span style={{ fontStyle: "italic", fontFamily: "var(--serif-2)", fontWeight: 300, color: "var(--gold)" }}>cotta a 485°.</span>
        </h1>

        <p className="rise" style={{
          maxWidth: 480, fontSize: 17, color: "var(--text-dim)",
          marginTop: 36, lineHeight: 1.6,
          animationDelay: "0.18s",
        }}>
          Settantadue ore di lievitazione. Novanta secondi nel forno. Una pizza che non somiglia a nessun'altra perché non vuole.
        </p>

        <div className="rise" style={{
          display: "flex", gap: 14, marginTop: 40,
          animationDelay: "0.3s",
        }}>
          <button onClick={() => go("menu")} className="btn ember">
            Ordina ora <Icon.arrow className="arrow"/>
          </button>
          <button onClick={() => go("menu")} className="btn">
            Vedi il menu
          </button>
        </div>

        {/* meta strip */}
        <div className="rise" style={{
          marginTop: 100,
          display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 32,
          borderTop: "1px solid var(--line)", paddingTop: 36,
          maxWidth: 720,
          animationDelay: "0.45s",
        }}>
          {[
            ["485°", "Forno a legna"],
            ["72h", "Lievitazione"],
            ["3", "Stelle Gambero Rosso"],
            ["12", "Ingredienti D.O.P."],
          ].map(([k, v]) => (
            <div key={v}>
              <div className="display" style={{ fontSize: 36, lineHeight: 1, color: "var(--gold)" }}>{k}</div>
              <div style={{
                fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-faint)",
                marginTop: 8, letterSpacing: "0.16em", textTransform: "uppercase",
              }}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* corner notation */}
      <div style={{
        position: "absolute", bottom: 32, right: 56, zIndex: 2,
        fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-faint)",
        letterSpacing: "0.16em", textTransform: "uppercase",
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <span>Scroll</span>
        <span style={{ width: 30, height: 1, background: "var(--text-faint)" }}/>
      </div>
    </section>
  );
}

function Embers() {
  // a few floating ember dots
  const dots = Array.from({ length: 14 }, (_, i) => i);
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {dots.map(i => {
        const left = (i * 137) % 100;
        const top = (i * 91) % 100;
        const delay = (i * 0.4) % 3;
        const size = 2 + (i % 3);
        return (
          <span key={i} style={{
            position: "absolute",
            left: left + "%", top: top + "%",
            width: size, height: size, borderRadius: 999,
            background: i % 3 === 0 ? "var(--accent)" : "var(--gold)",
            opacity: 0.5,
            animation: `float ${4 + (i % 4)}s ease-in-out ${delay}s infinite`,
            boxShadow: "0 0 8px currentColor",
          }}/>
        );
      })}
    </div>
  );
}

// --------------- FEATURED CAROUSEL ---------------
function FeaturedCarousel({ go }) {
  const cart = window.useCart();
  const items = window.PIZZAS.slice(0, 5);
  const scrollerRef = useRef_h(null);

  const scrollBy = (dir) => {
    if (!scrollerRef.current) return;
    scrollerRef.current.scrollBy({ left: dir * 420, behavior: "smooth" });
  };

  return (
    <section style={{ paddingTop: 120, paddingBottom: 80 }}>
      <div className="container">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 56, gap: 32 }}>
          <SectionHead
            eyebrow="Le firme"
            title={<>Pizza<br/><span className="it" style={{ color: "var(--gold)" }}>che ci rappresenta</span></>}
          />
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => scrollBy(-1)} style={navBtn}><Icon.arrow style={{ transform: "rotate(180deg)" }}/></button>
            <button onClick={() => scrollBy(1)} style={navBtn}><Icon.arrow/></button>
          </div>
        </div>
      </div>

      <div ref={scrollerRef} className="no-scrollbar" style={{
        display: "flex", gap: 24,
        overflowX: "auto", overflowY: "hidden",
        scrollSnapType: "x mandatory",
        padding: "0 56px 30px",
        scrollbarWidth: "none",
      }}>
        {items.map(item => (
          <div key={item.id} style={{ flex: "0 0 380px", scrollSnapAlign: "start" }}>
            <window.PizzaCard
              item={item}
              onClick={() => { window.__app_setProduct(item.id); go("product"); }}
              onAdd={() => {
                cart.add({ itemId: item.id, variant: "14", dough: "napoletana", qty: 1 });
              }}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

const navBtn = {
  width: 44, height: 44, borderRadius: 999,
  border: "1px solid var(--line-2)", background: "var(--bg-2)",
  color: "var(--text)", cursor: "pointer",
  display: "grid", placeItems: "center",
};

// --------------- DOUGH STORY ---------------
function DoughStory({ go }) {
  return (
    <section data-section="story" style={{ paddingTop: 140, paddingBottom: 120 }}>
      <div className="container">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 100, alignItems: "center" }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 22 }}>L'impasto</div>
            <h2 className="display" style={{ fontSize: "clamp(56px, 8vw, 120px)", lineHeight: 0.95, margin: 0 }}>
              Settantadue<br/>
              <span className="it" style={{ color: "var(--gold)", fontWeight: 300 }}>ore.</span>
            </h2>
            <p style={{ marginTop: 36, fontSize: 17, lineHeight: 1.7, color: "var(--text-dim)", maxWidth: 460 }}>
              Iniziamo con farina di grano tenero macinata a pietra in un piccolo mulino di Altamura. Idratazione al 68%. Sale marino integrale. Lievito madre vivo, alimentato ogni dodici ore.
            </p>
            <p style={{ marginTop: 18, fontSize: 17, lineHeight: 1.7, color: "var(--text-dim)", maxWidth: 460 }}>
              Poi tre giorni di freddo, a 4 gradi. La fermentazione lenta rompe i carboidrati complessi in zuccheri semplici — è il motivo per cui la nostra pizza è digeribile in venti minuti, non in cinque ore.
            </p>

            <ul style={{
              listStyle: "none", padding: 0, marginTop: 40,
              fontFamily: "var(--mono)", fontSize: 12,
              borderTop: "1px solid var(--line)",
            }}>
              {[
                ["01", "Farina", "Tipo 0 — Mulino Altamura"],
                ["02", "Idratazione", "68%"],
                ["03", "Lievitazione", "72 ore a 4°C"],
                ["04", "Stesura", "A mano, mai mattarello"],
                ["05", "Cottura", "90 secondi · 485°C"],
              ].map(([n, k, v]) => (
                <li key={n} style={{
                  display: "grid", gridTemplateColumns: "40px 140px 1fr",
                  padding: "16px 0", borderBottom: "1px solid var(--line)",
                  alignItems: "center",
                }}>
                  <span style={{ color: "var(--gold)" }}>{n}</span>
                  <span style={{ color: "var(--text)", letterSpacing: "0.06em", textTransform: "uppercase" }}>{k}</span>
                  <span style={{ color: "var(--text-dim)" }}>{v}</span>
                </li>
              ))}
            </ul>
          </div>

          <div style={{ position: "relative", aspectRatio: "4/5", minHeight: 600 }}>
            <div className="ph" style={{
              position: "absolute", inset: 0,
            }}>
              <div style={{ textAlign: "center" }}>
                <div>Dough in proofing tray</div>
                <div style={{ color: "var(--text-faint)", marginTop: 6, letterSpacing: "0.1em" }}>shot 4:5 · b&w</div>
              </div>
            </div>
            {/* overlay caption */}
            <div style={{
              position: "absolute", bottom: 24, left: 24, right: 24,
              background: "rgba(15,13,12,0.7)", backdropFilter: "blur(20px)",
              border: "1px solid var(--line-2)", padding: "18px 20px",
              fontFamily: "var(--mono)", fontSize: 11,
              color: "var(--text-dim)", letterSpacing: "0.08em",
              display: "flex", justifyContent: "space-between",
            }}>
              <span>Ora 47 di 72</span>
              <span style={{ color: "var(--gold)" }}>Lievito attivo</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// --------------- SEASONAL ---------------
function Seasonal({ go }) {
  const cart = window.useCart();
  const seasonal = window.PIZZAS.filter(p => p.category === "seasonal");

  return (
    <section style={{
      paddingTop: 120, paddingBottom: 120,
      background: "var(--bg-2)",
      borderTop: "1px solid var(--line)",
      borderBottom: "1px solid var(--line)",
    }}>
      <div className="container">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 60 }}>
          <SectionHead
            eyebrow="Autunno 2026"
            title={<>Solo<br/><span className="it" style={{ color: "var(--gold)" }}>per ora.</span></>}
            kicker="Quattro pizze stagionali che spariscono quando finiscono gli ingredienti. Nessuna scorta, nessun congelatore."
          />
          <button onClick={() => go("menu")} className="btn">Tutto il menu <Icon.arrow className="arrow"/></button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 32 }}>
          {seasonal.map(item => (
            <SeasonalCard key={item.id} item={item} go={go} onAdd={() => cart.add({ itemId: item.id, variant: "14", dough: "napoletana", qty: 1 })}/>
          ))}
        </div>
      </div>
    </section>
  );
}

function SeasonalCard({ item, go, onAdd }) {
  const [hover, setHover] = useState_h(false);
  return (
    <article onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      onClick={() => { window.__app_setProduct(item.id); go("product"); }}
      style={{
        display: "grid", gridTemplateColumns: "240px 1fr", gap: 36,
        padding: 36, background: "var(--bg)",
        border: "1px solid " + (hover ? "var(--gold-deep)" : "var(--line)"),
        cursor: "pointer", transition: "all .35s ease",
        alignItems: "center",
      }}>
      <div className="pizza-plate" style={{ transform: hover ? "scale(1.05)" : "scale(1)", transition: "transform .5s ease" }}>
        <div className="crust-glow"/>
      </div>
      <div>
        <div className="eyebrow" style={{ marginBottom: 12 }}>{item.badge || "Stagionale"}</div>
        <h3 className="display" style={{ fontSize: 44, margin: 0, lineHeight: 1 }}>{item.name}</h3>
        <p className="it" style={{ fontSize: 20, color: "var(--text-dim)", margin: "14px 0 0" }}>{item.tagline}</p>
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          marginTop: 28, paddingTop: 20, borderTop: "1px solid var(--line)",
        }}>
          <span className="display" style={{ fontSize: 28, color: "var(--gold)" }}>{window.fmt(item.price)}</span>
          <button onClick={(e) => { e.stopPropagation(); onAdd(); }} className="btn sm">
            Aggiungi <Icon.plus/>
          </button>
        </div>
      </div>
    </article>
  );
}

// --------------- INGREDIENTS ---------------
function Ingredients() {
  const items = [
    { name: "Pomodoro San Marzano D.O.P.", origin: "Agro Sarnese-Nocerino, Campania", note: "Raccolti a mano, pelati il giorno stesso." },
    { name: "Mozzarella di Bufala Campana", origin: "Aversa, Caserta", note: "Latte di bufala mungitura 24h." },
    { name: "Farina Tipo 0 Antica", origin: "Mulino di Altamura, Puglia", note: "Macinata a pietra, W260." },
    { name: "Olio EVO Nocellara", origin: "Trapani, Sicilia", note: "Cultivar singola, prima spremitura." },
    { name: "Basilico Genovese D.O.P.", origin: "Prà, Liguria", note: "Foglie piccole, mai oltre 6cm." },
    { name: "Sale Marino Integrale", origin: "Saline di Trapani, Sicilia", note: "Raccolto a mano, asciugato al sole." },
  ];

  return (
    <section style={{ paddingTop: 140, paddingBottom: 80 }}>
      <div className="container">
        <SectionHead
          eyebrow="Provenienza"
          title={<>Ogni ingrediente<br/><span className="it" style={{ color: "var(--gold)" }}>ha un nome.</span></>}
          kicker="Non compriamo niente da intermediari. Conosciamo ogni produttore, conosciamo ogni campo."
        />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1, background: "var(--line)", border: "1px solid var(--line)" }}>
          {items.map((it, i) => (
            <div key={it.name} style={{
              background: "var(--bg)", padding: "40px 36px",
              minHeight: 260, display: "flex", flexDirection: "column", justifyContent: "space-between",
              position: "relative",
            }}>
              <div className="mono" style={{ fontSize: 11, color: "var(--gold)", letterSpacing: "0.2em" }}>
                · 0{i + 1}
              </div>
              <div>
                <h3 className="display" style={{ fontSize: 30, lineHeight: 1.05, margin: 0 }}>{it.name}</h3>
                <div className="mono" style={{
                  marginTop: 14, fontSize: 11, color: "var(--text-dim)",
                  letterSpacing: "0.1em", textTransform: "uppercase",
                }}>{it.origin}</div>
                <p style={{ fontSize: 14, color: "var(--text-dim)", marginTop: 16, lineHeight: 1.6 }}>
                  {it.note}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// --------------- DELIVERY ---------------
function Delivery() {
  return (
    <section style={{ paddingTop: 120, paddingBottom: 120 }}>
      <div className="container">
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0,
          border: "1px solid var(--line)",
        }}>
          <div style={{ padding: "72px 60px", borderRight: "1px solid var(--line)" }}>
            <div className="eyebrow" style={{ marginBottom: 22 }}>Consegna</div>
            <h2 className="display" style={{ fontSize: 72, lineHeight: 0.98, margin: 0 }}>
              Trenta<br/>
              <span className="it" style={{ color: "var(--gold)", fontWeight: 300 }}>minuti.</span>
            </h2>
            <p style={{ fontSize: 16, color: "var(--text-dim)", marginTop: 28, maxWidth: 380, lineHeight: 1.7 }}>
              Cuociamo, sigilliamo, partiamo. La pizza arriva calda perché la consegniamo in un raggio di 3km — non oltre. Mai.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 24, marginTop: 40 }}>
              {[
                ["3 km", "Raggio di consegna"],
                ["€4.50", "Fee · gratis sopra €40"],
                ["18 min", "Tempo medio"],
                ["—", "Mance? Mai."],
              ].map(([k, v]) => (
                <div key={v} style={{ borderTop: "1px solid var(--line)", paddingTop: 16 }}>
                  <div className="display" style={{ fontSize: 26, color: "var(--gold)" }}>{k}</div>
                  <div className="mono" style={{ fontSize: 10, color: "var(--text-faint)", letterSpacing: "0.14em", textTransform: "uppercase", marginTop: 4 }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ padding: "72px 60px", background: "var(--bg-2)" }}>
            <div className="eyebrow" style={{ marginBottom: 22 }}>Ritiro</div>
            <h2 className="display" style={{ fontSize: 72, lineHeight: 0.98, margin: 0 }}>
              Quindici<br/>
              <span className="it" style={{ color: "var(--gold)", fontWeight: 300 }}>minuti.</span>
            </h2>
            <p style={{ fontSize: 16, color: "var(--text-dim)", marginTop: 28, maxWidth: 380, lineHeight: 1.7 }}>
              Ordina, paga, scegli un orario. Trovi la tua pizza sul bancone — appena uscita dal forno.
            </p>

            {/* mini map placeholder */}
            <div style={{
              marginTop: 40, aspectRatio: "16/10",
              background:
                "radial-gradient(circle at 60% 40%, color-mix(in srgb, var(--accent) 22%, transparent), transparent 40%)," +
                "repeating-linear-gradient(0deg, var(--grid-line) 0 1px, transparent 1px 30px)," +
                "repeating-linear-gradient(90deg, var(--grid-line) 0 1px, transparent 1px 30px)," +
                "linear-gradient(180deg, var(--bg-2), var(--bg-3))",
              border: "1px solid var(--line-2)",
              position: "relative",
            }}>
              <div style={{
                position: "absolute", left: "60%", top: "40%",
                transform: "translate(-50%, -50%)",
                width: 10, height: 10, borderRadius: 999, background: "var(--accent)",
                boxShadow: "0 0 0 6px color-mix(in srgb, var(--accent) 20%, transparent), 0 0 0 14px color-mix(in srgb, var(--accent) 10%, transparent)",
              }}/>
              <div style={{
                position: "absolute", bottom: 14, left: 14,
                fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-faint)",
                letterSpacing: "0.16em", textTransform: "uppercase",
              }}>Via dei Forni 14 · Milano</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// --------------- TESTIMONIALS ---------------
function Testimonials() {
  const [idx, setIdx] = useState_h(0);
  const list = window.TESTIMONIALS;

  useEffect_h(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % list.length), 6500);
    return () => clearInterval(t);
  }, []);

  return (
    <section style={{ paddingTop: 140, paddingBottom: 100, background: "var(--bg-2)", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}>
      <div className="container" style={{ textAlign: "center" }}>
        <div className="eyebrow" style={{ marginBottom: 28 }}>Dicono di noi</div>
        <div style={{ minHeight: 280, position: "relative" }}>
          {list.map((t, i) => (
            <div key={i} style={{
              position: "absolute", inset: 0,
              opacity: i === idx ? 1 : 0,
              transform: i === idx ? "translateY(0)" : "translateY(10px)",
              transition: "all .8s cubic-bezier(.2,.7,.2,1)",
              pointerEvents: i === idx ? "auto" : "none",
            }}>
              <div style={{ display: "flex", justifyContent: "center", gap: 4, marginBottom: 24, color: "var(--gold)" }}>
                {Array.from({ length: t.rating }).map((_, j) => <Icon.star key={j}/>)}
              </div>
              <blockquote className="display" style={{
                fontSize: "clamp(28px, 4vw, 52px)",
                lineHeight: 1.15, margin: 0,
                maxWidth: 1000, marginInline: "auto",
                fontStyle: "italic", fontFamily: "var(--serif-2)", fontWeight: 300,
              }}>
                "{t.quote}"
              </blockquote>
              <div style={{ marginTop: 32, fontFamily: "var(--mono)", fontSize: 12, letterSpacing: "0.16em", textTransform: "uppercase" }}>
                <span style={{ color: "var(--text)" }}>{t.author}</span>
                <span style={{ color: "var(--text-faint)", margin: "0 12px" }}>·</span>
                <span style={{ color: "var(--gold)" }}>{t.role}</span>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 48 }}>
          {list.map((_, i) => (
            <button key={i} onClick={() => setIdx(i)} style={{
              width: i === idx ? 28 : 6, height: 6, borderRadius: 999,
              background: i === idx ? "var(--gold)" : "var(--line-2)",
              border: "none", cursor: "pointer", transition: "all .3s ease", padding: 0,
            }}/>
          ))}
        </div>
      </div>
    </section>
  );
}

Object.assign(window, { HomeScreen });
