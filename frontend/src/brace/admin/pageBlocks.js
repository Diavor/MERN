// Grani Antichi Pages CMS — block registry, per-block editors, preview renderer, mini
// rich-text, Media Library, and the autosave hook. Ported from the design
// sources (admin-pages-blocks.jsx + the MediaLibrary/autosave parts of
// admin-shared.jsx), adapted to real image URLs (backed by /api/upload) instead
// of the prototype's placeholder "tone" swatches.
import "./pageBlocks.scss";
import React, { useState, useRef, useEffect, useCallback } from "react";
import Icon from "../ui/Icon";
import axios from "../../api/axiosConfig";
import {
  AdminModal,
  AdminFieldText,
  AdminFieldArea,
  AdminSegmented,
  AdminFieldToggle,
} from "./kit";

// ---------------- BLOCK REGISTRY ----------------
export const BLOCK_TYPES = [
  { type: "hero", label: "Hero", icon: "▭", defaults: { image: null, overlay: 45, title: "Titolo hero", subtitle: "Sottotitolo descrittivo", ctaText: "Scopri", ctaUrl: "/menu", align: "center" } },
  { type: "text", label: "Testo", icon: "¶", defaults: { html: "<p>Scrivi qui il tuo testo. Usa la barra per <strong>grassetto</strong>, <em>corsivo</em>, titoli e liste.</p>", align: "left" } },
  { type: "image", label: "Immagine", icon: "◳", defaults: { media: null, alt: "", caption: "", align: "center", width: 100 } },
  { type: "gallery", label: "Galleria", icon: "▥", defaults: { images: [], layout: "grid", columns: 3 } },
  { type: "columns", label: "Due colonne", icon: "◫", defaults: { left: { kind: "text", text: "Colonna sinistra", media: null, btnText: "", btnUrl: "" }, right: { kind: "image", text: "", media: null, btnText: "", btnUrl: "" } } },
  { type: "video", label: "Video", icon: "▷", defaults: { provider: "youtube", url: "https://youtube.com/watch?v=" } },
  { type: "button", label: "Bottone", icon: "◖", defaults: { text: "Prenota un tavolo", url: "/contatti", style: "ember", icon: "arrow" } },
  { type: "map", label: "Mappa", icon: "◎", defaults: { query: "Via dei Forni 14, Mogliano Veneto", zoom: 15 } },
  { type: "divider", label: "Divisore", icon: "—", defaults: { style: "solid" } },
  { type: "spacer", label: "Spazio", icon: "↕", defaults: { height: 60 } },
  { type: "html", label: "HTML", icon: "</>", defaults: { code: "<!-- HTML personalizzato -->\n<div class=\"promo\">Promo</div>" } },
];
export const blockDef = (type) => BLOCK_TYPES.find((b) => b.type === type) || BLOCK_TYPES[0];

export const slugify = (s) =>
  String(s || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

// ---------------- MEDIA THUMB (real image or placeholder) ----------------
export function MediaThumb({ media, style }) {
  if (media && media.url) {
    return (
      <img
        src={media.url}
        alt={media.name || ""}
        className="page-block__thumb-img"
        style={style}
      />
    );
  }
  return <div className="ph page-block__thumb-ph" style={style} />;
}

// ---------------- MEDIA LIBRARY ----------------
// Pick an image by URL or by uploading a file. Calls back with { url, name, dim }.
export function MediaLibrary({ open, onClose, onPick }) {
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const fileRef = useRef(null);

  useEffect(() => {
    if (open) {
      setUrl("");
      setName("");
      setError(null);
    }
  }, [open]);

  const upload = async (file) => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const userInfo = localStorage.getItem("userInfo") ? JSON.parse(localStorage.getItem("userInfo")) : null;
      const fd = new FormData();
      fd.append("img", file);
      const { data } = await axios.post("/api/upload", fd, {
        headers: {
          "Content-Type": "multipart/form-data",
          ...(userInfo?.token && { Authorization: `Bearer ${userInfo.token}` }),
        },
      });
      setUrl(data.url);
      setName(file.name);
    } catch (e) {
      setError(e.response?.data?.message || e.message);
    } finally {
      setUploading(false);
    }
  };

  const confirm = () => {
    if (!url.trim()) {
      setError("Inserisci un URL o carica un file");
      return;
    }
    onPick({ url: url.trim(), name: name || url.split("/").pop(), dim: "" });
    onClose();
  };

  return (
    <AdminModal
      open={open}
      onClose={onClose}
      title="Libreria media"
      subtitle="Immagini"
      width={620}
      footer={
        <>
          <span className={`mono page-block__ml-status${error ? " is-error" : ""}`}>
            {error || "Incolla un URL o carica un file"}
          </span>
          <div className="page-block__ml-actions">
            <button className="b-btn sm ghost" onClick={onClose}>Annulla</button>
            <button className="b-btn sm ember" onClick={confirm} disabled={uploading}>Usa selezionata</button>
          </div>
        </>
      }
    >
      <div className="page-block__ml-body">
        <button
          onClick={() => fileRef.current && fileRef.current.click()}
          className="page-block__ml-drop"
        >
          <Icon.plus />
          <span className="mono page-block__ml-drop-label">
            {uploading ? "Caricamento…" : "Carica un file"}
          </span>
        </button>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => upload(e.target.files[0])} />

        <AdminFieldText label="URL immagine" value={url} onChange={setUrl} placeholder="https://…" mono />

        {url && (
          <div className="page-block__ml-preview">
            <MediaThumb media={{ url, name }} />
          </div>
        )}
      </div>
    </AdminModal>
  );
}

// ---------------- AUTOSAVE ----------------
// Debounced dirty tracker. Returns { status: idle|saving|saved, dirty, markSaved }.
export function useAutosave(value, delay = 1200) {
  const [status, setStatus] = useState("idle");
  const [dirty, setDirty] = useState(false);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setDirty(true);
    setStatus("saving");
    const t = setTimeout(() => setStatus("saved"), delay);
    return () => clearTimeout(t);
  }, [value, delay]);

  // Warn before unload while there are unsaved changes.
  useEffect(() => {
    const handler = (e) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const markSaved = useCallback(() => {
    setDirty(false);
    setStatus("saved");
  }, []);

  return { status, dirty, markSaved };
}

export function AutosaveBadge({ status }) {
  const map = {
    idle: ["var(--text-faint)", "Nessuna modifica"],
    saving: ["var(--gold)", "Salvataggio…"],
    saved: ["var(--ok)", "Bozza salvata"],
  };
  const [color, label] = map[status] || map.idle;
  return (
    <span className="mono page-block__autosave" style={{ color }}>
      <span className="page-block__autosave-dot" style={{ background: color }} />
      {label}
    </span>
  );
}

// ---------------- MINI RICH TEXT ----------------
function MiniRichText({ value, onChange }) {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) ref.current.innerHTML = value;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const exec = (cmd, arg) => {
    document.execCommand(cmd, false, arg);
    ref.current.focus();
    onChange(ref.current.innerHTML);
  };

  const Btn = ({ cmd, arg, children, title }) => (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => {
        e.preventDefault();
        exec(cmd, arg);
      }}
      className="page-block__rt-btn"
    >
      {children}
    </button>
  );

  return (
    <div>
      <div className="page-block__rt-toolbar">
        <Btn cmd="bold" title="Grassetto"><strong>B</strong></Btn>
        <Btn cmd="italic" title="Corsivo"><em>I</em></Btn>
        <Btn cmd="underline" title="Sottolineato"><span className="page-block__rt-underline">U</span></Btn>
        <Btn cmd="formatBlock" arg="<h2>" title="Titolo">H</Btn>
        <Btn cmd="formatBlock" arg="<blockquote>" title="Citazione">❝</Btn>
        <Btn cmd="insertUnorderedList" title="Elenco">•</Btn>
        <Btn cmd="insertOrderedList" title="Elenco numerato">1.</Btn>
        <Btn cmd="justifyLeft" title="Sinistra">⇤</Btn>
        <Btn cmd="justifyCenter" title="Centro">↔</Btn>
        <Btn cmd="justifyRight" title="Destra">⇥</Btn>
        <button
          type="button"
          title="Link"
          onMouseDown={(e) => {
            e.preventDefault();
            const u = window.prompt("URL del link", "https://");
            if (u) exec("createLink", u);
          }}
          className="page-block__rt-link"
        >
          ↗
        </button>
        {["var(--accent)", "var(--gold)", "var(--text)"].map((c) => (
          <button
            key={c}
            type="button"
            title="Colore"
            onMouseDown={(e) => {
              e.preventDefault();
              const resolved = getComputedStyle(document.documentElement).getPropertyValue(c.slice(4, -1)).trim() || c;
              exec("foreColor", resolved);
            }}
            className="page-block__rt-color"
            style={{ background: c }}
          />
        ))}
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={(e) => onChange(e.currentTarget.innerHTML)}
        className="page-block__rt-editor"
      />
    </div>
  );
}

// ---------------- SMALL HELPERS ----------------
function FieldRow({ label, children }) {
  return (
    <div className="page-block__field-row">
      <span className="page-block__label">{label}</span>
      <div>{children}</div>
    </div>
  );
}

function SliderRow({ label, value, min, max, unit, onChange }) {
  return (
    <div>
      <div className="page-block__slider-head">
        <span className="page-block__label">{label}</span>
        <span className="mono page-block__slider-value">{value}{unit}</span>
      </div>
      <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} className="page-block__slider-input" />
    </div>
  );
}

function MediaPickRow({ label, media, onPick, onClear }) {
  return (
    <div>
      <div className="page-block__label">{label}</div>
      <div className="page-block__pick-row">
        <div className="page-block__pick-thumb">
          <MediaThumb media={media} />
        </div>
        <div className="page-block__pick-actions">
          <button className="b-btn sm ghost" onClick={onPick}>{media ? "Cambia" : "Scegli da libreria"}</button>
          {media && <button className="b-btn sm ghost" onClick={onClear}>Rimuovi</button>}
        </div>
      </div>
      {media && media.name && (
        <div className="mono page-block__pick-name">{media.name}</div>
      )}
    </div>
  );
}

function ColumnEditor({ col, onChange, openMedia }) {
  const set = (patch) => onChange({ ...col, ...patch });
  return (
    <div className="page-block__col-editor">
      <AdminSegmented value={col.kind} options={[{ value: "text", label: "Testo" }, { value: "image", label: "Img" }, { value: "button", label: "Bottone" }]} onChange={(v) => set({ kind: v })} />
      {col.kind === "text" && <AdminFieldArea label="Testo" value={col.text} onChange={(v) => set({ text: v })} rows={4} />}
      {col.kind === "image" && <MediaPickRow label="Immagine" media={col.media} onPick={() => openMedia((m) => set({ media: m }))} onClear={() => set({ media: null })} />}
      {col.kind === "button" && (
        <>
          <AdminFieldText label="Testo bottone" value={col.btnText} onChange={(v) => set({ btnText: v })} />
          <AdminFieldText label="URL" value={col.btnUrl} onChange={(v) => set({ btnUrl: v })} mono />
        </>
      )}
    </div>
  );
}

// ---------------- BLOCK EDITOR ----------------
export function BlockEditor({ block, onChange, openMedia }) {
  const p = block.props;
  const set = (patch) => onChange({ ...block, props: { ...p, ...patch } });

  switch (block.type) {
    case "hero":
      return (
        <div className="page-block__editor">
          <MediaPickRow label="Immagine di sfondo" media={p.image} onPick={() => openMedia((m) => set({ image: m }))} onClear={() => set({ image: null })} />
          <AdminFieldText label="Titolo" value={p.title} onChange={(v) => set({ title: v })} />
          <AdminFieldText label="Sottotitolo" value={p.subtitle} onChange={(v) => set({ subtitle: v })} />
          <div className="page-block__editor-2col">
            <AdminFieldText label="Testo bottone" value={p.ctaText} onChange={(v) => set({ ctaText: v })} />
            <AdminFieldText label="URL bottone" value={p.ctaUrl} onChange={(v) => set({ ctaUrl: v })} mono />
          </div>
          <SliderRow label="Opacità overlay" value={p.overlay} min={0} max={80} unit="%" onChange={(v) => set({ overlay: v })} />
          <FieldRow label="Allineamento"><AdminSegmented value={p.align} options={[{ value: "left", label: "Sx" }, { value: "center", label: "Centro" }, { value: "right", label: "Dx" }]} onChange={(v) => set({ align: v })} /></FieldRow>
        </div>
      );
    case "text":
      return (
        <div className="page-block__editor">
          <div><div className="page-block__label">Contenuto</div><MiniRichText value={p.html} onChange={(v) => set({ html: v })} /></div>
        </div>
      );
    case "image":
      return (
        <div className="page-block__editor">
          <MediaPickRow label="Immagine" media={p.media} onPick={() => openMedia((m) => set({ media: m }))} onClear={() => set({ media: null })} />
          <AdminFieldText label="Testo alternativo (alt)" value={p.alt} onChange={(v) => set({ alt: v })} hint="SEO + accessibilità" />
          <AdminFieldText label="Didascalia" value={p.caption} onChange={(v) => set({ caption: v })} />
          <FieldRow label="Allineamento"><AdminSegmented value={p.align} options={[{ value: "left", label: "Sx" }, { value: "center", label: "Centro" }, { value: "right", label: "Dx" }]} onChange={(v) => set({ align: v })} /></FieldRow>
          <SliderRow label="Larghezza" value={p.width} min={40} max={100} unit="%" onChange={(v) => set({ width: v })} />
        </div>
      );
    case "gallery":
      return (
        <div className="page-block__editor">
          <FieldRow label="Layout"><AdminSegmented value={p.layout} options={[{ value: "grid", label: "Griglia" }, { value: "slider", label: "Slider" }]} onChange={(v) => set({ layout: v })} /></FieldRow>
          {p.layout === "grid" && <SliderRow label="Colonne" value={p.columns} min={2} max={4} unit="" onChange={(v) => set({ columns: v })} />}
          <div>
            <div className="page-block__label">Immagini · {p.images.length}</div>
            <div className="page-block__gallery-grid">
              {p.images.map((m, i) => (
                <div key={i} className="page-block__gallery-tile">
                  <MediaThumb media={m} />
                  <button onClick={() => set({ images: p.images.filter((_, j) => j !== i) })} className="page-block__del-tile"><Icon.close /></button>
                </div>
              ))}
              <button onClick={() => openMedia((m) => set({ images: [...p.images, m] }))} className="page-block__gallery-add"><Icon.plus /></button>
            </div>
          </div>
        </div>
      );
    case "columns":
      return (
        <div className="page-block__columns">
          {["left", "right"].map((side) => (
            <div key={side} className="page-block__column">
              <div className="eyebrow page-block__column-title">{side === "left" ? "Sinistra" : "Destra"}</div>
              <ColumnEditor col={p[side]} onChange={(c) => set({ [side]: c })} openMedia={openMedia} />
            </div>
          ))}
        </div>
      );
    case "video":
      return (
        <div className="page-block__editor">
          <FieldRow label="Sorgente"><AdminSegmented value={p.provider} options={[{ value: "youtube", label: "YouTube" }, { value: "vimeo", label: "Vimeo" }, { value: "upload", label: "Upload" }]} onChange={(v) => set({ provider: v })} /></FieldRow>
          <AdminFieldText label={p.provider === "upload" ? "File caricato" : "URL video"} value={p.url} onChange={(v) => set({ url: v })} mono />
        </div>
      );
    case "button":
      return (
        <div className="page-block__editor">
          <div className="page-block__editor-2col">
            <AdminFieldText label="Testo" value={p.text} onChange={(v) => set({ text: v })} />
            <AdminFieldText label="URL" value={p.url} onChange={(v) => set({ url: v })} mono />
          </div>
          <FieldRow label="Stile"><AdminSegmented value={p.style} options={[{ value: "ember", label: "Pieno" }, { value: "solid", label: "Scuro" }, { value: "ghost", label: "Bordo" }]} onChange={(v) => set({ style: v })} /></FieldRow>
          <AdminFieldToggle label="Icona freccia" value={p.icon === "arrow"} onChange={(v) => set({ icon: v ? "arrow" : null })} />
        </div>
      );
    case "map":
      return (
        <div className="page-block__editor">
          <AdminFieldText label="Indirizzo / query" value={p.query} onChange={(v) => set({ query: v })} />
          <SliderRow label="Zoom" value={p.zoom} min={10} max={20} unit="" onChange={(v) => set({ zoom: v })} />
        </div>
      );
    case "divider":
      return <FieldRow label="Stile linea"><AdminSegmented value={p.style} options={[{ value: "solid", label: "Piena" }, { value: "dashed", label: "Tratteggio" }, { value: "dotted", label: "Punti" }]} onChange={(v) => set({ style: v })} /></FieldRow>;
    case "spacer":
      return <SliderRow label="Altezza" value={p.height} min={20} max={200} unit="px" onChange={(v) => set({ height: v })} />;
    case "html":
      return (
        <div>
          <div className="page-block__label">Codice HTML</div>
          <textarea value={p.code} onChange={(e) => set({ code: e.target.value })} rows={8} spellCheck={false} className="page-block__html-input" />
        </div>
      );
    default:
      return null;
  }
}

// ---------------- BLOCK PREVIEW ----------------
function ColPreview({ col }) {
  if (col.kind === "image") return <MediaThumb media={col.media} />;
  if (col.kind === "button") return <div className="page-block__col-btn"><span className="b-btn ember page-block__inline">{col.btnText || "Bottone"}</span></div>;
  return <p className="page-block__col-text">{col.text}</p>;
}

export function BlockPreview({ block }) {
  const p = block.props;
  switch (block.type) {
    case "hero":
      return (
        <div className="page-block__hero">
          {p.image && p.image.url ? (
            <img src={p.image.url} alt="" className="page-block__hero-img" />
          ) : (
            <div className="ph page-block__hero-ph">sfondo hero</div>
          )}
          <div className="page-block__hero-overlay" style={{ background: "rgba(10,10,10," + p.overlay / 100 + ")" }} />
          <div className="page-block__hero-content" style={{ textAlign: p.align }}>
            <div className="display page-block__hero-title">{p.title}</div>
            <div className="it page-block__hero-subtitle">{p.subtitle}</div>
            {p.ctaText && <span className="b-btn ember sm page-block__hero-cta">{p.ctaText}</span>}
          </div>
        </div>
      );
    case "text":
      return <div className="page-rt page-block__text" style={{ textAlign: p.align }} dangerouslySetInnerHTML={{ __html: p.html }} />;
    case "image":
      return (
        <div className="page-block__pad" style={{ textAlign: p.align }}>
          <div className="page-block__image-inner" style={{ width: p.width + "%" }}>
            {p.media && p.media.url ? (
              <img src={p.media.url} alt={p.alt || ""} className="page-block__image-img" />
            ) : (
              <div className="ph page-block__ph-16-9">immagine</div>
            )}
            {p.caption && <div className="mono page-block__image-caption">{p.caption}</div>}
          </div>
        </div>
      );
    case "gallery":
      return (
        <div className="page-block__pad">
          {p.images.length === 0 ? (
            <div className="ph page-block__ph-21-9">galleria vuota</div>
          ) : (
            <div className="page-block__gallery-preview" style={{ gridTemplateColumns: p.layout === "slider" ? "repeat(" + p.images.length + ", 70%)" : "repeat(" + p.columns + ", 1fr)", overflowX: p.layout === "slider" ? "auto" : "visible" }}>
              {p.images.map((m, i) => <MediaThumb key={i} media={m} />)}
            </div>
          )}
        </div>
      );
    case "columns":
      return (
        <div className="page-block__columns-preview">
          {["left", "right"].map((s) => <ColPreview key={s} col={p[s]} />)}
        </div>
      );
    case "video":
      return (
        <div className="page-block__pad">
          <div className="ph page-block__video-ph">
            <div className="page-block__video-play">▷</div>
            <span>{p.provider} · {(p.url || "").slice(0, 40)}</span>
          </div>
        </div>
      );
    case "button":
      return <div className="page-block__button-preview"><span className={"b-btn " + (p.style === "ember" ? "ember" : p.style === "ghost" ? "ghost" : "solid") + " page-block__inline"}>{p.text}{p.icon === "arrow" && <Icon.arrow />}</span></div>;
    case "map":
      return (
        <div className="page-block__pad">
          <div className="page-block__map">
            <div className="page-block__map-pin" />
            <div className="mono page-block__map-label">{p.query}</div>
          </div>
        </div>
      );
    case "divider":
      return <div className="page-block__divider"><div className="page-block__divider-line" style={{ borderTopStyle: p.style }} /></div>;
    case "spacer":
      return <div className="page-block__spacer" style={{ height: p.height }}><span className="mono page-block__spacer-label">↕ {p.height}px</span></div>;
    case "html":
      return <div className="page-block__pad"><pre className="mono page-block__html-pre">{p.code}</pre></div>;
    default:
      return null;
  }
}
