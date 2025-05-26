import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Menu.css"; // We will create this file next

function Menu() {
  const [selectedCategory, setSelectedCategory] = useState("All"); // State for active category
  const categories = [
    "All",
    "Drink",
    "Burger",
    "Pizza",
    "French Fries",
    "Veggies",
  ]; // List of categories
  const [menuItems, setMenuItems] = useState([]); // State to store menu items
  const [loading, setLoading] = useState(true); // State for loading indicator
  const [error, setError] = useState(null); // State for error handling
  const [cart, setCart] = useState({}); // State to store cart items: { itemId: quantity }
  const [orderType, setOrderType] = useState("dine-in"); // Add orderType state
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  // Effect to fetch menu items when selectedCategory changes
  useEffect(() => {
    const fetchMenuItems = async () => {
      setLoading(true);
      setError(null);
      try {
        const categoryQuery =
          selectedCategory === "All" ? "" : `?category=${selectedCategory}`;
        const response = await fetch(
          `http://localhost:5000/api/menu${categoryQuery}`
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setMenuItems(data);
      } catch (err) {
        setError("Failed to fetch menu items");
        console.error("Error fetching menu items:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMenuItems();
  }, [selectedCategory]); // Rerun effect when selectedCategory changes

  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
    // Future: Fetch menu items for this category
    console.log(`Category selected: ${category}`);
  };

  // Handle adding item to cart
  const handleAddToCart = (item) => {
    setCart((prevCart) => ({
      ...prevCart,
      [item._id]: (prevCart[item._id] || 0) + 1,
    }));
  };

  // Handle removing item from cart
  const handleRemoveFromCart = (item) => {
    setCart((prevCart) => {
      const newCart = { ...prevCart };
      if (newCart[item._id] && newCart[item._id] > 0) {
        newCart[item._id] -= 1;
        if (newCart[item._id] === 0) {
          delete newCart[item._id]; // Remove item if quantity is zero
        }
      }
      return newCart;
    });
  };

  // Helper to get item quantity in cart
  const getItemQuantity = (itemId) => {
    return cart[itemId] || 0;
  };

  // Calculate cart summary
  const calculateCartSummary = () => {
    let itemTotal = 0;
    // Assuming menuItems state is populated with all available items
    // It might be more efficient to have a separate state or map for quick item lookup by ID
    // For now, we'll iterate through menuItems to find the price.
    // A more robust solution would be to get the price from the backend when adding to cart,
    // or build a map like { itemId: { price, name, ... } } from fetched menuItems.
    const itemsInCartDetails = Object.keys(cart)
      .map((itemId) => {
        const item = menuItems.find((menuItem) => menuItem._id === itemId);
        if (item) {
          itemTotal += item.price * cart[itemId];
          return { ...item, quantity: cart[itemId] };
        }
        return null; // Should not happen if item is in cart and menuItems are loaded
      })
      .filter((item) => item !== null); // Filter out any potential nulls

    // Placeholder values for now
    const deliveryCharge = itemTotal > 0 ? 50 : 0; // Example: free delivery if order is 0
    const taxes = itemTotal > 0 ? itemTotal * 0.1 : 0; // Example: 10% tax if order > 0
    const grandTotal = itemTotal + deliveryCharge + taxes;

    return {
      items: itemsInCartDetails,
      itemTotal: itemTotal, // Return as number before toFixed for calculations
      deliveryCharge: deliveryCharge, // Return as number
      taxes: taxes, // Return as number
      grandTotal: grandTotal, // Return as number
    };
  };

  const cartSummary = calculateCartSummary();

  const handleOrderTypeChange = (type) => {
    setOrderType(type);
    // You can add additional logic here if needed when order type changes
  };

  const handleNext = () => {
    if (Object.keys(cart).length === 0) return;

    // Prepare order data
    const orderData = {
      items: Object.entries(cart).map(([itemId, quantity]) => {
        const item = menuItems.find((menuItem) => menuItem._id === itemId);
        // Pass necessary item details for display on checkout, using data from menuItems state
        return {
          _id: item._id,
          name: item.name,
          price: item.price, // Pass item price as number
          quantity: quantity,
          // cookingInstructions: item.cookingInstructions, // Include if per item instructions needed
        };
      }),
      orderType, // Include order type
      itemTotal: cartSummary.itemTotal, // Include calculated item total
      deliveryCharge: cartSummary.deliveryCharge, // Include calculated delivery charge
      taxes: cartSummary.taxes, // Include calculated taxes
      grandTotal: cartSummary.grandTotal, // Include calculated grand total
      // Add placeholder deliveryInfo structure expected by backend if needed for consistency
      deliveryInfo: {
        estimatedTime: "42", // Placeholder
        cookingInstructions: "", // Placeholder - will be filled on checkout
        // deliveryCharge and taxes are now at the top level, but backend expects them nested
        // Let's align frontend passing with backend expectation for deliveryInfo
        // Reverting backend change to accept deliveryCharge/taxes at top level
        // And passing deliveryCharge/taxes within deliveryInfo from frontend
        deliveryCharge: cartSummary.deliveryCharge,
        taxes: cartSummary.taxes,
      },
    };

    console.log("Navigating to checkout with orderData:", orderData); // Log data being passed

    // Navigate to checkout with order data
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
