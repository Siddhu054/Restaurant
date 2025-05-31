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

function AppContent() {
  const location = useLocation();
  const [dashboardData, setDashboardData] = useState({});
  const [orderSummary, setOrderSummary] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    totalItemsSold: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const triggerDashboardRefetch = () => {
    setRefetchTrigger((prev) => prev + 1);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get("/dashboard/summary");
        setDashboardData(response.data);
        if (response.data.orderSummary) {
          setOrderSummary(response.data.orderSummary);
        }
        setError(null);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError(err);
        setDashboardData({});
        setOrderSummary({});
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [refetchTrigger]);

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo"></div>
        <nav className="sidebar-nav">
          <Link
            to="/dashboard"
            className={location.pathname === "/dashboard" ? "active" : ""}
            title="Analytics"
          >
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
          <Route
            path="/order-management"
            element={
              <OrderManagement
                triggerDashboardRefetch={triggerDashboardRefetch}
              />
            }
          />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
