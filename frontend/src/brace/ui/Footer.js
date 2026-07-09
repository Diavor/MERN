import React from "react";
import Icon, { Mark } from "./Icon";
import { HOURS, CONTACT } from "../content";

const Footer = () => (
  <footer
    style={{
      borderTop: "1px solid var(--line)",
      marginTop: 120,
      paddingTop: 80,
      paddingBottom: 60,
      background: "var(--bg)",
    }}
  >
    <div className="b-container">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 56,
          marginBottom: 80,
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
            <Mark size={32} />
            <span className="display" style={{ fontSize: 28, letterSpacing: "0.34em" }}>
              BRÀCE
            </span>
          </div>
          <p
            className="it"
            style={{
              fontSize: 22,
              lineHeight: 1.4,
              color: "var(--text-dim)",
              maxWidth: 360,
              margin: 0,
            }}
          >
            Una pizzeria di quartiere, un forno a 485°C, due mani che sanno cosa fanno.
          </p>
        </div>

        <div>
          <div className="eyebrow" style={{ marginBottom: 18 }}>
            Orari
          </div>
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              fontFamily: "var(--mono)",
              fontSize: 12,
              color: "var(--text-dim)",
            }}
          >
            {HOURS.map(([day, hours]) => (
              <li
                key={day}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "6px 0",
                  borderBottom: "1px dashed var(--line)",
                }}
              >
                <span style={{ color: "var(--text)" }}>{day}</span>
                <span>{hours}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="eyebrow" style={{ marginBottom: 18 }}>
            Contatto
          </div>
          <div
            style={{
              fontFamily: "var(--mono)",
              fontSize: 12,
              color: "var(--text-dim)",
              lineHeight: 2,
            }}
          >
            <div style={{ color: "var(--text)" }}>{CONTACT.street}</div>
            <div>{CONTACT.city}</div>
            <div style={{ marginTop: 14 }}>{CONTACT.phone}</div>
            <div>{CONTACT.email}</div>
            <div style={{ marginTop: 14, color: "var(--gold)" }}>{CONTACT.instagram}</div>
          </div>
        </div>

        <div>
          <div className="eyebrow" style={{ marginBottom: 18 }}>
            Newsletter
          </div>
          <p style={{ fontSize: 13, color: "var(--text-dim)", marginTop: 0 }}>
            Stagionali e dropping menu, una mail al mese. Niente di più.
          </p>
          <form
            onSubmit={(e) => e.preventDefault()}
            style={{ display: "flex", borderBottom: "1px solid var(--line-2)", paddingBottom: 6 }}
          >
            <input
              placeholder="email@cucina.it"
              style={{
                flex: 1,
                background: "none",
                border: "none",
                outline: "none",
                color: "var(--text)",
                fontFamily: "var(--mono)",
                fontSize: 12,
                padding: "8px 0",
              }}
            />
            <button
              style={{ background: "none", border: "none", color: "var(--gold)", cursor: "pointer" }}
            >
              <Icon.arrow />
            </button>
          </form>
        </div>
      </div>

      <div className="hr" />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          paddingTop: 28,
          fontFamily: "var(--mono)",
          fontSize: 11,
          color: "var(--text-faint)",
          letterSpacing: "0.1em",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>© {new Date().getFullYear()} BRÀCE Pizzeria — Mogliano Veneto</div>
        <div style={{ display: "flex", gap: 24 }}>
          <span>Privacy</span>
          <span>Cookies</span>
          <span>Allergeni</span>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
