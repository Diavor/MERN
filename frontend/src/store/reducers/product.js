import * as actionTypes from "../actionTypes";
export const productDetails = (
  state = { product: { reviews: [] } },
  action
) => {
  switch (action.type) {
    case actionTypes.PRODUCT_REQUEST:
      return { ...state, loading: true };
    case actionTypes.PRODUCT_SUCCESS:
      return { loading: false, product: action.payload };
    case actionTypes.PRODUCT_FAIL:
      return { loading: false, error: action.payload };
    default:
      return state;
  }
};
