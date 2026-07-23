import React, { useEffect, useRef, useState } from "react";
import Meta from "../components/Meta";
import "./CollezioneScreen.scss";

// Grani Antichi — La Collezione. Cinematic showcase page (static).
// Section media are local clips in /video with poster fallbacks in /img;
// dropping higher-grade footage in at the same paths upgrades the page.

const PHONE = "+393398657277";

const DOUGHS = [
  ["01", "Classico", "Farina tipo 0 di grani italiani, 48 ore di lievitazione."],
  ["02", "Multicereali", "Cinque cereali macinati a pietra, crosta rustica."],
  ["03", "Integrale", "Grano tenero integrale, profondità e carattere."],
  ["04", "Senatore Cappelli", "Il grano duro antico per eccellenza, Presidio Slow Food."],
];

const PIZZE = [
  {
    name: "La Melone",
    desc: "Focaccina croccante, Prosciutto crudo di Parma 24 mesi, burrata, velo di melone.",
    price: "14,00 €",
  },
  {
    name: "L'Oca Loca",
    desc: "Fior di latte, pomodorini confit, pesto di basilico, petto d'oca affumicato.",
    price: "14,00 €",
  },
];

const ZONES =
  "Mogliano Veneto · Marcon · Bonisiolo · Preganziol · Casale sul Sile";

const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// <video> with graceful degradation: if the clip can't load, swap to its poster.
const ClipMedia = ({ src, poster, mediaRef, className, scrub }) => {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return <img ref={mediaRef} className={className} src={poster} alt="" />;
  }
  return (
    <video
      ref={mediaRef}
      className={className}
      poster={poster}
      muted
      playsInline
      loop={!scrub}
      autoPlay={!scrub && !prefersReducedMotion()}
      preload="auto"
      onError={() => setFailed(true)}
    >
      <source src={src} type="video/mp4" onError={() => setFailed(true)} />
    </video>
  );
};

// Full-bleed hero: a tall scroll track with a sticky viewport; scroll progress
// scrubs the clip's currentTime instead of playing it.
const ScrubHero = () => {
  const trackRef = useRef(null);
  const mediaRef = useRef(null);

  useEffect(() => {
    if (prefersReducedMotion()) return undefined;
    let raf = 0;

    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const track = trackRef.current;
        const media = mediaRef.current;
        if (!track || !media || !media.duration) return;
        const range = track.offsetHeight - window.innerHeight;
        const progress = Math.min(1, Math.max(0, -track.getBoundingClientRect().top / range));
        // pause "playback" and drive time from scroll
        if (!media.paused && media.pause) media.pause();
        media.currentTime = progress * media.duration;
      });
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section ref={trackRef} className="collezione__hero" aria-label="Grani Antichi">
      <div className="collezione__hero-sticky">
        <ClipMedia
          scrub
          mediaRef={mediaRef}
          className="collezione__hero-media"
          src="/video/hero-oven.mp4"
          poster="/img/hero-oven.jpg"
        />
        <div className="collezione__hero-scrim" />
        <div className="collezione__hero-copy">
          <h1 className="display collezione__hero-title">Grani Antichi</h1>
          <p className="it collezione__hero-tagline">Farine antiche. Fuoco vero.</p>
          <div className="mono collezione__hero-hint">Scorri</div>
        </div>
      </div>
    </section>
  );
};

// Section with a slow-parallax media background.
const MediaSection = ({ src, poster, className, children }) => {
  const sectionRef = useRef(null);
  const mediaRef = useRef(null);

  useEffect(() => {
    if (prefersReducedMotion()) return undefined;
    let raf = 0;

    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const section = sectionRef.current;
        const media = mediaRef.current;
        if (!section || !media) return;
        const rect = section.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > window.innerHeight) return;
        const center = rect.top + rect.height / 2 - window.innerHeight / 2;
        media.style.transform = `translateY(${center * -0.1}px) scale(1.18)`;
      });
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section ref={sectionRef} className={`collezione__section ${className}`}>
      <ClipMedia
        mediaRef={mediaRef}
        className="collezione__section-media"
        src={src}
        poster={poster}
      />
      <div className="collezione__section-scrim" />
      <div className="b-container collezione__section-inner">{children}</div>
    </section>
  );
};

const CollezioneScreen = () => {
  // Page-scoped chrome overrides (dark nav, floating-cart offset) hook off this
  // body class; removed on unmount so nothing leaks to other routes.
  useEffect(() => {
    document.body.classList.add("page-collezione");
    return () => document.body.classList.remove("page-collezione");
  }, []);

  return (
    <div className="collezione">
      <Meta title="Grani Antichi | La Collezione" />

      <ScrubHero />

      {/* Gli impasti — over the dough clip */}
      <MediaSection
        className="collezione__impasti"
        src="/video/dough-hands.mp4"
        poster="/img/dough-hands.jpg"
      >
        <div className="eyebrow collezione__eyebrow">Gli impasti</div>
        <h2 className="display collezione__heading">
          Quattro impasti. <span className="it">Grani italiani, 100% tracciabili.</span>
        </h2>
        <div className="collezione__doughs">
          {DOUGHS.map(([n, name, desc]) => (
            <div key={n} className="collezione__dough">
              <div className="mono collezione__dough-num">· {n}</div>
              <h3 className="display collezione__dough-name">{name}</h3>
              <p className="collezione__dough-desc">{desc}</p>
            </div>
          ))}
        </div>
      </MediaSection>

      {/* La Collezione — seasonal pizzas */}
      <section className="collezione__grid-section">
        <div className="b-container">
          <div className="eyebrow collezione__eyebrow">La Collezione</div>
          <h2 className="display collezione__heading">
            Pizze di stagione, <span className="it">ingredienti con un nome.</span>
          </h2>
          <p className="collezione__note">
            DOP, IGP e Presìdi Slow Food. La collezione cambia con le stagioni.
          </p>
          <div className="collezione__pizzas">
            {PIZZE.map((p) => (
              <article key={p.name} className="collezione__pizza">
                <header className="collezione__pizza-head">
                  <h3 className="display collezione__pizza-name">{p.name}</h3>
                  <div className="mono collezione__pizza-price">{p.price}</div>
                </header>
                <p className="it collezione__pizza-desc">{p.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Delivery — over the room clip */}
      <MediaSection
        className="collezione__delivery"
        src="/video/dining-room.mp4"
        poster="/img/dining-room.jpg"
      >
        <div className="eyebrow collezione__eyebrow">A domicilio</div>
        <h2 className="display collezione__heading">
          La pizza <span className="it">direttamente a casa tua.</span>
        </h2>
        <p className="collezione__note">
          Consegna gratuita sopra i 49 €. Pagamento con carta alla porta.
        </p>
        <div className="mono collezione__zones">{ZONES}</div>
      </MediaSection>

      {/* Closing — hours, address, map, CTA */}
      <section className="collezione__closing">
        <div className="b-container collezione__closing-inner">
          <div className="collezione__closing-info">
            <div className="eyebrow collezione__eyebrow">Vieni a trovarci</div>
            <h2 className="display collezione__heading">Zerman.</h2>
            <dl className="collezione__facts">
              <div>
                <dt className="mono">Orari</dt>
                <dd>
                  Martedì – Domenica · 18:00 – 22:00
                  <br />
                  Lunedì chiuso
                </dd>
              </div>
              <div>
                <dt className="mono">Indirizzo</dt>
                <dd>
                  Via Antonio Canova 23
                  <br />
                  Zerman di Mogliano Veneto
                </dd>
              </div>
            </dl>
            <a href={`tel:${PHONE}`} className="b-btn collezione__cta">
              Ordina Ora · 339 865 7277
            </a>
          </div>
          <div className="collezione__map">
            <iframe
              title="Grani Antichi — Via Antonio Canova 23, Zerman di Mogliano Veneto"
              src="https://www.google.com/maps?q=Via%20Antonio%20Canova%2023%2C%20Zerman%2C%20Mogliano%20Veneto&output=embed"
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </section>

      {/* Mobile-only sticky call bar */}
      <a href={`tel:${PHONE}`} className="collezione__callbar mono">
        Ordina Ora · 339 865 7277
      </a>
    </div>
  );
};

export default CollezioneScreen;
