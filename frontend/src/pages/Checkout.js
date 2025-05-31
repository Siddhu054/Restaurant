import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axiosInstance from "../api/axios";
import "./Checkout.css";

function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();
  const orderData = location.state?.orderData;

  const [paymentMethod, setPaymentMethod] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    if (!orderData || !orderData.items || orderData.items.length === 0) {
      navigate("/pos");
    }
  }, [orderData, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    if (!paymentMethod) {
      setSubmitError("Please select a payment method.");
      setIsSubmitting(false);
      return;
    }

    const orderSubmission = {
      ...orderData,
      paymentMethod,
      notes,
      status: "processing",
    };

    if (orderSubmission.items && Array.isArray(orderSubmission.items)) {
      orderSubmission.items = orderSubmission.items.map((item) => ({
        menuItem: item.id,
        quantity: item.quantity,
      }));
    }

    console.log("Submitting order:", orderSubmission);

    try {
      const { data } = await axiosInstance.post("/api/orders", orderSubmission);

      console.log("Order successfully submitted:", data);

      if (data.success) {
        navigate("/order-confirmation", { state: { order: data.order } });
      } else {
        setSubmitError(data.message || "Failed to place order");
      }
    } catch (err) {
      console.error("Error submitting order:", err);
      setSubmitError(
        `Failed to place order: ${err.response?.data?.message || err.message}`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!orderData || !orderData.items || orderData.items.length === 0) {
    return null;
  }

  const safeOrderData = {
    ...orderData,
    itemTotal: Number(orderData.itemTotal) || 0,
    deliveryCharge: Number(orderData.deliveryCharge) || 0,
    taxes: Number(orderData.taxes) || 0,
    grandTotal: Number(orderData.grandTotal) || 0,

    items: orderData.items || [],
    customerDetails: orderData.customerDetails || {},
    deliveryInfo: orderData.deliveryInfo || {},
  };

  return (
    <div className="checkout-container">
      <h2>Checkout</h2>
      {submitError && <div className="error-message">{submitError}</div>}

      {/* Order Summary */}
      <div className="order-summary">
        <h3>Order Summary</h3>
        <ul>
          {safeOrderData.items.map((item, index) => (
            <li key={item.id || index}>
              {item.quantity} x {item.name} - ${item.price.toFixed(2)}
            </li>
          ))}
        </ul>
        <div className="totals">
          <p>Subtotal: ${safeOrderData.itemTotal.toFixed(2)}</p>
          <p>Delivery: ${safeOrderData.deliveryCharge.toFixed(2)}</p>
          <p>Taxes: ${safeOrderData.taxes.toFixed(2)}</p>
          <p>Grand Total: ${safeOrderData.grandTotal.toFixed(2)}</p>
        </div>
      </div>

      {/* Payment Method Selection */}
      <div className="payment-method">
        <h3>Payment Method</h3>
        <select
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
          required
        >
          <option value="">Select Payment Method</option>
          <option value="cash">Cash</option>
          <option value="card">Card</option>
          <option value="online">Online Payment</option>
        </select>
      </div>

      {/* Notes/Instructions (Optional) */}
      <div className="order-notes">
        <h3>Notes/Instructions</h3>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any special instructions or notes..."
        ></textarea>
      </div>

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={isSubmitting || !paymentMethod}
        className="submit-order-btn"
      >
        {isSubmitting ? "Processing..." : "Place Order"}
      </button>
    </div>
  );
}

export default Checkout;
