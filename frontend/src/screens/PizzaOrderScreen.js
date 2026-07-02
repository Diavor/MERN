import React, { useState, useEffect } from 'react'
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Badge,
  Form,
  Alert,
  Spinner,
} from 'react-bootstrap'
import axios from 'axios'

const PIZZA_MENU = [
  { id: 1, name: 'Margherita', price: 8.5, description: 'Tomato, mozzarella, basil' },
  { id: 2, name: 'Diavola', price: 10.5, description: 'Tomato, mozzarella, spicy salami' },
  { id: 3, name: 'Quattro Formaggi', price: 11.0, description: 'Four cheese blend' },
  { id: 4, name: 'Prosciutto', price: 10.0, description: 'Tomato, mozzarella, ham' },
  { id: 5, name: 'Vegetariana', price: 9.5, description: 'Seasonal vegetables' },
  {
    id: 6,
    name: 'Capricciosa',
    price: 11.5,
    description: 'Ham, mushrooms, artichokes, olives',
  },
]

const PizzaOrderScreen = () => {
  const [cart, setCart] = useState({})
  const [selectedDate, setSelectedDate] = useState('')
  const [slots, setSlots] = useState([])
  const [selectedSlot, setSelectedSlot] = useState('')
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(null)

  useEffect(() => {
    if (!selectedDate) return
    setLoadingSlots(true)
    setSelectedSlot('')
    setSlots([])
    axios
      .get(`/api/slots?date=${selectedDate}`)
      .then(({ data }) => setSlots(data))
      .catch(() => setError('Failed to load time slots'))
      .finally(() => setLoadingSlots(false))
  }, [selectedDate])

  const totalQty = Object.values(cart).reduce((a, b) => a + b, 0)
  const totalPrice = PIZZA_MENU.reduce(
    (acc, p) => acc + (cart[p.id] || 0) * p.price,
    0
  )

  const addToCart = (id) => {
    setError('')
    setCart((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }))
  }

  const removeFromCart = (id) => {
    setCart((prev) => {
      const next = { ...prev }
      if (next[id] > 1) next[id]--
      else delete next[id]
      return next
    })
  }

  const handleCheckout = async () => {
    setError('')
    if (totalQty === 0) return setError('Your cart is empty')
    if (!selectedSlot) return setError('Please select a delivery time slot')

    const items = PIZZA_MENU.filter((p) => cart[p.id]).map((p) => ({
      name: p.name,
      qty: cart[p.id],
      price: p.price,
    }))

    setSubmitting(true)
    try {
      const { data } = await axios.post('/api/pizza-orders', {
        items,
        deliveryDate: selectedDate,
        deliverySlot: selectedSlot,
      })
      setSuccess(data)
      setCart({})
      setSelectedSlot('')
    } catch (err) {
      setError(err.response?.data?.message || 'Order failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const today = new Date().toISOString().split('T')[0]

  if (success) {
    return (
      <Container className="py-5">
        <Alert variant="success" className="text-center p-5">
          <h4 className="mb-3">Order Placed Successfully!</h4>
          <p>
            Your pizzas will be delivered on{' '}
            <strong>{success.deliveryDate}</strong> at{' '}
            <strong>{success.deliverySlot}</strong>.
          </p>
          <p>
            Total: <strong>€{success.totalPrice.toFixed(2)}</strong>
          </p>
          <Button variant="danger" onClick={() => setSuccess(null)}>
            Order Again
          </Button>
        </Alert>
      </Container>
    )
  }

  return (
    <Container className="py-4">
      <h2 className="mb-4">Order Pizza</h2>
      <Row>
        {/* MENU */}
        <Col lg={7}>
          <h5 className="mb-3">Menu</h5>
          <Row>
            {PIZZA_MENU.map((pizza) => (
              <Col md={6} key={pizza.id} className="mb-3">
                <Card className="h-100">
                  <Card.Body className="d-flex flex-column justify-content-between">
                    <div>
                      <Card.Title>{pizza.name}</Card.Title>
                      <Card.Text className="text-muted small">
                        {pizza.description}
                      </Card.Text>
                    </div>
                    <div className="d-flex justify-content-between align-items-center mt-2">
                      <strong className="text-danger">
                        €{pizza.price.toFixed(2)}
                      </strong>
                      <div className="d-flex align-items-center gap-2">
                        {cart[pizza.id] && (
                          <>
                            <Button
                              size="sm"
                              variant="outline-secondary"
                              onClick={() => removeFromCart(pizza.id)}
                            >
                              −
                            </Button>
                            <span className="fw-bold">{cart[pizza.id]}</span>
                          </>
                        )}
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => addToCart(pizza.id)}
                        >
                          +
                        </Button>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Col>

        {/* SIDEBAR */}
        <Col lg={5}>
          {/* Order Summary */}
          <Card className="mb-3">
            <Card.Header>
              <strong>Your Order</strong>
              {totalQty > 0 && (
                <Badge bg="danger" className="ms-2">
                  {totalQty}
                </Badge>
              )}
            </Card.Header>
            <Card.Body>
              {totalQty === 0 ? (
                <p className="text-muted mb-0">No items added yet</p>
              ) : (
                <>
                  {PIZZA_MENU.filter((p) => cart[p.id]).map((p) => (
                    <div key={p.id} className="d-flex justify-content-between mb-1">
                      <span>
                        {p.name} × {cart[p.id]}
                      </span>
                      <span>€{(p.price * cart[p.id]).toFixed(2)}</span>
                    </div>
                  ))}
                  <hr />
                  <div className="d-flex justify-content-between fw-bold">
                    <span>
                      Total ({totalQty} pizza{totalQty !== 1 ? 's' : ''})
                    </span>
                    <span>€{totalPrice.toFixed(2)}</span>
                  </div>
                </>
              )}
            </Card.Body>
          </Card>

          {/* Date + Slot Picker */}
          <Card className="mb-3">
            <Card.Header>
              <strong>Delivery</strong>
            </Card.Header>
            <Card.Body>
              <Form.Group className="mb-3">
                <Form.Label>Select Date</Form.Label>
                <Form.Control
                  type="date"
                  min={today}
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value)
                    setError('')
                  }}
                />
              </Form.Group>

              {selectedDate && (
                <Form.Group>
                  <Form.Label>Select Time Slot</Form.Label>
                  {loadingSlots ? (
                    <div>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Loading slots...
                    </div>
                  ) : (
                    <div className="d-flex flex-wrap gap-1">
                      {slots.map((slot) => (
                        <Button
                          key={slot.time}
                          size="sm"
                          variant={
                            slot.available === 0
                              ? 'danger'
                              : selectedSlot === slot.time
                              ? slot.available >= 6 ? 'success' : 'warning'
                              : slot.available >= 6 ? 'outline-success' : 'outline-warning'
                          }
                          disabled={slot.available === 0}
                          onClick={() => {
                            setSelectedSlot(slot.time)
                            setError('')
                          }}
                        >
                          {slot.time}
                          {slot.available < 10 && slot.available > 0 && (
                            <span
                              className="ms-1"
                              style={{ fontSize: '0.7rem' }}
                            >
                              ({slot.available})
                            </span>
                          )}
                        </Button>
                      ))}
                    </div>
                  )}
                </Form.Group>
              )}
            </Card.Body>
          </Card>

          {error && <Alert variant="danger">{error}</Alert>}

          <Button
            variant="danger"
            size="lg"
            className="w-100"
            onClick={handleCheckout}
            disabled={submitting || totalQty === 0 || !selectedSlot}
          >
            {submitting ? (
              <>
                <Spinner
                  animation="border"
                  size="sm"
                  className="me-2"
                />
                Placing Order...
              </>
            ) : (
              'Place Order'
            )}
          </Button>
        </Col>
      </Row>
    </Container>
  )
}

export default PizzaOrderScreen
