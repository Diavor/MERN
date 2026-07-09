import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import axios from "axios";
import Icon from "../brace/ui/Icon";
import fmt from "../brace/ui/fmt";
import Field from "../brace/ui/Field";
import Message from "../brace/ui/Message";
import ZoneSelector from "../brace/checkout/ZoneSelector";
import DatePicker from "../brace/checkout/DatePicker";
import TimeSlotPicker from "../brace/checkout/TimeSlotPicker";
import OrderSummary from "../brace/checkout/OrderSummary";
import { createOrder } from "../store/actions/order";
import { clearCart } from "../store/actions/cart";
import { DELIVERY_ZONES, FREE_DELIVERY_THRESHOLD } from "../brace/content";

const STEP_LABELS = ["Contatti", "Pagamento", "Conferma"];

const SectionLabel = ({ n, label, span, top }) => (
  <div
    style={{
      gridColumn: span ? "span " + span : "auto",
      marginTop: top ? 40 : 32,
      marginBottom: 14,
      display: "flex",
      alignItems: "center",
      gap: 14,
    }}
  >
    <span
      className="mono"
      style={{ fontSize: 10, color: "var(--gold)", letterSpacing: "0.2em" }}
    >
      · {n}
    </span>
    <span
      style={{
        fontFamily: "var(--mono)",
        fontSize: 12,
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        color: "var(--text)",
      }}
    >
      {label}
    </span>
    <span style={{ flex: 1, height: 1, background: "var(--line)" }} />
  </div>
);

const CheckoutScreen = ({ history }) => {
  const dispatch = useDispatch();

  const { cartItems } = useSelector((state) => state.cart);
  const { userInfo } = useSelector((state) => state.userLogin);
  const { success, order, error, loading } = useSelector(
    (state) => state.orderCreate
  );

  const [step, setStep] = useState(1);
  const [mode, setMode] = useState("guest"); // guest | login (visual)

  // Contact
  const [name, setName] = useState(userInfo?.name || "");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState(userInfo?.email || "");

  // Order type
  const [orderType, setOrderType] = useState("delivery");

  // Delivery address
  const [city, setCity] = useState("");
  const [street, setStreet] = useState("");
  const [buildingNumber, setBuildingNumber] = useState("");
  const [floor, setFloor] = useState("");

  // Schedule
  const [selectedDate, setSelectedDate] = useState("");
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Payment
  const [paymentMethod, setPaymentMethod] = useState("Contanti");

  // Notes
  const [notes, setNotes] = useState("");

  // Validation message
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (!success && (!cartItems || cartItems.length === 0)) {
      history.push("/menu");
    }
  }, [cartItems, history, success]);

  useEffect(() => {
    if (success && order) {
      dispatch(clearCart());
      history.push(`/order/${order._id}`);
    }
  }, [success, order, history, dispatch]);

  useEffect(() => {
    if (!selectedDate) return;
    setLoadingSlots(true);
    setSelectedSlot("");
    setSlots([]);
    axios
      .get(`/api/slots?date=${selectedDate}`)
      .then(({ data }) => setSlots(data))
      .catch(() => {})
      .finally(() => setLoadingSlots(false));
  }, [selectedDate]);

  const itemsPrice = cartItems.reduce(
    (acc, item) => acc + item.qty * item.price,
    0
  );

  const deliveryFee =
    orderType === "pickup" || itemsPrice >= FREE_DELIVERY_THRESHOLD
      ? 0
      : DELIVERY_ZONES.find((z) => z.city === city)?.price || 0;

  const totalPrice = (itemsPrice + deliveryFee).toFixed(2);

  const validateStep1 = () => {
    if (!name.trim() || !phone.trim() || !email.trim())
      return "Inserisci nome, telefono ed email.";
    if (orderType === "delivery" && (!city || !street.trim() || !buildingNumber.trim()))
      return "Completa l'indirizzo di consegna (zona, via e numero civico).";
    if (!selectedDate) return "Scegli una data.";
    if (!selectedSlot) return "Scegli un orario.";
    return "";
  };

  const goToPayment = () => {
    const err = validateStep1();
    if (err) {
      setFormError(err);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setFormError("");
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const placeOrder = () => {
    dispatch(
      createOrder({
        orderItems: cartItems.map((item) => ({
          name: item.name,
          qty: item.qty,
          image: item.image,
          price: item.price,
          toppings: [
            ...(item.toppings || []),
            ...(item.selectedDough
              ? [
                  {
                    name: "Impasto: " + item.selectedDough.name,
                    price: item.selectedDough.price,
                  },
                ]
              : []),
          ],
          product: item.product,
        })),
        shippingAddress: {
          name,
          phone,
          email,
          orderType,
          country: "Italy",
          city: orderType === "delivery" ? city : "Pickup",
          street: orderType === "delivery" ? street : "",
          buildingNumber: orderType === "delivery" ? buildingNumber : "",
          floor: orderType === "delivery" ? floor : "",
          deliveryDate: selectedDate,
          deliverySlot: selectedSlot,
          deliveryPrice: deliveryFee,
          notes,
        },
        paymentMethod,
        itemsNum: cartItems.reduce((acc, item) => acc + item.qty, 0),
        itemsPrice: itemsPrice.toFixed(2),
        shippingPrice: deliveryFee.toFixed(2),
        taxPrice: "0.00",
        totalPrice,
      })
    );
  };

  if (!cartItems || cartItems.length === 0) return null;

  return (
    <main style={{ paddingTop: 130, paddingBottom: 80, minHeight: "100vh" }}>
      <div className="b-container">
        {/* progress */}
        <div style={{ marginBottom: 60 }}>
          <div className="eyebrow" style={{ marginBottom: 18 }}>
            Checkout · Passo {step} di 3
          </div>
          <h1
            className="display"
            style={{ fontSize: 72, lineHeight: 0.98, margin: 0 }}
          >
            {step === 1 ? (
              <>
                Dove ti
                <br />
                <span
                  className="it"
                  style={{ color: "var(--gold)", fontWeight: 300 }}
                >
                  troviamo?
                </span>
              </>
            ) : (
              <>
                Come
                <br />
                <span
                  className="it"
                  style={{ color: "var(--gold)", fontWeight: 300 }}
                >
                  vuoi pagare?
                </span>
              </>
            )}
          </h1>

          <div style={{ display: "flex", gap: 4, marginTop: 40 }}>
            {STEP_LABELS.map((l, i) => (
              <div
                key={l}
                style={{
                  flex: 1,
                  paddingTop: 14,
                  borderTop:
                    "2px solid " +
                    (i + 1 <= step ? "var(--gold)" : "var(--line-2)"),
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize: 10,
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    color: i + 1 <= step ? "var(--gold)" : "var(--text-faint)",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <span>0{i + 1}</span>
                  <span>{l}</span>
                  {i + 1 < step && <Icon.check style={{ color: "var(--gold)" }} />}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.4fr 1fr",
            gap: 80,
            alignItems: "start",
          }}
        >
          <div>
            {formError && (
              <div style={{ marginBottom: 24 }}>
                <Message variant="danger">{formError}</Message>
              </div>
            )}
            {error && (
              <div style={{ marginBottom: 24 }}>
                <Message variant="danger">{error}</Message>
              </div>
            )}

            {step === 1 ? (
              <Step1
                mode={mode}
                setMode={setMode}
                userInfo={userInfo}
                name={name}
                setName={setName}
                phone={phone}
                setPhone={setPhone}
                email={email}
                setEmail={setEmail}
                orderType={orderType}
                setOrderType={setOrderType}
                city={city}
                setCity={setCity}
                street={street}
                setStreet={setStreet}
                buildingNumber={buildingNumber}
                setBuildingNumber={setBuildingNumber}
                floor={floor}
                setFloor={setFloor}
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                slots={slots}
                selectedSlot={selectedSlot}
                setSelectedSlot={setSelectedSlot}
                loadingSlots={loadingSlots}
                notes={notes}
                setNotes={setNotes}
                itemsPrice={itemsPrice}
              />
            ) : (
              <Step2
                paymentMethod={paymentMethod}
                setPaymentMethod={setPaymentMethod}
                name={name}
              />
            )}

            <div
              style={{
                marginTop: 48,
                display: "flex",
                justifyContent: "space-between",
                paddingTop: 32,
                borderTop: "1px solid var(--line)",
              }}
            >
              <button
                type="button"
                onClick={() => (step > 1 ? setStep(1) : history.push("/menu"))}
                className="b-btn ghost"
              >
                <Icon.arrow style={{ transform: "rotate(180deg)" }} />{" "}
                {step === 1 ? "Continua a comprare" : "Indietro"}
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => (step === 1 ? goToPayment() : placeOrder())}
                className="b-btn ember"
              >
                {step === 1 ? (
                  <>
                    Continua al pagamento <Icon.arrow className="arrow" />
                  </>
                ) : loading ? (
                  "Invio ordine…"
                ) : (
                  <>
                    Ordina · paga {paymentMethod === "Contanti" ? "alla consegna" : "al POS"}{" "}
                    {fmt(totalPrice)} <Icon.arrow className="arrow" />
                  </>
                )}
              </button>
            </div>
          </div>

          <OrderSummary
            cartItems={cartItems}
            itemsPrice={itemsPrice}
            deliveryFee={deliveryFee}
            orderType={orderType}
            city={city}
            freeThreshold={FREE_DELIVERY_THRESHOLD}
            total={itemsPrice + deliveryFee}
          />
        </div>
      </div>
    </main>
  );
};

// ---- STEP 1: contact + address + schedule ----
const Step1 = ({
  mode,
  setMode,
  userInfo,
  name,
  setName,
  phone,
  setPhone,
  email,
  setEmail,
  orderType,
  setOrderType,
  city,
  setCity,
  street,
  setStreet,
  buildingNumber,
  setBuildingNumber,
  floor,
  setFloor,
  selectedDate,
  setSelectedDate,
  slots,
  selectedSlot,
  setSelectedSlot,
  loadingSlots,
  notes,
  setNotes,
  itemsPrice,
}) => {
  return (
    <div>
      {/* guest / login toggle (only for anonymous visitors) */}
      {!userInfo && (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 0,
              background: "var(--bg-2)",
              border: "1px solid var(--line)",
              padding: 4,
              borderRadius: 999,
              maxWidth: 380,
            }}
          >
            {["guest", "login"].map((k) => (
              <button
                type="button"
                key={k}
                onClick={() => setMode(k)}
                style={{
                  padding: "12px 14px",
                  borderRadius: 999,
                  border: "none",
                  background: mode === k ? "var(--text)" : "transparent",
                  color: mode === k ? "var(--bg)" : "var(--text-dim)",
                  cursor: "pointer",
                  fontFamily: "var(--mono)",
                  fontSize: 11,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                }}
              >
                {k === "guest" ? "Continua come ospite" : "Accedi"}
              </button>
            ))}
          </div>
          {mode === "login" && (
            <div
              style={{
                marginTop: 16,
                fontSize: 14,
                color: "var(--text-dim)",
              }}
            >
              Hai già un account?{" "}
              <Link
                to="/login?redirect=/checkout"
                style={{ color: "var(--gold)" }}
              >
                Accedi
              </Link>{" "}
              per ritrovare i tuoi dati — oppure continua come ospite.
            </div>
          )}
        </>
      )}

      {/* delivery toggle */}
      <SectionLabel
        n="01"
        label={orderType === "delivery" ? "Consegna o ritiro" : "Consegna o ritiro"}
      />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          marginBottom: 28,
        }}
      >
        {[
          ["delivery", "Consegna a casa", "Mogliano Veneto e dintorni"],
          ["pickup", "Ritiro in pizzeria", "Nessun costo di consegna"],
        ].map(([k, l, sub]) => (
          <button
            type="button"
            key={k}
            onClick={() => setOrderType(k)}
            style={{
              padding: 20,
              textAlign: "left",
              cursor: "pointer",
              color: "var(--text)",
              background: orderType === k ? "var(--bg-3)" : "var(--bg-2)",
              border:
                "1px solid " +
                (orderType === k ? "var(--gold-deep)" : "var(--line)"),
            }}
          >
            <div style={{ fontWeight: 500, marginBottom: 6 }}>{l}</div>
            <div
              className="mono"
              style={{
                fontSize: 11,
                color: "var(--text-faint)",
                letterSpacing: "0.1em",
              }}
            >
              {sub}
            </div>
          </button>
        ))}
      </div>

      {/* contact fields */}
      <SectionLabel n="02" label="I tuoi contatti" top />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
        }}
      >
        <Field label="Nome e cognome" value={name} onChange={setName} span={2} required />
        <Field label="Telefono" value={phone} onChange={setPhone} type="tel" required />
        <Field label="Email" value={email} onChange={setEmail} type="email" required />

        {orderType === "delivery" && (
          <>
            <SectionLabel n="03" label="Indirizzo di consegna" span={2} top />
            <div style={{ gridColumn: "1/-1" }}>
              <ZoneSelector
                zones={DELIVERY_ZONES}
                value={city}
                onChange={setCity}
                subtotal={itemsPrice}
                freeThreshold={FREE_DELIVERY_THRESHOLD}
              />
            </div>
            <Field
              label="Via"
              value={street}
              onChange={setStreet}
              span={2}
              icon="📍"
              required
            />
            <Field
              label="Numero civico"
              value={buildingNumber}
              onChange={setBuildingNumber}
              required
            />
            <Field label="Piano · interno" value={floor} onChange={setFloor} />
          </>
        )}

        <SectionLabel
          n={orderType === "delivery" ? "04" : "03"}
          label="Quando ti serviamo"
          span={2}
          top
        />
        <div
          style={{
            gridColumn: "1/-1",
            display: "grid",
            gridTemplateColumns: "1.1fr 1fr",
            gap: 24,
          }}
        >
          <DatePicker value={selectedDate} onChange={setSelectedDate} />
          <TimeSlotPicker
            slots={slots}
            value={selectedSlot}
            onChange={setSelectedSlot}
            loading={loadingSlots}
            date={selectedDate}
          />
        </div>

        <SectionLabel
          n={orderType === "delivery" ? "05" : "04"}
          label="Note per la cucina"
          span={2}
          top
        />
        <Field
          label="Allergie, citofono, richieste particolari…"
          value={notes}
          onChange={setNotes}
          span={2}
          multiline
        />
      </div>
    </div>
  );
};

// ---- STEP 2: payment method ----
const Step2 = ({ paymentMethod, setPaymentMethod, name }) => {
  const methods = [
    {
      id: "Contanti",
      label: "Contanti",
      sub: "Paghi alla consegna o al ritiro",
      icon: "€",
    },
    {
      id: "Bancomat",
      label: "Bancomat / Carta",
      sub: "POS a bordo · Visa · Mastercard",
      icon: "💳",
    },
  ];

  return (
    <div>
      <SectionLabel n="01" label="Come vuoi pagare" />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 12,
        }}
      >
        {methods.map((opt) => (
          <button
            type="button"
            key={opt.id}
            onClick={() => setPaymentMethod(opt.id)}
            style={{
              padding: 20,
              textAlign: "left",
              cursor: "pointer",
              color: "var(--text)",
              background:
                paymentMethod === opt.id ? "var(--bg-3)" : "var(--bg-2)",
              border:
                "1px solid " +
                (paymentMethod === opt.id ? "var(--gold-deep)" : "var(--line)"),
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}
          >
            <span
              style={{
                width: 44,
                height: 30,
                display: "grid",
                placeItems: "center",
                background: "var(--bg)",
                border: "1px solid var(--line-2)",
                fontFamily: "var(--mono)",
                fontSize: 14,
                color: "var(--gold)",
              }}
            >
              {opt.icon}
            </span>
            <div>
              <div style={{ fontWeight: 500 }}>{opt.label}</div>
              <div
                className="mono"
                style={{
                  fontSize: 11,
                  color: "var(--text-faint)",
                  letterSpacing: "0.1em",
                  marginTop: 4,
                }}
              >
                {opt.sub}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Decorative "POS a bordo" card visual for Bancomat */}
      {paymentMethod === "Bancomat" && (
        <div style={{ marginTop: 36 }}>
          <SectionLabel n="02" label="Pagamento alla consegna" />
          <div
            style={{
              background: "var(--feature-card)",
              border: "1px solid var(--line-2)",
              padding: 32,
              position: "relative",
              overflow: "hidden",
              color: "#f3ece2",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "radial-gradient(400px 200px at 80% 30%, rgba(212,163,115,0.18), transparent 70%)",
              }}
            />
            <div style={{ position: "relative" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span
                  className="display"
                  style={{
                    fontSize: 22,
                    letterSpacing: "0.3em",
                    color: "#d4a373",
                  }}
                >
                  BRÀCE
                </span>
                <span
                  className="mono"
                  style={{
                    fontSize: 11,
                    color: "rgba(243,236,226,0.5)",
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                  }}
                >
                  POS a bordo
                </span>
              </div>
              <div
                className="mono"
                style={{
                  fontSize: 22,
                  letterSpacing: "0.12em",
                  marginTop: 60,
                  color: "#f3ece2",
                }}
              >
                •••• •••• •••• ••••
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: 28,
                }}
              >
                <div>
                  <div
                    className="mono"
                    style={{
                      fontSize: 9,
                      color: "rgba(243,236,226,0.5)",
                      letterSpacing: "0.18em",
                    }}
                  >
                    TITOLARE
                  </div>
                  <div
                    className="mono"
                    style={{ fontSize: 12, marginTop: 4, textTransform: "uppercase" }}
                  >
                    {name || "—"}
                  </div>
                </div>
                <div>
                  <div
                    className="mono"
                    style={{
                      fontSize: 9,
                      color: "rgba(243,236,226,0.5)",
                      letterSpacing: "0.18em",
                    }}
                  >
                    PAGAMENTO
                  </div>
                  <div className="mono" style={{ fontSize: 12, marginTop: 4 }}>
                    Alla consegna
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div
            style={{
              marginTop: 24,
              padding: "14px 18px",
              background: "var(--bg-2)",
              border: "1px solid var(--line)",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: 999,
                background: "var(--ok)",
              }}
            />
            <span
              className="mono"
              style={{
                fontSize: 11,
                color: "var(--text-dim)",
                letterSpacing: "0.1em",
              }}
            >
              Il rider porta il POS · paghi con carta o bancomat alla consegna
            </span>
          </div>
        </div>
      )}

      {paymentMethod === "Contanti" && (
        <div
          style={{
            marginTop: 36,
            padding: 40,
            background: "var(--bg-2)",
            border: "1px solid var(--line)",
          }}
        >
          <div className="display" style={{ fontSize: 28, marginBottom: 12 }}>
            Contanti
          </div>
          <p style={{ color: "var(--text-dim)", margin: 0, maxWidth: 500 }}>
            Paghi in contanti direttamente al rider (o al banco, se ritiri).
            Tieni pronto l'importo — il resto lo portiamo noi.
          </p>
        </div>
      )}
    </div>
  );
};

export default CheckoutScreen;
