// BRÀCE — Pages CMS: list, page builder shell, settings, and live preview.
// Uses window.BlockEditor / BlockPreview (admin-pages-blocks.jsx) + shared admin primitives.

const { useState: useS_pg, useMemo: useM_pg, useEffect: useE_pg } = React;

const PAGES_SEED = [
  { id: "p1", title: "Chi siamo", slug: "chi-siamo", status: "published", created: "2024-02-10", updated: "2026-05-02", seoTitle: "Chi siamo · BRÀCE Pizzeria Milano", seoDesc: "La storia di BRÀCE, pizzeria napoletana ai Navigli.", keywords: "pizzeria, milano, napoletana", canonical: "https://brace.it/chi-siamo", ogImage: { tone: 8, name: "impasto-72h.jpg", dim: "2880×1620" }, visibility: "public", blocks: [
    { id: "b1", type: "hero", props: { image: { tone: 8, name: "impasto-72h.jpg", dim: "2880×1620" }, overlay: 50, title: "Un impasto. Tre giorni.", subtitle: "Pizzeria napoletana ai Navigli, dal 2019.", ctaText: "Vedi il menu", ctaUrl: "/menu", align: "center" } },
    { id: "b2", type: "text", props: { html: "<p>BRÀCE nasce da un forno costruito mattone su mattone nell'estate del 2019. Cuociamo a <strong>485 gradi</strong>, novanta secondi, mai un secondo di più.</p>", align: "left" } },
  ] },
  { id: "p2", title: "Contatti", slug: "contatti", status: "published", created: "2024-02-12", updated: "2026-04-18", seoTitle: "Contatti · BRÀCE", seoDesc: "Dove siamo, orari e prenotazioni.", keywords: "contatti, prenotazioni", canonical: "https://brace.it/contatti", ogImage: null, visibility: "public", blocks: [
    { id: "b1", type: "map", props: { query: "Via dei Forni 14, Milano", zoom: 15 } },
  ] },
  { id: "p3", title: "Informazioni consegna", slug: "consegna", status: "published", created: "2024-03-01", updated: "2026-03-30", seoTitle: "Consegna a domicilio · BRÀCE", seoDesc: "Consegniamo in 30 minuti entro 3km.", keywords: "consegna, domicilio, milano", canonical: "https://brace.it/consegna", ogImage: null, visibility: "public", blocks: [] },
  { id: "p4", title: "Privacy Policy", slug: "privacy", status: "published", created: "2024-02-09", updated: "2025-11-22", seoTitle: "Privacy Policy · BRÀCE", seoDesc: "Informativa sul trattamento dei dati.", keywords: "privacy", canonical: "https://brace.it/privacy", ogImage: null, visibility: "public", blocks: [] },
  { id: "p5", title: "La nostra storia", slug: "storia", status: "draft", created: "2026-05-05", updated: "2026-05-12", seoTitle: "La storia di BRÀCE", seoDesc: "", keywords: "", canonical: "", ogImage: null, visibility: "private", blocks: [
    { id: "b1", type: "hero", props: { image: null, overlay: 40, title: "Dal 2019", subtitle: "Bozza in lavorazione", ctaText: "", ctaUrl: "", align: "center" } },
  ] },
  { id: "p6", title: "Eventi privati", slug: "eventi-privati", status: "draft", created: "2026-05-14", updated: "2026-05-16", seoTitle: "Eventi privati · BRÀCE", seoDesc: "", keywords: "", canonical: "", ogImage: null, visibility: "private", blocks: [] },
  { id: "p7", title: "Landing · Estate 2026", slug: "estate-2026", status: "draft", created: "2026-05-18", updated: "2026-05-18", seoTitle: "Estate 2026 · BRÀCE", seoDesc: "", keywords: "", canonical: "", ogImage: null, visibility: "scheduled", blocks: [] },
];

function AdminPages() {
  const toast = window.useToast();
  const [pages, setPages] = useS_pg(PAGES_SEED);
  const [editing, setEditing] = useS_pg(null); // page id or "new"
  const [loading, setLoading] = useS_pg(true);

  useE_pg(() => { const t = setTimeout(() => setLoading(false), 650); return () => clearTimeout(t); }, []);

  const current = editing === "new"
    ? { id: "new", title: "", slug: "", status: "draft", created: new Date().toISOString().slice(0, 10), updated: new Date().toISOString().slice(0, 10), seoTitle: "", seoDesc: "", keywords: "", canonical: "", ogImage: null, visibility: "public", blocks: [] }
    : pages.find(p => p.id === editing);

  const savePage = (page) => {
    setPages(prev => {
      const exists = prev.some(p => p.id === page.id);
      const stamped = { ...page, updated: new Date().toISOString().slice(0, 10) };
      return exists ? prev.map(p => p.id === page.id ? stamped : p) : [{ ...stamped, id: "p" + (prev.length + 1) }, ...prev];
    });
  };

  if (editing && current) {
    return <PageEditor page={current} onSave={(pg) => { savePage(pg); toast("Pagina salvata", "ok"); }}
      onPublish={(pg) => { savePage({ ...pg, status: "published" }); toast("Pagina pubblicata", "ok"); setEditing(null); }}
      onClose={() => setEditing(null)}/>;
  }

  return loading
    ? <window.AdminSkeleton rows={6}/>
    : <PagesList pages={pages} onEdit={setEditing}
        onDuplicate={(p) => { setPages(prev => [{ ...p, id: "p" + (prev.length + 1), title: p.title + " (copia)", slug: p.slug + "-copia", status: "draft" }, ...prev]); toast("Pagina duplicata", "ok"); }}
        onDelete={(p) => { if (window.confirm("Eliminare “" + p.title + "”?")) { setPages(prev => prev.filter(x => x.id !== p.id)); toast("Pagina eliminata"); } }}
        onPreview={(p) => setEditing(p.id)}
        onNew={() => setEditing("new")}/>;
}

// ---------------- LIST ----------------
function PagesList({ pages, onEdit, onDuplicate, onDelete, onPreview, onNew }) {
  const [q, setQ] = useS_pg("");
  const [status, setStatus] = useS_pg("all");
  const [sort, setSort] = useS_pg("updated");
  const [page, setPage] = useS_pg(1);
  const perPage = 5;

  const filtered = useM_pg(() => {
    let xs = pages.filter(p =>
      (status === "all" || p.status === status) &&
      (!q || p.title.toLowerCase().includes(q.toLowerCase()) || p.slug.includes(q.toLowerCase()))
    );
    xs = xs.slice().sort((a, b) => sort === "title" ? a.title.localeCompare(b.title) : (b[sort] || "").localeCompare(a[sort] || ""));
    return xs;
  }, [pages, q, status, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / perPage));
  const visible = filtered.slice((page - 1) * perPage, page * perPage);
  useE_pg(() => { setPage(1); }, [q, status, sort]);

  return (
    <div>
      {/* toolbar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[["all", "Tutte"], ["published", "Pubblicate"], ["draft", "Bozze"]].map(([k, l]) => (
            <button key={k} onClick={() => setStatus(k)} style={{
              padding: "10px 18px", borderRadius: 999, cursor: "pointer",
              background: status === k ? "var(--text)" : "transparent", color: status === k ? "var(--bg)" : "var(--text-dim)",
              border: "1px solid " + (status === k ? "var(--text)" : "var(--line)"),
              fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase",
            }}>{l}</button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", border: "1px solid var(--line)", borderRadius: 999, minWidth: 220 }}>
            <Icon.search style={{ color: "var(--text-faint)" }}/>
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Cerca pagina o slug…" style={{ flex: 1, background: "none", border: "none", outline: "none", color: "var(--text)", fontFamily: "var(--mono)", fontSize: 12 }}/>
          </div>
          <select value={sort} onChange={e => setSort(e.target.value)} style={{
            background: "var(--bg-2)", color: "var(--text-dim)", border: "1px solid var(--line)", borderRadius: 999,
            padding: "10px 14px", fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase",
          }}>
            <option value="updated">Aggiornate</option>
            <option value="created">Create</option>
            <option value="title">Titolo A–Z</option>
          </select>
          <button className="btn sm ember" onClick={onNew}>+ Nuova pagina</button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <window.AdminEmptyState icon="▱" title="Nessuna pagina" body="Non ci sono pagine che corrispondono ai filtri. Crea la prima pagina del sito."
          action={<button className="btn ember" onClick={onNew}>+ Nuova pagina <Icon.arrow className="arrow"/></button>}/>
      ) : (
        <div style={{ background: "var(--bg-2)", border: "1px solid var(--line)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--text-faint)" }}>
                <th style={pgTh}>Titolo</th>
                <th style={pgTh}>Slug</th>
                <th style={pgTh}>Stato</th>
                <th style={pgTh}>Aggiornata</th>
                <th style={pgTh}>SEO Title</th>
                <th style={{ ...pgTh, textAlign: "right" }}>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {visible.map(p => (
                <tr key={p.id} style={{ borderTop: "1px solid var(--line)" }}>
                  <td style={pgTd}>
                    <button onClick={() => onEdit(p.id)} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: "var(--text)", textAlign: "left" }}>
                      <div className="display" style={{ fontSize: 19 }}>{p.title || "Senza titolo"}</div>
                      <div className="mono" style={{ fontSize: 10, color: "var(--text-faint)", letterSpacing: "0.08em", marginTop: 3 }}>{p.blocks.length} blocchi</div>
                    </button>
                  </td>
                  <td style={{ ...pgTd, fontFamily: "var(--mono)", fontSize: 12, color: "var(--text-dim)" }}>/{p.slug}</td>
                  <td style={pgTd}>
                    {p.status === "published"
                      ? <window.AdminStatusPill label="Pubblicata" color="var(--ok)" soft/>
                      : <window.AdminStatusPill label="Bozza" color="var(--gold)" soft/>}
                  </td>
                  <td style={{ ...pgTd, fontFamily: "var(--mono)", fontSize: 12, color: "var(--text-dim)" }}>{fmtDate(p.updated)}</td>
                  <td style={{ ...pgTd, color: "var(--text-dim)", fontSize: 13, maxWidth: 220 }}>
                    <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.seoTitle || "—"}</div>
                  </td>
                  <td style={{ ...pgTd, textAlign: "right" }}>
                    <div style={{ display: "inline-flex", gap: 6 }}>
                      <RowAction label="Modifica" onClick={() => onEdit(p.id)}/>
                      <RowAction label="Duplica" onClick={() => onDuplicate(p)}/>
                      <RowAction label="Anteprima" onClick={() => onPreview(p)}/>
                      <RowAction label="Elimina" danger onClick={() => onDelete(p)}/>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px", borderTop: "1px solid var(--line)" }}>
            <span className="mono" style={{ fontSize: 11, color: "var(--text-faint)", letterSpacing: "0.1em" }}>
              {filtered.length} pagine · {page}/{pageCount}
            </span>
            <div style={{ display: "flex", gap: 6 }}>
              <button className="btn sm ghost" disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))} style={{ opacity: page === 1 ? 0.4 : 1 }}>‹ Prec</button>
              {Array.from({ length: pageCount }).map((_, i) => (
                <button key={i} onClick={() => setPage(i + 1)} style={{
                  width: 34, height: 34, cursor: "pointer",
                  background: page === i + 1 ? "var(--text)" : "transparent", color: page === i + 1 ? "var(--bg)" : "var(--text-dim)",
                  border: "1px solid " + (page === i + 1 ? "var(--text)" : "var(--line)"), fontFamily: "var(--mono)", fontSize: 12,
                }}>{i + 1}</button>
              ))}
              <button className="btn sm ghost" disabled={page === pageCount} onClick={() => setPage(p => Math.min(pageCount, p + 1))} style={{ opacity: page === pageCount ? 0.4 : 1 }}>Succ ›</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RowAction({ label, onClick, danger }) {
  return <button onClick={onClick} style={{
    padding: "5px 11px", background: "transparent", cursor: "pointer",
    border: "1px solid var(--line)", color: danger ? "var(--accent)" : "var(--text-dim)",
    fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase",
  }}>{label}</button>;
}

// ---------------- EDITOR ----------------
function PageEditor({ page, onSave, onPublish, onClose }) {
  const [draft, setDraft] = useS_pg(page);
  const [selBlock, setSelBlock] = useS_pg(page.blocks[0] ? page.blocks[0].id : null);
  const [rail, setRail] = useS_pg("block"); // block | page | seo
  const [adding, setAdding] = useS_pg(false);
  const [preview, setPreview] = useS_pg(false);
  const [mediaCb, setMediaCb] = useS_pg(null);
  const auto = window.useAutosave(draft);

  const update = (patch) => setDraft(d => ({ ...d, ...patch }));
  const selected = draft.blocks.find(b => b.id === selBlock);

  const addBlock = (type) => {
    const def = window.blockDef(type);
    const nb = { id: "b" + Math.random().toString(36).slice(2, 7), type, props: JSON.parse(JSON.stringify(def.defaults)) };
    update({ blocks: [...draft.blocks, nb] });
    setSelBlock(nb.id); setRail("block"); setAdding(false);
  };
  const updateBlock = (nb) => update({ blocks: draft.blocks.map(b => b.id === nb.id ? nb : b) });
  const moveBlock = (id, dir) => {
    const i = draft.blocks.findIndex(b => b.id === id);
    const j = i + dir;
    if (j < 0 || j >= draft.blocks.length) return;
    const arr = draft.blocks.slice();
    [arr[i], arr[j]] = [arr[j], arr[i]];
    update({ blocks: arr });
  };
  const deleteBlock = (id) => { update({ blocks: draft.blocks.filter(b => b.id !== id) }); if (selBlock === id) setSelBlock(null); };

  return (
    <div>
      {/* editor top bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 20, marginBottom: 24, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, flex: 1, minWidth: 300 }}>
          <button className="btn sm ghost" onClick={() => { if (!auto.dirty || window.confirm("Modifiche non salvate. Uscire?")) onClose(); }}>‹ Pagine</button>
          <input value={draft.title} onChange={e => update({ title: e.target.value, slug: draft.slug || window.slugify(e.target.value) })}
            placeholder="Titolo della pagina" style={{
              flex: 1, background: "none", border: "none", borderBottom: "1px solid var(--line)", outline: "none",
              color: "var(--text)", fontFamily: "var(--serif)", fontSize: 28, padding: "4px 0",
            }}/>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <window.AutosaveBadge status={auto.status}/>
          <button className="btn sm ghost" onClick={() => setPreview(true)}>Anteprima</button>
          <button className="btn sm" onClick={() => { auto.markSaved(); onSave(draft); }}>Salva bozza</button>
          <button className="btn sm ember" onClick={() => { auto.markSaved(); onPublish(draft); }}>Pubblica</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 24, alignItems: "start" }}>
        {/* canvas */}
        <div style={{ background: "var(--bg-2)", border: "1px solid var(--line)", minHeight: 500 }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div className="eyebrow">Canvas · /{draft.slug || "..."}</div>
            <span className="mono" style={{ fontSize: 10, color: "var(--text-faint)", letterSpacing: "0.12em" }}>{draft.blocks.length} blocchi</span>
          </div>

          {draft.blocks.length === 0 && (
            <div style={{ padding: "70px 30px", textAlign: "center", color: "var(--text-dim)" }}>
              <div className="display" style={{ fontSize: 26 }}>Pagina vuota</div>
              <p style={{ marginTop: 8 }}>Aggiungi il primo blocco per iniziare.</p>
            </div>
          )}

          {draft.blocks.map((b, i) => {
            const active = b.id === selBlock;
            return (
              <div key={b.id} onClick={() => { setSelBlock(b.id); setRail("block"); }} style={{
                position: "relative", borderBottom: "1px solid var(--line)", cursor: "pointer",
                outline: active ? "2px solid var(--accent)" : "none", outlineOffset: -2,
              }}>
                <div style={{
                  position: "absolute", top: 8, left: 8, zIndex: 2, display: "flex", gap: 4,
                  opacity: active ? 1 : 0.35, transition: "opacity .15s",
                }}>
                  <span className="mono" style={{ fontSize: 9, padding: "3px 7px", background: "var(--bg)", border: "1px solid var(--line-2)", color: "var(--gold)", letterSpacing: "0.1em", textTransform: "uppercase" }}>{window.blockDef(b.type).label}</span>
                </div>
                <div style={{ position: "absolute", top: 8, right: 8, zIndex: 2, display: "flex", gap: 4, opacity: active ? 1 : 0, transition: "opacity .15s" }}>
                  <MiniBtn onClick={(e) => { e.stopPropagation(); moveBlock(b.id, -1); }} disabled={i === 0}>↑</MiniBtn>
                  <MiniBtn onClick={(e) => { e.stopPropagation(); moveBlock(b.id, 1); }} disabled={i === draft.blocks.length - 1}>↓</MiniBtn>
                  <MiniBtn onClick={(e) => { e.stopPropagation(); deleteBlock(b.id); }} danger>✕</MiniBtn>
                </div>
                <window.BlockPreview block={b}/>
              </div>
            );
          })}

          <button onClick={() => setAdding(true)} style={{
            width: "100%", padding: "20px", background: "transparent", border: "none", borderTop: draft.blocks.length ? "1px dashed var(--line-2)" : "none",
            cursor: "pointer", color: "var(--gold)", fontFamily: "var(--mono)", fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          }}><Icon.plus/> Aggiungi blocco</button>
        </div>

        {/* right rail */}
        <div style={{ position: "sticky", top: 200, background: "var(--bg-2)", border: "1px solid var(--line)" }}>
          <div style={{ display: "flex", borderBottom: "1px solid var(--line)" }}>
            {[["block", "Blocco"], ["page", "Pagina"], ["seo", "SEO"]].map(([k, l]) => (
              <button key={k} onClick={() => setRail(k)} style={{
                flex: 1, padding: "14px 0", background: "none", border: "none", cursor: "pointer",
                color: rail === k ? "var(--gold)" : "var(--text-dim)", borderBottom: "1px solid " + (rail === k ? "var(--gold)" : "transparent"),
                marginBottom: -1, fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase",
              }}>{l}</button>
            ))}
          </div>
          <div style={{ padding: 22, maxHeight: "calc(100vh - 320px)", overflowY: "auto" }}>
            {rail === "block" && (selected
              ? <div>
                  <div className="eyebrow" style={{ marginBottom: 16 }}>{window.blockDef(selected.type).label}</div>
                  <window.BlockEditor block={selected} onChange={updateBlock} openMedia={(cb) => setMediaCb(() => cb)}/>
                </div>
              : <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-faint)" }}>
                  <div className="mono" style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase" }}>Seleziona un blocco</div>
                </div>)}
            {rail === "page" && <PageSettings draft={draft} update={update} openMedia={(cb) => setMediaCb(() => cb)}/>}
            {rail === "seo" && <SeoSettings draft={draft} update={update} openMedia={(cb) => setMediaCb(() => cb)}/>}
          </div>
        </div>
      </div>

      {/* add-block picker */}
      <window.AdminModal open={adding} onClose={() => setAdding(false)} title="Aggiungi blocco" subtitle="Costruttore pagine" width={680}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
          {window.BLOCK_TYPES.map(b => (
            <button key={b.type} onClick={() => addBlock(b.type)} style={{
              padding: "22px 16px", background: "var(--bg)", border: "1px solid var(--line)", cursor: "pointer",
              color: "var(--text)", textAlign: "left", transition: "border-color .15s",
            }} onMouseEnter={e => e.currentTarget.style.borderColor = "var(--gold-deep)"} onMouseLeave={e => e.currentTarget.style.borderColor = "var(--line)"}>
              <div style={{ fontSize: 24, color: "var(--gold)", fontFamily: "var(--mono)" }}>{b.icon}</div>
              <div className="display" style={{ fontSize: 18, marginTop: 12 }}>{b.label}</div>
            </button>
          ))}
        </div>
      </window.AdminModal>

      {/* media library */}
      <window.MediaLibrary open={!!mediaCb} onClose={() => setMediaCb(null)} onPick={(m) => { if (mediaCb) mediaCb(m); }}/>

      {/* preview overlay */}
      {preview && <PagePreview page={draft} onClose={() => setPreview(false)}/>}
    </div>
  );
}

function MiniBtn({ children, onClick, disabled, danger }) {
  return <button onClick={onClick} disabled={disabled} style={{
    width: 26, height: 26, background: "var(--bg)", border: "1px solid var(--line-2)", cursor: disabled ? "not-allowed" : "pointer",
    color: danger ? "var(--accent)" : "var(--text)", fontSize: 12, opacity: disabled ? 0.3 : 1, display: "grid", placeItems: "center",
  }}>{children}</button>;
}

// ---------------- PAGE SETTINGS ----------------
function PageSettings({ draft, update, openMedia }) {
  return (
    <div style={{ display: "grid", gap: 14 }}>
      <window.AdminFieldText label="Slug" value={draft.slug} onChange={v => update({ slug: window.slugify(v) })} prefix="/" mono error={draft.slug && !/^[a-z0-9-]+$/.test(draft.slug) ? "Slug non valido" : null}/>
      <window.AdminFieldSelect label="Stato" value={draft.status} options={[{ value: "draft", label: "Bozza" }, { value: "published", label: "Pubblicata" }]} onChange={v => update({ status: v })}/>
      <window.AdminFieldSelect label="Visibilità" value={draft.visibility} options={[{ value: "public", label: "Pubblica" }, { value: "private", label: "Privata" }, { value: "scheduled", label: "Programmata" }]} onChange={v => update({ visibility: v })}/>
      {draft.visibility === "scheduled" && <window.AdminFieldText label="Data pubblicazione" value={draft.publishDate || ""} onChange={v => update({ publishDate: v })} type="date"/>}
      <div>
        <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-faint)", letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 8 }}>Immagine in evidenza</div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ width: 80, flexShrink: 0 }}>{draft.featured ? <window.MediaThumb tone={draft.featured.tone}/> : <div className="ph" style={{ aspectRatio: "4/3" }}/>}</div>
          <button className="btn sm ghost" onClick={() => openMedia(m => update({ featured: m }))}>{draft.featured ? "Cambia" : "Scegli"}</button>
        </div>
      </div>
    </div>
  );
}

// ---------------- SEO SETTINGS ----------------
function SeoSettings({ draft, update, openMedia }) {
  const titleLen = (draft.seoTitle || "").length;
  const descLen = (draft.seoDesc || "").length;
  return (
    <div style={{ display: "grid", gap: 14 }}>
      {/* SERP preview */}
      <div style={{ background: "var(--bg)", border: "1px solid var(--line)", padding: 16 }}>
        <div className="eyebrow" style={{ marginBottom: 10 }}>Anteprima Google</div>
        <div style={{ fontFamily: "arial, sans-serif" }}>
          <div style={{ color: "#8ab4f8", fontSize: 15, lineHeight: 1.3 }}>{draft.seoTitle || draft.title || "Titolo pagina"}</div>
          <div style={{ color: "var(--ok)", fontSize: 12, marginTop: 2 }}>brace.it › {draft.slug || "..."}</div>
          <div style={{ color: "var(--text-dim)", fontSize: 12, marginTop: 4, lineHeight: 1.4 }}>{draft.seoDesc || "Aggiungi una descrizione SEO per migliorare l'anteprima nei risultati di ricerca."}</div>
        </div>
      </div>
      <window.AdminFieldText label="SEO Title" value={draft.seoTitle} onChange={v => update({ seoTitle: v })} hint={titleLen + "/60"} error={titleLen > 60 ? "Troppo lungo" : null}/>
      <window.AdminFieldArea label="Meta description" value={draft.seoDesc} onChange={v => update({ seoDesc: v })} rows={3} hint={descLen + "/160"} error={descLen > 160 ? "Troppo lunga" : null}/>
      <window.AdminFieldText label="Parole chiave" value={draft.keywords} onChange={v => update({ keywords: v })} hint="separate da virgola"/>
      <window.AdminFieldText label="URL canonico" value={draft.canonical} onChange={v => update({ canonical: v })} mono/>
      <div>
        <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-faint)", letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 8 }}>Open Graph image</div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ width: 80, flexShrink: 0 }}>{draft.ogImage ? <window.MediaThumb tone={draft.ogImage.tone}/> : <div className="ph" style={{ aspectRatio: "1.91/1" }}/>}</div>
          <button className="btn sm ghost" onClick={() => openMedia(m => update({ ogImage: m }))}>{draft.ogImage ? "Cambia" : "Scegli"}</button>
        </div>
      </div>
    </div>
  );
}

// ---------------- LIVE PREVIEW ----------------
function PagePreview({ page, onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 600, background: "var(--bg)", overflowY: "auto" }}>
      <div style={{
        position: "sticky", top: 0, zIndex: 2, padding: "16px 28px", background: "var(--scrim-blur-strong)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <window.AdminStatusPill label={page.status === "published" ? "Pubblicata" : "Anteprima bozza"} color={page.status === "published" ? "var(--ok)" : "var(--gold)"} soft/>
          <span className="mono" style={{ fontSize: 12, color: "var(--text-dim)", letterSpacing: "0.08em" }}>brace.it/{page.slug}</span>
        </div>
        <button className="btn sm ghost" onClick={onClose}><Icon.close/> Chiudi anteprima</button>
      </div>
      <article style={{ maxWidth: 1080, margin: "0 auto" }}>
        {page.blocks.length === 0
          ? <div style={{ padding: "120px 40px", textAlign: "center", color: "var(--text-faint)" }}><div className="display" style={{ fontSize: 32 }}>Pagina senza contenuto</div></div>
          : page.blocks.map(b => <div key={b.id}><window.BlockPreview block={b}/></div>)}
      </article>
    </div>
  );
}

const fmtDate = (iso) => { const d = new Date(iso); return d.toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" }); };
const pgTh = { padding: "16px 24px", fontWeight: 400 };
const pgTd = { padding: "18px 24px", fontSize: 14, verticalAlign: "middle" };

Object.assign(window, { AdminPages });
