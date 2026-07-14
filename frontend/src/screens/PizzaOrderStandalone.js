import React, { useEffect } from "react";
import { Container } from "react-bootstrap";
import PizzaOrderScreen from "./PizzaOrderScreen";

// The Bootswatch/Bootstrap theme for the embeddable /order-pizza widget is a
// vendored file served from /public/vendor. It is injected as a <link> only when
// this lazily-loaded widget mounts, so it never enters the main Grani Antichi bundle and
// stays out of the Tailwind/PostCSS pipeline (its Google-Fonts @import trips the
// strict Tailwind v4 CSS parser).
const BOOTSTRAP_HREF = "/vendor/bootstrap.min.css";

const PizzaOrderStandalone = (props) => {
  useEffect(() => {
    if (document.querySelector(`link[href="${BOOTSTRAP_HREF}"]`)) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = BOOTSTRAP_HREF;
    link.dataset.widgetStyle = "bootstrap";
    document.head.appendChild(link);
  }, []);

  return (
    <div style={{ paddingTop: 110 }}>
      <Container className="py-3">
        <PizzaOrderScreen {...props} />
      </Container>
    </div>
  );
};

export default PizzaOrderStandalone;
