// Menu + Product Detail screens for BRÀCE

const { useState: useState_m, useEffect: useEffect_m, useMemo: useMemo_m } = React;

function MenuScreen({ go }) {
  const cart = window.useCart();
  const [cat, setCat] = useState_m("all");
  const [q, setQ] = useState_m("");
  const [sort, setSort] = useState_m("default");

  const items = useMemo_m(() => {
    let xs = window.ALL_ITEMS.slice();
    if (cat !== "all") xs = xs.filter(x => x.category === cat);
    if (q) {
      const ql = q.toLowerCase();
      xs = xs.filter(x => x.name.toLowerCase().includes(ql) || (x.ingredients || []).some(i => i.toLowerCase().includes(ql)));
    }
    if (sort === "price-asc") xs.sort((a, b) => a.price - b.price);
    if (sort === "price-desc") xs.sort((a, b) => b.price - a.price);
    return xs;
  }, [cat, q, sort]);

  return (
    <main style={{ paddingTop: 140 }}>
      <div className="container">
        {/* Header */}
        <div style={{ paddingBottom: 60, borderBottom: "1px solid var(--line)" }}>
          <div className="eyebrow" style={{ marginBottom: 20 }}>Il menu · Autunno 2026</div>
          <h1 className="display" style={{ fontSize: "clamp(64px, 10vw, 148px)", lineHeight: 0.9, margin: 0, letterSpacing: "-0.01em" }}>
            La carta,<br/>
            <span className="it" style={{ color: "var(--gold)", fontWeight: 300 }}>per intero.</span>
          </h1>
          <p style={{ marginTop: 28, fontSize: 17, color: "var(--text-dim)", maxWidth: 600, lineHeight: 1.6 }}>
            Otto pizze, sempre. Quattro stagionali che cambiano. Una carta vini snella. Zero compromessi.
          </p>
        </div>

        {/* Sticky filter bar */}
        <div style={{
          position: "sticky", top: 78, zIndex: 50,
          background: "var(--scrim-blur-strong)", backdropFilter: "blur(20px)",
          margin: "0 -56px", padding: "24px 56px",
          borderBottom: "1px solid var(--line)",
          display: "flex", justifyContent: "space-between", alignItems: "center", gap: 24, flexWrap: "wrap",
        }}>
          <div style={{ display: "flex", gap: 0, overflowX: "auto" }}>
            {window.CATEGORIES.map(c => (
              <button key={c.id} onClick={() => setCat(c.id)} style={{
                padding: "10px 18px",
                background: cat === c.id ? "var(--text)" : "transparent",
                color: cat === c.id ? "var(--bg)" : "var(--text-dim)",
                border: "1px solid " + (cat === c.id ? "var(--text)" : "var(--line)"),
                borderRadius: 999, cursor: "pointer", marginRight: 8,
                fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase",
                whiteSpace: "nowrap", transition: "all .2s ease",
              }}>{c.label}</button>
            ))}
          </div>

          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "8px 14px", border: "1px solid var(--line)", borderRadius: 999,
              minWidth: 220,
            }}>
              <Icon.search style={{ color: "var(--text-faint)" }}/>
              <input value={q} onChange={e => setQ(e.target.value)} placeholder="Cerca ingrediente"
                style={{
                  background: "none", border: "none", outline: "none", color: "var(--text)",
                  fontFamily: "var(--mono)", fontSize: 12, width: "100%",
                }}/>
            </div>
            <select value={sort} onChange={e => setSort(e.target.value)} style={{
              background: "var(--bg-2)", color: "var(--text-dim)", border: "1px solid var(--line)",
              borderRadius: 999, padding: "10px 14px", fontFamily: "var(--mono)", fontSize: 11,
              letterSpacing: "0.12em", textTransform: "uppercase",
            }}>
              <option value="default">Ordina</option>
              <option value="price-asc">Prezzo crescente</option>
              <option value="price-desc">Prezzo decrescente</option>
            </select>
          </div>
        </div>

        {/* Grid */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
          gap: 28, marginTop: 48, marginBottom: 80,
        }}>
          {items.length === 0 ? (
            <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: 80, color: "var(--text-faint)" }}>
              <div className="display" style={{ fontSize: 32 }}>Niente da mostrare.</div>
              <p>Prova a cambiare filtro o cerca un altro ingrediente.</p>
            </div>
          ) : items.map(item => (
            item.category === "drinks" ? (
              <DrinkCard key={item.id} item={item} onAdd={() => cart.add({ itemId: item.id, variant: "12", dough: "napoletana", qty: 1 })}/>
            ) : (
              <window.PizzaCard key={item.id}
                item={item}
                onClick={() => { window.__app_setProduct(item.id); go("product"); }}
                onAdd={(it) => cart.add({ itemId: it.id, variant: "14", dough: "napoletana", qty: 1 })}
              />
            )
          ))}
        </div>
      </div>
    </main>
  );
}

function DrinkCard({ item, onAdd }) {
  const [hover, setHover] = useState_m(false);
  return (
    <article onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        background: "var(--bg-2)",
        border: "1px solid " + (hover ? "var(--line-2)" : "var(--line)"),
        padding: 28, transition: "all .35s ease",
        transform: hover ? "translateY(-4px)" : "translateY(0)",
        display: "flex", flexDirection: "column", justifyContent: "space-between",
        minHeight: 380,
      }}>
      <div>
        <div className="eyebrow" style={{ marginBottom: 14 }}>Bevanda</div>
        <h3 className="display" style={{ fontSize: 32, margin: 0 }}>{item.name}</h3>
        <div style={{
          fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-faint)",
          letterSpacing: "0.08em", marginTop: 18, lineHeight: 1.9,
        }}>
          {(item.ingredients || []).map((ing, i) => <div key={i}>· {ing}</div>)}
        </div>
      </div>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        paddingTop: 22, borderTop: "1px solid var(--line)", marginTop: 24,
      }}>
        <span className="display" style={{ fontSize: 26, color: "var(--gold)" }}>{window.fmt(item.price)}</span>
        <button onClick={onAdd} className="btn sm">Aggiungi <Icon.plus/></button>
      </div>
    </article>
  );
}

// ------------------- PRODUCT DETAIL -------------------
function ProductScreen({ productId, go }) {
  const cart = window.useCart();
  const toast = window.useToast();
  const item = window.ALL_ITEMS.find(i => i.id === productId) || window.PIZZAS[0];

  const [variant, setVariant] = useState_m("14");
  const [dough, setDough] = useState_m("napoletana");
  const [qty, setQty] = useState_m(1);
  const [tab, setTab] = useState_m("ingredients");
  const [fav, setFav] = useState_m(false);

  const v = window.VARIANTS.find(x => x.id === variant);
  const doughDelta = dough === "senza" ? 3 : 0;
  const unitPrice = item.price + (v ? v.priceDelta : 0) + doughDelta;

  const related = window.PIZZAS.filter(p => p.id !== item.id && p.category === item.category).slice(0, 3);
  const isPizza = item.category !== "drinks";

  return (
    <main style={{ paddingTop: 120, paddingBottom: 60 }}>
      <div className="container">
        {/* Breadcrumb */}
        <div style={{
          display: "flex", gap: 12, alignItems: "center",
          fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-faint)",
          letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 40,
        }}>
          <button onClick={() => go("home")} style={linkBtn}>Casa</button>
          <span>/</span>
          <button onClick={() => go("menu")} style={linkBtn}>Menu</button>
          <span>/</span>
          <span style={{ color: "var(--gold)" }}>{item.name}</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 80, alignItems: "start" }}>
          {/* gallery */}
          <div>
            <div style={{
              aspectRatio: "1/1", background: "var(--bg-2)",
              border: "1px solid var(--line)", padding: 60,
              position: "relative", overflow: "hidden",
            }}>
              <div style={{
                position: "absolute", inset: 0,
                background: "radial-gradient(500px 400px at 60% 30%, rgba(192,57,43,0.18), transparent 60%)",
              }}/>
              <div className="pizza-plate" style={{ position: "relative" }}>
                <div className="crust-glow"/>
              </div>

              {/* corner markers */}
              <div style={{
                position: "absolute", top: 24, left: 24,
                fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-faint)",
                letterSpacing: "0.18em", textTransform: "uppercase",
              }}>
                BR · {item.id.slice(0, 6).toUpperCase()}
              </div>
              <div style={{
                position: "absolute", top: 24, right: 24,
                fontFamily: "var(--mono)", fontSize: 10, color: "var(--gold)",
                letterSpacing: "0.18em", textTransform: "uppercase",
              }}>
                {item.badge || item.category}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginTop: 8 }}>
              {[0, 1, 2, 3].map(i => (
                <div key={i} style={{
                  aspectRatio: "1/1", background: "var(--bg-2)",
                  border: "1px solid " + (i === 0 ? "var(--gold-deep)" : "var(--line)"),
                  display: "grid", placeItems: "center", cursor: "pointer",
                }}>
                  <div className="pizza-plate" style={{ width: "70%", height: "70%", filter: i === 0 ? "none" : "saturate(0.6) brightness(0.7)" }}>
                    <div className="crust-glow"/>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* sticky sidebar */}
          <div style={{ position: "sticky", top: 120 }}>
            <div className="eyebrow">{isPizza ? "Pizza" : "Bevanda"} · {item.category}</div>
            <h1 className="display" style={{ fontSize: 76, lineHeight: 0.98, margin: "14px 0 18px" }}>{item.name}</h1>
            {item.tagline && (
              <p className="it" style={{ fontSize: 22, color: "var(--text-dim)", margin: 0, lineHeight: 1.4 }}>{item.tagline}</p>
            )}

            <div style={{ display: "flex", alignItems: "baseline", gap: 16, marginTop: 30 }}>
              <span className="display" style={{ fontSize: 56, color: "var(--gold)" }}>{window.fmt(unitPrice)}</span>
              {variant !== "14" || dough === "senza" ? (
                <span className="mono" style={{ fontSize: 12, color: "var(--text-faint)", textDecoration: "line-through" }}>
                  {window.fmt(item.price)}
                </span>
              ) : null}
            </div>

            {/* rating row */}
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 22, paddingTop: 22, borderTop: "1px solid var(--line)" }}>
              <div style={{ display: "flex", gap: 2, color: "var(--gold)" }}>
                {Array.from({ length: 5 }).map((_, i) => <Icon.star key={i}/>)}
              </div>
              <span className="mono" style={{ fontSize: 11, color: "var(--text-dim)", letterSpacing: "0.12em" }}>
                4.9 · 847 valutazioni
              </span>
            </div>

            {isPizza && (
              <>
                {/* variant */}
                <FieldGroup label="Dimensione">
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                    {window.VARIANTS.map(v => (
                      <button key={v.id} onClick={() => setVariant(v.id)} style={{
                        padding: "16px 12px", background: variant === v.id ? "var(--bg-3)" : "transparent",
                        border: "1px solid " + (variant === v.id ? "var(--gold-deep)" : "var(--line)"),
                        cursor: "pointer", textAlign: "left", color: "var(--text)",
                      }}>
                        <div style={{ fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: variant === v.id ? "var(--gold)" : "var(--text-dim)" }}>
                          {v.id}″
                        </div>
                        <div className="display" style={{ fontSize: 18, marginTop: 4 }}>{v.label.split(" ")[1]}</div>
                        <div className="mono" style={{ fontSize: 10, color: "var(--text-faint)", marginTop: 4 }}>
                          {v.priceDelta === 0 ? "incluso" : "+" + window.fmt(v.priceDelta)}
                        </div>
                      </button>
                    ))}
                  </div>
                </FieldGroup>

                {/* dough */}
                <FieldGroup label="Impasto">
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {window.DOUGHS.map(d => (
                      <button key={d.id} onClick={() => setDough(d.id)} style={{
                        padding: "14px 16px", background: dough === d.id ? "var(--bg-3)" : "transparent",
                        border: "1px solid " + (dough === d.id ? "var(--gold-deep)" : "var(--line)"),
                        cursor: "pointer", textAlign: "left", color: "var(--text)",
                        display: "flex", alignItems: "center", gap: 14,
                      }}>
                        <span style={{
                          width: 16, height: 16, borderRadius: 999,
                          border: "1px solid " + (dough === d.id ? "var(--gold)" : "var(--line-2)"),
                          display: "grid", placeItems: "center",
                        }}>
                          {dough === d.id && <span style={{ width: 8, height: 8, borderRadius: 999, background: "var(--gold)" }}/>}
                        </span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 500 }}>{d.label}</div>
                          <div className="mono" style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 4 }}>{d.note}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </FieldGroup>
              </>
            )}

            {/* qty + add */}
            <div style={{
              display: "flex", gap: 12, alignItems: "stretch", marginTop: 32,
              padding: "20px 0", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)",
            }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 10,
                border: "1px solid var(--line-2)", padding: "0 16px", borderRadius: 999,
              }}>
                <button onClick={() => setQty(Math.max(1, qty - 1))} style={qtyBtnSlim}><Icon.minus/></button>
                <span className="mono" style={{ minWidth: 24, textAlign: "center", fontSize: 14 }}>{qty}</span>
                <button onClick={() => setQty(qty + 1)} style={qtyBtnSlim}><Icon.plus/></button>
              </div>
              <button
                onClick={() => {
                  cart.add({ itemId: item.id, variant, dough, qty });
                  toast("Aggiunto al carrello · " + item.name, "ok");
                }}
                className="btn ember"
                style={{ flex: 1, justifyContent: "center", padding: "16px 22px" }}>
                Aggiungi al carrello — {window.fmt(unitPrice * qty)}
              </button>
              <button onClick={() => setFav(!fav)} style={{
                width: 56, border: "1px solid var(--line-2)", borderRadius: 999,
                background: fav ? "var(--bg-3)" : "transparent",
                color: fav ? "var(--accent)" : "var(--text-dim)",
                cursor: "pointer", display: "grid", placeItems: "center",
              }}>
                <Icon.heart style={{ fill: fav ? "currentColor" : "none" }}/>
              </button>
            </div>

            {/* delivery line */}
            <div style={{
              display: "flex", justifyContent: "space-between",
              fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-dim)",
              letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 18,
            }}>
              <span>Consegna · 18–28 min</span>
              <span style={{ color: "var(--ok)" }}>● Disponibile ora</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ marginTop: 100, borderTop: "1px solid var(--line)" }}>
          <div style={{ display: "flex", gap: 0, borderBottom: "1px solid var(--line)" }}>
            {[
              ["ingredients", "Ingredienti"],
              ["allergens", "Allergeni"],
              ["nutrition", "Valori nutrizionali"],
              ["story", "La storia"],
            ].map(([k, l]) => (
              <button key={k} onClick={() => setTab(k)} style={{
                padding: "20px 28px", background: "none", border: "none",
                color: tab === k ? "var(--gold)" : "var(--text-dim)",
                cursor: "pointer", fontFamily: "var(--mono)", fontSize: 11,
                letterSpacing: "0.16em", textTransform: "uppercase",
                borderBottom: "1px solid " + (tab === k ? "var(--gold)" : "transparent"),
                marginBottom: -1,
              }}>{l}</button>
            ))}
          </div>

          <div style={{ padding: "48px 0", minHeight: 240 }}>
            {tab === "ingredients" && (
              <ul style={{ listStyle: "none", padding: 0, columns: 2, columnGap: 60, maxWidth: 720 }}>
                {(item.ingredients || []).map((ing, i) => (
                  <li key={i} style={{
                    display: "flex", gap: 14, alignItems: "baseline",
                    padding: "12px 0", borderBottom: "1px solid var(--line)",
                    breakInside: "avoid",
                  }}>
                    <span className="mono" style={{ color: "var(--gold)", fontSize: 11 }}>0{i + 1}</span>
                    <span>{ing}</span>
                  </li>
                ))}
              </ul>
            )}
            {tab === "allergens" && (
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                {(item.allergens || []).map(a => (
                  <span key={a} style={{
                    padding: "10px 18px", border: "1px solid var(--line-2)", borderRadius: 999,
                    fontFamily: "var(--mono)", fontSize: 12, letterSpacing: "0.1em",
                  }}>{a}</span>
                ))}
                {(!item.allergens || item.allergens.length === 0) && <p style={{ color: "var(--text-dim)" }}>Nessun allergene principale.</p>}
                <p style={{ flexBasis: "100%", color: "var(--text-faint)", fontSize: 13, marginTop: 20 }}>
                  Avvertenza: la nostra cucina manipola glutine, lattosio, frutta a guscio e uova. Tracce possibili.
                </p>
              </div>
            )}
            {tab === "nutrition" && item.nutrition && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 1, background: "var(--line)", maxWidth: 680 }}>
                {[
                  ["Calorie", item.nutrition.kcal + " kcal"],
                  ["Proteine", item.nutrition.p + "g"],
                  ["Carboidrati", item.nutrition.c + "g"],
                  ["Grassi", item.nutrition.f + "g"],
                ].map(([k, v]) => (
                  <div key={k} style={{ background: "var(--bg)", padding: 28 }}>
                    <div className="mono" style={{ fontSize: 10, color: "var(--text-faint)", letterSpacing: "0.16em", textTransform: "uppercase" }}>{k}</div>
                    <div className="display" style={{ fontSize: 32, color: "var(--gold)", marginTop: 8 }}>{v}</div>
                  </div>
                ))}
                <p style={{ gridColumn: "1/-1", color: "var(--text-faint)", fontSize: 13, background: "var(--bg)", padding: "16px 28px" }}>
                  Valori per pizza 14″ con impasto napoletano. Variano con la dimensione e l'impasto.
                </p>
              </div>
            )}
            {tab === "story" && (
              <p className="it" style={{ fontSize: 24, lineHeight: 1.5, maxWidth: 760, color: "var(--text-dim)" }}>
                {item.story || "Una pizza che parla da sola — non servono molte parole."}
              </p>
            )}
          </div>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <div style={{ marginTop: 80 }}>
            <div className="eyebrow" style={{ marginBottom: 24 }}>Da provare anche</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
              {related.map(r => (
                <window.PizzaCard
                  key={r.id} item={r}
                  onClick={() => { window.__app_setProduct(r.id); window.scrollTo({ top: 0 }); }}
                  onAdd={(it) => cart.add({ itemId: it.id, variant: "14", dough: "napoletana", qty: 1 })}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sticky add-to-cart at bottom (mobile/quick) */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 60,
        background: "var(--scrim-blur-strong)", backdropFilter: "blur(20px)",
        borderTop: "1px solid var(--line)",
        padding: "14px 56px",
        display: "flex", justifyContent: "space-between", alignItems: "center", gap: 18,
        transform: "translateY(100%)",
        animation: "rise .6s ease forwards",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div className="pizza-plate" style={{ width: 38, height: 38 }}><div className="crust-glow"/></div>
          <div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-faint)", letterSpacing: "0.14em", textTransform: "uppercase" }}>{item.category}</div>
            <div className="display" style={{ fontSize: 18 }}>{item.name}</div>
          </div>
        </div>
        <button onClick={() => { cart.add({ itemId: item.id, variant, dough, qty }); toast("Aggiunto · " + item.name, "ok"); }}
          className="btn ember">
          Aggiungi {window.fmt(unitPrice * qty)} <Icon.arrow className="arrow"/>
        </button>
      </div>
    </main>
  );
}

function FieldGroup({ label, children }) {
  return (
    <div style={{ marginTop: 28 }}>
      <div className="eyebrow" style={{ marginBottom: 14 }}>{label}</div>
      {children}
    </div>
  );
}

const qtyBtnSlim = {
  width: 24, height: 24, borderRadius: 999,
  border: "none", background: "transparent", color: "var(--text)",
  cursor: "pointer", display: "grid", placeItems: "center",
};

const linkBtn = {
  background: "none", border: "none", padding: 0, cursor: "pointer",
  color: "var(--text-dim)", fontFamily: "inherit", fontSize: "inherit",
  letterSpacing: "inherit", textTransform: "inherit",
};

Object.assign(window, { MenuScreen, ProductScreen });
