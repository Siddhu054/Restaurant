import React, { useEffect, useState, useRef, useMemo } from "react";
import "../App.css";
import OrderSummaryPie from "../components/OrderSummaryPie";
import RevenueLineChart from "../components/RevenueLineChart";
import OrderSummaryDonut from "../components/OrderSummaryDonut";
import RevenueChart from "../components/RevenueChart";
import // Removed PieChart, Pie, Cell, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer
"recharts";

// Updated colors to match Figma
// const PIE_COLORS = ["#7ED957", "#FFD966", "#6EC6FF"];
// const REVENUE_COLORS = ["#7ED957"];

function Dashboard({ dashboardData, orderSummary, loading, error }) {
  // Defensive helpers
  const safe = (val, fallback = "--") =>
    val !== undefined && val !== null ? val : fallback;
  const safeNum = (val, fallback = "--") =>
    val !== undefined && val !== null && !isNaN(val) ? Number(val) : fallback;

  // Transform order summary data for pie chart
  const pieData = useMemo(() => {
    // Use orderSummary from backend which has counts for served, dineIn, takeAway
    return dashboardData?.orderSummary
      ? [
          { name: "Served", value: dashboardData.orderSummary.served || 0 },
          { name: "Dine In", value: dashboardData.orderSummary.dineIn || 0 },
          {
            name: "Take Away",
            value: dashboardData.orderSummary.takeAway || 0,
          },
        ].filter((item) => item.value > 0) // Filter out categories with 0 orders if desired
      : [];
  }, [dashboardData?.orderSummary]);

  // Transform daily revenue data for line chart - Use day number for X axis
  const lineData = useMemo(() => {
    const transformedData = dashboardData?.dailyRevenue
      ? dashboardData.dailyRevenue.map((item) => ({
          day: item.day, // Use the day number (0-6)
          revenue: item.totalRevenue,
        }))
      : [];

    console.log("Generated lineData:", transformedData);

    return transformedData;
  }, [dashboardData?.dailyRevenue]);

  // Prepare data for the new RevenueChart
  const revenueData = useMemo(() => {
    // Map the backend dailyRevenue array to the format expected by RevenueChart
    const transformedData = dashboardData?.dailyRevenue
      ? dashboardData.dailyRevenue.map((item) => ({
          // Use the date string from the backend as the 'day' key for the chart
          day: item.date,
          revenue: item.totalRevenue,
        }))
      : [];

    console.log("Generated revenueData for chart:", transformedData);

    return transformedData;
  }, [dashboardData?.dailyRevenue]); // Depend on dailyRevenue from backend

  // Create refs for the chart containers
  const pieContainerRef = useRef(null);
  const lineContainerRef = useRef(null);

  // State to store container dimensions
  const [pieContainerSize, setPieContainerSize] = useState({
    width: 0,
    height: 0,
  });
  const [lineContainerSize, setLineContainerSize] = useState({
    width: 0,
    height: 0,
  });

  // Global search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    analytics: "all", // all, served, dine_in, take_away
    tableStatus: "all", // all, available, reserved
    orderType: "all", // all, dine_in, take_away
  });

  const [summaryRange, setSummaryRange] = useState("daily");

  // Helper function to filter tables
  const getFilteredTables = useMemo(() => {
    console.log("DEBUG: Raw tables data:", dashboardData?.tables); // Add debug logging
    let filtered = dashboardData?.tables || [];

    // Filter by table status
    if (filters.tableStatus !== "all") {
      filtered = filtered.filter(
        (table) => table.status === filters.tableStatus
      );
    }

    // Filter by analytics/order type (show only tables with orders matching the filter)
    if (filters.analytics !== "all" || filters.orderType !== "all") {
      const matchingTableIds = new Set(
        (dashboardData?.orders || [])
          .filter((order) => {
            const analyticsMatch =
              filters.analytics === "all" || order.status === filters.analytics;
            const orderTypeMatch =
              filters.orderType === "all" || order.type === filters.orderType;
            return analyticsMatch && orderTypeMatch && order.table;
          })
          .map((order) => order.table?._id || order.table)
      );
      filtered = filtered.filter(
        (table) =>
          // Use tableNumber as fallback if _id is missing
          matchingTableIds.has(table._id) ||
          matchingTableIds.has(table.tableNumber)
      );
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter((table) =>
        String(table.tableNumber)
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      );
    }

    console.log("DEBUG: Filtered tables:", filtered); // Add debug logging
    return filtered;
  }, [
    dashboardData?.tables,
    dashboardData?.orders,
    filters.tableStatus,
    filters.analytics,
    filters.orderType,
    searchQuery,
  ]);

  // Helper function to filter chef orders
  const getFilteredChefOrders = useMemo(() => {
    return (dashboardData?.chefOrders || []).filter((chef) => {
      if (
        searchQuery &&
        !(
          chef.name &&
          chef.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
        return false;
      return true;
    });
  }, [dashboardData?.chefOrders, searchQuery]);

  // Helper function to filter orders
  const getFilteredOrders = useMemo(() => {
    return (dashboardData?.orders || []).filter((order) => {
      if (filters.orderType !== "all" && order.type !== filters.orderType)
        return false;
      if (filters.analytics !== "all" && order.status !== filters.analytics)
        return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (
          !order._id.toLowerCase().includes(q) &&
          !order.status.toLowerCase().includes(q) &&
          !order.items.some((item) =>
            item.menuItem?.name?.toLowerCase().includes(q)
          )
        ) {
          return false;
        }
      }
      return true;
    });
  }, [
    dashboardData?.orders,
    filters.orderType,
    filters.analytics,
    searchQuery,
  ]);

  // Helper function to filter menu items
  const getFilteredMenuItems = useMemo(() => {
    return (dashboardData?.menuItems || []).filter((item) => {
      if (
        searchQuery &&
        !item.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
        return false;
      return true;
    });
  }, [dashboardData?.menuItems, searchQuery]);

  useEffect(() => {
    // Function to update container sizes
    const updateContainerSize = () => {
      if (pieContainerRef.current) {
        setPieContainerSize({
          width: pieContainerRef.current.clientWidth,
          height: pieContainerRef.current.clientHeight,
        });
      }
      if (lineContainerRef.current) {
        setLineContainerSize({
          width: lineContainerRef.current.clientWidth,
          height: lineContainerRef.current.clientHeight,
        });
      }
    };

    // Update size initially and on window resize
    updateContainerSize();
    window.addEventListener("resize", updateContainerSize);

    // Cleanup listener on component unmount
    return () => {
      window.removeEventListener("resize", updateContainerSize);
    };
  }, [dashboardData]); // Rerun effect if dashboardData changes (in case layout changes based on data)

  // Log container sizes
  console.log("Pie Container Size:", pieContainerSize);
  console.log("Line Container Size:", lineContainerSize);

  // Calculate domain for the revenue chart XAxis - This is likely not needed anymore
  // if the chart component handles date strings directly on the XAxis.
  // Keeping it commented out in case the chart component needs specific date formatting.
  /*
  const revenueDomain =
    revenueData.length > 0
      ? [
          // You might need to parse dates here if the chart needs numeric domain
          // For now, assuming the chart can handle date strings as categories
          revenueData[0].day,
          revenueData[revenueData.length - 1].day,
        ]
      : [];
  */

  // Handle loading and error states at the top level
  if (loading) return <div className="main-content">Loading dashboard...</div>;
  if (error) return <div className="main-content">{error.message}</div>;

  // Render the main dashboard structure once not loading or in error state
  return (
    <main className="main-content">
      <header
        className="main-header"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 32,
        }}
      >
        <h2
          className="analytics-title"
          style={{ fontWeight: 700, fontSize: 28, margin: 0, flex: "0 0 auto" }}
        >
          Analytics
        </h2>
        <input
          className="search-bar"
          placeholder="Filter..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="Search"
          style={{ flex: "1 1 400px", margin: "0 32px", maxWidth: 500 }}
        />
        <div className="filter-panel" style={{ flex: "0 0 auto", margin: 0 }}>
          <label style={{ fontWeight: 500 }}>
            Table Status:
            <select
              value={filters.tableStatus}
              onChange={(e) =>
                setFilters((f) => ({ ...f, tableStatus: e.target.value }))
              }
              style={{ marginLeft: 8, padding: "6px 16px", borderRadius: 8 }}
            >
              <option value="all">All</option>
              <option value="available">Available</option>
              <option value="reserved">Reserved</option>
            </select>
          </label>
        </div>
      </header>
      <section className="dashboard">
        <div className="dashboard-cards">
          <div className="dashboard-card">
            <div className="card-title">
              {safe(String(dashboardData?.totalChefs).padStart(2, "0"))}
            </div>
            <div className="card-desc">TOTAL CHEF</div>
          </div>
          <div className="dashboard-card">
            <div className="card-title">
              ₹{" "}
              {safeNum(dashboardData?.totalRevenue) !== "--"
                ? safeNum(dashboardData?.totalRevenue).toLocaleString()
                : "--"}
            </div>
            <div className="card-desc">TOTAL REVENUE</div>
          </div>
          <div className="dashboard-card">
            <div className="card-title">
              {safe(String(dashboardData?.totalOrders).padStart(2, "0"))}
            </div>
            <div className="card-desc">TOTAL ORDER</div>
          </div>
          <div className="dashboard-card">
            <div className="card-title">
              {safe(String(dashboardData?.totalClients).padStart(2, "0"))}
            </div>
            <div className="card-desc">TOTAL CLIENT</div>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginBottom: 24,
            width: "100%",
          }}
        >
          <select
            value={summaryRange}
            onChange={(e) => setSummaryRange(e.target.value)}
            style={{
              padding: "8px 18px",
              borderRadius: 20,
              border: "1.5px solid #e0e0e0",
              fontWeight: 500,
              fontSize: 16,
              background: "#f7f9f9",
              outline: "none",
              cursor: "pointer",
            }}
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
        <div className="dashboard-analytics">
          {/* Order Summary Pie Chart */}
          <div className="order-summary" ref={pieContainerRef}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                width: "100%",
                marginBottom: 24,
              }}
            >
              <h3 className="summary-title" style={{ margin: 0 }}>
                Order Summary
              </h3>
              <select
                value={summaryRange}
                onChange={(e) => setSummaryRange(e.target.value)}
                style={{
                  padding: "8px 18px",
                  borderRadius: 20,
                  border: "1.5px solid #e0e0e0",
                  fontWeight: 500,
                  fontSize: 16,
                  background: "#f7f9f9",
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div
              style={{
                display: "flex",
                gap: 24,
                marginBottom: 24,
                justifyContent: "center",
                width: "100%",
              }}
            >
              <div
                style={{
                  background: "#f7f9f9",
                  border: "1.5px solid #e0e0e0",
                  borderRadius: 16,
                  minWidth: 90,
                  minHeight: 80,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 600,
                  fontSize: 28,
                  color: "#444",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                }}
              >
                <div style={{ fontSize: 32, fontWeight: 700 }}>
                  {safe(
                    String(dashboardData.orderSummary?.served || 0).padStart(
                      2,
                      "0"
                    )
                  )}
                </div>
                <div
                  style={{
                    fontSize: 16,
                    color: "#888",
                    fontWeight: 500,
                    marginTop: 4,
                  }}
                >
                  Served
                </div>
              </div>
              <div
                style={{
                  background: "#f7f9f9",
                  border: "1.5px solid #e0e0e0",
                  borderRadius: 16,
                  minWidth: 90,
                  minHeight: 80,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 600,
                  fontSize: 28,
                  color: "#444",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                }}
              >
                <div style={{ fontSize: 32, fontWeight: 700 }}>
                  {safe(
                    String(dashboardData.orderSummary?.dineIn || 0).padStart(
                      2,
                      "0"
                    )
                  )}
                </div>
                <div
                  style={{
                    fontSize: 16,
                    color: "#888",
                    fontWeight: 500,
                    marginTop: 4,
                  }}
                >
                  Dine In
                </div>
              </div>
              <div
                style={{
                  background: "#f7f9f9",
                  border: "1.5px solid #e0e0e0",
                  borderRadius: 16,
                  minWidth: 90,
                  minHeight: 80,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 600,
                  fontSize: 28,
                  color: "#444",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                }}
              >
                <div style={{ fontSize: 32, fontWeight: 700 }}>
                  {safe(
                    String(dashboardData.orderSummary?.takeAway || 0).padStart(
                      2,
                      "0"
                    )
                  )}
                </div>
                <div
                  style={{
                    fontSize: 16,
                    color: "#888",
                    fontWeight: 500,
                    marginTop: 4,
                  }}
                >
                  Take Away
                </div>
              </div>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 32,
                width: "100%",
                justifyContent: "center",
              }}
            >
              <OrderSummaryDonut
                served={dashboardData.orderSummary?.served || 0}
                dineIn={dashboardData.orderSummary?.dineIn || 0}
                takeAway={dashboardData.orderSummary?.takeAway || 0}
                summaryRange={summaryRange}
              />
            </div>
          </div>

          {/* Daily Revenue Line Chart */}
          <div className="revenue-chart" ref={lineContainerRef}>
            <h3 className="summary-title">Daily Revenue</h3>
            {revenueData.length > 0 ? (
              <RevenueChart data={revenueData} />
            ) : (
              <p>No revenue data available for the selected range.</p>
            )}
          </div>

          {/* Tables Status */}
          <div className="tables-status">
            <h3 className="summary-title">Tables Status</h3>
            {getFilteredTables.length > 0 ? (
              <div className="tables-grid">
                {getFilteredTables.map((table) => (
                  <div
                    key={table.tableNumber}
                    className={`table-box ${table.status}`}
                  >
                    <div className="table-number">{table.tableNumber}</div>
                    <div className="table-details">
                      <div className="table-chairs">🪑 {table.chairs}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p>No tables found matching the filter.</p>
            )}
          </div>
        </div>

        {/* Chefs Table */}
        <div className="chefs-table">
          <h3 className="summary-title">Chefs Order Count</h3>
          {getFilteredChefOrders.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Chef Name</th>
                  <th>Orders Assigned</th>
                </tr>
              </thead>
              <tbody>
                {getFilteredChefOrders.map((chef) => (
                  <tr key={chef.name}>
                    <td>{chef.name}</td>
                    <td>{chef.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No chef data available matching the filter.</p>
          )}
        </div>

        {/* Order List (Optional, can be added later) */}
        {/*
        <div className="order-list">
           <h3 className="summary-title">Recent Orders</h3>
           {getFilteredOrders.length > 0 ? (
              // Render a list or table of filtered orders here
              <ul>
                 {getFilteredOrders.map(order => (
                    <li key={order._id}>{order._id} - {order.status}</li> // Basic example
                 ))}
              </ul>
           ) : (
              <p>No orders found matching the filter.</p>
           )}
        </div>
        */}
      </section>
    </main>
  );
}

export default Dashboard;
