import React from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

// Define day names for the X-axis ticks
const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const RevenueChart = ({ data, revenueDomain }) => {
  // Helper function to format the day index (0-6) to abbreviated day name
  const formatDayTick = (dayIndex) => {
    // Ensure dayIndex is a valid number between 0 and 6
    if (dayIndex >= 0 && dayIndex <= 6) {
      return dayNames[dayIndex];
    }
    return ""; // Return empty string for invalid index
  };

  return (
    <div style={{ width: "100%", height: 320 }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data}>
          <CartesianGrid stroke="#f5f5f5" vertical={false} />
          <XAxis
            dataKey="day" // This is now the day index (0-6)
            tick={{ fontSize: 14, fill: "#888" }}
            // Use the fixed domain [0, 6]
            domain={revenueDomain}
            // Add the tickFormatter to display abbreviated day names from index
            tickFormatter={formatDayTick}
            // Specify ticks for each day of the week to ensure they are always shown
            ticks={[0, 1, 2, 3, 4, 5, 6]}
          />
          <Tooltip
            // Optional: Customize tooltip label to show day name from index
            labelFormatter={formatDayTick}
          />
          <Bar
            dataKey="revenue"
            barSize={40}
            fill="#e6e6e6"
            radius={[4, 4, 0, 0]}
          />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="#222"
            strokeWidth={2.5}
            dot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RevenueChart;
