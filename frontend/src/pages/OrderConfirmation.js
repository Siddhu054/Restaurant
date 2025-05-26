import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./OrderConfirmation.css"; // We will create this file next

function OrderConfirmation() {
  const location = useLocation();
  const navigate = useNavigate();
  // Use localStorage fallback for order data
  const { order: passedOrder } = location.state || {};
  const storedOrder = (() => {
    try {
      return JSON.parse(localStorage.getItem("latestOrder"));
    } catch {
      return null;
    }
  })();
  const order = passedOrder || storedOrder;

  // Improved debugging
  useEffect(() => {
    console.log("Full Order object:", order);
    if (order) {
      console.log("Customer Details:", order.customerDetails);
      console.log("Delivery Info:", order.deliveryInfo);
    }
  }, [order]);

  // Redirect to menu if no order data is found (e.g., direct access or refresh)
  useEffect(() => {
    if (!order) {
      navigate("/menu", { replace: true });
    }
  }, [order, navigate]);

  // If no order data, show a loading/redirecting message or null
  if (!order) {
    return <div className="order-confirmation-container">Redirecting...</div>;
  }

  console.log("Order items structure:", order.items);

  return (
    <div className="order-confirmation-container">
      <header className="order-confirmation-header">
        <h2>Order Confirmed!</h2>
        <p>Thank you for your order. Details are below:</p>
      </header>

      <section className="order-details-summary">
        <h3>Order Summary</h3>
        <div className="order-info-line">
          <span>Order ID:</span>
          <span>#{order._id || "N/A"}</span>
        </div>
        <div className="order-info-line">
          <span>Order Time:</span>
          <span>
            {order.createdAt
              ? new Date(order.createdAt).toLocaleString()
              : "N/A"}
          </span>
        </div>
        <div className="order-info-line">
          <span>Order Type:</span>
          <span>{order.type || "N/A"}</span>
        </div>

        <h4>Items:</h4>
        <ul className="ordered-items-list">
          {(order.items || []).map((item, index) => {
            // Debug log for each item
            console.log("Rendering item:", item, "menuItem:", item?.menuItem);
            let itemName = "Unknown Item";
            let itemPrice = 0;

            // Check if item.menuItem exists and is an object with a name
            if (
              item?.menuItem &&
              typeof item.menuItem === "object" &&
              item.menuItem.name
            ) {
              itemName = item.menuItem.name;
              itemPrice = item.menuItem.price || 0;
            } else if (item?.name) {
              // Fallback to item.name if available on the item itself
              itemName = item.name;
              itemPrice = item.price || 0;
            } else if (typeof item?.menuItem === "string") {
              // Fallback if menuItem is just an ID string
              itemName = `Item ID: ${item.menuItem}`; // Display the ID if name is not available
              itemPrice = item.price || 0;
            }

            return (
              // Use a combination of order item ID and index for the key if item._id is not reliable here
              <li key={item._id || `item-${index}`} className="ordered-item">
                <span>
                  {item.quantity}x {itemName}
                </span>
                <span>₹{(Number(itemPrice) * item.quantity).toFixed(2)}</span>
              </li>
            );
          })}
        </ul>

        <div className="order-info-line total">
          <span>Total:</span>
          <span>₹{order.total || order.grandTotal || "N/A"}</span>
        </div>
      </section>

      <section className="customer-info-summary">
        <h3>Customer Details</h3>
        <div className="order-info-line">
          <span>Name:</span>
          <span>{order.customer?.name || "N/A"}</span>
        </div>
        <div className="order-info-line">
          <span>Phone:</span>
          <span>{order.customer?.phone || "N/A"}</span>
        </div>
        {order.orderType === "take-away" && (
          <div className="order-info-line">
            <span>Delivery Address:</span>
            <span>{order.customer?.address || "N/A"}</span>
          </div>
        )}
      </section>

      <section className="delivery-instructions-summary">
        <h3>Delivery Information</h3>
        <div className="order-info-line">
          <span>Estimated Time:</span>
          <span>{order.deliveryInfo?.estimatedTime || "N/A"} minutes</span>
        </div>
        <div className="order-info-line">
          <span>Cooking Instructions:</span>
          <span>
            {order.deliveryInfo?.cookingInstructions || "None provided"}
          </span>
        </div>
      </section>

      {/* Placeholder for Order Tracking Information (will implement later) */}
      <section className="order-tracking">
        <h3>Order Status</h3>
        <p>Your order is currently: {order.status || "N/A"}</p>
        {/* More detailed tracking info/progress bar will go here */}
      </section>

      {/* Add a button to go back to menu or home */}
      <button className="back-to-menu-button" onClick={() => navigate("/menu")}>
        Back to Menu
      </button>
    </div>
  );
}

export default OrderConfirmation;
