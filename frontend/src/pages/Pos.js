import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axios"; // Import axiosInstance

function Pos() {
  const navigate = useNavigate();
  // State for cart items
  const [cartItems, setCartItems] = useState([]);

  // State for keyboard input
  const [input, setInput] = useState("");

  // State for menu items
  const [menuItems, setMenuItems] = useState([]);

  // State for loading menu items
  const [loading, setLoading] = useState(true);

  // State for error fetching menu items
  const [error, setError] = useState(null);

  // State for order type (dine_in or take_away)
  const [orderType, setOrderType] = useState("dine_in"); // Default to dine_in

  // State for selected table
  const [selectedTable, setSelectedTable] = useState(null);

  // State for available tables
  const [tables, setTables] = useState([]);

  // State for loading tables
  const [loadingTables, setLoadingTables] = useState(true);

  // State for error fetching tables
  const [errorTables, setErrorTables] = useState(null);

  // State for customer details
  const [customerDetails, setCustomerDetails] = useState({
    name: "",
    phone: "",
    address: "", // For take-away orders
  });

  // State for delivery/order details (like estimated time, cooking instructions)
  const [orderExtraInfo, setOrderExtraInfo] = useState({
    estimatedTime: "", // e.g., "45 minutes"
    cookingInstructions: "",
  });

  // Fetch menu items on component mount
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
    fetchTables(); // Fetch tables when component mounts
  }, []);

  // Fetch available tables
  const fetchTables = async () => {
    try {
      setLoadingTables(true);
      // Use axiosInstance for API call
      const { data } = await axiosInstance.get("/api/tables");
      // Filter for available tables if your backend returns status
      // For now, assuming all fetched tables are available to be assigned
      setTables(data);
      if (data.length > 0) {
        setSelectedTable(data[0]._id); // Select the first table by default
      }
    } catch (err) {
      setErrorTables(err.response?.data?.message || err.message);
      console.error("Error fetching tables:", err);
    } finally {
      setLoadingTables(false);
    }
  };

  // Handler for keyboard key press
  const handleKeyPress = (key) => {
    if (key === "DEL") {
      setInput(input.slice(0, -1));
    } else {
      setInput(input + key);
    }
  };

  // Handler for adding item to cart
  const handleAddItem = (item) => {
    // Determine the item ID, checking for both 'id' and '_id'
    const itemId = item.id || item._id;

    // Ensure the item has an ID before proceeding
    if (!item || !itemId) {
      console.error("Attempted to add an item without a valid ID:", item);
      return;
    }

    // Check if item already exists in cart based on its ID
    const existingItemIndex = cartItems.findIndex(
      (cartItem) => cartItem.id === itemId
    );

    if (existingItemIndex >= 0) {
      // If item exists, increase quantity
      const updatedCartItems = [...cartItems];
      updatedCartItems[existingItemIndex].quantity += 1;
      setCartItems(updatedCartItems);
    } else {
      // If item doesn't exist, add it with quantity 1, ensuring ID is present
      setCartItems([
        ...cartItems,
        {
          id: itemId, // Use the determined item ID
          name: item.name,
          price: item.price,
          quantity: 1,
          // Add other properties you might need from the menu item
        },
      ]);
    }
  };

  // Handler for removing item from cart
  const handleRemoveItem = (itemId) => {
    setCartItems(cartItems.filter((item) => item.id !== itemId));
  };

  // Handler for updating item quantity
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

  // Calculate total price
  const totalPrice = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // Group menu items by category
  const menuItemsByCategory = menuItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {});

  // Basic keyboard layout
  const keyboardLayout = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    ["0", ".", "DEL"],
  ];

  // Handler for proceeding with order - now triggered by swipe
  const handlePlaceOrder = async () => {
    // Calculate totals
    const itemTotal = cartItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const deliveryCharge = 0; // You can add delivery charge calculation logic here
    const taxes = itemTotal * 0.1; // 10% tax, adjust as needed
    const grandTotal = itemTotal + deliveryCharge + taxes;

    // Prepare order data to be sent to the backend
    const orderDataToSend = {
      items: cartItems.map((item) => ({
        menuItem: item.id, // Use the ID stored in the cart item
        quantity: item.quantity,
        // Add cookingInstructions if that functionality is added later
      })),
      totalAmount: grandTotal, // Send grandTotal as totalAmount
      orderType: orderType === "take_away" ? "take_away" : orderType, // Use orderType for backend
      status: "processing", // Initial status
      customerDetails: customerDetails, // Include customer details
      deliveryInfo: orderExtraInfo, // Include extra order info (estimated time, instructions)
    };

    // Only include table for dine-in orders
    if (orderType === "dine_in" && selectedTable) {
      orderDataToSend.table = selectedTable;
    } else {
      // Ensure table is not sent for take_away
      delete orderDataToSend.table;
    }

    // Prevent placing order if dine-in is selected but no table is chosen
    if (orderType === "dine_in" && !selectedTable) {
      alert("Please select a table for dine-in orders.");
      return;
    }

    console.log("Order data being sent to backend:", orderDataToSend);

    try {
      // Use axiosInstance for API call
      const { data } = await axiosInstance.post("/api/orders", orderDataToSend);

      console.log("Order placed successfully:", data);

      if (data.success) {
        // Store the order data in localStorage for the confirmation page
        localStorage.setItem("latestOrder", JSON.stringify(data.order));
        // Navigate to confirmation page with the order data
        navigate("/order-confirmation", { state: { order: data.order } });
      } else {
        alert(data.message || "Failed to place order");
      }
    } catch (err) {
      console.error("Failed to place order:", err);
      // Display an error message to the user
      setError(
        `Failed to place order: ${err.response?.data?.message || err.message}`
      );
      alert(
        `Failed to place order: ${err.response?.data?.message || err.message}`
      ); // Also show an alert for immediate feedback
    }
  };

  // State for swipe gesture for the button
  const [buttonSwipeState, setButtonSwipeState] = useState({
    startX: null,
    currentTranslateX: 0,
    isSwiping: false,
  });

  // Threshold for swipe to order button
  const BUTTON_SWIPE_THRESHOLD = 200; // Adjust as needed

  const onButtonTouchStart = (e) => {
    if (cartItems.length === 0) return; // Disable swipe if cart is empty
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

    // Only allow swiping right
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
      handlePlaceOrder(); // Trigger the order placement logic
    }

    // Reset swipe state
    setButtonSwipeState({
      startX: null,
      currentTranslateX: 0,
      isSwiping: false,
    });
  };

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

      <div className="pos-main">
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

        <div className="pos-sidebar">
          <div className="cart-overview">
            <h3>Cart</h3>
            {cartItems.length === 0 ? (
              <p>Cart is empty</p>
            ) : (
              <>
                <ul className="cart-items">
                  {cartItems.map((item) => (
                    <li key={item._id} className="cart-item">
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
                <div className="cart-total">
                  Total: ${totalPrice.toFixed(2)}
                </div>
              </>
            )}
          </div>

          {/* Order Type and Table Selection */}
          <div className="order-options">
            <h3>Order Type</h3>
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

            {orderType === "dine_in" && ( // Only show table selection for Dine In
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
          </div>

          {/* Customer Details Input */}
          <h3>Customer Details</h3>
          <div className="customer-details-input">
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
          <h3>Additional Info</h3>
          <div className="additional-info-input">
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

          <div className="on-screen-keyboard">
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
            >
              <div
                className="swipe-to-order-button"
                style={{
                  transform: `translateX(${buttonSwipeState.currentTranslateX}px)`,
                  transition: buttonSwipeState.isSwiping
                    ? "none"
                    : "transform 0.3s ease-out",
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
