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

export const userRegisterReducer = (state = {}, action) => {
  switch (action.type) {
    case actionTypes.USER_REGISTER_REQUEST:
      return { loading: true };
    case actionTypes.USER_REGISTER_SUCCES:
      return {
        loading: false,
        userInfo: action.payload,
      };
    case actionTypes.USER_REGISTER_FAIL:
      return { loading: false, error: action.payload };
    default:
      return state;
  }
};

export const userDetailsReducer = (state = { user: {} }, action) => {
  switch (action.type) {
    case actionTypes.USER_DETAILS_REQUEST:
      return { ...state, loading: true };
    case actionTypes.USER_DETAILS_SUCCES:
      return {
        loading: false,
        user: action.payload,
      };
    case actionTypes.USER_DETAILS_FAIL:
      return { loading: false, error: action.payload };
    case actionTypes.USER_DETAILS_RESET:
      return { user: {} };
    default:
      return state;
  }
};

export const userUpdateProfileReducer = (state = {}, action) => {
  switch (action.type) {
    case actionTypes.USER_UPDATE_REQUEST:
      return { loading: true };
    case actionTypes.USER_UPDATE_SUCCES:
      return {
        loading: false,
        success: true,
        userInfo: action.payload,
      };
    case actionTypes.USER_UPDATE_FAIL:
      return { loading: false, error: action.payload };
    case actionTypes.USER_UPDATE_RESET:
      return {};
    default:
      return state;
  }
};
