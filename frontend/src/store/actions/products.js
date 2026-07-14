import * as actionTypes from "../actionTypes";
import axios from "axios";
export const listProducts = (keyword = "", pageNumber = "", category = "") => async (
  dispatch
) => {
  try {
    dispatch({ type: actionTypes.PRODUCT_LIST_REQUEST });

    const params = new URLSearchParams();
    if (keyword) params.set("keyword", keyword);
    if (pageNumber) params.set("pageNumber", pageNumber);
    if (category && category !== "all") params.set("category", category);

    const { data } = await axios.get(`/api/products?${params.toString()}`);
    dispatch({
      type: actionTypes.PRODUCT_LIST_SUCCESS,
      payload: data,
    });
  } catch (error) {
    dispatch({
      type: actionTypes.PRODUCT_LIST_FAIL,
      payload:
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message,
    });
  }
};

export const listTopProducts = () => async (dispatch) => {
  try {
    dispatch({ type: actionTypes.PRODUCT_TOP_REQUEST });

    const { data } = await axios.get(`/api/products/top`);
    dispatch({
      type: actionTypes.PRODUCT_TOP_SUCCESS,
      payload: data,
    });
  } catch (error) {
    dispatch({
      type: actionTypes.PRODUCT_TOP_FAIL,
      payload:
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message,
    });
  }
};
