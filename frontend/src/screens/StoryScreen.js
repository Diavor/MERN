import React from "react";

// BRÀCE manifesto / story page (static).
const StoryScreen = () => (
  <main style={{ paddingTop: 140, minHeight: "70vh", paddingBottom: 120 }}>
    <div className="b-container">
      <div className="eyebrow" style={{ marginBottom: 20 }}>
        Manifesto
      </div>
      <h1
        className="display"
        style={{
          fontSize: "clamp(72px, 12vw, 168px)",
          lineHeight: 0.9,
          margin: 0,
          letterSpacing: "-0.015em",
        }}
      >
        Un impasto.
        <br />
        <span className="it" style={{ color: "var(--gold)", fontWeight: 300 }}>
          Tre giorni.
        </span>
      </h1>
      <p
        className="it"
        style={{
          fontSize: 26,
          color: "var(--text-dim)",
          marginTop: 36,
          maxWidth: 760,
          lineHeight: 1.4,
        }}
      >
        BRÀCE è una pizzeria piccola, in via dei Forni, a Mogliano Veneto.
        Apriamo cinque sere a settimana. Cuociamo a 485 gradi in un forno a legna
        che abbiamo costruito noi, mattone su mattone, nell'estate del 2019.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 24,
          marginTop: 100,
        }}
      >
        {[
          ["01", "Farina", "Tipo 0 antica, macinata a pietra in un piccolo mulino pugliese."],
          ["02", "Tempo", "Settantadue ore di lievitazione a freddo. Niente scorciatoie."],
          ["03", "Forno", "Faggio e quercia. 485 gradi. Novanta secondi. Mai un secondo di più."],
        ].map(([n, t, d]) => (
          <div key={n} style={{ borderTop: "1px solid var(--gold-deep)", paddingTop: 24 }}>
            <div className="mono" style={{ color: "var(--gold)", fontSize: 11, letterSpacing: "0.2em" }}>
              · {n}
            </div>
            <h3 className="display" style={{ fontSize: 44, margin: "16px 0 18px" }}>
              {t}
            </h3>
            <p style={{ color: "var(--text-dim)", fontSize: 15, lineHeight: 1.7 }}>{d}</p>
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: 120,
          padding: "80px 60px",
          textAlign: "center",
          background: "var(--bg-2)",
          border: "1px solid var(--line)",
        }}
      >
        <p
          className="it"
          style={{
            fontSize: "clamp(28px, 4vw, 48px)",
            lineHeight: 1.3,
            maxWidth: 880,
            margin: "0 auto",
            fontWeight: 300,
            fontFamily: "var(--serif-2)",
          }}
        >
          "La pizza non è un piatto complicato. È un piatto preciso. La differenza
          non è negli ingredienti — è nel tempo che ci metti."
        </p>
        <div
          style={{
            marginTop: 36,
            fontFamily: "var(--mono)",
            fontSize: 12,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "var(--text-dim)",
          }}
        >
          Antonio Sannino · Pizzaiolo · Fondatore
        </div>
      </div>
    </div>
  </main>
);

export default StoryScreen;
