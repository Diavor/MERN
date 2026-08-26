import env from "../config/env.js";
import logger from "../utils/logger.js";

// Order-confirmation email. The transport is a dev stub that logs the rendered
// message — swap `deliver` for nodemailer/SES/Resend when a real provider is
// configured; the job/queue plumbing doesn't change.

const euro = (n) => `€${Number(n || 0).toFixed(2)}`;

export const renderOrderConfirmation = (order) => {
  const items = (order.orderItems || [])
    .map((it) => {
      const toppings = it.toppings?.length
        ? ` (+ ${it.toppings.map((t) => t.name).join(", ")})`
        : "";
      return `  ${it.qty}× ${it.name}${toppings} — ${euro(it.price * it.qty)}`;
    })
    .join("\n");

  const addr = order.shippingAddress || {};
  const isPickup = addr.orderType === "pickup";
  const when =
    addr.deliveryDate && addr.deliverySlot
      ? `${addr.deliveryDate} alle ${addr.deliverySlot}`
      : "il prima possibile";

  const shortId = String(order._id).slice(-6).toUpperCase();

  return {
    subject: `Conferma ordine #${shortId} — Pizzeria Grani Antichi`,
    text: [
      `Grazie per il tuo ordine, ${addr.name || "cliente"}!`,
      "",
      `Ordine #${shortId}`,
      isPickup ? `Ritiro in pizzeria ${when}` : `Consegna a ${addr.address || ""}, ${addr.city || ""} ${when}`,
      "",
      items,
      "",
      order.discountPrice > 0 ? `Sconto: -${euro(order.discountPrice)}` : null,
      `Totale: ${euro(order.totalPrice)}`,
      "",
      "Ti avviseremo quando l'ordine sarà in preparazione.",
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
export const sendOrderConfirmation = async ({ order }) => {
  const to = order?.shippingAddress?.email;
  if (!to) {
    logger.debug({ orderId: order?._id }, "Order has no email — skipping confirmation");
    return;
  }
  const { subject, text } = renderOrderConfirmation(order);
  await deliver({ to, subject, text });
};
