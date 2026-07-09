import axios from "axios";
import store from "../store/store";
import * as actionTypes from "../store/actionTypes";

// Transparent access-token refresh.
//
// Access tokens are short-lived (15 min). When a request comes back 401, we try
// once to rotate the httpOnly refresh cookie into a new access token, update the
// persisted session, and replay the original request. Concurrent 401s share a
// single in-flight refresh. If the refresh itself fails, we log out.
//
// This installs on the default axios instance, so every existing thunk (which
// imports the same singleton) benefits without any change.

let refreshing = null;

// Don't attempt a refresh for the auth endpoints themselves (avoids recursion):
// login, the refresh call, and register (POST /api/users).
const shouldSkipRefresh = (url = "") =>
  url.includes("/api/users/login") ||
  url.includes("/api/users/refresh") ||
  url === "/api/users";

axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config || {};
    const status = error.response?.status;

    if (status !== 401 || original.__isRetry || shouldSkipRefresh(original.url)) {
      return Promise.reject(error);
    }

    try {
      if (!refreshing) {
        refreshing = axios
          .post("/api/users/refresh", {}, { withCredentials: true })
          .finally(() => {
            refreshing = null;
          });
      }
      const { data } = await refreshing;

      // Keep Redux + localStorage in sync so later thunks read the new token.
      localStorage.setItem("userInfo", JSON.stringify(data));
      store.dispatch({ type: actionTypes.USER_LOGIN_SUCCES, payload: data });

      original.__isRetry = true;
      original.headers = {
        ...original.headers,
        Authorization: `Bearer ${data.token}`,
      };
      return axios(original);
    } catch (refreshError) {
      // Refresh failed → session is gone. Drop it and let the UI redirect.
      localStorage.removeItem("userInfo");
      store.dispatch({ type: actionTypes.USER_LOGOUT });
      return Promise.reject(error);
    }
  }
);

export default axios;
