import * as actionTypes from "../actionTypes";

export const userLoginReducer = (state = {}, action) => {
  switch (action.type) {
    case actionTypes.USER_LOGIN_REQUEST:
      return { loading: true, users: [] };
    case actionTypes.USER_LOGIN_SUCCES:
      return {
        loading: false,
        userInfo: action.payload,
      };
    case actionTypes.USER_LOGIN_FAIL:
      return { loading: false, error: action.payload };
    case actionTypes.USER_LOGOUT:
      return {};

    default:
      return state;
  }
};
