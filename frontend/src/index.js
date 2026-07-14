import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import store from "./store/store";
import "./api/axiosConfig"; // installs the 401 → refresh interceptor (side effect)
import "./styles/theme.css"; // Tailwind entry + design-token bridge (load first)
import "./styles/brace.scss"; // Grani Antichi base + shared primitives
import App from "./App";

ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById("root")
);
