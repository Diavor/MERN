import React from "react";
import { Card } from "react-bootstrap";

const Product = ({ product }) => {
  return (
    <Card className="my-3 p-3 rounded">
      <a href={`/product/${product._id}`}>
        {/* <Card.Img src={product.img} variant="top" /> */}
        <h1>{product.brand}</h1>
      </a>
    </Card>
  );
};

export default Product;
