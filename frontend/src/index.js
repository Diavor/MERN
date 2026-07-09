import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import store from "./store/store";
import "./api/axiosConfig"; // installs the 401 → refresh interceptor (side effect)
import "./index.css";
import "./brace/brace.css";
import App from "./App";

ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById("root")
);
