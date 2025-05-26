import React, { useEffect, useState } from "react";
import "./App.css";
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import OrderManagement from "./pages/OrderManagement";
import TableManagement from "./pages/TableManagement";
import Menu from "./pages/Menu";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import Pos from "./pages/Pos";
import PastOrders from "./pages/PastOrders";
import {
  FaTachometerAlt,
  FaChair,
  FaBook,
  FaChartBar,
  FaCreditCard,
  FaHistory,
} from "react-icons/fa";

function App() {
  // Assuming dashboardData and orderSummary are still needed for the dashboard, keeping the state and fetch for now
  const [dashboardData, setDashboardData] = useState({});
  const [orderSummary, setOrderSummary] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    totalItemsSold: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch(
          "http://localhost:5000/api/dashboard/summary"
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const json = await response.json();
        console.log("Fetched data:", json); // Log fetched data

        // Defensive check for required fields and map to state
        if (json.orderSummary) {
          // Set the raw orderSummary data
          setDashboardData((prevData) => ({
            ...prevData,
            orderSummary: json.orderSummary,
          }));
        } else {
          console.warn("orderSummary is undefined in fetched data", json);
          setDashboardData((prevData) => ({ ...prevData, orderSummary: {} })); // Set empty object if data is missing
        }

        if (json.dailyRevenue) {
          // Set the raw dailyRevenue data
          setDashboardData((prevData) => ({
            ...prevData,
            dailyRevenue: json.dailyRevenue,
          }));
        } else {
          console.warn("dailyRevenue is undefined in fetched data", json);
          setDashboardData((prevData) => ({ ...prevData, dailyRevenue: [] })); // Set empty array if data is missing
        }

        if (json.tables) {
          setDashboardData((prevData) => ({
            ...prevData,
            tables: json.tables,
          }));
        } else {
          console.warn("tables is undefined in fetched data", json);
          setDashboardData((prevData) => ({ ...prevData, tables: [] }));
        }

        if (json.chefOrders) {
          setDashboardData((prevData) => ({
            ...prevData,
            chefOrders: json.chefOrders,
          }));
        } else {
          console.warn("chefOrders is undefined in fetched data", json);
          setDashboardData((prevData) => ({ ...prevData, chefOrders: [] }));
        }
        if (json.totalChefs !== undefined) {
          setDashboardData((prevData) => ({
            ...prevData,
            totalChefs: json.totalChefs,
          }));
        }
        if (json.totalRevenue !== undefined) {
          setDashboardData((prevData) => ({
            ...prevData,
            totalRevenue: json.totalRevenue,
          }));
        }
        if (json.totalOrders !== undefined) {
          setDashboardData((prevData) => ({
            ...prevData,
            totalOrders: json.totalOrders,
          }));
        }
        if (json.totalClients !== undefined) {
          setDashboardData((prevData) => ({
            ...prevData,
            totalClients: json.totalClients,
          }));
        }
      } catch (error) {
        setError(error);
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []); // Empty dependency array means this effect runs once on mount

  // The table state and handlers are now moved to TableManagement component

  return (
    <Router>
      <div className="app-container">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-logo"></div>
          <nav className="sidebar-nav">
            <Link to="/dashboard" className="nav-btn" title="Analytics">
              <FaChartBar size={30} />
            </Link>
            <Link to="/tables" className="nav-btn" title="Tables">
              <FaChair size={30} />
            </Link>
            <Link to="/orders" className="nav-btn" title="Orders">
              <FaBook size={30} />
            </Link>
            <Link to="/pos" className="nav-btn" title="POS">
              <FaCreditCard size={30} />
            </Link>
            <Link to="/past-orders" className="nav-btn" title="Past Orders">
              <FaHistory size={30} />
            </Link>
          </nav>
        </aside>

        {/* Main Content with Routes */}
        <main className="main-content">
          <Routes>
            <Route
              path="/"
              element={
                <Dashboard
                  dashboardData={dashboardData}
                  orderSummary={orderSummary}
                  loading={loading}
                  error={error}
                />
              }
            />
            <Route
              path="/dashboard"
              element={
                <Dashboard
                  dashboardData={dashboardData}
                  orderSummary={orderSummary}
                  loading={loading}
                  error={error}
                />
              }
            />
            <Route path="/orders" element={<OrderManagement />} />
            <Route path="/tables" element={<TableManagement />} />
            <Route path="/menu" element={<Menu />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/order-confirmation" element={<OrderConfirmation />} />
            <Route path="/pos" element={<Pos />} />
            <Route path="/past-orders" element={<PastOrders />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
