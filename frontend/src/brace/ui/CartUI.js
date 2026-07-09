import React, { createContext, useContext, useState } from "react";

// UI-only cart state (drawer visibility). Cart contents live in Redux.
const CartUICtx = createContext({ open: false, setOpen: () => {} });
export const useCartUI = () => useContext(CartUICtx);

export function CartUIProvider({ children }) {
  const [open, setOpen] = useState(false);
  return (
    <CartUICtx.Provider value={{ open, setOpen }}>
      {children}
    </CartUICtx.Provider>
  );
}
