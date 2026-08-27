// Minimal backend i18n for the handful of client-facing strings (checkout
// errors, the confirmation email). Mirrors the frontend's i18next API surface —
// t(locale, "dot.key", { vars }) with {{var}} interpolation — without pulling
// the full library in for a dozen strings. Italian is the base/fallback locale.

const resources = {
  it: {
    order: {
      slotFull: "Questo orario di consegna è al completo. Scegli un altro orario.",
    },
    email: {
      subject: "Conferma ordine #{{id}} — Pizzeria Grani Antichi",
      greeting: "Grazie per il tuo ordine, {{name}}!",
      customer: "cliente",
      orderNo: "Ordine #{{id}}",
      pickup: "Ritiro in pizzeria {{when}}",
      delivery: "Consegna a {{address}} {{when}}",
      asap: "il prima possibile",
      at: "alle",
      discount: "Sconto: -{{amount}}",
      total: "Totale: {{amount}}",
      closing: "Ti avviseremo quando l'ordine sarà in preparazione.",
    },
  },
  en: {
    order: {
      slotFull: "This delivery slot is fully booked. Please choose another time.",
    },
    email: {
      subject: "Order confirmation #{{id}} — Pizzeria Grani Antichi",
      greeting: "Thank you for your order, {{name}}!",
      customer: "customer",
      orderNo: "Order #{{id}}",
      pickup: "Pickup at the pizzeria {{when}}",
      delivery: "Delivery to {{address}} {{when}}",
      asap: "as soon as possible",
      at: "at",
      discount: "Discount: -{{amount}}",
      total: "Total: {{amount}}",
      closing: "We'll let you know when your order is being prepared.",
    },
  },
};

export const SUPPORTED_LOCALES = Object.keys(resources);
const DEFAULT_LOCALE = "it";

/** "en-US,en;q=0.9" → "en"; anything unsupported → "it". */
export const localeFromReq = (req) => {
  const raw = (req.headers?.["accept-language"] || "").split(",")[0].trim();
  const lang = raw.slice(0, 2).toLowerCase();
  return SUPPORTED_LOCALES.includes(lang) ? lang : DEFAULT_LOCALE;
};

/** Translate a dot-path key with {{var}} interpolation. */
export const t = (locale, key, vars = {}) => {
  const lang = SUPPORTED_LOCALES.includes(locale) ? locale : DEFAULT_LOCALE;
  const template =
    key.split(".").reduce((node, part) => node?.[part], resources[lang]) ??
    key.split(".").reduce((node, part) => node?.[part], resources[DEFAULT_LOCALE]);
  if (typeof template !== "string") return key;
  return template.replace(/\{\{(\w+)\}\}/g, (_, name) =>
    vars[name] !== undefined ? String(vars[name]) : ""
  );
};
