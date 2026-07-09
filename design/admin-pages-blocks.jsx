// BRÀCE — Pages CMS: block registry, per-block editors, and block preview renderer.
// Consumed by admin-pages.jsx. Block model: { id, type, props }.

const { useState: useS_blk, useRef: useR_blk, useEffect: useE_blk } = React;

// ---------------- BLOCK REGISTRY ----------------
const BLOCK_TYPES = [
  { type: "hero",    label: "Hero",       icon: "▭", defaults: { image: null, overlay: 45, title: "Titolo hero", subtitle: "Sottotitolo descrittivo", ctaText: "Scopri", ctaUrl: "/menu", align: "center" } },
  { type: "text",    label: "Testo",      icon: "¶", defaults: { html: "<p>Scrivi qui il tuo testo. Usa la barra per <strong>grassetto</strong>, <em>corsivo</em>, titoli e liste.</p>", align: "left" } },
  { type: "image",   label: "Immagine",   icon: "◳", defaults: { media: null, alt: "", caption: "", align: "center", width: 100 } },
  { type: "gallery", label: "Galleria",   icon: "▥", defaults: { images: [], layout: "grid", columns: 3 } },
  { type: "columns", label: "Due colonne", icon: "◫", defaults: { left: { kind: "text", text: "Colonna sinistra", media: null, btnText: "", btnUrl: "" }, right: { kind: "image", text: "", media: null, btnText: "", btnUrl: "" } } },
  { type: "video",   label: "Video",      icon: "▷", defaults: { provider: "youtube", url: "https://youtube.com/watch?v=" } },
  { type: "button",  label: "Bottone",    icon: "◖", defaults: { text: "Prenota un tavolo", url: "/contatti", style: "ember", icon: "arrow" } },
  { type: "map",     label: "Mappa",      icon: "◎", defaults: { query: "Via dei Forni 14, Milano", zoom: 15 } },
  { type: "divider", label: "Divisore",   icon: "—", defaults: { style: "solid" } },
  { type: "spacer",  label: "Spazio",     icon: "↕", defaults: { height: 60 } },
  { type: "html",    label: "HTML",       icon: "</>", defaults: { code: "<!-- HTML personalizzato -->\n<div class=\"promo\">Promo</div>" } },
];
const blockDef = (type) => BLOCK_TYPES.find(b => b.type === type);

// ---------------- MINI RICH TEXT ----------------
function MiniRichText({ value, onChange }) {
  const ref = useR_blk(null);
  const [, force] = useS_blk(0);

  useE_blk(() => {
    if (ref.current && ref.current.innerHTML !== value) ref.current.innerHTML = value;
  }, []);

  const exec = (cmd, arg) => {
    document.execCommand(cmd, false, arg);
    ref.current.focus();
    onChange(ref.current.innerHTML);
    force(x => x + 1);
  };

  const Btn = ({ cmd, arg, children, title }) => (
    <button type="button" title={title} onMouseDown={e => { e.preventDefault(); exec(cmd, arg); }} style={{
      minWidth: 30, height: 30, padding: "0 8px", background: "var(--bg)", border: "1px solid var(--line)",
      color: "var(--text)", cursor: "pointer", fontFamily: "var(--serif-2)", fontSize: 14,
    }}>{children}</button>
  );

  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 8 }}>
        <Btn cmd="bold" title="Grassetto"><strong>B</strong></Btn>
        <Btn cmd="italic" title="Corsivo"><em>I</em></Btn>
        <Btn cmd="underline" title="Sottolineato"><span style={{ textDecoration: "underline" }}>U</span></Btn>
        <Btn cmd="formatBlock" arg="<h2>" title="Titolo">H</Btn>
        <Btn cmd="formatBlock" arg="<blockquote>" title="Citazione">❝</Btn>
        <Btn cmd="insertUnorderedList" title="Elenco">•</Btn>
        <Btn cmd="insertOrderedList" title="Elenco numerato">1.</Btn>
        <Btn cmd="justifyLeft" title="Sinistra">⇤</Btn>
        <Btn cmd="justifyCenter" title="Centro">↔</Btn>
        <Btn cmd="justifyRight" title="Destra">⇥</Btn>
        <button type="button" title="Link" onMouseDown={e => { e.preventDefault(); const u = window.prompt("URL del link", "https://"); if (u) exec("createLink", u); }} style={{
          minWidth: 30, height: 30, background: "var(--bg)", border: "1px solid var(--line)", color: "var(--text)", cursor: "pointer", fontSize: 13,
        }}>↗</button>
        {["var(--accent)", "var(--gold)", "var(--text)"].map(c => (
          <button key={c} type="button" title="Colore" onMouseDown={e => { e.preventDefault(); exec("foreColor", getComputedStyle(document.documentElement).getPropertyValue(c.slice(4, -1)) || c); }} style={{
            width: 30, height: 30, background: c, border: "1px solid var(--line)", cursor: "pointer",
          }}/>
        ))}
      </div>
      <div ref={ref} contentEditable suppressContentEditableWarning
        onInput={e => onChange(e.currentTarget.innerHTML)}
        style={{
          minHeight: 120, padding: 14, background: "var(--bg)", border: "1px solid var(--line)",
          color: "var(--text)", fontSize: 14, lineHeight: 1.6, outline: "none",
        }}/>
    </div>
  );
}

// ---------------- BLOCK EDITOR (contextual settings) ----------------
function BlockEditor({ block, onChange, openMedia }) {
  const p = block.props;
  const set = (patch) => onChange({ ...block, props: { ...p, ...patch } });

  switch (block.type) {
    case "hero":
      return (
        <div style={{ display: "grid", gap: 14 }}>
          <MediaPickRow label="Immagine di sfondo" media={p.image} onPick={() => openMedia(m => set({ image: m }))} onClear={() => set({ image: null })}/>
          <window.AdminFieldText label="Titolo" value={p.title} onChange={v => set({ title: v })}/>
          <window.AdminFieldText label="Sottotitolo" value={p.subtitle} onChange={v => set({ subtitle: v })}/>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <window.AdminFieldText label="Testo bottone" value={p.ctaText} onChange={v => set({ ctaText: v })}/>
            <window.AdminFieldText label="URL bottone" value={p.ctaUrl} onChange={v => set({ ctaUrl: v })} mono/>
          </div>
          <SliderRow label="Opacità overlay" value={p.overlay} min={0} max={80} unit="%" onChange={v => set({ overlay: v })}/>
          <FieldRow label="Allineamento"><window.AdminSegmented value={p.align} options={[{value:"left",label:"Sx"},{value:"center",label:"Centro"},{value:"right",label:"Dx"}]} onChange={v => set({ align: v })}/></FieldRow>
        </div>
      );
    case "text":
      return (
        <div style={{ display: "grid", gap: 14 }}>
          <div><div style={lblStyle}>Contenuto</div><MiniRichText value={p.html} onChange={v => set({ html: v })}/></div>
        </div>
      );
    case "image":
      return (
        <div style={{ display: "grid", gap: 14 }}>
          <MediaPickRow label="Immagine" media={p.media} onPick={() => openMedia(m => set({ media: m }))} onClear={() => set({ media: null })}/>
          <window.AdminFieldText label="Testo alternativo (alt)" value={p.alt} onChange={v => set({ alt: v })} hint="SEO + accessibilità"/>
          <window.AdminFieldText label="Didascalia" value={p.caption} onChange={v => set({ caption: v })}/>
          <FieldRow label="Allineamento"><window.AdminSegmented value={p.align} options={[{value:"left",label:"Sx"},{value:"center",label:"Centro"},{value:"right",label:"Dx"}]} onChange={v => set({ align: v })}/></FieldRow>
          <SliderRow label="Larghezza" value={p.width} min={40} max={100} unit="%" onChange={v => set({ width: v })}/>
        </div>
      );
    case "gallery":
      return (
        <div style={{ display: "grid", gap: 14 }}>
          <FieldRow label="Layout"><window.AdminSegmented value={p.layout} options={[{value:"grid",label:"Griglia"},{value:"slider",label:"Slider"}]} onChange={v => set({ layout: v })}/></FieldRow>
          {p.layout === "grid" && <SliderRow label="Colonne" value={p.columns} min={2} max={4} unit="" onChange={v => set({ columns: v })}/>}
          <div>
            <div style={lblStyle}>Immagini · {p.images.length}</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
              {p.images.map((m, i) => (
                <div key={i} style={{ position: "relative" }}>
                  <window.MediaThumb tone={m.tone}/>
                  <button onClick={() => set({ images: p.images.filter((_, j) => j !== i) })} style={delTileBtn}><Icon.close/></button>
                </div>
              ))}
              <button onClick={() => openMedia(m => set({ images: [...p.images, m] }))} style={{
                aspectRatio: "4/3", border: "1px dashed var(--line-2)", background: "var(--bg)", cursor: "pointer",
                display: "grid", placeItems: "center", color: "var(--text-dim)",
              }}><Icon.plus/></button>
            </div>
          </div>
        </div>
      );
    case "columns":
      return (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {["left", "right"].map(side => (
            <div key={side} style={{ border: "1px solid var(--line)", padding: 14 }}>
              <div className="eyebrow" style={{ marginBottom: 12 }}>{side === "left" ? "Sinistra" : "Destra"}</div>
              <ColumnEditor col={p[side]} onChange={c => set({ [side]: c })} openMedia={openMedia}/>
            </div>
          ))}
        </div>
      );
    case "video":
      return (
        <div style={{ display: "grid", gap: 14 }}>
          <FieldRow label="Sorgente"><window.AdminSegmented value={p.provider} options={[{value:"youtube",label:"YouTube"},{value:"vimeo",label:"Vimeo"},{value:"upload",label:"Upload"}]} onChange={v => set({ provider: v })}/></FieldRow>
          <window.AdminFieldText label={p.provider === "upload" ? "File caricato" : "URL video"} value={p.url} onChange={v => set({ url: v })} mono/>
        </div>
      );
    case "button":
      return (
        <div style={{ display: "grid", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <window.AdminFieldText label="Testo" value={p.text} onChange={v => set({ text: v })}/>
            <window.AdminFieldText label="URL" value={p.url} onChange={v => set({ url: v })} mono/>
          </div>
          <FieldRow label="Stile"><window.AdminSegmented value={p.style} options={[{value:"ember",label:"Pieno"},{value:"solid",label:"Scuro"},{value:"ghost",label:"Bordo"}]} onChange={v => set({ style: v })}/></FieldRow>
          <window.AdminFieldToggle label="Icona freccia" value={p.icon === "arrow"} onChange={v => set({ icon: v ? "arrow" : null })}/>
        </div>
      );
    case "map":
      return (
        <div style={{ display: "grid", gap: 14 }}>
          <window.AdminFieldText label="Indirizzo / query" value={p.query} onChange={v => set({ query: v })}/>
          <SliderRow label="Zoom" value={p.zoom} min={10} max={20} unit="" onChange={v => set({ zoom: v })}/>
        </div>
      );
    case "divider":
      return <FieldRow label="Stile linea"><window.AdminSegmented value={p.style} options={[{value:"solid",label:"Piena"},{value:"dashed",label:"Tratteggio"},{value:"dotted",label:"Punti"}]} onChange={v => set({ style: v })}/></FieldRow>;
    case "spacer":
      return <SliderRow label="Altezza" value={p.height} min={20} max={200} unit="px" onChange={v => set({ height: v })}/>;
    case "html":
      return (
        <div>
          <div style={lblStyle}>Codice HTML</div>
          <textarea value={p.code} onChange={e => set({ code: e.target.value })} rows={8} spellCheck={false} style={{
            width: "100%", background: "var(--bg)", border: "1px solid var(--line)", color: "var(--text)",
            fontFamily: "var(--mono)", fontSize: 12, padding: 12, outline: "none", resize: "vertical", lineHeight: 1.6,
          }}/>
        </div>
      );
    default: return null;
  }
}

function ColumnEditor({ col, onChange, openMedia }) {
  const set = (patch) => onChange({ ...col, ...patch });
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <window.AdminSegmented value={col.kind} options={[{value:"text",label:"Testo"},{value:"image",label:"Img"},{value:"button",label:"Bottone"}]} onChange={v => set({ kind: v })}/>
      {col.kind === "text" && <window.AdminFieldArea label="Testo" value={col.text} onChange={v => set({ text: v })} rows={4}/>}
      {col.kind === "image" && <MediaPickRow label="Immagine" media={col.media} onPick={() => openMedia(m => set({ media: m }))} onClear={() => set({ media: null })}/>}
      {col.kind === "button" && <>
        <window.AdminFieldText label="Testo bottone" value={col.btnText} onChange={v => set({ btnText: v })}/>
        <window.AdminFieldText label="URL" value={col.btnUrl} onChange={v => set({ btnUrl: v })} mono/>
      </>}
    </div>
  );
}

// ---------------- BLOCK PREVIEW (canvas) ----------------
function BlockPreview({ block }) {
  const p = block.props;
  switch (block.type) {
    case "hero":
      return (
        <div style={{ position: "relative", minHeight: 220, overflow: "hidden", display: "grid", placeItems: "center" }}>
          {p.image ? <window.MediaThumb tone={p.image.tone} style={{ position: "absolute", inset: 0, aspectRatio: "auto", height: "100%" }}/>
            : <div className="ph" style={{ position: "absolute", inset: 0 }}>sfondo hero</div>}
          <div style={{ position: "absolute", inset: 0, background: "rgba(40,28,10," + (p.overlay / 100) + ")" }}/>
          <div style={{ position: "relative", textAlign: p.align, padding: 40, color: "var(--cream)", width: "100%" }}>
            <div className="display" style={{ fontSize: 42, lineHeight: 1, color: "#f1e7d0" }}>{p.title}</div>
            <div className="it" style={{ fontSize: 18, marginTop: 12, color: "rgba(241,231,208,0.85)" }}>{p.subtitle}</div>
            {p.ctaText && <span className="btn ember sm" style={{ marginTop: 18, display: "inline-flex" }}>{p.ctaText}</span>}
          </div>
        </div>
      );
    case "text":
      return <div className="page-rt" style={{ padding: 28, textAlign: p.align, color: "var(--text)" }} dangerouslySetInnerHTML={{ __html: p.html }}/>;
    case "image":
      return (
        <div style={{ padding: 28, textAlign: p.align }}>
          <div style={{ display: "inline-block", width: p.width + "%" }}>
            {p.media ? <window.MediaThumb tone={p.media.tone}/> : <div className="ph" style={{ aspectRatio: "16/9" }}>immagine</div>}
            {p.caption && <div className="mono" style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 8, letterSpacing: "0.06em" }}>{p.caption}</div>}
          </div>
        </div>
      );
    case "gallery":
      return (
        <div style={{ padding: 28 }}>
          {p.images.length === 0 ? <div className="ph" style={{ aspectRatio: "21/9" }}>galleria vuota</div> : (
            <div style={{ display: "grid", gridTemplateColumns: p.layout === "slider" ? "repeat(" + p.images.length + ", 70%)" : "repeat(" + p.columns + ", 1fr)", gap: 10, overflowX: p.layout === "slider" ? "auto" : "visible" }}>
              {p.images.map((m, i) => <window.MediaThumb key={i} tone={m.tone}/>)}
            </div>
          )}
        </div>
      );
    case "columns":
      return (
        <div style={{ padding: 28, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "center" }}>
          {["left", "right"].map(s => <ColPreview key={s} col={p[s]}/>)}
        </div>
      );
    case "video":
      return (
        <div style={{ padding: 28 }}>
          <div className="ph" style={{ aspectRatio: "16/9", flexDirection: "column", gap: 10 }}>
            <div style={{ width: 54, height: 54, borderRadius: 999, border: "1px solid var(--line-2)", display: "grid", placeItems: "center", color: "var(--gold)" }}>▷</div>
            <span>{p.provider} · {p.url.slice(0, 40)}</span>
          </div>
        </div>
      );
    case "button":
      return <div style={{ padding: 28, textAlign: "center" }}><span className={"btn " + (p.style === "ember" ? "ember" : p.style === "ghost" ? "ghost" : "solid")} style={{ display: "inline-flex" }}>{p.text}{p.icon === "arrow" && <Icon.arrow/>}</span></div>;
    case "map":
      return (
        <div style={{ padding: 28 }}>
          <div style={{ aspectRatio: "21/9", position: "relative", overflow: "hidden", border: "1px solid var(--line-2)",
            background: "repeating-linear-gradient(0deg, var(--grid-line) 0 1px, transparent 1px 28px), repeating-linear-gradient(90deg, var(--grid-line) 0 1px, transparent 1px 28px), var(--bg-3)" }}>
            <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", width: 12, height: 12, borderRadius: 999, background: "var(--accent)", boxShadow: "0 0 0 5px color-mix(in srgb, var(--accent) 25%, transparent)" }}/>
            <div className="mono" style={{ position: "absolute", bottom: 12, left: 12, fontSize: 10, color: "var(--text-faint)", letterSpacing: "0.12em", textTransform: "uppercase" }}>{p.query}</div>
          </div>
        </div>
      );
    case "divider":
      return <div style={{ padding: "8px 28px" }}><div style={{ borderTop: "1px " + p.style + " var(--line-2)" }}/></div>;
    case "spacer":
      return <div style={{ height: p.height, display: "grid", placeItems: "center" }}><span className="mono" style={{ fontSize: 10, color: "var(--text-faint)", letterSpacing: "0.14em" }}>↕ {p.height}px</span></div>;
    case "html":
      return <div style={{ padding: 28 }}><pre className="mono" style={{ fontSize: 11, color: "var(--text-dim)", background: "var(--bg)", padding: 16, border: "1px solid var(--line)", overflowX: "auto", margin: 0 }}>{p.code}</pre></div>;
    default: return null;
  }
}

function ColPreview({ col }) {
  if (col.kind === "image") return col.media ? <window.MediaThumb tone={col.media.tone}/> : <div className="ph" style={{ aspectRatio: "4/3" }}>immagine</div>;
  if (col.kind === "button") return <div style={{ textAlign: "center" }}><span className="btn ember" style={{ display: "inline-flex" }}>{col.btnText || "Bottone"}</span></div>;
  return <p style={{ color: "var(--text-dim)", margin: 0, lineHeight: 1.6 }}>{col.text}</p>;
}

// ---------------- MEDIA PICK ROW + small helpers ----------------
function MediaPickRow({ label, media, onPick, onClear }) {
  return (
    <div>
      <div style={lblStyle}>{label}</div>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <div style={{ width: 88, flexShrink: 0 }}>
          {media ? <window.MediaThumb tone={media.tone}/> : <div className="ph" style={{ aspectRatio: "4/3" }}/>}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn sm ghost" onClick={onPick}>{media ? "Cambia" : "Scegli da libreria"}</button>
          {media && <button className="btn sm ghost" onClick={onClear}>Rimuovi</button>}
        </div>
      </div>
      {media && <div className="mono" style={{ fontSize: 10, color: "var(--text-faint)", marginTop: 8, letterSpacing: "0.08em" }}>{media.name} · {media.dim}</div>}
    </div>
  );
}

const lblStyle = { fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-faint)", letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 8 };
const delTileBtn = { position: "absolute", top: 4, right: 4, width: 20, height: 20, borderRadius: 999, background: "var(--accent)", color: "var(--cream)", border: "none", cursor: "pointer", display: "grid", placeItems: "center" };

function FieldRow({ label, children }) {
  return <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}><span style={lblStyle}>{label}</span><div>{children}</div></div>;
}

function SliderRow({ label, value, min, max, unit, onChange }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={lblStyle}>{label}</span>
        <span className="mono" style={{ fontSize: 11, color: "var(--gold)" }}>{value}{unit}</span>
      </div>
      <input type="range" min={min} max={max} value={value} onChange={e => onChange(Number(e.target.value))} style={{ width: "100%", accentColor: "var(--accent)" }}/>
    </div>
  );
}

Object.assign(window, { BLOCK_TYPES, blockDef, BlockEditor, BlockPreview, MiniRichText });
