import React, { useEffect, useState } from "react";
import "./App.css";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Link,
  useLocation,
} from "react-router-dom";
import axiosInstance from "./api/axios";
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
  const location = useLocation();

  const fetchDashboardData = async () => {
    try {
      const { data } = await axiosInstance.get("/api/dashboard/summary");
      console.log("Fetched data:", data);

      // Defensive check for required fields and map to state
      if (data.orderSummary) {
        setDashboardData((prevData) => ({
          ...prevData,
          orderSummary: data.orderSummary,
        }));
      } else {
        console.warn("orderSummary is undefined in fetched data", data);
        setDashboardData((prevData) => ({ ...prevData, orderSummary: {} }));
      }

      if (data.dailyRevenue) {
        setDashboardData((prevData) => ({
          ...prevData,
          dailyRevenue: data.dailyRevenue,
        }));
      } else {
        console.warn("dailyRevenue is undefined in fetched data", data);
        setDashboardData((prevData) => ({ ...prevData, dailyRevenue: [] }));
      }

      if (data.tables) {
        setDashboardData((prevData) => ({
          ...prevData,
          tables: data.tables,
        }));
      } else {
        console.warn("tables is undefined in fetched data", data);
        setDashboardData((prevData) => ({ ...prevData, tables: [] }));
      }

      if (data.chefOrders) {
        setDashboardData((prevData) => ({
          ...prevData,
          chefOrders: data.chefOrders,
        }));
      } else {
        console.warn("chefOrders is undefined in fetched data", data);
        setDashboardData((prevData) => ({ ...prevData, chefOrders: [] }));
      }

      if (data.totalChefs !== undefined) {
        setDashboardData((prevData) => ({
          ...prevData,
          totalChefs: data.totalChefs,
        }));
      }
      if (data.totalRevenue !== undefined) {
        setDashboardData((prevData) => ({
          ...prevData,
          totalRevenue: data.totalRevenue,
        }));
      }
      if (data.totalOrders !== undefined) {
        setDashboardData((prevData) => ({
          ...prevData,
          totalOrders: data.totalOrders,
        }));
      }
      if (data.totalClients !== undefined) {
        setDashboardData((prevData) => ({
          ...prevData,
          totalClients: data.totalClients,
        }));
      }
    } catch (error) {
      setError(error.response?.data?.message || error.message);
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (location.pathname === "/dashboard" || location.pathname === "/") {
      fetchDashboardData();
    }
    // eslint-disable-next-line
  }, [location.pathname]);

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
