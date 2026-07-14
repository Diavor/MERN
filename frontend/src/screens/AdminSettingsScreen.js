import React, { useEffect, useState } from "react";
import "./AdminSettingsScreen.scss";
import Loader from "../brace/ui/Loader";
import Message from "../brace/ui/Message";
import { useToast } from "../brace/ui/Toast";
import { fetchSettings, updateSettings } from "../brace/admin/api";
import { SETTINGS_CARDS } from "../brace/admin/settingsCards";

// Editable settings overview (Impostazioni). Each card mirrors the original
// read-only panel and gains an Edit action that opens a section modal. Cards are
// driven by the SETTINGS_CARDS registry, so the screen stays generic — adding an
// editable section requires no changes here.
const AdminSettingsScreen = () => {
  const toast = useToast();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null); // card.key | null

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await fetchSettings();
        if (alive) setSettings(data);
      } catch (e) {
        if (alive) setError(e.message);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // Persist a single section and merge the returned document back into state, so
  // only the edited card re-renders — the page never reloads.
  const saveSection = async (patch) => {
    const updated = await updateSettings(patch);
    setSettings(updated);
    toast("Impostazioni aggiornate", "ok");
  };

  if (loading) return <Loader />;
  if (error) return <Message variant="danger">{error}</Message>;
  if (!settings) return null;

  return (
    <div className="b-rise admin-settings">
      {SETTINGS_CARDS.map((card) => (
        <div key={card.key} className="admin-settings__panel">
          <div className="admin-settings__panel-head">
            <div className="eyebrow admin-settings__title">{card.title}</div>
            <button
              type="button"
              className="b-btn sm ghost admin-settings__edit-btn"
              onClick={() => setEditing(card.key)}
            >
              Modifica
            </button>
          </div>
          {card.rows(settings).map(([k, v]) => (
            <div key={k} className="admin-settings__row">
              <span className="admin-settings__key">{k}</span>
              <span className="admin-settings__value">{v}</span>
            </div>
          ))}
        </div>
      ))}

      {SETTINGS_CARDS.map((card) => {
        const Modal = card.Modal;
        return (
          <Modal
            key={card.key}
            open={editing === card.key}
            value={card.getValue(settings)}
            save={saveSection}
            onClose={() => setEditing(null)}
          />
        );
      })}
    </div>
  );
};

export default AdminSettingsScreen;
