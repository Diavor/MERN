import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import Meta from "../components/Meta";
import "./CollectionScreen.scss";

// Grani Antichi — La Collezione. Cinematic showcase page (static).
// Section media are local clips in /video with poster fallbacks in /img;
// dropping higher-grade footage in at the same paths upgrades the page.

const PHONE = "+393398657277";

// [num, nameKey, descKey] — resolved with t() at render time.
const DOUGHS = [
  ["01", "collection.dough1Name", "collection.dough1Desc"],
  ["02", "collection.dough2Name", "collection.dough2Desc"],
  ["03", "collection.dough3Name", "collection.dough3Desc"],
  ["04", "collection.dough4Name", "collection.dough4Desc"],
];

// Pizza names are brand names — only the descriptions translate.
const PIZZE = [
  { name: "La Melone", descKey: "collection.pizza1Desc", price: "14,00 €" },
  { name: "L'Oca Loca", descKey: "collection.pizza2Desc", price: "14,00 €" },
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
  const { t } = useTranslation();
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
    <section ref={trackRef} className="collection__hero" aria-label="Grani Antichi">
      <div className="collection__hero-sticky">
        <ClipMedia
          scrub
          mediaRef={mediaRef}
          className="collection__hero-media"
          src="/video/hero-oven.mp4"
          poster="/img/hero-oven.jpg"
        />
        <div className="collection__hero-scrim" />
        <div className="collection__hero-copy">
          <h1 className="display collection__hero-title">Grani Antichi</h1>
          <p className="it collection__hero-tagline">{t("collection.tagline")}</p>
          <div className="mono collection__hero-hint">{t("collection.scroll")}</div>
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
    <section ref={sectionRef} className={`collection__section ${className}`}>
      <ClipMedia
        mediaRef={mediaRef}
        className="collection__section-media"
        src={src}
        poster={poster}
      />
      <div className="collection__section-scrim" />
      <div className="b-container collection__section-inner">{children}</div>
    </section>
  );
};

const CollectionScreen = () => {
  const { t } = useTranslation();
  // Page-scoped chrome overrides (dark nav, floating-cart offset) hook off this
  // body class; removed on unmount so nothing leaks to other routes.
  useEffect(() => {
    document.body.classList.add("page-collection");
    return () => document.body.classList.remove("page-collection");
  }, []);

  return (
    <div className="collection">
      <Meta title="Grani Antichi | La Collezione" />

      <ScrubHero />

      {/* Gli impasti — over the dough clip */}
      <MediaSection
        className="collection__impasti"
        src="/video/dough-hands.mp4"
        poster="/img/dough-hands.jpg"
      >
        <div className="eyebrow collection__eyebrow">{t("collection.doughsEyebrow")}</div>
        <h2 className="display collection__heading">
          {t("collection.doughsHeading")}{" "}
          <span className="it">{t("collection.doughsHeadingAccent")}</span>
        </h2>
        <div className="collection__doughs">
          {DOUGHS.map(([n, nameKey, descKey]) => (
            <div key={n} className="collection__dough">
              <div className="mono collection__dough-num">· {n}</div>
              <h3 className="display collection__dough-name">{t(nameKey)}</h3>
              <p className="collection__dough-desc">{t(descKey)}</p>
            </div>
          ))}
        </div>
      </MediaSection>

      {/* La Collezione — seasonal pizzas */}
      <section className="collection__grid-section">
        <div className="b-container">
          <div className="eyebrow collection__eyebrow">La Collezione</div>
          <h2 className="display collection__heading">
            {t("collection.seasonHeading")}{" "}
            <span className="it">{t("collection.seasonHeadingAccent")}</span>
          </h2>
          <p className="collection__note">{t("collection.seasonNote")}</p>
          <div className="collection__pizzas">
            {PIZZE.map((p) => (
              <article key={p.name} className="collection__pizza">
                <header className="collection__pizza-head">
                  <h3 className="display collection__pizza-name">{p.name}</h3>
                  <div className="mono collection__pizza-price">{p.price}</div>
                </header>
                <p className="it collection__pizza-desc">{t(p.descKey)}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Delivery — over the room clip */}
      <MediaSection
        className="collection__delivery"
        src="/video/dining-room.mp4"
        poster="/img/dining-room.jpg"
      >
        <div className="eyebrow collection__eyebrow">{t("collection.deliveryEyebrow")}</div>
        <h2 className="display collection__heading">
          {t("collection.deliveryHeading")}{" "}
          <span className="it">{t("collection.deliveryHeadingAccent")}</span>
        </h2>
        <p className="collection__note">{t("collection.deliveryNote")}</p>
        <div className="mono collection__zones">{ZONES}</div>
      </MediaSection>

      {/* Closing — hours, address, map, CTA */}
      <section className="collection__closing">
        <div className="b-container collection__closing-inner">
          <div className="collection__closing-info">
            <div className="eyebrow collection__eyebrow">{t("collection.visitEyebrow")}</div>
            <h2 className="display collection__heading">Zerman.</h2>
            <dl className="collection__facts">
              <div>
                <dt className="mono">{t("footer.hours")}</dt>
                <dd>
                  {t("collection.hoursLine1")}
                  <br />
                  {t("collection.hoursLine2")}
                </dd>
              </div>
              <div>
                <dt className="mono">{t("collection.address")}</dt>
                <dd>
                  Via Antonio Canova 23
                  <br />
                  Zerman di Mogliano Veneto
                </dd>
              </div>
            </dl>
            <a href={`tel:${PHONE}`} className="b-btn collection__cta">
              {t("collection.orderNow")} · 339 865 7277
            </a>
          </div>
          <div className="collection__map">
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
      <a href={`tel:${PHONE}`} className="collection__callbar mono">
        {t("collection.orderNow")} · 339 865 7277
      </a>
    </div>
  );
};

export default CollectionScreen;
