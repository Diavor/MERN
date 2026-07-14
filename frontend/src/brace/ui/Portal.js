import { useState, useEffect } from "react";
import ReactDOM from "react-dom";

// Renders children into <body>, escaping any transformed / clipped ancestor
// (e.g. the `.b-rise` animation wrapper on our screens). A `position: fixed`
// descendant of a transformed element resolves against that element instead of
// the viewport, so every full-screen overlay/modal/drawer must portal out.
export default function Portal({ children }) {
  const [host] = useState(() => document.createElement("div"));

  useEffect(() => {
    host.className = "b-portal";
    document.body.appendChild(host);
    return () => {
      document.body.removeChild(host);
    };
  }, [host]);

  return ReactDOM.createPortal(children, host);
}
