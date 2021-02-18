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

export const productDeleteReducer = (state = {}, action) => {
  switch (action.type) {
    case actionTypes.PRODUCT_DELETE_REQUEST:
      return { loading: true };
    case actionTypes.PRODUCT_DELETE_SUCCESS:
      return { loading: false, success: true };
    case actionTypes.PRODUCT_DELETE_FAIL:
      return { loading: false, error: action.payload };
    default:
      return state;
  }
};

export const productCreateReducer = (state = {}, action) => {
  switch (action.type) {
    case actionTypes.PRODUCT_CREATE_REQUEST:
      return { loading: true };
    case actionTypes.PRODUCT_CREATE_SUCCESS:
      return { loading: false, success: true, product: action.payload };
    case actionTypes.PRODUCT_CREATE_FAIL:
      return { loading: false, error: action.payload };
    case actionTypes.PRODUCT_CREATE_RESET:
      return {};
    default:
      return state;
  }
};

export const productUpdateReducer = (state = { product: {} }, action) => {
  switch (action.type) {
    case actionTypes.PRODUCT_UPDATE_REQUEST:
      return { loading: true };
    case actionTypes.PRODUCT_UPDATE_SUCCESS:
      return { loading: false, success: true, product: action.payload };
    case actionTypes.PRODUCT_UPDATE_FAIL:
      return { loading: false, error: action.payload };
    case actionTypes.PRODUCT_UPDATE_RESET:
      return { product: {} };
    default:
      return state;
  }
};
