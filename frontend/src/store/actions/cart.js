import axios from "axios";
import * as actionTypes from "../actionTypes";

// A cart line is identified by product + dough + toppings so the same pizza
// with different configurations can coexist in the cart.
export const cartItemKey = (productId, selectedDough, toppings = []) =>
  [
    productId,
    selectedDough ? selectedDough.name : "",
    toppings
      .map((t) => t.name)
      .sort()
      .join(","),
  ].join("|");

export const addToCart = (id, qty, selectedToppings = [], selectedDough = null) => async (dispatch, getState) => {
  const { data } = await axios.get(`/api/products/${id}`);

  const toppingsTotal = selectedToppings.reduce((acc, t) => acc + t.price, 0);
  const doughExtra = selectedDough ? selectedDough.price : 0;
  const key = cartItemKey(data._id, selectedDough, selectedToppings);

  // Adding the same configuration again increases the quantity.
  const existing = getState().cart.cartItems.find(
    (i) => (i.key || i.product) === key
  );

  dispatch({
    type: actionTypes.CART_ADD_ITEM,
    payload: {
      key,
      product: data._id,
      name: data.name,
      image: data.img,
      price: data.price + toppingsTotal + doughExtra,
      basePrice: data.price,
      toppings: selectedToppings,
      availableToppings: data.toppings || [],
      selectedDough,
      availableDoughVariants: data.doughVariants || [],
      countInStock: data.countInStock,
      qty: qty + (existing ? existing.qty : 0),
    },
  });
  localStorage.setItem("cartItems", JSON.stringify(getState().cart.cartItems));
};

// Set an absolute quantity on an existing line (qty <= 0 removes it).
export const updateCartQty = (item, qty) => (dispatch, getState) => {
  if (qty <= 0) {
    dispatch({
      type: actionTypes.CART_REMOVE_ITEM,
      payload: item.key || item.product,
    });
  } else {
    dispatch({
      type: actionTypes.CART_ADD_ITEM,
      payload: { ...item, key: item.key || item.product, qty },
    });
  }
  localStorage.setItem("cartItems", JSON.stringify(getState().cart.cartItems));
};

export const removeCart = (key) => (dispatch, getState) => {
  dispatch({
    type: actionTypes.CART_REMOVE_ITEM,
    payload: key,
  });
  localStorage.setItem("cartItems", JSON.stringify(getState().cart.cartItems));
};

export const clearCart = () => (dispatch) => {
  dispatch({ type: actionTypes.CART_CLEAR_ITEMS });
  localStorage.removeItem("cartItems");
};

export const saveShippingAddress = (data) => (dispatch) => {
  dispatch({
    type: actionTypes.CART_SAVE_SHIPPING_ADDRESS,
    payload: data,
  });
  localStorage.setItem("shippingAddress", JSON.stringify(data));
};

export const savePaymentMethod = (data) => (dispatch) => {
  dispatch({
    type: actionTypes.CART_SAVE_PAYMENT_METHOD,
    payload: data,
  });
  localStorage.setItem("paymentMethod", JSON.stringify(data));
};
