import React from "react";
import { useTranslation } from "react-i18next";
import Icon from "./Icon";
import { HOURS, CONTACT } from "../content";
import usePublicSettings from "./usePublicSettings";
import "./Footer.scss";

// Map the settings document into the shapes this footer already renders, falling
// back to the static content constants until settings load (or if the fetch fails).
const toHoursRows = (settings, t) =>
  settings
    ? settings.hours.map((d) => [d.day, d.closed ? t("footer.closed") : `${d.open} — ${d.close}`])
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
  const { t } = useTranslation();
  const settings = usePublicSettings();
  const hours = toHoursRows(settings, t);
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
          <p className="it footer__blurb">{t("footer.blurb")}</p>
        </div>

        <div>
          <div className="eyebrow footer__col-title">{t("footer.hours")}</div>
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
          <div className="eyebrow footer__col-title">{t("footer.contact")}</div>
          <div className="footer__contact">
            <div className="footer__contact-strong">{contact.street}</div>
            {contact.city && <div>{contact.city}</div>}
            <div className="footer__contact-gap">{contact.phone}</div>
            <div>{contact.email}</div>
            <div className="footer__contact-social">{contact.instagram}</div>
          </div>
        </div>

        <div>
          <div className="eyebrow footer__col-title">{t("footer.newsletter")}</div>
          <p className="footer__news-copy">{t("footer.newsletterCopy")}</p>
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
          <span>{t("footer.privacy")}</span>
          <span>{t("footer.cookies")}</span>
          <span>{t("footer.allergens")}</span>
        </div>
      </div>
    </div>
  </footer>
  );
};

export default Footer;
