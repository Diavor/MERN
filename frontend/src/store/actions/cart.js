import axios from "axios";
import * as actionTypes from "../actionTypes";
export const addToCart = (id, qty, selectedToppings = [], selectedDough = null) => async (dispatch, getState) => {
  const { data } = await axios.get(`/api/products/${id}`);

  const toppingsTotal = selectedToppings.reduce((acc, t) => acc + t.price, 0);
  const doughExtra = selectedDough ? selectedDough.price : 0;

  dispatch({
    type: actionTypes.CART_ADD_ITEM,
    payload: {
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
      qty,
    },
  });
  localStorage.setItem("cartItems", JSON.stringify(getState().cart.cartItems));
};

export const removeCart = (id) => (dispatch, getState) => {
  dispatch({
    type: actionTypes.CART_REMOVE_ITEM,
    payload: id,
  });
  localStorage.setItem("cartItems", JSON.stringify(getState().cart.cartItems));
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
