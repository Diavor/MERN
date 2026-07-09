import React from "react";
// Bootstrap CSS is imported ONLY here so it lands in this lazily-loaded chunk
// and never touches the main BRÀCE bundle. The /order-pizza widget keeps its
// original react-bootstrap look.
import "../bootstrap.min.css";
import { Container } from "react-bootstrap";
import PizzaOrderScreen from "./PizzaOrderScreen";

const PizzaOrderStandalone = (props) => (
  <div style={{ paddingTop: 110 }}>
    <Container className="py-3">
      <PizzaOrderScreen {...props} />
    </Container>
  </div>
);

export default PizzaOrderStandalone;
