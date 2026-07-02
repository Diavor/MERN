import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Form, Button } from "react-bootstrap";
import FormContainer from "../components/FormContainer";
import CheckoutSteps from "../components/CheckoutSteps";
import { saveShippingAddress } from "../store/actions/cart";

const DELIVERY_ZONES = [
  { city: "Mogliano Veneto", price: 2.5 },
  { city: "Zerman", price: 2.5 },
  { city: "Preganziol", price: 3.0 },
  { city: "Campocroce", price: 3.0 },
  { city: "Conscio", price: 3.0 },
  { city: "Gaggio", price: 3.0 },
  { city: "Marcon", price: 3.0 },
  { city: "Lughignano", price: 3.0 },
  { city: "San Liberale", price: 3.0 },
];

const getDeliveryPrice = (city) => {
  const zone = DELIVERY_ZONES.find((z) => z.city === city);
  return zone ? zone.price : 0;
};

const ShippingScreen = ({ history }) => {
  const { shippingAddress } = useSelector((state) => state.cart);

  const [country] = useState("Italy");
  const [city, setCity] = useState(shippingAddress.city || "");
  const [address, setAddress] = useState(shippingAddress.address || "");
  const [postalCode, setPostalCode] = useState(shippingAddress.postalCode || "");

  const dispatch = useDispatch();

  const deliveryPrice = getDeliveryPrice(city);

  const submitHandler = (e) => {
    e.preventDefault();
    dispatch(
      saveShippingAddress({
        country,
        city,
        address,
        postalCode,
        deliveryPrice,
      })
    );
    history.push("/payment");
  };

  return (
    <FormContainer>
      <CheckoutSteps step1 step2 />
      <h1>Shipping</h1>
      <Form onSubmit={submitHandler}>
        <Form.Group controlId="country">
          <Form.Label>Country</Form.Label>
          <Form.Control type="text" value="Italy" readOnly />
        </Form.Group>

        <Form.Group controlId="city">
          <Form.Label>City</Form.Label>
          <Form.Control
            as="select"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            required
          >
            <option value="">-- Select delivery city --</option>
            <optgroup label="Delivery €2.50">
              {DELIVERY_ZONES.filter((z) => z.price === 2.5).map((z) => (
                <option key={z.city} value={z.city}>
                  {z.city}
                </option>
              ))}
            </optgroup>
            <optgroup label="Delivery €3.00">
              {DELIVERY_ZONES.filter((z) => z.price === 3.0).map((z) => (
                <option key={z.city} value={z.city}>
                  {z.city}
                </option>
              ))}
            </optgroup>
          </Form.Control>
          {city && (
            <Form.Text className="text-muted">
              Delivery to {city}: €{deliveryPrice.toFixed(2)}
            </Form.Text>
          )}
        </Form.Group>

        <Form.Group controlId="address">
          <Form.Label>Address</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
          />
        </Form.Group>

        <Form.Group controlId="postalCode">
          <Form.Label>Postal Code</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter postal code"
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value)}
            required
          />
        </Form.Group>

        <Button type="submit" variant="primary">
          Continue
        </Button>
      </Form>
    </FormContainer>
  );
};

export default ShippingScreen;
