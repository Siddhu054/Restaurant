import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

const REVENUE_COLORS = ["#7ED957"];

function RevenueLineChart({ lineData, size, revenueDomain }) {
  const safeNum = (val, fallback = "--") =>
    val !== undefined && val !== null && !isNaN(val) ? Number(val) : fallback;

  // Map day numbers (0-6) to day names (Monday to Sunday)
  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  // Extract unique day numbers for ticks
  const uniqueDays = Array.from(new Set(lineData.map((item) => item.day)));

  // Sort unique days to ensure correct order on the axis
  uniqueDays.sort((a, b) => a - b);

  return (
    <LineChart
      width={size.width}
      height={size.height}
      data={lineData}
      margin={{
        top: 5,
        right: 30,
        left: 20,
        bottom: 5,
      }}
    >
      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
      <XAxis
        dataKey="day"
        type="number"
        domain={revenueDomain}
        tickFormatter={(dayNum) => dayNames[dayNum]}
        ticks={uniqueDays}
        allowDataOverflow={true}
        stroke="#6B7280"
        tick={{ fill: "#6B7280", fontSize: 12 }}
      />
      <YAxis
        hide={false}
        domain={["auto", "auto"]}
        stroke="#6B7280"
        tick={{ fill: "#6B7280", fontSize: 12 }}
        tickFormatter={(value) => `₹${value.toLocaleString()}`}
      />
      <Tooltip
        formatter={(value) => [
          `₹${safeNum(value).toLocaleString()}`,
          "Revenue",
        ]}
        labelFormatter={(dayNum) => dayNames[dayNum]}
        contentStyle={{
          backgroundColor: "#fff",
          border: "none",
          borderRadius: "4px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        }}
      />
      <Line
        type="monotone"
        dataKey="revenue"
        stroke={REVENUE_COLORS[0]}
        strokeWidth={3}
        dot={{ fill: REVENUE_COLORS[0], r: 6, stroke: "#fff", strokeWidth: 2 }}
        activeDot={{
          r: 8,
          fill: REVENUE_COLORS[0],
          stroke: "#222",
          strokeWidth: 2,
        }}
      />
    </LineChart>
  );
}

export default RevenueLineChart;
