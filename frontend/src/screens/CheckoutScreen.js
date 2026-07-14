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
import { fetchActiveZones, validateCoupon } from "../brace/admin/api";
import "./CheckoutScreen.scss";

const STEP_LABELS = ["Contatti", "Pagamento", "Conferma"];

// Round a currency amount to cents as a Number (avoids float noise like 8.499999
// while keeping the value numeric, which the order validator requires).
const round2 = (n) => Math.round(n * 100) / 100;

// If the zones API is unreachable, fall back to the static list so checkout
// still works — mapped into the same shape the live zones use.
const FALLBACK_ZONES = DELIVERY_ZONES.map((z) => ({
  _id: z.city,
  name: z.city,
  fee: z.price,
  freeThreshold: FREE_DELIVERY_THRESHOLD,
  minOrder: 0,
  eta: "20–30 min",
}));

const SectionLabel = ({ n, label, span, top }) => (
  <div
    className={
      "checkout__section-label" +
      (span ? " is-span" : "") +
      (top ? " is-top" : "")
    }
  >
    <span className="mono checkout__section-n">· {n}</span>
    <span className="checkout__section-title">{label}</span>
    <span className="checkout__section-rule" />
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

  // Delivery zones (live, admin-managed)
  const [zones, setZones] = useState(FALLBACK_ZONES);
  const [zonesLoading, setZonesLoading] = useState(true);

  // Promo code
  const [promoCode, setPromoCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null); // {code,type,value,discount}
  const [promoError, setPromoError] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);

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

  // Load the live, admin-managed delivery zones. Keep the static fallback if the
  // request fails or returns nothing, so delivery never becomes unselectable.
  useEffect(() => {
    let alive = true;
    fetchActiveZones()
      .then((data) => {
        if (alive && Array.isArray(data) && data.length) setZones(data);
      })
      .catch(() => {})
      .finally(() => alive && setZonesLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const itemsPrice = cartItems.reduce(
    (acc, item) => acc + item.qty * item.price,
    0
  );

  const selectedZone = zones.find((z) => z.name === city);
  const zoneThreshold = selectedZone?.freeThreshold ?? FREE_DELIVERY_THRESHOLD;

  const deliveryFee =
    orderType === "pickup" || !selectedZone || itemsPrice >= selectedZone.freeThreshold
      ? 0
      : selectedZone.fee;

  // Coupon discount is computed server-side against the items subtotal; clamp so
  // it can never exceed the subtotal.
  const discount = appliedCoupon
    ? Math.min(appliedCoupon.discount, itemsPrice)
    : 0;

  const totalPrice = Math.max(0, itemsPrice + deliveryFee - discount);

  const validateStep1 = () => {
    if (!name.trim() || !phone.trim() || !email.trim())
      return "Inserisci nome, telefono ed email.";
    if (orderType === "delivery" && (!city || !street.trim() || !buildingNumber.trim()))
      return "Completa l'indirizzo di consegna (zona, via e numero civico).";
    if (
      orderType === "delivery" &&
      selectedZone &&
      selectedZone.minOrder > 0 &&
      itemsPrice < selectedZone.minOrder
    )
      return `Ordine minimo ${fmt(selectedZone.minOrder)} per la zona ${city}.`;
    if (!selectedDate) return "Scegli una data.";
    if (!selectedSlot) return "Scegli un orario.";
    return "";
  };

  const applyPromo = async () => {
    const code = promoCode.trim();
    if (!code) return;
    setPromoLoading(true);
    setPromoError("");
    try {
      const res = await validateCoupon(code, itemsPrice);
      setAppliedCoupon(res); // { code, type, value, discount }
    } catch (e) {
      setAppliedCoupon(null);
      setPromoError(e.message || "Codice non valido");
    } finally {
      setPromoLoading(false);
    }
  };

  const removePromo = () => {
    setAppliedCoupon(null);
    setPromoCode("");
    setPromoError("");
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
        // Money fields must be numbers (rounded to cents), not toFixed strings —
        // the order validator rejects strings.
        itemsPrice: round2(itemsPrice),
        shippingPrice: round2(deliveryFee),
        discountPrice: round2(discount),
        couponCode: appliedCoupon?.code || "",
        taxPrice: 0,
        totalPrice: round2(totalPrice),
      })
    );
  };

  if (!cartItems || cartItems.length === 0) return null;

  return (
    <main className="checkout">
      <div className="b-container">
        {/* progress */}
        <div className="checkout__progress">
          <div className="eyebrow checkout__eyebrow">
            Checkout · Passo {step} di 3
          </div>
          <h1 className="display checkout__title">
            {step === 1 ? (
              <>
                Dove ti
                <br />
                <span className="it checkout__title-kicker">
                  troviamo?
                </span>
              </>
            ) : (
              <>
                Come
                <br />
                <span className="it checkout__title-kicker">
                  vuoi pagare?
                </span>
              </>
            )}
          </h1>

          <div className="checkout__steps">
            {STEP_LABELS.map((l, i) => (
              <div
                key={l}
                className={"checkout__step" + (i + 1 <= step ? " is-active" : "")}
              >
                <div
                  className={
                    "checkout__step-label" +
                    (i + 1 <= step ? " is-active" : "")
                  }
                >
                  <span>0{i + 1}</span>
                  <span>{l}</span>
                  {i + 1 < step && <Icon.check className="checkout__step-check" />}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="checkout__layout">
          <div>
            {formError && (
              <div className="checkout__alert">
                <Message variant="danger">{formError}</Message>
              </div>
            )}
            {error && (
              <div className="checkout__alert">
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
                zones={zones}
                zonesLoading={zonesLoading}
              />
            ) : (
              <Step2
                paymentMethod={paymentMethod}
                setPaymentMethod={setPaymentMethod}
                name={name}
              />
            )}

            <div className="checkout__nav">
              <button
                type="button"
                onClick={() => (step > 1 ? setStep(1) : history.push("/menu"))}
                className="b-btn ghost"
              >
                <Icon.arrow className="checkout__back-arrow" />{" "}
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
            freeThreshold={zoneThreshold}
            discount={discount}
            total={itemsPrice + deliveryFee - discount}
            promoCode={promoCode}
            setPromoCode={setPromoCode}
            appliedCoupon={appliedCoupon}
            onApplyPromo={applyPromo}
            onRemovePromo={removePromo}
            promoError={promoError}
            promoLoading={promoLoading}
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
  zones,
  zonesLoading,
}) => {
  return (
    <div>
      {/* guest / login toggle (only for anonymous visitors) */}
      {!userInfo && (
        <>
          <div className="checkout__auth">
            {["guest", "login"].map((k) => (
              <button
                type="button"
                key={k}
                onClick={() => setMode(k)}
                className={
                  "checkout__auth-btn" + (mode === k ? " is-active" : "")
                }
              >
                {k === "guest" ? "Continua come ospite" : "Accedi"}
              </button>
            ))}
          </div>
          {mode === "login" && (
            <div className="checkout__auth-hint">
              Hai già un account?{" "}
              <Link
                to="/login?redirect=/checkout"
                className="checkout__auth-link"
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
      <div className="checkout__options">
        {[
          ["delivery", "Consegna a casa", "Mogliano Veneto e dintorni"],
          ["pickup", "Ritiro in pizzeria", "Nessun costo di consegna"],
        ].map(([k, l, sub]) => (
          <button
            type="button"
            key={k}
            onClick={() => setOrderType(k)}
            className={"checkout__option" + (orderType === k ? " is-active" : "")}
          >
            <div className="checkout__option-title">{l}</div>
            <div className="mono checkout__option-sub">{sub}</div>
          </button>
        ))}
      </div>

      {/* contact fields */}
      <SectionLabel n="02" label="I tuoi contatti" top />
      <div className="checkout__grid">
        <Field label="Nome e cognome" value={name} onChange={setName} span={2} required />
        <Field label="Telefono" value={phone} onChange={setPhone} type="tel" required />
        <Field label="Email" value={email} onChange={setEmail} type="email" required />

        {orderType === "delivery" && (
          <>
            <SectionLabel n="03" label="Indirizzo di consegna" span={2} top />
            <div className="checkout__span-full">
              <ZoneSelector
                zones={zones}
                value={city}
                onChange={setCity}
                subtotal={itemsPrice}
                loading={zonesLoading}
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
        <div className="checkout__schedule">
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
      <div className="checkout__methods">
        {methods.map((opt) => (
          <button
            type="button"
            key={opt.id}
            onClick={() => setPaymentMethod(opt.id)}
            className={
              "checkout__method" +
              (paymentMethod === opt.id ? " is-active" : "")
            }
          >
            <span className="checkout__method-icon">{opt.icon}</span>
            <div>
              <div className="checkout__method-label">{opt.label}</div>
              <div className="mono checkout__method-sub">{opt.sub}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Decorative "POS a bordo" card visual for Bancomat */}
      {paymentMethod === "Bancomat" && (
        <div className="checkout__pos">
          <SectionLabel n="02" label="Pagamento alla consegna" />
          <div className="checkout__card">
            <div className="checkout__card-glow" />
            <div className="checkout__card-inner">
              <div className="checkout__card-head">
                <span className="display checkout__card-brand">
                  Grani Antichi
                </span>
                <span className="mono checkout__card-tag">
                  POS a bordo
                </span>
              </div>
              <div className="mono checkout__card-number">
                •••• •••• •••• ••••
              </div>
              <div className="checkout__card-foot">
                <div>
                  <div className="mono checkout__card-caption">
                    TITOLARE
                  </div>
                  <div className="mono checkout__card-value is-upper">
                    {name || "—"}
                  </div>
                </div>
                <div>
                  <div className="mono checkout__card-caption">
                    PAGAMENTO
                  </div>
                  <div className="mono checkout__card-value">
                    Alla consegna
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="checkout__rider">
            <span className="checkout__rider-dot" />
            <span className="mono checkout__rider-text">
              Il rider porta il POS · paghi con carta o bancomat alla consegna
            </span>
          </div>
        </div>
      )}

      {paymentMethod === "Contanti" && (
        <div className="checkout__cash">
          <div className="display checkout__cash-title">
            Contanti
          </div>
          <p className="checkout__cash-text">
            Paghi in contanti direttamente al rider (o al banco, se ritiri).
            Tieni pronto l'importo — il resto lo portiamo noi.
          </p>
        </div>
      )}
    </div>
  );
};

export default CheckoutScreen;
