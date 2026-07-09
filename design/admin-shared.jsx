// BRÀCE — shared admin primitives (Modal, form fields, skeletons, empty states,
// status pills, media library, autosave). Reused across all admin modules so the
// new Pages / Zones / Order-detail features feel native to the existing console.

const { useState: useS_sh, useEffect: useE_sh, useRef: useR_sh, useCallback: useC_sh } = React;

// ---------------- MODAL ----------------
// Single overlay+panel used for both create and edit flows everywhere.
function AdminModal({ open, onClose, title, subtitle, width = 760, footer, children, dirty }) {
  useE_sh(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") attemptClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, dirty]);

  const attemptClose = () => {
    if (dirty && !window.confirm("Ci sono modifiche non salvate. Chiudere comunque?")) return;
    onClose();
  };

  if (!open) return null;
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 500,
      display: "flex", alignItems: "flex-start", justifyContent: "center",
      padding: "60px 24px", overflowY: "auto",
    }}>
      <div onClick={attemptClose} style={{
        position: "fixed", inset: 0, background: "var(--scrim-overlay)", backdropFilter: "blur(4px)",
        animation: "fade .2s ease both",
      }}/>
      <div className="rise" style={{
        position: "relative", width: "100%", maxWidth: width,
        background: "var(--bg-2)", border: "1px solid var(--line-2)",
        boxShadow: "0 30px 80px rgba(40,28,10,0.35)",
        display: "flex", flexDirection: "column", maxHeight: "calc(100vh - 120px)",
      }}>
        <div style={{
          padding: "24px 28px", borderBottom: "1px solid var(--line)",
          display: "flex", justifyContent: "space-between", alignItems: "flex-start",
          position: "sticky", top: 0, background: "var(--bg-2)", zIndex: 2,
        }}>
          <div>
            {subtitle && <div className="eyebrow" style={{ marginBottom: 8 }}>{subtitle}</div>}
            <div className="display" style={{ fontSize: 30, lineHeight: 1 }}>{title}</div>
          </div>
          <button onClick={attemptClose} style={{
            background: "none", border: "1px solid var(--line-2)", color: "var(--text)",
            width: 38, height: 38, borderRadius: 999, cursor: "pointer", display: "grid", placeItems: "center",
            flexShrink: 0,
          }}><Icon.close/></button>
        </div>

        <div style={{ padding: 28, overflowY: "auto", flex: 1 }}>{children}</div>

        {footer && (
          <div style={{
            padding: "18px 28px", borderTop: "1px solid var(--line)",
            display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16,
            position: "sticky", bottom: 0, background: "var(--bg-2)",
          }}>{footer}</div>
        )}
      </div>
    </div>
  );
}

// ---------------- FORM FIELDS ----------------
const sh_label = (error, focus) => ({
  fontFamily: "var(--mono)", fontSize: 10,
  color: error ? "var(--accent)" : focus ? "var(--gold)" : "var(--text-faint)",
  letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 8,
  transition: "color .15s ease", display: "flex", justifyContent: "space-between", gap: 10,
});
const sh_box = (error, focus) => ({
  background: "var(--bg)", border: "1px solid " + (error ? "var(--accent)" : focus ? "var(--gold-deep)" : "var(--line)"),
  display: "flex", alignItems: "center", gap: 10, transition: "border-color .15s ease",
});

function AdminFieldText({ label, value, onChange, placeholder, error, type = "text", hint, span, prefix, mono }) {
  const [focus, setFocus] = useS_sh(false);
  return (
    <label style={{ gridColumn: span ? "span " + span : "auto", display: "block" }}>
      <div style={sh_label(error, focus)}>
        <span>{label}</span>
        {hint && <span style={{ color: "var(--text-faint)", letterSpacing: "0.08em" }}>{hint}</span>}
      </div>
      <div style={{ ...sh_box(error, focus), padding: "0 14px" }}>
        {prefix && <span className="mono" style={{ color: "var(--text-faint)", fontSize: 13 }}>{prefix}</span>}
        <input type={type} value={value} placeholder={placeholder}
          onChange={e => onChange(e.target.value)} onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
          style={{
            width: "100%", padding: "13px 0", background: "none", border: "none", outline: "none",
            color: "var(--text)", fontFamily: mono ? "var(--mono)" : "var(--sans)", fontSize: 14,
          }}/>
      </div>
      {error && <div className="mono" style={{ fontSize: 10, color: "var(--accent)", marginTop: 6, letterSpacing: "0.06em" }}>↳ {error}</div>}
    </label>
  );
}

function AdminFieldArea({ label, value, onChange, placeholder, error, rows = 3, span, hint }) {
  const [focus, setFocus] = useS_sh(false);
  return (
    <label style={{ gridColumn: span ? "span " + span : "auto", display: "block" }}>
      <div style={sh_label(error, focus)}><span>{label}</span>{hint && <span style={{ color: "var(--text-faint)" }}>{hint}</span>}</div>
      <div style={{ ...sh_box(error, focus), padding: 12 }}>
        <textarea value={value} placeholder={placeholder} rows={rows}
          onChange={e => onChange(e.target.value)} onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
          style={{
            width: "100%", background: "none", border: "none", outline: "none", resize: "vertical",
            color: "var(--text)", fontFamily: "var(--sans)", fontSize: 14, lineHeight: 1.5,
          }}/>
      </div>
      {error && <div className="mono" style={{ fontSize: 10, color: "var(--accent)", marginTop: 6 }}>↳ {error}</div>}
    </label>
  );
}

function AdminFieldSelect({ label, value, options, onChange, error, span, hint }) {
  return (
    <label style={{ gridColumn: span ? "span " + span : "auto", display: "block" }}>
      <div style={sh_label(error, false)}><span>{label}</span>{hint && <span style={{ color: "var(--text-faint)" }}>{hint}</span>}</div>
      <select value={value} onChange={e => onChange(e.target.value)} style={{
        width: "100%", padding: "13px 14px", background: "var(--bg)",
        border: "1px solid " + (error ? "var(--accent)" : "var(--line)"), color: "var(--text)",
        fontFamily: "var(--mono)", fontSize: 13, appearance: "none", cursor: "pointer",
        backgroundImage: "linear-gradient(45deg, transparent 50%, var(--gold) 50%), linear-gradient(135deg, var(--gold) 50%, transparent 50%)",
        backgroundPosition: "calc(100% - 22px) 50%, calc(100% - 16px) 50%", backgroundSize: "6px 6px", backgroundRepeat: "no-repeat",
        paddingRight: 44,
      }}>
        {options.map(o => {
          const v = typeof o === "object" ? o.value : o;
          const l = typeof o === "object" ? o.label : o;
          return <option key={v} value={v}>{l}</option>;
        })}
      </select>
    </label>
  );
}

function AdminFieldToggle({ label, value, onChange, hint }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "14px 16px", background: "var(--bg)", border: "1px solid var(--line)",
    }}>
      <div>
        <div style={{ fontSize: 14, color: "var(--text)" }}>{label}</div>
        {hint && <div className="mono" style={{ fontSize: 10, color: "var(--text-faint)", marginTop: 4, letterSpacing: "0.08em" }}>{hint}</div>}
      </div>
      <button onClick={() => onChange(!value)} style={{
        width: 44, height: 24, borderRadius: 999, border: "none", cursor: "pointer", position: "relative",
        background: value ? "var(--accent)" : "var(--line-2)", transition: "background .2s ease", flexShrink: 0,
      }}>
        <span style={{
          position: "absolute", top: 3, left: value ? 23 : 3, width: 18, height: 18, borderRadius: 999,
          background: "var(--cream)", transition: "left .2s ease",
        }}/>
      </button>
    </div>
  );
}

function AdminSegmented({ value, options, onChange, size = "md" }) {
  return (
    <div style={{ display: "inline-flex", background: "var(--bg)", border: "1px solid var(--line)", padding: 3, borderRadius: 4 }}>
      {options.map(o => {
        const v = typeof o === "object" ? o.value : o;
        const l = typeof o === "object" ? o.label : o;
        const active = v === value;
        return (
          <button key={v} onClick={() => onChange(v)} style={{
            padding: size === "sm" ? "6px 12px" : "9px 16px", border: "none", cursor: "pointer",
            background: active ? "var(--text)" : "transparent", color: active ? "var(--bg)" : "var(--text-dim)",
            fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase",
            transition: "all .15s ease", borderRadius: 2,
          }}>{l}</button>
        );
      })}
    </div>
  );
}

// ---------------- STATUS PILL ----------------
function AdminStatusPill({ label, color = "var(--gold)", soft }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 7,
      padding: "5px 11px", borderRadius: 999,
      background: soft ? "color-mix(in srgb, " + color + " 14%, transparent)" : "transparent",
      border: soft ? "none" : "1px solid " + color,
      color, fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase",
    }}>
      <span style={{ width: 5, height: 5, borderRadius: 999, background: color }}/>
      {label}
    </span>
  );
}

// ---------------- SKELETON ----------------
function AdminSkeleton({ rows = 5 }) {
  return (
    <div style={{ background: "var(--bg-2)", border: "1px solid var(--line)" }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{
          display: "flex", gap: 24, padding: "20px 24px",
          borderTop: i ? "1px solid var(--line)" : "none", alignItems: "center",
        }}>
          <SkelBar w={120}/><SkelBar w={200} flex/><SkelBar w={80}/><SkelBar w={60}/>
        </div>
      ))}
    </div>
  );
}
function SkelBar({ w, flex }) {
  return <div style={{
    height: 12, width: flex ? "auto" : w, flex: flex ? 1 : "none", borderRadius: 3,
    background: "linear-gradient(90deg, var(--bg-3) 0%, var(--line) 50%, var(--bg-3) 100%)",
    backgroundSize: "200% 100%", animation: "shimmer 1.4s ease infinite",
  }}/>;
}

// ---------------- EMPTY STATE ----------------
function AdminEmptyState({ icon = "○", title, body, action }) {
  return (
    <div style={{
      padding: "80px 40px", textAlign: "center",
      background: "var(--bg-2)", border: "1px dashed var(--line-2)",
    }}>
      <div style={{ fontSize: 40, color: "var(--text-faint)", lineHeight: 1 }}>{icon}</div>
      <div className="display" style={{ fontSize: 30, marginTop: 18 }}>{title}</div>
      {body && <p style={{ color: "var(--text-dim)", maxWidth: 420, margin: "12px auto 0" }}>{body}</p>}
      {action && <div style={{ marginTop: 24 }}>{action}</div>}
    </div>
  );
}

// ---------------- AUTOSAVE HOOK ----------------
// Returns { status: 'idle'|'saving'|'saved', dirty, markSaved }. Debounces a
// "saving → saved" cycle whenever `value` changes, and arms a beforeunload guard
// while there are unpersisted edits.
function useAutosave(value, { delay = 1200 } = {}) {
  const [status, setStatus] = useS_sh("saved");
  const [dirty, setDirty] = useS_sh(false);
  const first = useR_sh(true);
  const timer = useR_sh(null);

  useE_sh(() => {
    if (first.current) { first.current = false; return; }
    setDirty(true);
    setStatus("saving");
    clearTimeout(timer.current);
    timer.current = setTimeout(() => { setStatus("saved"); setDirty(false); }, delay);
    return () => clearTimeout(timer.current);
  }, [value]);

  useE_sh(() => {
    const guard = (e) => { if (dirty) { e.preventDefault(); e.returnValue = ""; } };
    window.addEventListener("beforeunload", guard);
    return () => window.removeEventListener("beforeunload", guard);
  }, [dirty]);

  return { status, dirty, markSaved: () => { setStatus("saved"); setDirty(false); } };
}

function AutosaveBadge({ status }) {
  const map = {
    saving: ["var(--gold)", "Salvataggio…"],
    saved:  ["var(--ok)", "Bozza salvata"],
    idle:   ["var(--text-faint)", "—"],
  };
  const [color, label] = map[status] || map.idle;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontFamily: "var(--mono)", fontSize: 11, color, letterSpacing: "0.1em" }}>
      <span style={{ width: 6, height: 6, borderRadius: 999, background: color, animation: status === "saving" ? "float 1s ease-in-out infinite" : "none" }}/>
      {label}
    </span>
  );
}

// ---------------- MEDIA LIBRARY ----------------
const MEDIA_FOLDERS = ["Tutte", "Hero", "Pizze", "Ambiente", "Team"];
const MEDIA_SEED = [
  { id: "m1", name: "forno-legna.jpg",    folder: "Ambiente", size: "1.8 MB", dim: "2400×1600", tone: 18 },
  { id: "m2", name: "margherita-top.jpg", folder: "Pizze",    size: "1.2 MB", dim: "1800×1800", tone: 32 },
  { id: "m3", name: "impasto-72h.jpg",    folder: "Hero",     size: "2.4 MB", dim: "2880×1620", tone: 8 },
  { id: "m4", name: "sala-sera.jpg",      folder: "Ambiente", size: "1.6 MB", dim: "2400×1600", tone: 22 },
  { id: "m5", name: "pizzaiolo.jpg",      folder: "Team",     size: "1.1 MB", dim: "1600×2000", tone: 14 },
  { id: "m6", name: "diavola-nera.jpg",   folder: "Pizze",    size: "1.3 MB", dim: "1800×1800", tone: 38 },
  { id: "m7", name: "navigli-dehors.jpg", folder: "Hero",     size: "2.1 MB", dim: "2880×1620", tone: 26 },
  { id: "m8", name: "ingredienti.jpg",    folder: "Ambiente", size: "0.9 MB", dim: "1600×1067", tone: 30 },
  { id: "m9", name: "team-cucina.jpg",    folder: "Team",     size: "1.4 MB", dim: "2000×1333", tone: 12 },
];

function MediaThumb({ tone, style }) {
  // deterministic warm placeholder swatch
  const hue = 28 + (tone % 20);
  return <div style={{
    width: "100%", aspectRatio: "4/3", ...style,
    background: `repeating-linear-gradient(135deg, hsl(${hue} 40% 42%) 0 3px, hsl(${hue} 38% 38%) 3px 14px)`,
    position: "relative", overflow: "hidden",
  }}>
    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(160deg, rgba(255,240,210,0.18), rgba(40,28,10,0.25))" }}/>
  </div>;
}

function MediaLibrary({ open, onClose, onPick }) {
  const [folder, setFolder] = useS_sh("Tutte");
  const [q, setQ] = useS_sh("");
  const [sel, setSel] = useS_sh(null);
  const [items, setItems] = useS_sh(MEDIA_SEED);

  const filtered = items.filter(m =>
    (folder === "Tutte" || m.folder === folder) &&
    (!q || m.name.toLowerCase().includes(q.toLowerCase()))
  );

  const upload = () => {
    const n = items.length + 1;
    setItems([{ id: "m" + (100 + n), name: "nuova-immagine-" + n + ".jpg", folder: folder === "Tutte" ? "Hero" : folder, size: "1.0 MB", dim: "2000×1333", tone: (n * 7) % 40 }, ...items]);
  };

  return (
    <AdminModal open={open} onClose={onClose} title="Libreria media" subtitle="Carica · organizza · seleziona" width={920}
      footer={<>
        <span className="mono" style={{ fontSize: 11, color: "var(--text-faint)", letterSpacing: "0.1em" }}>{filtered.length} file · {folder}</span>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn sm ghost" onClick={onClose}>Annulla</button>
          <button className="btn sm ember" disabled={!sel} onClick={() => { if (sel) { onPick(sel); onClose(); } }}
            style={{ opacity: sel ? 1 : 0.4 }}>Usa selezionata</button>
        </div>
      </>}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {MEDIA_FOLDERS.map(f => (
            <button key={f} onClick={() => setFolder(f)} style={{
              padding: "8px 14px", borderRadius: 999, cursor: "pointer",
              background: folder === f ? "var(--text)" : "transparent", color: folder === f ? "var(--bg)" : "var(--text-dim)",
              border: "1px solid " + (folder === f ? "var(--text)" : "var(--line)"),
              fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase",
            }}>{f}</button>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 14px", border: "1px solid var(--line)", borderRadius: 999, minWidth: 200 }}>
          <Icon.search style={{ color: "var(--text-faint)" }}/>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Cerca file…" style={{
            flex: 1, background: "none", border: "none", outline: "none", color: "var(--text)", fontFamily: "var(--mono)", fontSize: 12,
          }}/>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
        <button onClick={upload} style={{
          aspectRatio: "4/3", border: "1px dashed var(--line-2)", background: "var(--bg)", cursor: "pointer",
          display: "grid", placeItems: "center", color: "var(--text-dim)",
        }}>
          <div style={{ textAlign: "center" }}>
            <Icon.plus style={{ width: 22, height: 22 }}/>
            <div className="mono" style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", marginTop: 8 }}>Carica file</div>
          </div>
        </button>
        {filtered.map(m => {
          const active = sel && sel.id === m.id;
          return (
            <button key={m.id} onClick={() => setSel(m)} style={{
              padding: 0, border: "2px solid " + (active ? "var(--accent)" : "var(--line)"), background: "var(--bg)",
              cursor: "pointer", textAlign: "left", position: "relative",
            }}>
              <MediaThumb tone={m.tone}/>
              {active && <span style={{
                position: "absolute", top: 8, right: 8, width: 22, height: 22, borderRadius: 999,
                background: "var(--accent)", color: "var(--cream)", display: "grid", placeItems: "center",
              }}><Icon.check/></span>}
              <div style={{ padding: "10px 12px" }}>
                <div className="mono" style={{ fontSize: 11, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.name}</div>
                <div className="mono" style={{ fontSize: 9, color: "var(--text-faint)", letterSpacing: "0.08em", marginTop: 4 }}>{m.dim} · {m.size}</div>
              </div>
            </button>
          );
        })}
      </div>
    </AdminModal>
  );
}

// ---------------- VALIDATION HELPERS ----------------
function validateRequired(fields, values) {
  // fields: [{ key, label, type }]  → returns { errors:{}, ok:bool }
  const errors = {};
  fields.forEach(f => {
    const v = values[f.key];
    if (f.required && (v === undefined || v === null || String(v).trim() === "")) {
      errors[f.key] = "Campo obbligatorio";
    } else if (f.type === "number" && v !== "" && isNaN(Number(v))) {
      errors[f.key] = "Inserisci un numero valido";
    } else if (f.type === "slug" && v && !/^[a-z0-9-]+$/.test(v)) {
      errors[f.key] = "Solo minuscole, numeri e trattini";
    }
  });
  return { errors, ok: Object.keys(errors).length === 0 };
}

const slugify = (s) => s.toLowerCase().trim()
  .replace(/[àáâ]/g, "a").replace(/[èé]/g, "e").replace(/[ìí]/g, "i").replace(/[òó]/g, "o").replace(/[ùú]/g, "u")
  .replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");

Object.assign(window, {
  AdminModal, AdminFieldText, AdminFieldArea, AdminFieldSelect, AdminFieldToggle,
  AdminSegmented, AdminStatusPill, AdminSkeleton, AdminEmptyState,
  useAutosave, AutosaveBadge, MediaLibrary, MediaThumb,
  validateRequired, slugify,
});
