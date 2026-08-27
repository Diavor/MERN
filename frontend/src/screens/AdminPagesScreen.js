import React, { useEffect, useMemo, useRef, useState } from "react";
import "./AdminPagesScreen.scss";
import Icon from "../brace/ui/Icon";
import Message from "../brace/ui/Message";
import FieldSelect from "../brace/ui/FieldSelect";
import Portal from "../brace/ui/Portal";
import { useToast } from "../brace/ui/Toast";
import {
  AdminModal,
  AdminSkeleton,
  AdminStatusPill,
  AdminEmptyState,
  AdminFieldText,
  AdminFieldArea,
  AdminFieldSelect,
} from "../brace/admin/kit";
import {
  BLOCK_TYPES,
  blockDef,
  slugify,
  BlockEditor,
  BlockPreview,
  MediaLibrary,
  MediaThumb,
  useAutosave,
  AutosaveBadge,
} from "../brace/admin/pageBlocks";
import {
  fetchPages,
  fetchPage,
  createPage as apiCreate,
  updatePage as apiUpdate,
  deletePage as apiDelete,
} from "../brace/admin/api";

const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" }) : "—");

// ---- backend <-> editor draft mapping ----
const toDraft = (page) => ({
  _id: page._id,
  title: page.title || "",
  slug: page.slug || "",
  status: page.status || "draft",
  visibility: page.visibility || "public",
  publishDate: page.publishDate ? page.publishDate.slice(0, 10) : "",
  featured: page.featuredImage ? { url: page.featuredImage, name: "" } : null,
  blocks: (page.blocks || []).map((b) => ({ id: b.id, type: b.type, props: b.data || {} })),
  seoTitle: page.seo?.title || "",
  seoDesc: page.seo?.description || "",
  keywords: page.seo?.keywords || "",
  canonical: page.seo?.canonical || "",
  ogImage: page.seo?.ogImage ? { url: page.seo.ogImage, name: "" } : null,
});

const toPayload = (d) => ({
  title: d.title || "Pagina senza titolo",
  slug: d.slug || slugify(d.title) || "pagina",
  status: d.status,
  visibility: d.visibility,
  publishDate: d.publishDate || null,
  featuredImage: d.featured?.url || "",
  blocks: d.blocks.map((b) => ({ id: b.id, type: b.type, data: b.props })),
  seo: {
    title: d.seoTitle,
    description: d.seoDesc,
    keywords: d.keywords,
    canonical: d.canonical,
    ogImage: d.ogImage?.url || "",
  },
});

const AdminPagesScreen = () => {
  const toast = useToast();
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null); // draft object | "new" | null

  const load = async () => {
    try {
      setLoading(true);
      setPages(await fetchPages());
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

  const openEditor = async (id) => {
    try {
      const page = await fetchPage(id);
      setEditing(toDraft(page));
    } catch (e) {
      toast(e.message);
    }
  };

  const openNew = () =>
    setEditing({
      title: "",
      slug: "",
      status: "draft",
      visibility: "public",
      publishDate: "",
      featured: null,
      blocks: [],
      seoTitle: "",
      seoDesc: "",
      keywords: "",
      canonical: "",
      ogImage: null,
    });

  const duplicate = async (p) => {
    try {
      const full = await fetchPage(p._id);
      const copy = toPayload(toDraft(full));
      copy.title = full.title + " (copia)";
      copy.slug = full.slug + "-copia";
      copy.status = "draft";
      const created = await apiCreate(copy);
      setPages((prev) => [created, ...prev]);
      toast("Pagina duplicata", "ok");
    } catch (e) {
      toast(e.message);
    }
  };

  const remove = async (p) => {
    if (!window.confirm(`Eliminare "${p.title}"?`)) return;
    try {
      await apiDelete(p._id);
      setPages((prev) => prev.filter((x) => x._id !== p._id));
      toast("Pagina eliminata");
    } catch (e) {
      toast(e.message);
    }
  };

  const onEditorClose = (savedPage) => {
    setEditing(null);
    if (savedPage) {
      setPages((prev) => {
        const exists = prev.some((p) => p._id === savedPage._id);
        return exists ? prev.map((p) => (p._id === savedPage._id ? savedPage : p)) : [savedPage, ...prev];
      });
    } else {
      load();
    }
  };

  if (editing) {
    return <PageEditor initial={editing} onClose={onEditorClose} />;
  }

  return (
    <div className="b-rise">
      {loading ? (
        <AdminSkeleton rows={6} />
      ) : error ? (
        <Message variant="danger">{error}</Message>
      ) : (
        <PagesList pages={pages} onEdit={openEditor} onNew={openNew} onDuplicate={duplicate} onDelete={remove} />
      )}
    </div>
  );
};

// ---------------- LIST ----------------
function PagesList({ pages, onEdit, onNew, onDuplicate, onDelete }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("updatedAt");
  const [page, setPage] = useState(1);
  const perPage = 6;

  const filtered = useMemo(() => {
    let xs = pages.filter(
      (p) =>
        (status === "all" || p.status === status) &&
        (!q || (p.title || "").toLowerCase().includes(q.toLowerCase()) || (p.slug || "").includes(q.toLowerCase()))
    );
    xs = xs.slice().sort((a, b) => (sort === "title" ? (a.title || "").localeCompare(b.title || "") : new Date(b[sort] || 0) - new Date(a[sort] || 0)));
    return xs;
  }, [pages, q, status, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / perPage));
  const visible = filtered.slice((page - 1) * perPage, page * perPage);
  useEffect(() => {
    setPage(1);
  }, [q, status, sort]);

  return (
    <div className="admin-pages">
      <div className="admin-pages__toolbar">
        <div className="admin-pages__filters">
          {[["all", "Tutte"], ["published", "Pubblicate"], ["draft", "Bozze"]].map(([k, l]) => (
            <button
              key={k}
              onClick={() => setStatus(k)}
              className={"admin-pages__filter" + (status === k ? " is-active" : "")}
            >
              {l}
            </button>
          ))}
        </div>
        <div className="admin-pages__controls">
          <div className="admin-pages__search">
            <Icon.search className="admin-pages__search-icon" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cerca pagina o slug…" className="admin-pages__search-input" />
          </div>
          <FieldSelect
            value={sort}
            onChange={setSort}
            variant="pill"
            ariaLabel="Ordina pagine"
            className="admin-pages__sort"
            options={[
              { value: "updatedAt", label: "Aggiornate" },
              { value: "createdAt", label: "Create" },
              { value: "title", label: "Titolo A–Z" },
            ]}
          />
          <button className="b-btn sm ember" onClick={onNew}>+ Nuova pagina</button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <AdminEmptyState
          icon="▱"
          title="Nessuna pagina"
          body="Non ci sono pagine che corrispondono ai filtri. Crea la prima pagina del sito."
          action={<button className="b-btn ember" onClick={onNew}>+ Nuova pagina <Icon.arrow className="arrow" /></button>}
        />
      ) : (
        <div className="admin-pages__card">
          <div className="admin-pages__table-wrap">
            <table className="admin-pages__table admin-table">
              <thead>
                <tr className="admin-pages__table-head">
                  <th>Titolo</th>
                  <th>Slug</th>
                  <th>Stato</th>
                  <th>Aggiornata</th>
                  <th>SEO Title</th>
                  <th className="is-right">Azioni</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((p) => (
                  <tr key={p._id} className="admin-pages__row">
                    <td className="is-lead">
                      <button onClick={() => onEdit(p._id)} className="admin-pages__title-btn">
                        <div className="display admin-pages__title">{p.title || "Senza titolo"}</div>
                        <div className="mono admin-pages__blocks">{(p.blocks || []).length} blocchi</div>
                      </button>
                    </td>
                    <td data-label="Slug" className="is-mono is-sm is-dim">/{p.slug}</td>
                    <td data-label="Stato">
                      {p.status === "published" ? <AdminStatusPill label="Pubblicata" color="var(--ok)" soft /> : <AdminStatusPill label="Bozza" color="var(--gold)" soft />}
                    </td>
                    <td data-label="Aggiornata" className="is-mono is-sm is-dim">{fmtDate(p.updatedAt)}</td>
                    <td data-label="SEO Title" className="is-dim admin-pages__td--seo">
                      <div className="admin-pages__seo">{p.seo?.title || "—"}</div>
                    </td>
                    <td className="is-right">
                      <div className="admin-pages__actions">
                        <RowAction label="Modifica" onClick={() => onEdit(p._id)} />
                        <RowAction label="Duplica" onClick={() => onDuplicate(p)} />
                        <RowAction label="Elimina" danger onClick={() => onDelete(p)} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="admin-pages__pagination">
            <span className="mono admin-pages__page-info">
              {filtered.length} pagine · {page}/{pageCount}
            </span>
            <div className="admin-pages__pages">
              <button className="b-btn sm ghost admin-pages__pager" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>‹ Prec</button>
              {Array.from({ length: pageCount }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={"admin-pages__page-num" + (page === i + 1 ? " is-active" : "")}
                >
                  {i + 1}
                </button>
              ))}
              <button className="b-btn sm ghost admin-pages__pager" disabled={page === pageCount} onClick={() => setPage((p) => Math.min(pageCount, p + 1))}>Succ ›</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RowAction({ label, onClick, danger }) {
  return (
    <button onClick={onClick} className={"admin-pages__row-action" + (danger ? " admin-pages__row-action--danger" : "")}>
      {label}
    </button>
  );
}

// ---------------- EDITOR ----------------
function PageEditor({ initial, onClose }) {
  const toast = useToast();
  const [draft, setDraft] = useState(initial);
  const [selBlock, setSelBlock] = useState(initial.blocks[0] ? initial.blocks[0].id : null);
  const [rail, setRail] = useState("block");
  const [adding, setAdding] = useState(false);
  const [preview, setPreview] = useState(false);
  const [mediaCb, setMediaCb] = useState(null);
  const auto = useAutosave(draft);
  const idRef = useRef(initial._id || null);
  const savingRef = useRef(false);
  const lastSaved = useRef(null);

  const update = (patch) => setDraft((d) => ({ ...d, ...patch }));
  const selected = draft.blocks.find((b) => b.id === selBlock);

  // Persist the current draft (create on first save, update thereafter).
  const persist = async (overrides = {}) => {
    if (savingRef.current) return null;
    savingRef.current = true;
    try {
      const payload = { ...toPayload(draft), ...overrides };
      let saved;
      if (idRef.current) {
        saved = await apiUpdate(idRef.current, payload);
      } else {
        saved = await apiCreate(payload);
        idRef.current = saved._id;
        setDraft((d) => ({ ...d, _id: saved._id, slug: saved.slug }));
      }
      lastSaved.current = saved;
      return saved;
    } finally {
      savingRef.current = false;
    }
  };

  // Debounced autosave: whenever the autosave hook flips to "saving", schedule a
  // real persist ~1.2s later.
  useEffect(() => {
    if (!auto.dirty) return;
    const t = setTimeout(() => {
      persist().catch(() => {});
    }, 1300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);

  const addBlock = (type) => {
    const def = blockDef(type);
    const nb = { id: "b" + Math.random().toString(36).slice(2, 7), type, props: JSON.parse(JSON.stringify(def.defaults)) };
    update({ blocks: [...draft.blocks, nb] });
    setSelBlock(nb.id);
    setRail("block");
    setAdding(false);
  };
  const updateBlock = (nb) => update({ blocks: draft.blocks.map((b) => (b.id === nb.id ? nb : b)) });
  const moveBlock = (id, dir) => {
    const i = draft.blocks.findIndex((b) => b.id === id);
    const j = i + dir;
    if (j < 0 || j >= draft.blocks.length) return;
    const arr = draft.blocks.slice();
    [arr[i], arr[j]] = [arr[j], arr[i]];
    update({ blocks: arr });
  };
  const deleteBlock = (id) => {
    update({ blocks: draft.blocks.filter((b) => b.id !== id) });
    if (selBlock === id) setSelBlock(null);
  };

  const saveDraft = async () => {
    try {
      const saved = await persist();
      auto.markSaved();
      toast("Bozza salvata", "ok");
      return saved;
    } catch (e) {
      toast(e.message);
    }
  };

  const publish = async () => {
    try {
      const saved = await persist({ status: "published" });
      auto.markSaved();
      toast("Pagina pubblicata", "ok");
      onClose(saved);
    } catch (e) {
      toast(e.message);
    }
  };

  const close = () => {
    if (!auto.dirty || window.confirm("Modifiche non salvate. Uscire?")) {
      onClose(lastSaved.current);
    }
  };

  return (
    <div className="admin-pages b-rise">
      <div className="admin-pages__editor-head">
        <div className="admin-pages__editor-head-left">
          <button className="b-btn sm ghost" onClick={close}>‹ Pagine</button>
          <input
            value={draft.title}
            onChange={(e) => update({ title: e.target.value, slug: draft.slug || slugify(e.target.value) })}
            placeholder="Titolo della pagina"
            className="admin-pages__title-input"
          />
        </div>
        <div className="admin-pages__editor-actions">
          <AutosaveBadge status={auto.status} />
          <button className="b-btn sm ghost" onClick={() => setPreview(true)}>Anteprima</button>
          <button className="b-btn sm" onClick={saveDraft}>Salva bozza</button>
          <button className="b-btn sm ember" onClick={publish}>Pubblica</button>
        </div>
      </div>

      <div className="admin-pages__grid">
        {/* canvas */}
        <div className="admin-pages__canvas">
          <div className="admin-pages__canvas-head">
            <div className="eyebrow">Canvas · /{draft.slug || "..."}</div>
            <span className="mono admin-pages__canvas-count">{draft.blocks.length} blocchi</span>
          </div>

          {draft.blocks.length === 0 && (
            <div className="admin-pages__canvas-empty">
              <div className="display admin-pages__canvas-empty-title">Pagina vuota</div>
              <p className="admin-pages__canvas-empty-text">Aggiungi il primo blocco per iniziare.</p>
            </div>
          )}

          {draft.blocks.map((b, i) => {
            const active = b.id === selBlock;
            return (
              <div
                key={b.id}
                onClick={() => {
                  setSelBlock(b.id);
                  setRail("block");
                }}
                className={"admin-pages__block" + (active ? " is-active" : "")}
              >
                <div className="admin-pages__block-tag-wrap">
                  <span className="mono admin-pages__block-tag">{blockDef(b.type).label}</span>
                </div>
                <div className="admin-pages__block-tools">
                  <MiniBtn onClick={(e) => { e.stopPropagation(); moveBlock(b.id, -1); }} disabled={i === 0}>↑</MiniBtn>
                  <MiniBtn onClick={(e) => { e.stopPropagation(); moveBlock(b.id, 1); }} disabled={i === draft.blocks.length - 1}>↓</MiniBtn>
                  <MiniBtn onClick={(e) => { e.stopPropagation(); deleteBlock(b.id); }} danger>✕</MiniBtn>
                </div>
                <BlockPreview block={b} />
              </div>
            );
          })}

          <button
            onClick={() => setAdding(true)}
            className={"admin-pages__add-block" + (draft.blocks.length ? " is-divided" : "")}
          >
            <Icon.plus /> Aggiungi blocco
          </button>
        </div>

        {/* right rail */}
        <div className="admin-pages__rail">
          <div className="admin-pages__rail-tabs">
            {[["block", "Blocco"], ["page", "Pagina"], ["seo", "SEO"]].map(([k, l]) => (
              <button
                key={k}
                onClick={() => setRail(k)}
                className={"admin-pages__rail-tab" + (rail === k ? " is-active" : "")}
              >
                {l}
              </button>
            ))}
          </div>
          <div className="admin-pages__rail-body">
            {rail === "block" &&
              (selected ? (
                <div>
                  <div className="eyebrow admin-pages__rail-block-label">{blockDef(selected.type).label}</div>
                  <BlockEditor block={selected} onChange={updateBlock} openMedia={(cb) => setMediaCb(() => cb)} />
                </div>
              ) : (
                <div className="admin-pages__rail-empty">
                  <div className="mono admin-pages__rail-empty-text">Seleziona un blocco</div>
                </div>
              ))}
            {rail === "page" && <PageSettings draft={draft} update={update} openMedia={(cb) => setMediaCb(() => cb)} />}
            {rail === "seo" && <SeoSettings draft={draft} update={update} openMedia={(cb) => setMediaCb(() => cb)} />}
          </div>
        </div>
      </div>

      {/* add-block picker */}
      <AdminModal open={adding} onClose={() => setAdding(false)} title="Aggiungi blocco" subtitle="Costruttore pagine" width={680}>
        <div className="admin-pages__block-grid">
          {BLOCK_TYPES.map((b) => (
            <button
              key={b.type}
              onClick={() => addBlock(b.type)}
              className="admin-pages__block-type"
            >
              <div className="admin-pages__block-type-icon">{b.icon}</div>
              <div className="display admin-pages__block-type-label">{b.label}</div>
            </button>
          ))}
        </div>
      </AdminModal>

      <MediaLibrary open={!!mediaCb} onClose={() => setMediaCb(null)} onPick={(m) => { if (mediaCb) mediaCb(m); }} />

      {preview && <PagePreview page={draft} onClose={() => setPreview(false)} />}
    </div>
  );
}

function MiniBtn({ children, onClick, disabled, danger }) {
  return (
    <button onClick={onClick} disabled={disabled} className={"admin-pages__mini-btn" + (danger ? " admin-pages__mini-btn--danger" : "")}>
      {children}
    </button>
  );
}

function PageSettings({ draft, update, openMedia }) {
  return (
    <div className="admin-pages__settings">
      <AdminFieldText label="Slug" value={draft.slug} onChange={(v) => update({ slug: slugify(v) })} prefix="/" mono error={draft.slug && !/^[a-z0-9-]+$/.test(draft.slug) ? "Slug non valido" : null} />
      <AdminFieldSelect label="Stato" value={draft.status} options={[{ value: "draft", label: "Bozza" }, { value: "published", label: "Pubblicata" }]} onChange={(v) => update({ status: v })} />
      <AdminFieldSelect label="Visibilità" value={draft.visibility} options={[{ value: "public", label: "Pubblica" }, { value: "private", label: "Privata" }, { value: "scheduled", label: "Programmata" }]} onChange={(v) => update({ visibility: v })} />
      {draft.visibility === "scheduled" && <AdminFieldText label="Data pubblicazione" value={draft.publishDate || ""} onChange={(v) => update({ publishDate: v })} type="date" />}
      <div>
        <div className="admin-pages__field-label">Immagine in evidenza</div>
        <div className="admin-pages__media-row">
          <div className="admin-pages__media-thumb"><MediaThumb media={draft.featured} /></div>
          <button className="b-btn sm ghost" onClick={() => openMedia((m) => update({ featured: m }))}>{draft.featured ? "Cambia" : "Scegli"}</button>
        </div>
      </div>
    </div>
  );
}

function SeoSettings({ draft, update, openMedia }) {
  const titleLen = (draft.seoTitle || "").length;
  const descLen = (draft.seoDesc || "").length;
  return (
    <div className="admin-pages__settings">
      <div className="admin-pages__google">
        <div className="eyebrow admin-pages__google-label">Anteprima Google</div>
        <div className="admin-pages__google-preview">
          <div className="admin-pages__google-title">{draft.seoTitle || draft.title || "Titolo pagina"}</div>
          <div className="admin-pages__google-url">graniantichi.it › {draft.slug || "..."}</div>
          <div className="admin-pages__google-desc">{draft.seoDesc || "Aggiungi una descrizione SEO per migliorare l'anteprima nei risultati di ricerca."}</div>
        </div>
      </div>
      <AdminFieldText label="SEO Title" value={draft.seoTitle} onChange={(v) => update({ seoTitle: v })} hint={titleLen + "/60"} error={titleLen > 60 ? "Troppo lungo" : null} />
      <AdminFieldArea label="Meta description" value={draft.seoDesc} onChange={(v) => update({ seoDesc: v })} rows={3} hint={descLen + "/160"} error={descLen > 160 ? "Troppo lunga" : null} />
      <AdminFieldText label="Parole chiave" value={draft.keywords} onChange={(v) => update({ keywords: v })} hint="separate da virgola" />
      <AdminFieldText label="URL canonico" value={draft.canonical} onChange={(v) => update({ canonical: v })} mono />
      <div>
        <div className="admin-pages__field-label">Open Graph image</div>
        <div className="admin-pages__media-row">
          <div className="admin-pages__media-thumb"><MediaThumb media={draft.ogImage} /></div>
          <button className="b-btn sm ghost" onClick={() => openMedia((m) => update({ ogImage: m }))}>{draft.ogImage ? "Cambia" : "Scegli"}</button>
        </div>
      </div>
    </div>
  );
}

function PagePreview({ page, onClose }) {
  return (
    <Portal>
      <div className="admin-pages admin-pages__preview">
      <div className="admin-pages__preview-bar">
        <div className="admin-pages__preview-bar-left">
          <AdminStatusPill label={page.status === "published" ? "Pubblicata" : "Anteprima bozza"} color={page.status === "published" ? "var(--ok)" : "var(--gold)"} soft />
          <span className="mono admin-pages__preview-url">graniantichi.it/{page.slug}</span>
        </div>
        <button className="b-btn sm ghost" onClick={onClose}><Icon.close /> Chiudi anteprima</button>
      </div>
      <article className="admin-pages__preview-article">
        {page.blocks.length === 0 ? (
          <div className="admin-pages__preview-empty">
            <div className="display admin-pages__preview-empty-title">Pagina senza contenuto</div>
          </div>
        ) : (
          page.blocks.map((b) => (
            <div key={b.id}>
              <BlockPreview block={b} />
            </div>
          ))
        )}
      </article>
      </div>
    </Portal>
  );
}


export default AdminPagesScreen;
