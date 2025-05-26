import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./Checkout.css";

function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { orderData } = location.state || {};

  const [customerDetails, setCustomerDetails] = useState({
    name: "",
    phone: "",
    address: "",
  });

  const [deliveryInfo, setDeliveryInfo] = useState({
    estimatedTime: orderData?.deliveryInfo?.estimatedTime || "42", // Use provided estimated time or default
    cookingInstructions: orderData?.deliveryInfo?.cookingInstructions || "", // Use provided instructions or empty
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const [tables, setTables] = useState([]); // State to store fetched tables
  const [selectedTable, setSelectedTable] = useState(""); // State to store the selected table ID
  const [tablesLoading, setTablesLoading] = useState(true); // Loading state for tables
  const [tablesError, setTablesError] = useState(null); // Error state for tables

  useEffect(() => {
    // Redirect to menu if no order data
    if (!orderData || !orderData.items || orderData.items.length === 0) {
      navigate("/menu", { replace: true });
    }
    // Initialize customer details if they were part of orderData (e.g., from a previous step/draft)
    if (orderData?.customerDetails) {
      setCustomerDetails(orderData.customerDetails);
    }
  }, [orderData, navigate]);

  // Effect to fetch tables when component mounts
  useEffect(() => {
    const fetchTables = async () => {
      setTablesLoading(true);
      setTablesError(null);
      try {
        const response = await fetch("http://localhost:5000/api/tables");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        // Filter for available tables for selection
        const availableTables = data.filter(
          (table) => table.status === "available"
        );
        setTables(availableTables);
        // Automatically select the first available table if any
        if (availableTables.length > 0) {
          setSelectedTable(availableTables[0]._id);
        }
      } catch (err) {
        setTablesError("Failed to fetch tables");
        console.error("Error fetching tables:", err);
      } finally {
        setTablesLoading(false);
      }
    };

    // Fetch tables only if order type is dine-in
    if (orderData?.orderType === "dine-in") {
      fetchTables();
    }
  }, [orderData]); // Rerun if orderData changes (specifically orderType)

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCustomerDetails((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleDeliveryInfoChange = (e) => {
    const { name, value } = e.target;
    setDeliveryInfo((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!customerDetails.name.trim()) {
      newErrors.name = "Name is required";
    }
    if (!customerDetails.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\d{10}$/.test(customerDetails.phone)) {
      newErrors.phone = "Please enter a valid 10-digit phone number";
    }
    if (
      orderData.orderType === "take-away" &&
      !customerDetails.address.trim()
    ) {
      newErrors.address = "Delivery address is required for take-away orders";
    }
    // Add validation for table selection for dine-in orders
    if (orderData?.orderType === "dine-in" && !selectedTable) {
      newErrors.table = "Please select a table for dine-in order.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null); // Clear previous errors

    if (validateForm()) {
      setIsSubmitting(true); // Disable button and show loading

      console.log("orderData.items before submit:", orderData.items);

      const orderSubmission = {
        // Use _id for each item as expected by the backend
        items: orderData.items.map((item) => ({
          _id: item._id || item.id,
          quantity: item.quantity,
          price: item.price,
        })),
        orderType: orderData.orderType, // Send order type
        customerDetails: customerDetails, // Send customer details
        deliveryInfo: {
          estimatedTime: deliveryInfo.estimatedTime, // Send estimated time
          cookingInstructions: deliveryInfo.cookingInstructions, // Send cooking instructions
          deliveryCharge: orderData.deliveryCharge, // Include delivery charge from initial calculation
          taxes: orderData.taxes, // Include taxes from initial calculation
        },
        // Include table ID only if order type is dine-in
        ...(orderData.orderType === "dine-in" && { table: selectedTable }),
      };

      console.log("Submitting order data to backend:", orderSubmission); // Log data being sent

      try {
        const response = await fetch("http://localhost:5000/api/orders", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(orderSubmission),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.message || `HTTP error! status: ${response.status}`
          );
        }

        const confirmedOrder = await response.json();
        console.log("Order successfully submitted:", confirmedOrder); // Log confirmed order from backend

        // Navigate to order confirmation page with the confirmed order data
        navigate("/order-confirmation", { state: { order: confirmedOrder } });
      } catch (err) {
        console.error("Error submitting order:", err);
        setSubmitError(`Failed to place order: ${err.message}`);
      } finally {
        setIsSubmitting(false); // Enable button
      }
    }
  };

  if (!orderData || !orderData.items || orderData.items.length === 0) {
    return null; // Or a loading indicator
  }

  // Add default values for numerical properties if they are undefined or null
  const safeOrderData = {
    ...orderData,
    itemTotal: Number(orderData.itemTotal) || 0,
    deliveryCharge: Number(orderData.deliveryCharge) || 0,
    taxes: Number(orderData.taxes) || 0,
    grandTotal: Number(orderData.grandTotal) || 0,
    // Ensure items and customerDetails are not lost
    items: orderData.items || [],
    customerDetails: orderData.customerDetails || {},
    deliveryInfo: orderData.deliveryInfo || {},
  };

  return (
    <div className="checkout-container">
      <header className="checkout-header">
        <h2>Checkout</h2>
        <p>Complete your order details</p>
      </header>

      <form onSubmit={handleSubmit} className="checkout-form">
        <section className="customer-details">
          <h3>Customer Details</h3>
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={customerDetails.name}
              onChange={handleInputChange}
              placeholder="Enter your full name"
              className={errors.name ? "error" : ""}
            />
            {errors.name && (
              <span className="error-message">{errors.name}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone Number</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={customerDetails.phone}
              onChange={handleInputChange}
              placeholder="Enter your phone number"
              className={errors.phone ? "error" : ""}
            />
            {errors.phone && (
              <span className="error-message">{errors.phone}</span>
            )}
          </div>

          {/* Table selection for Dine-In orders */}
          {safeOrderData.orderType === "dine-in" && (
            <div className="form-group">
              <label htmlFor="table-select">Select Table</label>
              {tablesLoading ? (
                <p>Loading tables...</p>
              ) : tablesError ? (
                <p className="error-message">{tablesError}</p>
              ) : tables.length > 0 ? (
                <select
                  id="table-select"
                  value={selectedTable}
                  onChange={(e) => setSelectedTable(e.target.value)}
                  className={errors.table ? "error" : ""}
                >
                  {tables.map((table) => (
                    <option key={table._id} value={table._id}>
                      Table {table.tableNumber}
                    </option>
                  ))}
                </select>
              ) : (
                <p>No available tables.</p>
              )}
              {errors.table && (
                <span className="error-message">{errors.table}</span>
              )}
            </div>
          )}

          {safeOrderData.orderType === "take-away" && (
            <div className="form-group">
              <label htmlFor="address">Delivery Address</label>
              <textarea
                id="address"
                name="address"
                value={customerDetails.address}
                onChange={handleInputChange}
                placeholder="Enter your delivery address"
                className={errors.address ? "error" : ""}
              />
              {errors.address && (
                <span className="error-message">{errors.address}</span>
              )}
            </div>
          )}
        </section>

        <section className="delivery-info">
          <h3>Delivery Information</h3>
          <div className="estimated-time">
            <span>Estimated Delivery Time:</span>
            <span className="time">
              {safeOrderData.deliveryInfo.estimatedTime || "-"} minutes
            </span>
          </div>

          <div className="form-group">
            <label htmlFor="cookingInstructions">Cooking Instructions</label>
            <textarea
              id="cookingInstructions"
              name="cookingInstructions"
              value={deliveryInfo.cookingInstructions}
              onChange={handleDeliveryInfoChange}
              placeholder="Any special instructions for cooking?"
            />
          </div>
        </section>

        <section className="order-summary">
          <h3>Order Summary</h3>
          <div className="order-info-line">
            <span>Order Type:</span>
            <span>{safeOrderData.orderType}</span>
          </div>
          {safeOrderData.items.map((item) => (
            <div key={item._id} className="order-item">
              <span>
                {item.quantity}x {item.name}
              </span>
              <span>₹{(Number(item.price) * item.quantity).toFixed(2)}</span>
            </div>
          ))}
          <div className="order-info-line">
            <span>Item Total:</span>
            <span>₹{safeOrderData.itemTotal.toFixed(2)}</span>
          </div>
          <div className="order-info-line">
            <span>Delivery Charge:</span>
            <span>₹{safeOrderData.deliveryCharge.toFixed(2)}</span>
          </div>
          <div className="order-info-line">
            <span>Taxes:</span>
            <span>₹{safeOrderData.taxes.toFixed(2)}</span>
          </div>
          <div className="order-total">
            <span>Grand Total:</span>
            <span>₹{safeOrderData.grandTotal.toFixed(2)}</span>
          </div>
        </section>

        {submitError && (
          <div className="submit-error-message">{submitError}</div>
        )}

        <button type="submit" className="submit-button" disabled={isSubmitting}>
          {isSubmitting ? "Placing Order..." : "Place Order"}
        </button>
      </form>
    </div>
  );
}

export default Checkout;
