import React from "react";
import "./StoryScreen.scss";

// Grani Antichi manifesto / story page (static).
const StoryScreen = () => (
  <main className="story">
    <div className="b-container">
      <div className="eyebrow story__eyebrow">Manifesto</div>
      <h1 className="display story__title">
        Un impasto.
        <br />
        <span className="it story__title-accent">Tre giorni.</span>
      </h1>
      <p className="it story__lede">
        Grani Antichi è una pizzeria piccola, in via dei Forni, a Mogliano Veneto.
        Apriamo cinque sere a settimana. Cuociamo a 485 gradi in un forno a legna
        che abbiamo costruito noi, mattone su mattone, nell'estate del 2019.
      </p>

      <div className="story__pillars">
        {[
          ["01", "Farina", "Tipo 0 antica, macinata a pietra in un piccolo mulino pugliese."],
          ["02", "Tempo", "Settantadue ore di lievitazione a freddo. Niente scorciatoie."],
          ["03", "Forno", "Faggio e quercia. 485 gradi. Novanta secondi. Mai un secondo di più."],
        ].map(([n, t, d]) => (
          <div key={n} className="story__pillar">
            <div className="mono story__pillar-num">· {n}</div>
            <h3 className="display story__pillar-title">{t}</h3>
            <p className="story__pillar-desc">{d}</p>
          </div>
        ))}
      </div>

      <div className="story__quote">
        <p className="it story__quote-text">
          "La pizza non è un piatto complicato. È un piatto preciso. La differenza
          non è negli ingredienti — è nel tempo che ci metti."
        </p>
        <div className="story__quote-cite">
          Antonio Sannino · Pizzaiolo · Fondatore
        </div>
      </div>
    </div>
  </main>
);

export default StoryScreen;
