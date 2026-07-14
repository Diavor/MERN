// Default site settings — the single source of truth for the Impostazioni
// singleton. Both the seeder and the Setting model's schema defaults consume
// this object, so a fresh database (upsert-on-read) and a seeded one show the
// same real business information.
const settings = {
  restaurant: {
    name: "Pizzeria Grani Antichi",
    vat: "12345678901",
    address: "Via Antonio Canova, 23, 31021 Mogliano Veneto",
    phone: "+39 339 865 7277",
    email: "info@pizzeriagraniantichi.it",
  },
  hours: [
    { day: "Lunedì", closed: true, open: "18:00", close: "22:00" },
    { day: "Martedì", closed: false, open: "18:00", close: "22:00" },
    { day: "Mercoledì", closed: false, open: "18:00", close: "22:00" },
    { day: "Giovedì", closed: false, open: "18:00", close: "22:00" },
    { day: "Venerdì", closed: false, open: "18:00", close: "22:00" },
    { day: "Sabato", closed: false, open: "18:00", close: "22:00" },
    { day: "Domenica", closed: false, open: "18:00", close: "22:00" },
  ],
  payments: {
    stripe: true,
    apple: true,
    google: true,
    cash: "pickup",
  },
  notifications: {
    emailNewOrders: true,
    smsRider: true,
    pushCustomer: true,
    dailySummary: "08:00",
  },
};

export default settings;
