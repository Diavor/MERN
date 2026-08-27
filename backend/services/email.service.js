import env from "../config/env.js";
import logger from "../utils/logger.js";
import { t } from "../utils/i18n.js";

// Order-confirmation email, localized (it/en — the locale is captured from the
// checkout request and travels with the job). The transport is a dev stub that
// logs the rendered message — swap `deliver` for nodemailer/SES/Resend when a
// real provider is configured; the job/queue plumbing doesn't change.

const euro = (n) => `€${Number(n || 0).toFixed(2)}`;

export const renderOrderConfirmation = (order, locale = "it") => {
  const items = (order.orderItems || [])
    .map((it) => {
      const toppings = it.toppings?.length
        ? ` (+ ${it.toppings.map((top) => top.name).join(", ")})`
        : "";
      return `  ${it.qty}× ${it.name}${toppings} — ${euro(it.price * it.qty)}`;
    })
    .join("\n");

  const addr = order.shippingAddress || {};
  const isPickup = addr.orderType === "pickup";
  const when =
    addr.deliveryDate && addr.deliverySlot
      ? `${addr.deliveryDate} ${t(locale, "email.at")} ${addr.deliverySlot}`
      : t(locale, "email.asap");

  const shortId = String(order._id).slice(-6).toUpperCase();
  const address = [addr.street, addr.buildingNumber, addr.city]
    .filter(Boolean)
    .join(" ");

  return {
    subject: t(locale, "email.subject", { id: shortId }),
    text: [
      t(locale, "email.greeting", { name: addr.name || t(locale, "email.customer") }),
      "",
      t(locale, "email.orderNo", { id: shortId }),
      isPickup
        ? t(locale, "email.pickup", { when })
        : t(locale, "email.delivery", { address, when }),
      "",
      items,
      "",
      order.discountPrice > 0
        ? t(locale, "email.discount", { amount: euro(order.discountPrice) })
        : null,
      t(locale, "email.total", { amount: euro(order.totalPrice) }),
      "",
      t(locale, "email.closing"),
      "Pizzeria Grani Antichi",
    ]
      .filter((l) => l !== null)
      .join("\n"),
  };
};

const deliver = async ({ to, subject, text }) => {
  // Dev transport: structured log stands in for an SMTP/API send.
  logger.info({ to, from: env.EMAIL_FROM, subject, body: text }, "Email delivered (dev transport)");
};

/** Job handler: send the confirmation for a freshly created order. */
export const sendOrderConfirmation = async ({ order, locale }) => {
  const to = order?.shippingAddress?.email;
  if (!to) {
    logger.debug({ orderId: order?._id }, "Order has no email — skipping confirmation");
    return;
  }
  const { subject, text } = renderOrderConfirmation(order, locale);
  await deliver({ to, subject, text });
};
