// Real menu — Pizzeria Grani Antichi (Mogliano Veneto).
// Source: https://www.pizzeriagraniantichi.it/le-nostre-pizze-a-mogliano-veneto
//
// Shaped to the Product model. Images point at /img/pizzas/<slug>.jpg; those
// files need not exist — ProductImage falls back to the pizza-plate placeholder
// and will pick up real photos automatically if dropped in at those paths.

const DOUGH_VARIANTS = [
  { name: "Low Carb", price: 2.5 },
  { name: "Integrale", price: 2.0 },
  { name: "Senatore Cappelli Bio", price: 2.0 },
  { name: "Multicereali", price: 2.0 },
];

// A small shared set of add-ons so the product customization UI is usable.
const COMMON_TOPPINGS = [
  { name: "Mozzarella extra", price: 1.5 },
  { name: "Bufala DOP", price: 2.5 },
  { name: "Crudo di Parma", price: 3.0 },
  { name: "Funghi", price: 1.5 },
  { name: "Olive taggiasche", price: 1.0 },
  { name: "Acciughe del Cantabrico", price: 2.0 },
];

const slug = (s) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

// [name, description (ingredients), price]
const MENU = [
  ["O Fiore Mio", "Mozzarella fior di latte, acciughe del Mar Cantabrico, burratina artigianale, fiori di zucca, origano di Pantelleria IGP", 13.5],
  ["Royal", "Mozzarella fior di latte, funghi porcini, crudo di Parma 24 mesi, fiocchi di Grana Padano 24 mesi", 12.5],
  ["Marinara", "Salsa di pomodoro, origano di Pantelleria, aglio bianco Polesano DOP", 6.5],
  ["Fresca", "Salsa di pomodoro, mozzarella fior di latte, bufala DOP, pomodorini freschi", 9.5],
  ["Margherita DOP", "Pomodoro miracolo di San Gennaro (Presidio Slow Food), fior di latte di Agerola, olio EVO, basilico, origano di Pantelleria", 8.0],
  ["Mediterranea", "Doppio pomodoro, bufala DOP, pomodori confit, olive taggiasche, origano di Pantelleria", 10.5],
  ["Zingara", "Salsa di pomodoro, mozzarella fior di latte, peperoni, olive nere, salamino piccante", 10.5],
  ["Siciliana", "Salsa di pomodoro, mozzarella fior di latte, capperi di Pantelleria IGP, acciughe del Mar Cantabrico, olive nere, salamino", 11.0],
  ["Friarielli e Salsiccia", "Mozzarella fior di latte, salsiccia, friarielli", 10.5],
  ["Piccantina", "Mozzarella fior di latte, friarielli, salamino piccante, acciughe del Mar Cantabrico", 11.5],
  ["Greca", "Doppio pomodoro, feta greca, cipolla caramellata, pomodorini, olive taggiasche, origano di Pantelleria", 10.5],
  ["Mortadella", "Mozzarella fior di latte, mortadella di Prato IGP Presidio Slow Food, burratina artigianale, granella di pistacchio di Bronte DOP", 13.5],
  ["Gustosa", "Salsa di pomodoro, mozzarella fior di latte, capperi di Pantelleria IGP, acciughe del Cantabrico, olive nere, pomodorini freschi", 11.0],
  ["Capricciosa", "Salsa di pomodoro, mozzarella fior di latte, prosciutto cotto, funghi, carciofi", 10.5],
  ["Carbonara", "Salsa di pomodoro, mozzarella fior di latte, pancetta affumicata, uovo, grana", 10.0],
  ["Porcellina", "Salsa di pomodoro, mozzarella fior di latte, würstel, prosciutto cotto, salsiccia, salamino piccante", 11.5],
  ["Zermanina", "Salsa di pomodoro, mozzarella fior di latte, scamorza, melanzane, crudo di Parma", 11.5],
  ["Mirada", "Mozzarella fior di latte, gamberoni, burrata, pomodorini confit", 15.0],
  ["Tirolese", "Salsa di pomodoro, mozzarella fior di latte, porcini, speck Alto Adige", 10.5],
  ["Valtellina", "Salsa di pomodoro, mozzarella fior di latte, bresaola, rucola, grana", 11.0],
  ["Chiodini e Sopressa", "Salsa di pomodoro, mozzarella fior di latte, chiodini, sopressa", 10.5],
  ["Sottobosco", "Salsa di pomodoro, mozzarella fior di latte, chiodini, porcini, trifolati", 11.0],
  ["Verdure", "Salsa di pomodoro, mozzarella fior di latte, zucchine, melanzane, peperoni", 10.0],
  ["Rustica", "Scamorza, mozzarella fior di latte, salsiccia, patate, cipolla di Tropea", 11.5],
  ["Cacio e Pere", "Mozzarella fior di latte, brie, scamorza, gorgonzola, cipolla di Tropea, pere kaiser, pepe bianco", 11.5],
  ["Saporita", "Mozzarella fior di latte, crema di carciofi, cotto alla brace, ricotta affumicata a scaglie", 11.5],
  ["Parma", "Mozzarella fior di latte, bufala, pomodorini freschi, crudo di Parma", 11.5],
  ["Claudia", "Ricotta, pancetta affumicata, pomodorini freschi, bufala DOP, olive taggiasche, origano di Pantelleria", 11.5],
  ["Casper", "Mozzarella fior di latte, stracchino, zucchine, speck", 11.0],
  ["Alpino", "Mozzarella fior di latte, misto di funghi, speck Alto Adige, origano di Pantelleria", 11.5],
];

const pizzas = MENU.map(([name, description, price]) => ({
  name,
  img: `/img/pizzas/${slug(name)}.jpg`,
  brand: "Grani Antichi",
  category: "Pizza",
  description,
  price,
  countInStock: 99,
  rating: 0,
  numReviews: 0,
  toppings: COMMON_TOPPINGS,
  doughVariants: DOUGH_VARIANTS,
}));

export default pizzas;
