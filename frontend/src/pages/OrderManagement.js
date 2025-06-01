import React, { useEffect, useState } from "react";
import "../App.css";
import OrderLine from "../components/OrderLine";
import axiosInstance from "../api/axios";

function OrderManagement() {
  const [orders, setOrders] = useState([]);
  const [chefs, setChefs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [assigning, setAssigning] = useState({});
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchOrders();
    fetchChefs();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setOrders((prevOrders) => [...prevOrders]);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const fetchOrders = async () => {
    try {
      const { data } = await axiosInstance.get("/api/orders");
      setOrders(data);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      console.error("Failed to load orders:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchChefs = async () => {
    try {
      // Use axiosInstance for API call
      const { data } = await axiosInstance.get("/api/chefs");
      setChefs(Array.isArray(data) ? data : data.chefs || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      console.error("Failed to fetch chefs:", err);
      setChefs([]);
    }
  };

  const handleMarkAsDone = async (orderId) => {
    try {
      const res = await axiosInstance.put(`/api/orders/${orderId}`, {
        status: "done",
      });
      if (!res.data.success) {
        throw new Error(res.data.message);
      }
      fetchOrders();
    } catch (err) {
      setError(
        `Failed to update order status: ${
          err.response?.data?.message || err.message
        }`
      );
      console.error("Failed to update order status:", err);
    }
  };

  const handleMarkAsServed = async (orderId) => {
    try {
      const res = await axiosInstance.put(`/api/orders/${orderId}`, {
        status: "served",
      });
      if (!res.data.success) {
        throw new Error(res.data.message);
      }
      fetchOrders();
    } catch (err) {
      setError(
        `Failed to update order status: ${
          err.response?.data?.message || err.message
        }`
      );
      console.error("Failed to update order status:", err);
    }
  };

  const handleRepeatOrder = async (order) => {
    try {
      const originalType = order.type || order.orderType;
      const mappedType = originalType
        ? originalType.replace("-", "_")
        : "dine_in";
      const newOrderData = {
        items: order.items.map((item) => ({
          menuItem: item.menuItem._id || item.menuItem,
          quantity: item.quantity,
          cookingInstructions: item.cookingInstructions,
        })),
        type: mappedType,
        status: "processing",
      };
      if (mappedType === "dine_in" && order.table) {
        newOrderData.table = order.table._id || order.table;
      }

      const { data } = await axiosInstance.post("/api/orders", newOrderData);
      if (!data.success) {
        throw new Error(data.message);
      }
      fetchOrders();
      alert("Order repeated successfully!");
    } catch (err) {
      setError(
        `Failed to repeat order: ${err.response?.data?.message || err.message}`
      );
      console.error("Failed to repeat order:", err);
      alert(err.response?.data?.message || err.message);
    }
  };

  const handleAssignChef = async (orderId, chefId) => {
    setAssigning((prev) => ({ ...prev, [orderId]: true }));
    try {
      const res = await axiosInstance.put(
        `/api/orders/${orderId}/assign-chef`,
        { chefId }
      );
      if (!res.data.success) {
        throw new Error(res.data.message);
      }
      await fetchOrders();
    } catch (err) {
      setError(
        `Failed to assign chef: ${err.response?.data?.message || err.message}`
      );
      console.error("Failed to assign chef:", err);
    } finally {
      setAssigning((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  const formatDuration = (startTime, endTime, status) => {
    let end = new Date();
    if (status === "done" || status === "served") {
      end = endTime ? new Date(endTime) : end;
    }
    const start = new Date(startTime);
    const diffInSeconds = Math.floor((end - start) / 1000);
    const hours = Math.floor(diffInSeconds / 3600);
    const minutes = Math.floor((diffInSeconds % 3600) / 60);
    const seconds = diffInSeconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  const filteredOrders = orders.filter((order) => {
    if (filter === "all") return true;
    return order.status === filter;
  });

  const sortedOrders = [...filteredOrders].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  const [swipeState, setSwipeState] = useState({
    startX: null,
    currentTranslateX: 0,
    isSwiping: false,
    swipingCardId: null,
  });

  const SWIPE_THRESHOLD = -100;

  const onTouchStart = (e, orderId) => {
    if (e.touches.length === 1) {
      setSwipeState({
        startX: e.touches[0].clientX,
        currentTranslateX: 0,
        isSwiping: true,
        swipingCardId: orderId,
      });
    }
  };

  const onTouchMove = (e) => {
    if (!swipeState.isSwiping || swipeState.swipingCardId === null) return;
    const currentX = e.touches[0].clientX;
    const deltaX = currentX - swipeState.startX;
    const newTranslateX = Math.min(0, deltaX);
    setSwipeState((prevState) => ({
      ...prevState,
      currentTranslateX: newTranslateX,
    }));
  };

  const onTouchEnd = (e, orderId) => {
    if (!swipeState.isSwiping || swipeState.swipingCardId !== orderId) return;
    const order = sortedOrders.find((o) => o._id === orderId);
    const shouldTriggerAction =
      swipeState.currentTranslateX <= SWIPE_THRESHOLD &&
      order?.status === "processing";
    if (shouldTriggerAction) {
      handleMarkAsDone(orderId);
    }
    setSwipeState({
      startX: null,
      currentTranslateX: 0,
      isSwiping: false,
      swipingCardId: null,
    });
  };

  const getCardBgClass = (type, status) => {
    if (status === "served") {
      if (type === "dine_in") return "order-card-bg-served-dinein";
      if (type === "take_away" || type === "takeaway")
        return "order-card-bg-takeaway";
    }
    if (status === "processing") return "order-card-bg-dinein";
    if (status === "done") return "order-card-bg-done";
    if (type === "dine_in") return "order-card-bg-dinein";
    if (type === "take_away" || type === "takeaway")
      return "order-card-bg-takeaway";
    return "order-card-bg-default";
  };

  if (loading) return <div className="main-content">Loading orders...</div>;
  if (error) return <div className="main-content">Error: {error}</div>;

  return (
    <div className="main-content order-management-container">
      <h2>Order Line</h2>
      <div className="filter-panel">
        <label>
          Filter by Status:
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All Orders</option>
            <option value="processing">Processing</option>
            <option value="done">Done</option>
            <option value="served">Served</option>
            <option value="not_picked_up">Not Picked Up</option>
          </select>
        </label>
      </div>
      <div className="order-grid">
        {sortedOrders.map((order) => (
          <div
            key={order._id}
            className={`order-card ${getCardBgClass(
              order.type,
              order.status
            )} order-status-${order.status} ${
              swipeState.isSwiping && swipeState.swipingCardId === order._id
                ? "swiping"
                : ""
            } ${order.status === "processing" ? "swipe-left-feedback" : ""}`}
            onTouchStart={(e) => onTouchStart(e, order._id)}
            onTouchMove={onTouchMove}
            onTouchEnd={(e) => onTouchEnd(e, order._id)}
          >
            <div
              className="order-card-content"
              style={{
                transform:
                  swipeState.swipingCardId === order._id
                    ? `translateX(${swipeState.currentTranslateX}px)`
                    : "none",
              }}
            >
              <div className="order-header">
                <div className="order-id">Order #{order.orderNumber}</div>
                <div className="order-header-details">
                  <span
                    className={`order-type order-type-${order.type.replace(
                      "_",
                      "-"
                    )}`}
                  >
                    {order.type.replace("_", " ")}
                  </span>
                  <span className="order-duration">
                    {formatDuration(
                      order.createdAt,
                      order.endTime,
                      order.status
                    )}
                  </span>
                  <span className="order-status-text">
                    {order.status.replace("_", " ")}
                  </span>
                </div>
              </div>
              <div className="order-details">
                <span className="order-table">
                  {order.table
                    ? `Table ${order.table.tableNumber}`
                    : "No Table"}
                </span>
                <span className="order-time">
                  {new Date(order.createdAt).toLocaleTimeString()}
                </span>
                <span className="order-item-count">
                  {order.items.length}{" "}
                  {order.items.length === 1 ? "Item" : "Items"}
                </span>
              </div>
              {order.cookingInstructions && (
                <div className="cooking-instructions">
                  {order.cookingInstructions}
                </div>
              )}
              <ul className="order-items-list">
                {order.items.map((item, index) => (
                  <li key={index}>
                    {item.quantity}x {item.menuItem.name}
                  </li>
                ))}
              </ul>
              <div className="order-actions">
                {order.status === "processing" && (
                  <>
                    <button
                      className="processing-button"
                      onClick={() => handleMarkAsDone(order._id)}
                    >
                      Mark as Done
                    </button>
                    <select
                      value={order.assignedChef || ""}
                      onChange={(e) =>
                        handleAssignChef(order._id, e.target.value)
                      }
                      disabled={assigning[order._id]}
                      style={{
                        marginTop: 8,
                        padding: "8px 12px",
                        borderRadius: 8,
                      }}
                    >
                      <option value="">Select Chef</option>
                      {chefs.map((chef) => (
                        <option key={chef._id} value={chef._id}>
                          {chef.name}
                        </option>
                      ))}
                    </select>
                  </>
                )}
                {order.status === "done" && (
                  <button
                    className="order-done-button"
                    onClick={() => handleMarkAsServed(order._id)}
                  >
                    Mark as Served
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default OrderManagement;
