import * as actionTypes from "../actionTypes";

// Lines are matched by `key` (product + dough + toppings); older payloads
// without a key fall back to the product id.
const lineId = (i) => i.key || i.product;

export const cartReducer = (
  state = { cartItems: [], shippingAddress: {} },
  action
) => {
  switch (action.type) {
    case actionTypes.CART_ADD_ITEM: {
      const item = action.payload;
      const existItem = state.cartItems.find((i) => lineId(i) === lineId(item));

      if (existItem) {
        return {
          ...state,
          cartItems: state.cartItems.map((i) =>
            lineId(i) === lineId(existItem) ? item : i
          ),
        };
      }
      return {
        ...state,
        cartItems: [...state.cartItems, item],
      };
    }

    case actionTypes.CART_REMOVE_ITEM:
      return {
        ...state,
        cartItems: state.cartItems.filter((i) => lineId(i) !== action.payload),
      };

    case actionTypes.CART_CLEAR_ITEMS:
      return {
        ...state,
        cartItems: [],
      };

    case actionTypes.CART_SAVE_SHIPPING_ADDRESS:
      return {
        ...state,
        shippingAddress: action.payload,
      };

    case actionTypes.CART_SAVE_PAYMENT_METHOD:
      return {
        ...state,
        paymentMethod: action.payload,
      };
    default:
      return state;
  }
};
