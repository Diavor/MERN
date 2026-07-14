import React from "react";
import Icon from "./Icon";
import { HOURS, CONTACT } from "../content";
import usePublicSettings from "./usePublicSettings";
import "./Footer.scss";

// Map the settings document into the shapes this footer already renders, falling
// back to the static content constants until settings load (or if the fetch fails).
const toHoursRows = (settings) =>
  settings
    ? settings.hours.map((d) => [d.day, d.closed ? "Chiuso" : `${d.open} — ${d.close}`])
    : HOURS;

const toContact = (settings) =>
  settings
    ? {
        street: settings.restaurant.address,
        city: "", // address is a single line in settings; no separate city row
        phone: settings.restaurant.phone,
        email: settings.restaurant.email,
        instagram: CONTACT.instagram, // not part of settings; keep brand social
      }
    : CONTACT;

const Footer = () => {
  const settings = usePublicSettings();
  const hours = toHoursRows(settings);
  const contact = toContact(settings);

  return (
  <footer className="footer">
    <div className="b-container">
      <div className="footer__grid">
        <div>
          <div className="footer__brand">
            <img
              src="/logo-grani-antichi.svg"
              alt="Pizzeria Grani Antichi"
              className="footer__logo"
              width={150}
              height={63}
            />
          </div>
          <p className="it footer__blurb">
            Sforniamo pizze di qualità dal 2017. Un locale open space vista
            cucina, a Mogliano Veneto.
          </p>
        </div>

        <div>
          <div className="eyebrow footer__col-title">Orari</div>
          <ul className="footer__hours">
            {hours.map(([day, range]) => (
              <li key={day} className="footer__hours-row">
                <span>{day}</span>
                <span>{range}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="eyebrow footer__col-title">Contatto</div>
          <div className="footer__contact">
            <div className="footer__contact-strong">{contact.street}</div>
            {contact.city && <div>{contact.city}</div>}
            <div className="footer__contact-gap">{contact.phone}</div>
            <div>{contact.email}</div>
            <div className="footer__contact-social">{contact.instagram}</div>
          </div>
        </div>

        <div>
          <div className="eyebrow footer__col-title">Newsletter</div>
          <p className="footer__news-copy">
            Stagionali e dropping menu, una mail al mese. Niente di più.
          </p>
          <form
            className="footer__news-form"
            onSubmit={(e) => e.preventDefault()}
          >
            <input
              className="footer__news-input"
              placeholder="email@cucina.it"
            />
            <button type="submit" className="footer__news-submit">
              <Icon.arrow />
            </button>
          </form>
        </div>
      </div>

      <div className="hr" />
      <div className="footer__legal">
        <div>© {new Date().getFullYear()} Grani Antichi Pizzeria — Mogliano Veneto</div>
        <div className="footer__legal-links">
          <span>Privacy</span>
          <span>Cookies</span>
          <span>Allergeni</span>
        </div>
      </div>
    </div>
  </footer>
  );
};

export default Footer;
