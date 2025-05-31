import React, { useEffect, useState, useRef, useMemo } from "react";
import "../App.css";
import OrderSummaryPie from "../components/OrderSummaryPie";
import RevenueLineChart from "../components/RevenueLineChart";
import OrderSummaryDonut from "../components/OrderSummaryDonut";
import RevenueChart from "../components/RevenueChart";
import // Removed PieChart, Pie, Cell, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer
"recharts";
import { useNavigate } from "react-router-dom";
import { FaUsers, FaUtensils, FaMoneyBillWave } from "react-icons/fa";
import TablesStatus from "../components/TablesStatus";

function Dashboard({ dashboardData, orderSummary, loading, error }) {
  const safe = (val, fallback = "--") =>
    val !== undefined && val !== null ? val : fallback;
  const safeNum = (val, fallback = "--") =>
    val !== undefined && val !== null && !isNaN(val) ? Number(val) : fallback;

  const navigate = useNavigate();
  const [orderFilter, setOrderFilter] = useState("daily");
  const [revenueFilter, setRevenueFilter] = useState("daily");
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    analytics: "all",
    tableStatus: "all",
    orderType: "all",
  });
  const [summaryRange, setSummaryRange] = useState("daily");

  // Refs for container sizing
  const pieContainerRef = useRef(null);
  const lineContainerRef = useRef(null);

  const [pieContainerSize, setPieContainerSize] = useState({
    width: 0,
    height: 0,
  });
  const [lineContainerSize, setLineContainerSize] = useState({
    width: 0,
    height: 0,
  });

  // Aggregation functions
  function aggregateOrderSummary(dailyOrderSummaries, range) {
    console.log(
      "DEBUG: aggregateOrderSummary input - dailyOrderSummaries:",
      dailyOrderSummaries
    );
    console.log("DEBUG: aggregateOrderSummary input - range:", range);
    if (
      !Array.isArray(dailyOrderSummaries) ||
      dailyOrderSummaries.length === 0
    ) {
      return { served: 0, dineIn: 0, takeAway: 0 };
    }

    if (range === "weekly") {
      const last7 = dailyOrderSummaries.slice(-7);
      return last7.reduce(
        (acc, day) => ({
          served: acc.served + (day.served || 0),
          dineIn: acc.dineIn + (day.dineIn || 0),
          takeAway: acc.takeAway + (day.takeAway || 0),
        }),
        { served: 0, dineIn: 0, takeAway: 0 }
      );
    }

    if (range === "monthly") {
      const last30 = dailyOrderSummaries.slice(-30);
      return last30.reduce(
        (acc, day) => ({
          served: acc.served + (day.served || 0),
          dineIn: acc.dineIn + (day.dineIn || 0),
          takeAway: acc.takeAway + (day.takeAway || 0),
        }),
        { served: 0, dineIn: 0, takeAway: 0 }
      );
    }

    console.log(
      "DEBUG: Input dailyOrderSummaries content:",
      dailyOrderSummaries
    );

    const last = dailyOrderSummaries[dailyOrderSummaries.length - 1];
    const result = {
      served: last.served || 0,
      dineIn: last.dineIn || 0,
      takeAway: last.takeAway || 0,
    };
    console.log("DEBUG: aggregateOrderSummary output:", result);
    return result;
  }

  function aggregateRevenue(dailyRevenue, range) {
    console.log("DEBUG: aggregateRevenue input - dailyRevenue:", dailyRevenue);
    console.log("DEBUG: aggregateRevenue input - range:", range);
    if (!Array.isArray(dailyRevenue) || dailyRevenue.length === 0) {
      console.log("DEBUG: aggregateRevenue output (empty input):", []);
      return [];
    }

    if (range === "weekly") {
      const weeks = [];
      const last28 = dailyRevenue.slice(-28);
      for (let i = 0; i < 4; i++) {
        const weekData = last28.slice(i * 7, (i + 1) * 7);
        const revenue = weekData.reduce(
          (sum, item) => sum + (item.revenue || item.totalRevenue || 0),
          0
        );
        weeks.push({ label: `Week ${i + 1}`, revenue });
      }
      return weeks;
    }

    if (range === "monthly") {
      const hasDate = dailyRevenue.some((item) => !!item.date);
      if (!hasDate) {
        const revenue = dailyRevenue.reduce(
          (sum, item) => sum + (item.revenue || item.totalRevenue || 0),
          0
        );
        return [{ label: "This Month", revenue }];
      }

      const monthsMap = {};
      dailyRevenue.forEach((item) => {
        let label = "";
        if (item.date) {
          const date = new Date(item.date);
          if (!isNaN(date)) {
            label = date.toLocaleString("default", {
              month: "short",
              year: "2-digit",
            });
          }
        }
        if (label) {
          monthsMap[label] =
            (monthsMap[label] || 0) + (item.revenue || item.totalRevenue || 0);
        }
      });
      const monthLabels = Object.keys(monthsMap).slice(-3);
      return monthLabels.map((label) => ({ label, revenue: monthsMap[label] }));
    }

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const dayMap = {};
    dailyRevenue.forEach((item) => {
      if (typeof item.day === "number") {
        dayMap[item.day] = item.revenue || item.totalRevenue || 0;
      }
    });
    const fullWeek = dayNames.map((name, idx) => ({
      label: name,
      revenue: dayMap[idx] || 0,
    }));
    console.log("DEBUG: aggregateRevenue output (daily):", fullWeek);
    return fullWeek;
  }

  // Calculate data before useMemo hooks
  const dailyOrderSummaries = Array.isArray(dashboardData?.dailyOrderSummary)
    ? dashboardData.dailyOrderSummary
    : [];
  console.log(
    "DEBUG: Raw dailyOrderSummaries from dashboardData:",
    dailyOrderSummaries
  );

  const orderSummaryData = aggregateOrderSummary(
    dailyOrderSummaries,
    orderFilter
  );
  console.log("DEBUG: Processed orderSummaryData:", orderSummaryData);

  const rawDailyRevenue = Array.isArray(dashboardData?.dailyRevenue)
    ? dashboardData.dailyRevenue
    : [];
  const revenueDataChart = aggregateRevenue(rawDailyRevenue, revenueFilter);

  // Calculate total orders for percentages
  const totalOrdersForPercentage =
    orderSummaryData.served +
    orderSummaryData.dineIn +
    orderSummaryData.takeAway;
  console.log("DEBUG: Total orders for percentage:", totalOrdersForPercentage);

  const calculatePercentage = (value, total) => {
    if (total === 0) return "0%";
    return `${Math.round((value / total) * 100)}%`;
  };

  // Memoized data for charts
  const pieData = useMemo(() => {
    console.log(
      "DEBUG: Creating pieData from orderSummaryData:",
      orderSummaryData
    );
    const data =
      orderSummaryData && typeof orderSummaryData === "object"
        ? [
            { name: "Served", value: orderSummaryData.served || 0 },
            { name: "Dine In", value: orderSummaryData.dineIn || 0 },
            {
              name: "Take Away",
              value: orderSummaryData.takeAway || 0,
            },
          ]
        : [];
    console.log("DEBUG: Final pieData array:", data);
    return data;
  }, [orderSummaryData]);

  const lineData = useMemo(() => {
    const transformedData = dashboardData?.dailyRevenue
      ? dashboardData.dailyRevenue.map((item) => ({
          day: item.day,
          revenue: item.totalRevenue,
        }))
      : [];

    console.log("Generated lineData:", transformedData);

    return transformedData;
  }, [dashboardData?.dailyRevenue]);

  const revenueData = useMemo(() => {
    const weeklyData = [0, 1, 2, 3, 4, 5, 6].map((dayIndex) => ({
      day: dayIndex,
      revenue: 0,
    }));

    if (dashboardData?.dailyRevenue) {
      dashboardData.dailyRevenue.forEach((item) => {
        const date = new Date(item.date);
        const dayOfWeek = date.getDay();
        const weeklyEntry = weeklyData.find((entry) => entry.day === dayOfWeek);
        if (weeklyEntry) {
          weeklyEntry.revenue += item.totalRevenue;
        }
      });
    } else {
      console.warn(
        "dashboardData.dailyRevenue is null or undefined.",
        dashboardData?.dailyRevenue
      );
    }

    console.log("Generated revenueData for chart (weekly view):", weeklyData);

    return weeklyData;
  }, [dashboardData?.dailyRevenue]);

  // Effect for container resizing
  useEffect(() => {
    const updateContainerSize = () => {
      if (pieContainerRef.current) {
        const newSize = {
          width: pieContainerRef.current.clientWidth,
          height: pieContainerRef.current.clientHeight,
        };
        console.log("DEBUG: Updating pie container size:", newSize);
        setPieContainerSize(newSize);
      }
      if (lineContainerRef.current) {
        const newSize = {
          width: lineContainerRef.current.clientWidth,
          height: lineContainerRef.current.clientHeight,
        };
        console.log("DEBUG: Updating line container size:", newSize);
        setLineContainerSize(newSize);
      }
    };

    updateContainerSize();
    window.addEventListener("resize", updateContainerSize);

    return () => {
      window.removeEventListener("resize", updateContainerSize);
    };
  }, [dashboardData]);

  const revenueDomain = [0, 6];

  const getFilteredTables = useMemo(() => {
    console.log("DEBUG: Raw tables data:", dashboardData?.tables);
    let filtered = dashboardData?.tables || [];

    if (filters.tableStatus !== "all") {
      filtered = filtered.filter(
        (table) => table.status === filters.tableStatus
      );
    }

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
          matchingTableIds.has(table._id) ||
          matchingTableIds.has(table.tableNumber)
      );
    }

    if (searchQuery) {
      filtered = filtered.filter((table) =>
        String(table.tableNumber)
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      );
    }

    console.log("DEBUG: Filtered tables:", filtered);
    return filtered;
  }, [
    dashboardData?.tables,
    dashboardData?.orders,
    filters.tableStatus,
    filters.analytics,
    filters.orderType,
    searchQuery,
  ]);

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

  console.log("Pie Container Size:", pieContainerSize);
  console.log("Line Container Size:", lineContainerSize);

  console.log(
    "DEBUG: orderSummaryData before passing to Donut:",
    orderSummaryData
  );
  console.log("DEBUG: pieData before passing to Donut:", pieData);

  if (loading) return <div className="main-content">Loading dashboard...</div>;
  if (error) return <div className="main-content">{error.message}</div>;

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
            <FaUsers className="card-icon" />
            <div className="card-content">
              <h3>Total Chef</h3>
              <p>{safe(dashboardData?.totalChefs, 0)}</p>
            </div>
          </div>
          <div className="dashboard-card">
            <FaMoneyBillWave className="card-icon" />
            <div className="card-content">
              <h3>Total Revenue</h3>
              <p>₹{safeNum(dashboardData?.totalRevenue, 0)}</p>
            </div>
          </div>
          <div className="dashboard-card">
            <FaUtensils className="card-icon" />
            <div className="card-content">
              <h3>Total Orders</h3>
              <p>{safe(dashboardData?.totalOrders, 0)}</p>
            </div>
          </div>
          <div className="dashboard-card">
            <FaUsers className="card-icon" />
            <div className="card-content">
              <h3>Total Clients</h3>
              <p>{safe(dashboardData?.totalClients, 0)}</p>
            </div>
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
          <div className="order-summary" ref={pieContainerRef}>
            <div className="section-header">
              <h2>Order Summary</h2>
              <select
                value={orderFilter}
                onChange={(e) => setOrderFilter(e.target.value)}
                className="filter-select"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "20px",
                flexWrap: "wrap",
              }}
            >
              <div
                style={{
                  width: "180px",
                  height: "200px",
                  overflow: "hidden",
                  flexShrink: 0,
                }}
              >
                <OrderSummaryDonut
                  served={orderSummaryData.served || 0}
                  dineIn={orderSummaryData.dineIn || 0}
                  takeAway={orderSummaryData.takeAway || 0}
                  size={pieContainerSize}
                />
              </div>
              <div className="summary-details">
                <p>
                  Take Away (
                  {calculatePercentage(
                    orderSummaryData.takeAway,
                    totalOrdersForPercentage
                  )}
                  ){" "}
                  <span style={{ float: "right", fontWeight: "bold" }}>
                    {safe(orderSummaryData.takeAway, 0)}
                  </span>
                </p>
                <p>
                  Served (
                  {calculatePercentage(
                    orderSummaryData.served,
                    totalOrdersForPercentage
                  )}
                  ){" "}
                  <span style={{ float: "right", fontWeight: "bold" }}>
                    {safe(orderSummaryData.served, 0)}
                  </span>
                </p>
                <p>
                  Dine In (
                  {calculatePercentage(
                    orderSummaryData.dineIn,
                    totalOrdersForPercentage
                  )}
                  ){" "}
                  <span style={{ float: "right", fontWeight: "bold" }}>
                    {safe(orderSummaryData.dineIn, 0)}
                  </span>
                </p>
              </div>
            </div>
          </div>

          <div className="revenue-chart" ref={lineContainerRef}>
            <div className="section-header">
              <h2>Daily Revenue</h2>
              <select
                value={revenueFilter}
                onChange={(e) => setRevenueFilter(e.target.value)}
                className="filter-select"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <RevenueChart data={revenueDataChart} size={lineContainerSize} />
          </div>
        </div>

        <div className="tables-status">
          <h2>Tables Status</h2>
          <TablesStatus tables={getFilteredTables} />
        </div>

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
      </section>
    </main>
  );
}

export default Dashboard;
