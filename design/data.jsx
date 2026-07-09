// Menu / testimonial / order data for BRÀCE

const PIZZAS = [
  {
    id: "margherita-dop",
    name: "Margherita D.O.P.",
    category: "classic",
    tagline: "The one that started everything.",
    price: 14,
    badge: "Signature",
    crustTone: "warm",
    ingredients: [
      "San Marzano D.O.P. tomato",
      "Fior di latte",
      "Buffalo mozzarella",
      "Genovese basil",
      "Sicilian EVOO, sea salt",
    ],
    allergens: ["Gluten", "Dairy"],
    nutrition: { kcal: 820, p: 31, c: 96, f: 28 },
    story: "Naples, 1889. Three colors on a plate. We do nothing to it that hasn't been done for 130 years — and that is exactly the point.",
  },
  {
    id: "diavola-nera",
    name: "Diavola Nera",
    category: "classic",
    tagline: "Slow heat. Then the kick.",
    price: 17,
    crustTone: "char",
    ingredients: [
      "San Marzano D.O.P.",
      "Fior di latte",
      "Spianata Calabrese piccante",
      "Calabrian chili honey",
      "Wild oregano",
    ],
    allergens: ["Gluten", "Dairy"],
    nutrition: { kcal: 940, p: 38, c: 91, f: 41 },
    story: "Our nduja is cured for 90 days in Calabria. The honey we lace it with is from bees that work the bergamot groves outside Reggio.",
  },
  {
    id: "tartufo-bianco",
    name: "Tartufo Bianco",
    category: "gourmet",
    tagline: "Alba truffle, in season.",
    price: 32,
    badge: "Tartufo",
    crustTone: "pale",
    ingredients: [
      "Fior di latte cream",
      "Robiola di Roccaverano",
      "Shaved Alba white truffle (3g)",
      "Acacia honey",
      "Black pepper",
    ],
    allergens: ["Gluten", "Dairy"],
    nutrition: { kcal: 1020, p: 36, c: 88, f: 56 },
    story: "We shave the truffle table-side. Eat within four minutes — the aroma volatiles dissipate at 12% per minute above 35°C.",
  },
  {
    id: "porcini-anatra",
    name: "Porcini & Anatra",
    category: "gourmet",
    tagline: "Wild mushroom, confit duck.",
    price: 24,
    crustTone: "warm",
    ingredients: [
      "Roasted porcini",
      "Confit duck leg",
      "Taleggio",
      "Fior di latte",
      "Saba reduction, thyme",
    ],
    allergens: ["Gluten", "Dairy"],
    nutrition: { kcal: 990, p: 44, c: 86, f: 47 },
    story: "Duck legs cured 36 hours in salt, garlic, juniper. Confit slowly in their own fat. We use the rendered drippings to gloss the crust.",
  },
  {
    id: "bianca-romana",
    name: "Bianca Romana",
    category: "white",
    tagline: "No tomato. No apology.",
    price: 16,
    crustTone: "pale",
    ingredients: [
      "Ricotta di bufala",
      "Fior di latte",
      "Lemon zest",
      "Rosemary, garlic confit",
      "Maldon salt",
    ],
    allergens: ["Gluten", "Dairy"],
    nutrition: { kcal: 870, p: 33, c: 90, f: 34 },
    story: "The original Roman pizza, pre-tomato. We confit the garlic in olive oil for six hours so it turns sweet and spreadable.",
  },
  {
    id: "cacio-pepe",
    name: "Cacio e Pepe",
    category: "white",
    tagline: "Three ingredients. Done correctly.",
    price: 18,
    crustTone: "pale",
    ingredients: [
      "Pecorino Romano D.O.P.",
      "Tellicherry black pepper, cracked",
      "Fior di latte cream",
      "Finishing EVOO",
    ],
    allergens: ["Gluten", "Dairy"],
    nutrition: { kcal: 910, p: 40, c: 86, f: 39 },
    story: "Pecorino aged 18 months at 1,400m altitude in Lazio. The pepper is toasted and cracked to order — never pre-ground.",
  },
  {
    id: "fico-prosciutto",
    name: "Fico & Prosciutto",
    category: "seasonal",
    tagline: "Late summer, on a plate.",
    price: 22,
    badge: "Stagionale",
    crustTone: "warm",
    ingredients: [
      "Fior di latte",
      "Prosciutto di Parma 24m",
      "Black mission fig",
      "Gorgonzola dolce drizzle",
      "Wild arugula",
    ],
    allergens: ["Gluten", "Dairy"],
    nutrition: { kcal: 950, p: 42, c: 89, f: 42 },
    story: "Available August through October only. The figs come from a single grove in Cilento — we get whatever ripens that week.",
  },
  {
    id: "zucca-salvia",
    name: "Zucca & Salvia",
    category: "seasonal",
    tagline: "Roasted squash, brown butter sage.",
    price: 20,
    badge: "Stagionale",
    crustTone: "warm",
    ingredients: [
      "Roasted delica squash",
      "Brown butter, crispy sage",
      "Fior di latte",
      "Amaretti crumble",
      "Aged balsamic",
    ],
    allergens: ["Gluten", "Dairy", "Nuts"],
    nutrition: { kcal: 880, p: 28, c: 102, f: 38 },
    story: "Autumn only. We brown the butter until the milk solids hit deep walnut, then crisp whole sage leaves in it before they land on the pizza.",
  },
];

const DRINKS = [
  { id: "negroni", name: "Negroni", category: "drinks", price: 14, ingredients: ["Campari", "Carpano Antica", "Plymouth Gin"], crustTone: "ember" },
  { id: "spritz", name: "Aperol Spritz", category: "drinks", price: 12, ingredients: ["Aperol", "Prosecco", "Soda, orange"], crustTone: "ember" },
  { id: "barolo", name: "Barolo 2018", category: "drinks", price: 96, ingredients: ["Nebbiolo, Piemonte", "G.D. Vajra", "750ml"], crustTone: "wine" },
  { id: "san-pellegrino", name: "San Pellegrino", category: "drinks", price: 5, ingredients: ["750ml", "Italian sparkling"], crustTone: "water" },
];

const ALL_ITEMS = [...PIZZAS, ...DRINKS];

const VARIANTS = [
  { id: "12", label: "12″ Personale", priceDelta: 0 },
  { id: "14", label: "14″ Tavola", priceDelta: 4 },
  { id: "16", label: "16″ Famiglia", priceDelta: 8 },
];

const DOUGHS = [
  { id: "napoletana", label: "Napoletana", note: "72h cold ferment. Soft, blistered cornicione." },
  { id: "antica", label: "Antica grani", note: "Stone-milled heritage wheat. Earthier, denser." },
  { id: "senza", label: "Senza glutine", note: "Rice & buckwheat blend. +€3." },
];

const TESTIMONIALS = [
  { quote: "The crust has a memory — fire, then flour, then milk. I've had pizza in Naples that didn't taste this Neapolitan.", author: "Marco Vitelli", role: "Gambero Rosso", rating: 5 },
  { quote: "A 72-hour ferment, a 90-second bake, and what arrives at your table is the closest thing to time travel a kitchen can offer.", author: "Eleanor Hughes", role: "Condé Nast Traveler", rating: 5 },
  { quote: "I came for the Margherita. I stayed because the Diavola Nera is, quietly, the best pizza in the city.", author: "Daniel Kwon", role: "Resy 50", rating: 5 },
];

const HOURS = [
  ["Monday", "Closed"],
  ["Tuesday", "17:30 — 23:00"],
  ["Wednesday", "17:30 — 23:00"],
  ["Thursday", "17:30 — 23:00"],
  ["Friday", "17:30 — 00:00"],
  ["Saturday", "12:00 — 00:00"],
  ["Sunday", "12:00 — 22:00"],
];

const CATEGORIES = [
  { id: "all", label: "Tutto" },
  { id: "classic", label: "Classiche" },
  { id: "gourmet", label: "Gourmet" },
  { id: "white", label: "Bianche" },
  { id: "seasonal", label: "Stagionali" },
  { id: "drinks", label: "Bevande" },
];

const DELIVERY_ZONES = [
  { id: "centro",  label: "Centro storico",       sub: "Duomo · Brera · Quadrilatero",          fee: 3.00, eta: "12–18 min", radius: "1.5 km" },
  { id: "navigli", label: "Navigli · Tortona",    sub: "Naviglio Grande · Porta Genova",        fee: 4.50, eta: "15–22 min", radius: "2.0 km" },
  { id: "porta",   label: "Porta Romana",         sub: "Bocconi · Porta Vittoria",              fee: 5.50, eta: "20–28 min", radius: "2.5 km" },
  { id: "isola",   label: "Isola · Garibaldi",    sub: "Isola · Porta Nuova · Gae Aulenti",     fee: 5.50, eta: "20–28 min", radius: "2.5 km" },
  { id: "studi",   label: "Città Studi",          sub: "Politecnico · Lambrate",                fee: 6.50, eta: "25–35 min", radius: "3.0 km" },
  { id: "fuori",   label: "Fuori zona · Milano",  sub: "Oltre il raggio · su prenotazione",     fee: 8.00, eta: "35–45 min", radius: "5.0 km" },
];

// Time slots 18:00 → 21:00, step 15 min
const TIME_SLOTS = (() => {
  const slots = [];
  for (let h = 18; h <= 21; h++) {
    for (let m = 0; m < 60; m += 15) {
      if (h === 21 && m > 0) break;
      slots.push(String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0"));
    }
  }
  return slots;
})();

Object.assign(window, {
  PIZZAS, DRINKS, ALL_ITEMS, VARIANTS, DOUGHS, TESTIMONIALS, HOURS, CATEGORIES,
  DELIVERY_ZONES, TIME_SLOTS,
});
