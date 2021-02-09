import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {
  Col,
  Image,
  ListGroup,
  Card,
  Button,
  Row,
  Form,
} from "react-bootstrap";
import Rating from "../components/Rating";
import Message from "../components/Message";
import Loader from "../components/Loader";
import { listProductDetails } from "../store/actions/product";
import { addToCart } from "../store/actions/cart";

const ProductScreen = ({ history, match }) => {
  const [qty, setQty] = useState(1);

  const dispatch = useDispatch();
  const { loading, error, product } = useSelector(
    (state) => state.productDetails
  );

  useEffect(() => {
    dispatch(listProductDetails(match.params.id));
  }, [match, dispatch]);

  // const addToCartHandler = () => {
  //   history.push(`/cart/${match.params.id}?qty=${qty}`);
  //   history.push("/cart");
  // };

  const addToCartHandler = () => {
    dispatch(addToCart(product._id, qty));
    history.push("/cart");
  };
  return (
    <>
      <Link className="btn btn-light my-3" to="/">
        Go Back
      </Link>
      {loading ? (
        <Loader />
      ) : error ? (
        <Message variant="danger">{error}</Message>
      ) : (
        <Row>
          <Col md={6} sm={4}>
            <Image src={product.img} alt={product.img} fluid />
          </Col>
          <Col md={3} sm={2}>
            <ListGroup variant="flush">
              <ListGroup.Item>
                <h3>{product.name}</h3>
              </ListGroup.Item>
              <ListGroup.Item>
                <Rating
                  value={product.rating}
                  text={`${product.numReviews} reviews`}
                />
              </ListGroup.Item>
              <ListGroup.Item>Price: ${product.price}</ListGroup.Item>
              <ListGroup.Item>
                Description: {product.description}
              </ListGroup.Item>
            </ListGroup>
          </Col>
          <Col md={3} sm={2}>
            <Card>
              <ListGroup variant="flush">
                <ListGroup.Item>
                  <Row>
                    <Col>Price: </Col>
                    <Col>
                      <strong>${product.price}</strong>
                    </Col>
                  </Row>
                </ListGroup.Item>
                <ListGroup.Item>
                  <Row>
                    <Col>Status: </Col>
                    <Col>
                      {product.countInStock > 0 ? "In Stock" : "Out Of Stock"}
                    </Col>
                  </Row>
                </ListGroup.Item>
                {product.countInStock > 0 && (
                  <ListGroup.Item>
                    <Row>
                      <Col>Qty</Col>
                      <Col>
                        <Form.Control
                          as="select"
                          size="sm"
                          value={qty}
                          onChange={(e) => setQty(e.target.value)}
                        >
                          {[...Array(product.countInStock).keys()].map((k) => (
                            <option key={k + 1} value={k + 1}>
                              {k + 1}
                            </option>
                          ))}
                        </Form.Control>
                      </Col>
                    </Row>
                  </ListGroup.Item>
                )}
                <ListGroup.Item>
                  <Button
                    onClick={addToCartHandler}
                    disabled={product.countInStock === 0}
                    className="btn-block"
                    type="button"
                  >
                    Add To Card
                  </Button>
                </ListGroup.Item>
              </ListGroup>
            </Card>
          </Col>
        </Row>
      )}
    </>
  );
};

export default ProductScreen;
