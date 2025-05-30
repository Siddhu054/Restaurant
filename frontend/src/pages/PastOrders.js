import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axios"; // Import axiosInstance

function PastOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Use axiosInstance for API call
    axiosInstance
      .get("/api/orders?limit=20")
      .then((response) => {
        const data = response.data;
        let fetchedOrders = Array.isArray(data) ? data : data.orders || [];
        // Sort orders by createdAt descending (latest first)
        fetchedOrders = [...fetchedOrders].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        setOrders(fetchedOrders);
        setLoading(false);
      })
      .catch((err) => {
        setError(
          `Failed to fetch past orders: ${
            err.response?.data?.message || err.message
          }`
        );
        setLoading(false);
        console.error("Failed to fetch past orders:", err);
      });
  }, []);

  const handleRepeatOrder = (order) => {
    // Map past order items to POS cart format
    const repeatedItems = order.items.map((item) => ({
      id: item.menuItem._id || item.menuItem.id || item.menuItem, // adapt as needed
      name: item.menuItem.name || item.name,
      price: item.menuItem.price || item.price,
      quantity: item.quantity,
    }));
    // Store in localStorage for POS page to pick up
    localStorage.setItem("repeatOrderCart", JSON.stringify(repeatedItems));
    // Navigate to POS page
    navigate("/pos?repeat=1");
  };

  if (loading) return <div>Loading past orders...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="past-orders-list">
      <h2>Past Orders</h2>
      {orders.length === 0 && <div>No past orders found.</div>}
      {orders.map((order) => (
        <div key={order._id} className="past-order-card">
          <div style={{ marginBottom: 8 }}>
            <b>Order #{order.orderNumber}</b>
            <span className={`order-type ${order.type}`}>
              {order.type.replace("_", " ")}
            </span>
            <span className="order-date">
              {new Date(order.createdAt).toLocaleString()}
            </span>
          </div>
          <ul style={{ marginBottom: 8 }}>
            {order.items.map((item) => (
              <li key={item.menuItem._id || item.menuItem}>
                {item.menuItem.name || item.name} x {item.quantity}
              </li>
            ))}
          </ul>
          <button
            onClick={() => handleRepeatOrder(order)}
            style={{
              padding: "8px 16px",
              borderRadius: 6,
              background: "#7ed957",
              color: "#fff",
              border: "none",
              cursor: "pointer",
            }}
          >
            Repeat Order
          </button>
        </div>
      ))}
    </div>
  );
}

export default PastOrders;
