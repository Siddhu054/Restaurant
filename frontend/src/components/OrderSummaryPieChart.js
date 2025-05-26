import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

// Custom colors for the pie chart segments
const COLORS = ["#FF6B6B", "#4ECDC4", "#45B7D1"];

function OrderSummaryPieChart({ pieData, size }) {
  const safeNum = (val, fallback = "--") =>
    val !== undefined && val !== null && !isNaN(val) ? Number(val) : fallback;

  // Calculate total value for percentages
  const total = pieData.reduce((sum, entry) => sum + entry.value, 0);

  // Custom Legend Component
  const CustomLegend = ({ payload }) => {
    return (
      <ul
        className="pie-chart-legend"
        style={{ listStyle: "none", padding: 0, margin: 0 }}
      >
        {payload.map((entry, index) => {
          const percentage =
            total > 0 ? ((entry.value / total) * 100).toFixed(1) : 0;
          return (
            <li
              key={`legend-${index}`}
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "8px",
                color: "#333",
                fontSize: "14px",
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  width: "12px",
                  height: "12px",
                  backgroundColor: entry.color,
                  marginRight: "8px",
                  borderRadius: "50%",
                }}
              ></span>
              <span>
                {entry.payload.name} ({percentage}%)
              </span>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={pieData}
          cx="45%"
          cy="50%"
          labelLine={false}
          outerRadius={120}
          fill="#8884d8"
          dataKey="value"
          innerRadius={75}
        >
          {pieData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value) => [`${safeNum(value)}`, "Orders"]}
          contentStyle={{
            backgroundColor: "#fff",
            border: "none",
            borderRadius: "4px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
        />
        <Legend
          content={<CustomLegend />}
          layout="vertical"
          align="right"
          verticalAlign="middle"
          wrapperStyle={{
            paddingLeft: "20px",
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

export default OrderSummaryPieChart;
