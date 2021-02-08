import * as actionTypes from "../actionTypes";
import axios from "axios";
export const listProductDetails = (id) => async (dispatch) => {
  try {
    dispatch({ type: actionTypes.PRODUCT_REQUEST });
    const { data } = await axios.get(`/api/products/${id}`);

    dispatch({
      type: actionTypes.PRODUCT_SUCCESS,
      payload: data,
    });
  } catch (error) {
    dispatch({
      type: actionTypes.PRODUCT_FAIL,
      payload:
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message,
    });
  }
};
