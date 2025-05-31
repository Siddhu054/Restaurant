import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axios";
import "./Menu.css";

function Menu() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const categories = [
    "All",
    "Drink",
    "Burger",
    "Pizza",
    "French Fries",
    "Veggies",
  ];
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cart, setCart] = useState({});
  const [orderType, setOrderType] = useState("dine-in");
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMenuItems = async () => {
      setLoading(true);
      setError(null);
      try {
        const categoryQuery =
          selectedCategory === "All" ? "" : `?category=${selectedCategory}`;
        // Use axiosInstance for API call
        const { data } = await axiosInstance.get(`/api/menu${categoryQuery}`);
        setMenuItems(data);
      } catch (err) {
        setError("Failed to fetch menu items");
        console.error(
          "Error fetching menu items:",
          err.response?.data?.message || err.message
        );
      } finally {
        setLoading(false);
      }
    };

    fetchMenuItems();
  }, [selectedCategory]);

  const handleCategoryClick = (category) => {
    setSelectedCategory(category);

    console.log(`Category selected: ${category}`);
  };

  const handleAddToCart = (item) => {
    setCart((prevCart) => ({
      ...prevCart,
      [item._id]: (prevCart[item._id] || 0) + 1,
    }));
  };

  const handleRemoveFromCart = (item) => {
    setCart((prevCart) => {
      const newCart = { ...prevCart };
      if (newCart[item._id] && newCart[item._id] > 0) {
        newCart[item._id] -= 1;
        if (newCart[item._id] === 0) {
          delete newCart[item._id];
        }
      }
      return newCart;
    });
  };

  const getItemQuantity = (itemId) => {
    return cart[itemId] || 0;
  };

  const calculateCartSummary = () => {
    let itemTotal = 0;

    const itemsInCartDetails = Object.keys(cart)
      .map((itemId) => {
        const item = menuItems.find((menuItem) => menuItem._id === itemId);
        if (item) {
          itemTotal += item.price * cart[itemId];
          return { ...item, quantity: cart[itemId] };
        }
        return null;
      })
      .filter((item) => item !== null);

    const deliveryCharge = itemTotal > 0 ? 50 : 0;
    const taxes = itemTotal > 0 ? itemTotal * 0.1 : 0;
    const grandTotal = itemTotal + deliveryCharge + taxes;

    return {
      items: itemsInCartDetails,
      itemTotal: itemTotal,
      deliveryCharge: deliveryCharge,
      taxes: taxes,
      grandTotal: grandTotal,
    };
  };

  const cartSummary = calculateCartSummary();

  const handleOrderTypeChange = (type) => {
    setOrderType(type);
  };

  const handleNext = () => {
    if (Object.keys(cart).length === 0) return;

    const orderData = {
      items: Object.entries(cart).map(([itemId, quantity]) => {
        const item = menuItems.find((menuItem) => menuItem._id === itemId);

        return {
          _id: item._id,
          name: item.name,
          price: item.price,
          quantity: quantity,
          // cookingInstructions: item.cookingInstructions, // Include if per item instructions needed
        };
      }),
      orderType,
      itemTotal: cartSummary.itemTotal,
      deliveryCharge: cartSummary.deliveryCharge,
      taxes: cartSummary.taxes,
      grandTotal: cartSummary.grandTotal,

      deliveryInfo: {
        estimatedTime: "42",
        cookingInstructions: "",

        deliveryCharge: cartSummary.deliveryCharge,
        taxes: cartSummary.taxes,
      },
    };

    console.log("Navigating to checkout with orderData:", orderData);

    navigate("/checkout", { state: { orderData } });
  };

  return (
    <div className="menu-container">
      <header className="menu-header">
        {/* Header content like "Good evening" */}
        <h2>Good evening</h2>
        <p>Place your order here</p>
        {/* Search bar */}
        <input
          type="text"
          placeholder="Search..."
          className="menu-search-bar"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </header>

      {/* Category tabs placeholder */}
      <section className="menu-categories">
        {categories.map((category) => (
          <div
            key={category}
            className={`category-tab ${
              selectedCategory === category ? "active" : ""
            }`}
            onClick={() => handleCategoryClick(category)}
          >
            {category}
          </div>
        ))}
      </section>

      {/* Menu items list placeholder */}
      <section className="menu-items-list">
        {loading && <p>Loading menu items...</p>}
        {error && <p style={{ color: "red" }}>Error: {error}</p>}
        {!loading && !error && menuItems.length > 0 && (
          <div className="menu-items-grid">
            {menuItems
              .filter((item) =>
                selectedCategory === "All"
                  ? true
                  : item.category.toLowerCase() ===
                    selectedCategory.toLowerCase()
              )
              .filter((item) =>
                item.name.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map((item) => (
                <div key={item._id} className="menu-item-card">
                  {/* Menu Item Card Structure (placeholder) */}
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="menu-item-image"
                    />
                  )}
                  <div className="menu-item-info">
                    <div className="menu-item-name">{item.name}</div>
                    <div className="menu-item-price">₹{item.price}</div>
                  </div>
                  {/* Add/Remove buttons will go here */}
                  <div className="add-remove-buttons">
                    <button onClick={() => handleRemoveFromCart(item)}>
                      -
                    </button>
                    <span>{getItemQuantity(item._id)}</span>{" "}
                    {/* Display quantity from cart */}
                    <button onClick={() => handleAddToCart(item)}>+</button>
                  </div>
                </div>
              ))}
          </div>
        )}
        {!loading && !error && menuItems.length === 0 && (
          <p>No menu items found for this category.</p>
        )}
      </section>

      {/* Cart summary and Next button */}
      {Object.keys(cart).length > 0 && (
        <footer className="menu-footer">
          <div className="order-type-selector">
            <button
              className={`order-type-btn ${
                orderType === "dine-in" ? "active" : ""
              }`}
              onClick={() => handleOrderTypeChange("dine-in")}
            >
              <span className="order-type-icon">🍽️</span>
              <span className="order-type-text">Dine In</span>
            </button>
            <button
              className={`order-type-btn ${
                orderType === "take-away" ? "active" : ""
              }`}
              onClick={() => handleOrderTypeChange("take-away")}
            >
              <span className="order-type-icon">🛍️</span>
              <span className="order-type-text">Take Away</span>
            </button>
          </div>

          <div className="cart-summary">
            <h3>Order Summary</h3>
            {cartSummary.items.map((item) => (
              <div key={item._id} className="cart-item">
                <span>
                  {item.quantity} x {item.name}
                </span>
                <span>₹{(item.quantity * item.price).toFixed(2)}</span>
              </div>
            ))}
            <div className="summary-line">
              <span>Item Total:</span>
              <span>₹{cartSummary.itemTotal}</span>
            </div>
            <div className="summary-line">
              <span>Delivery Charge:</span>
              <span>₹{cartSummary.deliveryCharge}</span>
            </div>
            <div className="summary-line">
              <span>Taxes:</span>
              <span>₹{cartSummary.taxes}</span>
            </div>
            <div className="summary-line grand-total">
              <span>Grand Total:</span>
              <span>₹{cartSummary.grandTotal}</span>
            </div>
          </div>

          <button
            className="next-button"
            onClick={handleNext}
            disabled={Object.keys(cart).length === 0}
          >
            Next
          </button>
        </footer>
      )}
    </div>
  );
}

export default Menu;
