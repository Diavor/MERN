import React from "react";
import "./Loader.scss";

// Drop-in replacement for the old Bootstrap spinner Loader
const Loader = () => (
  <div className="loader">
    <div className="loader__spinner" />
  </div>
);

export default Loader;
