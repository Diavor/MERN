// Static site content for BRÀCE (from the design) + real business data.

// Real delivery zones (moved out of CheckoutScreen.js) — Mogliano Veneto area.
export const DELIVERY_ZONES = [
  { city: "Mogliano Veneto", price: 2.5 },
  { city: "Zerman", price: 2.5 },
  { city: "Preganziol", price: 3.0 },
  { city: "Campocroce", price: 3.0 },
  { city: "Conscio", price: 3.0 },
  { city: "Gaggio", price: 3.0 },
  { city: "Marcon", price: 3.0 },
  { city: "Lughignano", price: 3.0 },
  { city: "San Liberale", price: 3.0 },
];

// Orders ≥ this amount ship free (matches CheckoutScreen logic).
export const FREE_DELIVERY_THRESHOLD = 39;

export const HOURS = [
  ["Lunedì", "Chiuso"],
  ["Martedì", "17:30 — 23:00"],
  ["Mercoledì", "17:30 — 23:00"],
  ["Giovedì", "17:30 — 23:00"],
  ["Venerdì", "17:30 — 00:00"],
  ["Sabato", "12:00 — 00:00"],
  ["Domenica", "12:00 — 22:00"],
];

export const TESTIMONIALS = [
  {
    quote:
      "The crust has a memory — fire, then flour, then milk. I've had pizza in Naples that didn't taste this Neapolitan.",
    author: "Marco Vitelli",
    role: "Gambero Rosso",
    rating: 5,
  },
  {
    quote:
      "A 72-hour ferment, a 90-second bake, and what arrives at your table is the closest thing to time travel a kitchen can offer.",
    author: "Eleanor Hughes",
    role: "Condé Nast Traveler",
    rating: 5,
  },
  {
    quote:
      "I came for the Margherita. I stayed because the Diavola is, quietly, the best pizza in the city.",
    author: "Daniel Kwon",
    role: "Resy 50",
    rating: 5,
  },
];

export const CONTACT = {
  street: "Via dei Forni 14",
  city: "31021 Mogliano Veneto (TV)",
  phone: "+39 041 550 8412",
  email: "ciao@brace.it",
  instagram: "@brace.pizzeria",
};
