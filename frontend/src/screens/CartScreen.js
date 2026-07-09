import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { addToCart } from "../store/actions/cart";
import { useCartUI } from "../brace/ui/CartUI";

// Compatibility shim for the legacy `/cart/:id?qty=N` add-to-cart deep link.
// The cart now lives in the slide-over drawer, so this component just performs
// the add (if an id is present), opens the drawer and bounces to the menu.
const CartScreen = ({ match, location, history }) => {
  const dispatch = useDispatch();
  const cartUI = useCartUI();

  const productId = match.params.id;
  const qty = location.search
    ? Number(new URLSearchParams(location.search).get("qty")) || 1
    : 1;

  useEffect(() => {
    if (productId) dispatch(addToCart(productId, qty, [], null));
    cartUI.setOpen(true);
    history.replace("/menu");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
};

export default CartScreen;
