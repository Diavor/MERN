import "./HomeScreen.scss";
import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useHistory } from "react-router-dom";
import Icon from "../brace/ui/Icon";
import fmt from "../brace/ui/fmt";
import Loader from "../brace/ui/Loader";
import Message from "../brace/ui/Message";
import PizzaCard from "../brace/ui/PizzaCard";
import ProductImage from "../brace/ui/ProductImage";
import SectionHead from "../brace/ui/SectionHead";
import { useToast } from "../brace/ui/Toast";
import { useCartUI } from "../brace/ui/CartUI";
import { listProducts, listTopProducts } from "../store/actions/products";
import { addToCart } from "../store/actions/cart";
import {
  DELIVERY_ZONES,
  FREE_DELIVERY_THRESHOLD,
  TESTIMONIALS,
  CONTACT,
} from "../brace/content";

// Grani Antichi home page. Note: this screen is also mounted on /search/:keyword and
// /page/:pageNumber routes for backwards compatibility, but it deliberately
// ignores those params — the /menu screen owns search & pagination now.
const HomeScreen = () => {
  const history = useHistory();
  const dispatch = useDispatch();
  const toast = useToast();
  const cartUI = useCartUI();

  useEffect(() => {
    dispatch(listTopProducts());
    dispatch(listProducts());
  }, [dispatch]);

  const addHandler = (product) => {
    dispatch(addToCart(product._id, 1));
    toast(product.name + " aggiunta al carrello", "ok");
    cartUI.setOpen(true);
  };

  return (
    <main>
      <Hero history={history} />
      <FeaturedCarousel history={history} onAdd={addHandler} />
      <DoughStory />
      <FromOurMenu history={history} onAdd={addHandler} />
      <Ingredients />
      <Delivery history={history} />
      <Testimonials />
    </main>
  );
};

// --------------- HERO ---------------
const Hero = ({ history }) => (
  <section className="home__hero">
    {/* background radial */}
    <div className="home__hero-bg" />

    {/* huge rotating pizza */}
    <div className="home__hero-pizza">
      <div className="pizza-plate">
        <div className="crust-glow" />
      </div>
    </div>

    {/* ember spark dots */}
    <Embers />

    <div className="b-container home__hero-inner">
      <div className="b-rise home__hero-eyebrow">
        <span className="home__hero-rule" />
        <span className="eyebrow">Pizzeria Napoletana · Mogliano Veneto · dal 2019</span>
      </div>

      <h1 className="display b-rise home__hero-title">
        Pizza,
        <br />
        <span className="home__hero-title-accent">
          cotta a 485°.
        </span>
      </h1>

      <p className="b-rise home__hero-lede">
        Settantadue ore di lievitazione. Novanta secondi nel forno. Una pizza che
        non somiglia a nessun'altra perché non vuole.
      </p>

      <div className="b-rise home__hero-actions">
        <button onClick={() => history.push("/menu")} className="b-btn ember">
          Ordina ora <Icon.arrow className="arrow" />
        </button>
        <button onClick={() => history.push("/menu")} className="b-btn">
          Vedi il menu
        </button>
      </div>

      {/* meta strip */}
      <div className="b-rise home__hero-meta">
        {[
          ["485°", "Forno a legna"],
          ["72h", "Lievitazione"],
          ["90s", "Di cottura"],
          ["D.O.P.", "Ingredienti"],
        ].map(([k, v]) => (
          <div key={v}>
            <div className="display home__hero-metric">
              {k}
            </div>
            <div className="home__hero-metric-label">
              {v}
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* corner notation */}
    <div className="home__hero-scroll">
      <span>Scroll</span>
      <span className="home__hero-scroll-rule" />
    </div>
  </section>
);

const Embers = () => {
  // a few floating ember dots
  const dots = Array.from({ length: 14 }, (_, i) => i);
  return (
    <div className="home__embers">
      {dots.map((i) => {
        const left = (i * 137) % 100;
        const top = (i * 91) % 100;
        const delay = (i * 0.4) % 3;
        const size = 2 + (i % 3);
        return (
          <span
            key={i}
            className={
              "home__ember " + (i % 3 === 0 ? "home__ember--accent" : "home__ember--gold")
            }
            style={{
              left: left + "%",
              top: top + "%",
              width: size,
              height: size,
              animation: `float ${4 + (i % 4)}s ease-in-out ${delay}s infinite`,
            }}
          />
        );
      })}
    </div>
  );
};

// --------------- FEATURED CAROUSEL (real top products) ---------------
const FeaturedCarousel = ({ history, onAdd }) => {
  const scrollerRef = useRef(null);

  const productTopRated = useSelector((state) => state.productTopRated);
  const { loading, error, products } = productTopRated;

  const scrollBy = (dir) => {
    if (!scrollerRef.current) return;
    scrollerRef.current.scrollBy({ left: dir * 420, behavior: "smooth" });
  };

  return (
    <section className="home__featured">
      <div className="b-container">
        <div className="home__featured-head">
          <SectionHead
            eyebrow="Le firme"
            title={
              <>
                Pizza
                <br />
                <span className="it home__accent">
                  che ci rappresenta
                </span>
              </>
            }
          />
          <div className="home__featured-nav">
            <button onClick={() => scrollBy(-1)} className="home__nav-btn" aria-label="Precedente">
              <Icon.arrow style={{ transform: "rotate(180deg)" }} />
            </button>
            <button onClick={() => scrollBy(1)} className="home__nav-btn" aria-label="Successivo">
              <Icon.arrow />
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <Loader />
      ) : error ? (
        <div className="b-container">
          <Message variant="danger">{error}</Message>
        </div>
      ) : (
        <div
          ref={scrollerRef}
          className="no-scrollbar home__featured-scroller"
        >
          {(products || []).map((p) => (
            <div key={p._id} className="home__featured-slide">
              <PizzaCard
                product={p}
                onClick={() => history.push("/product/" + p._id)}
                onAdd={() => onAdd(p)}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

// --------------- DOUGH STORY ---------------
const DoughStory = () => (
  <section data-section="story" className="home__story">
    <div className="b-container">
      <div className="home__story-grid">
        <div>
          <div className="eyebrow home__story-eyebrow">
            L'impasto
          </div>
          <h2 className="display home__story-title">
            Settantadue
            <br />
            <span className="it home__accent-light">
              ore.
            </span>
          </h2>
          <p className="home__story-p">
            Iniziamo con farina di grano tenero macinata a pietra in un piccolo
            mulino di Altamura. Idratazione al 68%. Sale marino integrale. Lievito
            madre vivo, alimentato ogni dodici ore.
          </p>
          <p className="home__story-p home__story-p--tight">
            Poi tre giorni di freddo, a 4 gradi. La fermentazione lenta rompe i
            carboidrati complessi in zuccheri semplici — è il motivo per cui la
            nostra pizza è digeribile in venti minuti, non in cinque ore.
          </p>

          <ul className="home__spec-list">
            {[
              ["01", "Farina", "Tipo 0 — Mulino Altamura"],
              ["02", "Idratazione", "68%"],
              ["03", "Lievitazione", "72 ore a 4°C"],
              ["04", "Stesura", "A mano, mai mattarello"],
              ["05", "Cottura", "90 secondi · 485°C"],
            ].map(([n, k, v]) => (
              <li key={n} className="home__spec-row">
                <span className="home__spec-n">{n}</span>
                <span className="home__spec-k">
                  {k}
                </span>
                <span className="home__spec-v">{v}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="home__story-media">
          <div className="ph home__story-ph">
            <div className="home__story-ph-body">
              <div>Dough in proofing tray</div>
              <div className="home__story-ph-sub">
                shot 4:5 · b&w
              </div>
            </div>
          </div>
          {/* overlay caption */}
          <div className="home__story-caption">
            <span>Ora 47 di 72</span>
            <span className="home__story-caption-active">Lievito attivo</span>
          </div>
        </div>
      </div>
    </div>
  </section>
);

// --------------- DAL NOSTRO MENU (design's "Seasonal" band, real products) ---------------
const FromOurMenu = ({ history, onAdd }) => {
  const productList = useSelector((state) => state.productList);
  const { loading, error, products } = productList;

  const items = (products || []).slice(0, 4);

  return (
    <section className="home__menu">
      <div className="b-container">
        <div className="home__menu-head">
          <SectionHead
            eyebrow="Dal nostro menu"
            title={
              <>
                Un assaggio,
                <br />
                <span className="it home__accent">
                  per cominciare.
                </span>
              </>
            }
            kicker="Quattro pizze dal nostro menu. Impasto a lunga lievitazione, forno a legna, ingredienti con nome e cognome."
          />
          <button onClick={() => history.push("/menu")} className="b-btn">
            Tutto il menu <Icon.arrow className="arrow" />
          </button>
        </div>

        {loading ? (
          <Loader />
        ) : error ? (
          <Message variant="danger">{error}</Message>
        ) : (
          <div className="home__menu-grid">
            {items.map((p) => (
              <MenuBandCard
                key={p._id}
                product={p}
                onClick={() => history.push("/product/" + p._id)}
                onAdd={() => onAdd(p)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

const MenuBandCard = ({ product, onClick, onAdd }) => {
  const excerpt =
    product.description && product.description.length > 110
      ? product.description.slice(0, 110).trimEnd() + "…"
      : product.description;
  return (
    <article onClick={onClick} className="home__band-card">
      <div className="home__band-media">
        <ProductImage src={product.img} alt={product.name} />
      </div>
      <div>
        <div className="eyebrow home__band-eyebrow">
          {product.category || "Pizza"}
        </div>
        <h3 className="display home__band-title">
          {product.name}
        </h3>
        <p className="it home__band-desc">
          {excerpt}
        </p>
        <div className="home__band-foot">
          <span className="display home__band-price">
            {fmt(product.price)}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAdd();
            }}
            className="b-btn sm"
          >
            Aggiungi <Icon.plus />
          </button>
        </div>
      </div>
    </article>
  );
};

// --------------- INGREDIENTS ---------------
const Ingredients = () => {
  const items = [
    {
      name: "Pomodoro San Marzano D.O.P.",
      origin: "Agro Sarnese-Nocerino, Campania",
      note: "Raccolti a mano, pelati il giorno stesso.",
    },
    {
      name: "Mozzarella di Bufala Campana",
      origin: "Aversa, Caserta",
      note: "Latte di bufala mungitura 24h.",
    },
    {
      name: "Farina Tipo 0 Antica",
      origin: "Mulino di Altamura, Puglia",
      note: "Macinata a pietra, W260.",
    },
    {
      name: "Olio EVO Nocellara",
      origin: "Trapani, Sicilia",
      note: "Cultivar singola, prima spremitura.",
    },
    {
      name: "Basilico Genovese D.O.P.",
      origin: "Prà, Liguria",
      note: "Foglie piccole, mai oltre 6cm.",
    },
    {
      name: "Sale Marino Integrale",
      origin: "Saline di Trapani, Sicilia",
      note: "Raccolto a mano, asciugato al sole.",
    },
  ];

  return (
    <section className="home__ingredients">
      <div className="b-container">
        <SectionHead
          eyebrow="Provenienza"
          title={
            <>
              Ogni ingrediente
              <br />
              <span className="it home__accent">
                ha un nome.
              </span>
            </>
          }
          kicker="Non compriamo niente da intermediari. Conosciamo ogni produttore, conosciamo ogni campo."
        />

        <div className="home__ingredients-grid">
          {items.map((it, i) => (
            <div key={it.name} className="home__ingredient">
              <div className="mono home__ingredient-n">
                · 0{i + 1}
              </div>
              <div>
                <h3 className="display home__ingredient-name">
                  {it.name}
                </h3>
                <div className="mono home__ingredient-origin">
                  {it.origin}
                </div>
                <p className="home__ingredient-note">
                  {it.note}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// --------------- DELIVERY (real zones from content.js) ---------------
const Delivery = ({ history }) => {
  const minZonePrice = Math.min(...DELIVERY_ZONES.map((z) => z.price));

  return (
    <section className="home__delivery">
      <div className="b-container">
        <div className="home__delivery-grid">
          <div className="home__delivery-panel home__delivery-panel--order">
            <div className="eyebrow home__delivery-eyebrow">
              Consegna
            </div>
            <h2 className="display home__delivery-title">
              A casa
              <br />
              <span className="it home__accent-light">
                tua.
              </span>
            </h2>
            <p className="home__delivery-p">
              Cuociamo, sigilliamo, partiamo. Consegniamo solo nelle zone che
              riusciamo a raggiungere con la pizza ancora calda — non oltre. Mai.
            </p>
            <div className="home__delivery-stats">
              {[
                [DELIVERY_ZONES.length, "Zone servite"],
                ["da " + fmt(minZonePrice), "Consegna"],
                [fmt(FREE_DELIVERY_THRESHOLD), "Gratuita oltre"],
                ["—", "Mance? Mai."],
              ].map(([k, v]) => (
                <div key={v} className="home__delivery-stat">
                  <div className="display home__delivery-stat-value">
                    {k}
                  </div>
                  <div className="mono home__delivery-stat-label">
                    {v}
                  </div>
                </div>
              ))}
            </div>
            <div className="mono home__delivery-zones">
              {DELIVERY_ZONES.map((z) => z.city).join(" · ")}
            </div>
            <button
              onClick={() => history.push("/menu")}
              className="b-btn ember home__delivery-cta"
            >
              Ordina ora <Icon.arrow className="arrow" />
            </button>
          </div>

          <div className="home__delivery-panel home__delivery-panel--pickup">
            <div className="eyebrow home__delivery-eyebrow">
              Ritiro
            </div>
            <h2 className="display home__delivery-title">
              In
              <br />
              <span className="it home__accent-light">
                pizzeria.
              </span>
            </h2>
            <p className="home__delivery-p">
              Ordina, paga, scegli un orario. Trovi la tua pizza sul bancone —
              appena uscita dal forno. Consegna da {fmt(minZonePrice)} · gratuita
              oltre {fmt(FREE_DELIVERY_THRESHOLD)}.
            </p>

            {/* mini map placeholder */}
            <div className="home__delivery-map">
              <div className="home__delivery-pin" />
              <div className="home__delivery-map-label">
                {CONTACT.street} · {CONTACT.city}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// --------------- TESTIMONIALS ---------------
const Testimonials = () => {
  const [idx, setIdx] = useState(0);
  const list = TESTIMONIALS;

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % list.length), 6500);
    return () => clearInterval(t);
  }, [list.length]);

  return (
    <section className="home__testimonials">
      <div className="b-container home__testimonials-inner">
        <div className="eyebrow home__testimonials-eyebrow">
          Dicono di noi
        </div>
        <div className="home__testimonials-stage">
          {list.map((t, i) => (
            <div
              key={i}
              className={"home__testimonial" + (i === idx ? " is-active" : "")}
            >
              <div className="home__testimonial-stars">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Icon.star key={j} />
                ))}
              </div>
              <blockquote className="display home__testimonial-quote">
                "{t.quote}"
              </blockquote>
              <div className="home__testimonial-meta">
                <span className="home__testimonial-author">{t.author}</span>
                <span className="home__testimonial-sep">·</span>
                <span className="home__testimonial-role">{t.role}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="home__dots">
          {list.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              aria-label={"Testimonianza " + (i + 1)}
              className={"home__dot" + (i === idx ? " is-active" : "")}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default HomeScreen;
