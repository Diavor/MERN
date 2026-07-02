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
import Meta from "../components/Meta";
import {
  listProductDetails,
  createProductReview,
} from "../store/actions/product";
import { addToCart } from "../store/actions/cart";
import { PRODUCT_CREATE_REVIEW_RESET } from "../store/actionTypes";

const ProductScreen = ({ history, match }) => {
  const [qty, setQty] = useState(1);
  const [selectedToppings, setSelectedToppings] = useState([]);
  const [selectedDough, setSelectedDough] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  const dispatch = useDispatch();
  const { loading, error, product } = useSelector(
    (state) => state.productDetails
  );
  const { success: successReview, error: errorReview } = useSelector(
    (state) => state.productReviewCreate
  );
  const { userInfo } = useSelector((state) => state.userLogin);

  useEffect(() => {
    if (successReview) {
      alert("Review Submitted!");
      setRating(0);
      setComment("");
      dispatch({ type: PRODUCT_CREATE_REVIEW_RESET });
    }
    dispatch(listProductDetails(match.params.id));
  }, [match, dispatch, successReview]);

  // const addToCartHandler = () => {
  //   history.push(`/cart/${match.params.id}?qty=${qty}`);
  //   history.push("/cart");
  // };

  const toggleTopping = (topping) => {
    setSelectedToppings((prev) =>
      prev.find((t) => t.name === topping.name)
        ? prev.filter((t) => t.name !== topping.name)
        : [...prev, topping]
    );
  };

  const toppingsTotal = selectedToppings.reduce((acc, t) => acc + t.price, 0);
  const doughExtra = selectedDough ? selectedDough.price : 0;

  const addToCartHandler = () => {
    dispatch(addToCart(product._id, qty, selectedToppings, selectedDough));
    history.push("/cart");
  };

  const submitHandler = (e) => {
    e.preventDefault();
    dispatch(
      createProductReview(match.params.id, {
        rating,
        comment,
      })
    );
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
        <>
          <Meta title={product.name} />
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
                <ListGroup.Item>
                  Price: €{(product.price + toppingsTotal + doughExtra).toFixed(2)}
                  {(toppingsTotal + doughExtra) > 0 && (
                    <small className="text-muted ms-2">
                      (base €{product.price?.toFixed(2)} + extras €{(toppingsTotal + doughExtra).toFixed(2)})
                    </small>
                  )}
                </ListGroup.Item>
                <ListGroup.Item>
                  Description: {product.description}
                </ListGroup.Item>
                {product.doughVariants && product.doughVariants.length > 0 && (
                  <ListGroup.Item>
                    <strong>Impasto Speciale:</strong>
                    <Form.Check
                      type="radio"
                      id="dough-standard"
                      name="dough"
                      label="Standard (incluso)"
                      checked={!selectedDough}
                      onChange={() => setSelectedDough(null)}
                      className="mt-1"
                    />
                    {product.doughVariants.map((dough) => (
                      <Form.Check
                        key={dough.name}
                        type="radio"
                        id={`dough-${dough.name}`}
                        name="dough"
                        label={`${dough.name} (+€${dough.price.toFixed(2)})`}
                        checked={selectedDough?.name === dough.name}
                        onChange={() => setSelectedDough(dough)}
                        className="mt-1"
                      />
                    ))}
                  </ListGroup.Item>
                )}
                {product.toppings && product.toppings.length > 0 && (
                  <ListGroup.Item>
                    <strong>Add extras:</strong>
                    {product.toppings.map((topping) => {
                      const checked = !!selectedToppings.find(
                        (t) => t.name === topping.name
                      );
                      return (
                        <Form.Check
                          key={topping.name}
                          type="checkbox"
                          id={`topping-${topping.name}`}
                          label={`${topping.name} (+€${topping.price.toFixed(2)})`}
                          checked={checked}
                          onChange={() => toggleTopping(topping)}
                          className="mt-1"
                        />
                      );
                    })}
                  </ListGroup.Item>
                )}
              </ListGroup>
            </Col>
            <Col md={3} sm={2}>
              <Card>
                <ListGroup variant="flush">
                  <ListGroup.Item>
                    <Row>
                      <Col>Price: </Col>
                      <Col>
                        <strong>€{(product.price + toppingsTotal + doughExtra).toFixed(2)}</strong>
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
                            {[...Array(product.countInStock).keys()].map(
                              (k) => (
                                <option key={k + 1} value={k + 1}>
                                  {k + 1}
                                </option>
                              )
                            )}
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
          <Row>
            <Col md={6}>
              <h2>Reviews</h2>
              {product.reviews.length === 0 && <Message>No Reviews</Message>}
              <ListGroup variant="flush">
                {product.reviews.map((r) => (
                  <ListGroup.Item key={r._id}>
                    <strong>{r.name}</strong>
                    <Rating value={r.rating} />
                    <p>{r.createdAt.substring(0, 10)}</p>
                    <p>{r.comment}</p>
                  </ListGroup.Item>
                ))}
                <ListGroup.Item>
                  {errorReview && (
                    <Message variant="danger">{errorReview}</Message>
                  )}
                  <h2>Write a Customer Review</h2>
                  {userInfo ? (
                    <Form onSubmit={submitHandler}>
                      <Form.Group controlId="rating">
                        <Form.Label>Rating</Form.Label>
                        <Form.Control
                          as="select"
                          value={rating}
                          onChange={(e) => setRating(e.target.value)}
                        >
                          <option value="">Select...</option>
                          <option value="1">1 - Poor</option>
                          <option value="2">2 - Fair</option>
                          <option value="3">3 - Good</option>
                          <option value="4">4 - Very Good</option>
                          <option value="5">5 - Excelent</option>
                        </Form.Control>
                      </Form.Group>
                      <Form.Group controlId="comment">
                        <Form.Label>Comment</Form.Label>
                        <Form.Control
                          as="textarea"
                          row="3"
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                        ></Form.Control>
                      </Form.Group>
                      <Button type="submit" variant="info">
                        Submit
                      </Button>
                    </Form>
                  ) : (
                    <Message>
                      Please <Link to="/login">Sign In</Link> to write a review
                    </Message>
                  )}
                </ListGroup.Item>
              </ListGroup>
            </Col>
          </Row>
        </>
      )}
    </>
  );
};

export default ProductScreen;
