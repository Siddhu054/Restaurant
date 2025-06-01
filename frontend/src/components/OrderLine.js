import React, { useEffect, useState } from "react";
import axiosInstance from "../api/axios";

const getStatusIcon = (status) => {
  switch (status) {
    case "Processing":
      return <span className="order-status-icon">⏳</span>;
    case "Done":
      return <span className="order-status-icon">✅</span>;
    case "Not Picked Up":
      return <span className="order-status-icon">❌</span>;
    default:
      return null;
  }
};

const OrderLine = () => {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    axiosInstance
      .get("/api/orders?limit=20")
      .then((response) => {
        const data = response.data;
        setOrders(Array.isArray(data) ? data : data.orders || []);
      })
      .catch((err) => {
        console.error(
          "Failed to fetch orders for OrderLine:",
          err.response?.data?.message || err.message
        );
      });
  }, []);

  return (
    <div className="order-line-grid">
      {orders.map((order, index) => (
        <div
          key={order._id || index}
          className={`order-card order-card-${
            order.status === "Done"
              ? "done"
              : order.status === "Not Picked Up"
              ? "notpicked"
              : "processing"
          }`}
        >
          <div className="order-card-header">
            <div className="order-card-id">
              🍽️ #{order.orderNumber || order.id}
            </div>
            <div className="order-card-time">
              {order.createdAt
                ? new Date(order.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : ""}
            </div>
          </div>

          <div className="order-card-meta">
            Table-{order.table?.tableNumber || order.table || "--"} •{" "}
            {order.type === "dine_in" ? "Dine In" : "Take Away"}
            {order.waitTime && (
              <span className="order-card-wait">
                Ongoing • {order.waitTime}
              </span>
            )}
          </div>

          <div className="order-card-items">
            <div className="order-card-items-title">
              {order.items?.length || 0} Item
              {order.items?.length > 1 ? "s" : ""}
            </div>
            <ul className="order-card-items-list">
              {order.items?.map((item, i) => (
                <li key={i}>
                  {item.menuItem?.name || item.name} x {item.quantity}
                </li>
              ))}
            </ul>
          </div>

          <div className={`order-card-status`}>
            {order.status === "Done"
              ? "Order Done"
              : order.status === "Not Picked Up"
              ? "Not Picked up"
              : order.status}
            {getStatusIcon(order.status)}
          </div>
        </div>
      ))}
    </div>
  );
};

export default OrderLine;
