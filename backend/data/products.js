const DOUGH_VARIANTS = [
  { name: "Low Carb", price: 2.5 },
  { name: "Integrale", price: 2.0 },
  { name: "Senatore Cappelli Bio", price: 2.0 },
  { name: "Multicereali", price: 2.0 },
];

const products = [
  {
    name: "Margherita",
    img: "/img/pizza-margherita.jpg",
    description:
      "The classic Neapolitan pizza. San Marzano tomato sauce, fior di latte mozzarella, fresh basil, and extra virgin olive oil on a hand-stretched dough.",
    brand: "Pizzeria",
    category: "Pizza",
    price: 8.5,
    countInStock: 99,
    rating: 4.5,
    numReviews: 18,
    toppings: [
      { name: "Extra mozzarella", price: 1.5 },
      { name: "Prosciutto crudo", price: 2.5 },
      { name: "Mushrooms", price: 1.0 },
      { name: "Olives", price: 1.0 },
      { name: "Anchovies", price: 1.5 },
      { name: "Potatoes", price: 1.5 },
    ],
    doughVariants: DOUGH_VARIANTS,
  },
  {
    name: "Diavola",
    img: "/img/pizza-diavola.jpg",
    description:
      "For those who like it hot. Tomato sauce, mozzarella, and generous slices of spicy Calabrian salami, finished with a drizzle of chilli oil.",
    brand: "Pizzeria",
    category: "Pizza",
    price: 10.5,
    countInStock: 99,
    rating: 4.8,
    numReviews: 24,
    toppings: [
      { name: "Extra spicy salami", price: 2.0 },
      { name: "Extra mozzarella", price: 1.5 },
      { name: "Peppers", price: 1.0 },
      { name: "Olives", price: 1.0 },
      { name: "Mushrooms", price: 1.0 },
    ],
  },
  {
    name: "Quattro Stagioni",
    img: "/img/pizza-quattro-stagioni.jpg",
    description:
      "Four seasons in every bite. Tomato sauce, mozzarella, ham, mushrooms, artichokes, and black olives — each topping in its own quarter.",
    brand: "Pizzeria",
    category: "Pizza",
    price: 12.0,
    countInStock: 99,
    rating: 4.3,
    numReviews: 15,
    toppings: [
      { name: "Extra ham", price: 2.0 },
      { name: "Extra mozzarella", price: 1.5 },
      { name: "Prosciutto crudo", price: 2.5 },
      { name: "Anchovies", price: 1.5 },
    ],
  },
  {
    name: "Prosciutto e Funghi",
    img: "/img/pizza-prosciutto-funghi.jpg",
    description:
      "A timeless combination of cooked ham and fresh mushrooms on tomato sauce and stretchy mozzarella — simple, satisfying, and loved by all.",
    brand: "Pizzeria",
    category: "Pizza",
    price: 11.0,
    countInStock: 99,
    rating: 4.2,
    numReviews: 20,
    toppings: [
      { name: "Potatoes", price: 1.5 },
      { name: "Extra mushrooms", price: 1.0 },
      { name: "Extra mozzarella", price: 1.5 },
      { name: "Olives", price: 1.0 },
      { name: "Peppers", price: 1.0 },
    ],
  },
  {
    name: "Capricciosa",
    img: "/img/pizza-capricciosa.jpg",
    description:
      "A capricious mix of cooked ham, mushrooms, artichoke hearts, and black olives on a rich tomato and mozzarella base. Whimsical and generous.",
    brand: "Pizzeria",
    category: "Pizza",
    price: 12.5,
    countInStock: 99,
    rating: 4.6,
    numReviews: 30,
    toppings: [
      { name: "Prosciutto crudo", price: 2.5 },
      { name: "Extra mozzarella", price: 1.5 },
      { name: "Anchovies", price: 1.5 },
      { name: "Spicy salami", price: 2.0 },
      { name: "Potatoes", price: 1.5 },
    ],
  },
  {
    name: "Vegetariana",
    img: "/img/pizza-vegetariana.jpg",
    description:
      "Garden-fresh goodness. Tomato sauce, mozzarella, roasted peppers, zucchini, eggplant, cherry tomatoes, and a scattering of fresh basil.",
    brand: "Pizzeria",
    category: "Pizza",
    price: 10.0,
    countInStock: 99,
    rating: 4.0,
    numReviews: 12,
    toppings: [
      { name: "Extra mozzarella", price: 1.5 },
      { name: "Mushrooms", price: 1.0 },
      { name: "Olives", price: 1.0 },
      { name: "Artichokes", price: 1.5 },
      { name: "Potatoes", price: 1.5 },
    ],
  },
];

export default products;
