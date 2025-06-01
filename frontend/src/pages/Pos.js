import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axios";
import "./Pos.css";

function Pos() {
  const navigate = useNavigate();

  const [cartItems, setCartItems] = useState([]);

  const [input, setInput] = useState("");

  const [menuItems, setMenuItems] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState(null);

  const [orderType, setOrderType] = useState("dine_in"); // Default to dine_in

  const [selectedTable, setSelectedTable] = useState(null);

  const [tables, setTables] = useState([]);

  const [loadingTables, setLoadingTables] = useState(true);

  const [errorTables, setErrorTables] = useState(null);

  const [customerDetails, setCustomerDetails] = useState({
    name: "",
    phone: "",
    address: "",
  });

  const [orderExtraInfo, setOrderExtraInfo] = useState({
    estimatedTime: "",
    cookingInstructions: "",
  });

  const [buttonSwipeState, setButtonSwipeState] = useState({
    startX: null,
    currentTranslateX: 0,
    isSwiping: false,
  });

  const BUTTON_SWIPE_THRESHOLD = 200;

  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        // Use axiosInstance for API call
        const { data } = await axiosInstance.get("/api/menu");
        setMenuItems(data);
      } catch (err) {
        setError(err.response?.data?.message || err.message);
        console.error("Error fetching menu items:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMenuItems();
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      setLoadingTables(true);

      const { data } = await axiosInstance.get("/api/tables");

      setTables(data);
      if (data.length > 0) {
        setSelectedTable(data[0]._id);
      }
    } catch (err) {
      setErrorTables(err.response?.data?.message || err.message);
      console.error("Error fetching tables:", err);
    } finally {
      setLoadingTables(false);
    }
  };

  const handleKeyPress = (key) => {
    if (key === "DEL") {
      setInput(input.slice(0, -1));
    } else {
      setInput(input + key);
    }
  };

  const handleAddItem = (item) => {
    const itemId = item.id || item._id;

    if (!item || !itemId) {
      console.error("Attempted to add an item without a valid ID:", item);
      return;
    }

    const existingItemIndex = cartItems.findIndex(
      (cartItem) => cartItem.id === itemId
    );

    if (existingItemIndex >= 0) {
      const updatedCartItems = [...cartItems];
      updatedCartItems[existingItemIndex].quantity += 1;
      setCartItems(updatedCartItems);
    } else {
      setCartItems([
        ...cartItems,
        {
          id: itemId,
          name: item.name,
          price: item.price,
          quantity: 1,
        },
      ]);
    }
  };

  const handleRemoveItem = (itemId) => {
    setCartItems(cartItems.filter((item) => item.id !== itemId));
  };

  const handleUpdateQuantity = (itemId, newQuantity) => {
    if (newQuantity < 1) {
      handleRemoveItem(itemId);
      return;
    }
    setCartItems(
      cartItems.map((item) =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const totalPrice = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const menuItemsByCategory = menuItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {});

  const keyboardLayout = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    ["0", ".", "DEL"],
  ];

  const handlePlaceOrder = async () => {
    const itemTotal = cartItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const deliveryCharge = 0;
    const taxes = itemTotal * 0.1;
    const grandTotal = itemTotal + deliveryCharge + taxes;

    const orderDataToSend = {
      items: cartItems.map((item) => ({
        menuItem: item.id,
        quantity: item.quantity,
      })),
      totalAmount: grandTotal,
      orderType: orderType === "take_away" ? "take_away" : orderType,
      status: "processing",
      customerDetails: customerDetails,
      deliveryInfo: orderExtraInfo,
    };

    if (orderType === "dine_in" && selectedTable) {
      orderDataToSend.table = selectedTable;
    } else {
      delete orderDataToSend.table;
    }

    if (orderType === "dine_in" && !selectedTable) {
      alert("Please select a table for dine-in orders.");
      return;
    }

    console.log("Order data being sent to backend:", orderDataToSend);

    try {
      const { data } = await axiosInstance.post("/api/orders", orderDataToSend);

      console.log("Order placed successfully:", data);

      if (data.success) {
        localStorage.setItem("latestOrder", JSON.stringify(data.order));

        navigate("/order-confirmation", { state: { order: data.order } });
      } else {
        alert(data.message || "Failed to place order");
      }
    } catch (err) {
      console.error("Failed to place order:", err);

      setError(
        `Failed to place order: ${err.response?.data?.message || err.message}`
      );
      alert(
        `Failed to place order: ${err.response?.data?.message || err.message}`
      );
    }
  };

  const onButtonTouchStart = (e) => {
    if (cartItems.length === 0) return;
    if (e.touches.length === 1) {
      setButtonSwipeState({
        startX: e.touches[0].clientX,
        currentTranslateX: 0,
        isSwiping: true,
      });
    }
  };

  const onButtonTouchMove = (e) => {
    if (!buttonSwipeState.isSwiping) return;

    const currentX = e.touches[0].clientX;
    const deltaX = currentX - buttonSwipeState.startX;

    const newTranslateX = Math.max(0, deltaX);

    setButtonSwipeState((prevState) => ({
      ...prevState,
      currentTranslateX: newTranslateX,
    }));
  };

  const onButtonTouchEnd = () => {
    if (!buttonSwipeState.isSwiping) return;

    const shouldTriggerAction =
      buttonSwipeState.currentTranslateX >= BUTTON_SWIPE_THRESHOLD;

    if (shouldTriggerAction) {
      handlePlaceOrder();
    }

    setButtonSwipeState({
      startX: null,
      currentTranslateX: 0,
      isSwiping: false,
    });
  };

  const onButtonMouseDown = (e) => {
    if (cartItems.length === 0) return;
    setButtonSwipeState({
      startX: e.clientX,
      currentTranslateX: 0,
      isSwiping: true,
    });
  };

  const onButtonMouseMove = (e) => {
    if (!buttonSwipeState.isSwiping) return;

    const currentX = e.clientX;
    const deltaX = currentX - buttonSwipeState.startX;

    const newTranslateX = Math.max(0, deltaX);

    setButtonSwipeState((prevState) => ({
      ...prevState,
      currentTranslateX: newTranslateX,
    }));
  };

  const onButtonMouseUp = () => {
    if (!buttonSwipeState.isSwiping) return;

    const shouldTriggerAction =
      buttonSwipeState.currentTranslateX >= BUTTON_SWIPE_THRESHOLD;

    if (shouldTriggerAction) {
      handlePlaceOrder();
    }

    setButtonSwipeState({
      startX: null,
      currentTranslateX: 0,
      isSwiping: false,
    });
  };

  useEffect(() => {
    window.addEventListener("mouseup", onButtonMouseUp);
    return () => {
      window.removeEventListener("mouseup", onButtonMouseUp);
    };
  }, [
    buttonSwipeState.isSwiping,
    buttonSwipeState.startX,
    buttonSwipeState.currentTranslateX,
  ]);

  useEffect(() => {
    const repeatOrderCart = localStorage.getItem("repeatOrderCart");
    if (repeatOrderCart) {
      setCartItems(JSON.parse(repeatOrderCart));
      localStorage.removeItem("repeatOrderCart");
    }
  }, []);

  if (loading) return <div>Loading menu items...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="pos-container">
      <h2>Point of Sale</h2>

      <div className="pos-layout">
        <div className="item-browsing-area">
          <h3>Menu Items</h3>
          {Object.entries(menuItemsByCategory).map(([category, items]) => (
            <div key={category} className="menu-category">
              <h4>{category.replace(/_/g, " ").toUpperCase()}</h4>
              <div className="menu-items-grid">
                {items.map((item) => (
                  <div
                    key={item._id}
                    className="menu-item"
                    onClick={() => handleAddItem(item)}
                  >
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="menu-item-image"
                      />
                    )}
                    <div className="menu-item-details">
                      <h5>{item.name}</h5>
                      <p className="menu-item-price">
                        ${item.price.toFixed(2)}
                      </p>
                      {item.description && (
                        <p className="menu-item-description">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="cart-overview">
          <h3>Cart</h3>
          {cartItems.length === 0 ? (
            <p>Cart is empty</p>
          ) : (
            <>
              <ul className="cart-items">
                {cartItems.map((item) => (
                  <li key={item.id} className="cart-item">
                    <div className="cart-item-details">
                      <span className="cart-item-name">{item.name}</span>
                      <span className="cart-item-price">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                    <div className="cart-item-quantity">
                      <button
                        onClick={() =>
                          handleUpdateQuantity(item.id, item.quantity - 1)
                        }
                      >
                        -
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        onClick={() =>
                          handleUpdateQuantity(item.id, item.quantity + 1)
                        }
                      >
                        +
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="cart-total">Total: ${totalPrice.toFixed(2)}</div>
            </>
          )}

          {/* Order Type and Table Selection */}
          <div className="order-type-selector">
            <button
              className={`order-type-button ${
                orderType === "dine_in" ? "active" : ""
              }`}
              onClick={() => setOrderType("dine_in")}
            >
              Dine In
            </button>
            <button
              className={`order-type-button ${
                orderType === "take_away" ? "active" : ""
              }`}
              onClick={() => setOrderType("take_away")}
            >
              Take Away
            </button>
          </div>

          {orderType === "dine_in" && (
            <div className="table-selector">
              <h3>Select Table</h3>
              {loadingTables ? (
                <p>Loading tables...</p>
              ) : errorTables ? (
                <p>Error loading tables: {errorTables}</p>
              ) : tables.length > 0 ? (
                <select
                  value={selectedTable || ""}
                  onChange={(e) => setSelectedTable(e.target.value)}
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
            </div>
          )}

          {/* Customer Details Input */}
          <div className="customer-details">
            <h3>Customer Details</h3>
            <input
              type="text"
              placeholder="Name"
              value={customerDetails.name}
              onChange={(e) =>
                setCustomerDetails({ ...customerDetails, name: e.target.value })
              }
            />
            <input
              type="text"
              placeholder="Phone"
              value={customerDetails.phone}
              onChange={(e) =>
                setCustomerDetails({
                  ...customerDetails,
                  phone: e.target.value,
                })
              }
            />
            {orderType === "take_away" && (
              <textarea
                placeholder="Delivery Address"
                value={customerDetails.address}
                onChange={(e) =>
                  setCustomerDetails({
                    ...customerDetails,
                    address: e.target.value,
                  })
                }
              />
            )}
          </div>

          {/* Additional Order Info Input */}
          <div className="additional-info">
            <h3>Additional Info</h3>
            {orderType === "dine_in" && (
              <input
                type="text"
                placeholder="Estimated Time (e.g. 30 minutes)"
                value={orderExtraInfo.estimatedTime}
                onChange={(e) =>
                  setOrderExtraInfo({
                    ...orderExtraInfo,
                    estimatedTime: e.target.value,
                  })
                }
              />
            )}
            <textarea
              placeholder="Cooking Instructions"
              value={orderExtraInfo.cookingInstructions}
              onChange={(e) =>
                setOrderExtraInfo({
                  ...orderExtraInfo,
                  cookingInstructions: e.target.value,
                })
              }
            />
          </div>

          <div className="keyboard-input">
            <h3>Keyboard Input</h3>
            <input type="text" value={input} readOnly />
            <div className="keyboard-keys">
              {keyboardLayout.map((row, rowIndex) => (
                <div key={rowIndex} className="keyboard-row">
                  {row.map((key) => (
                    <button key={key} onClick={() => handleKeyPress(key)}>
                      {key}
                    </button>
                  ))}
                </div>
              ))}
            </div>

            {/* Swipe to Order Button */}
            <div
              className={`swipe-to-order-container ${
                cartItems.length === 0 ? "disabled" : ""
              }`}
              onTouchStart={onButtonTouchStart}
              onTouchMove={onButtonTouchMove}
              onTouchEnd={onButtonTouchEnd}
              onMouseDown={onButtonMouseDown}
              onMouseMove={onButtonMouseMove}
            >
              <div
                className={`swipe-to-order-button ${
                  buttonSwipeState.isSwiping ? "swiping" : ""
                }`}
                style={{
                  transform: `translateX(${buttonSwipeState.currentTranslateX}px)`,
                }}
              >
                <span className="swipe-arrow">→</span>
                Swipe to Order
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Pos;
