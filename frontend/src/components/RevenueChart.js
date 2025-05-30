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

const RevenueChart = ({ data }) => {
  // Helper function to format date string to abbreviated day name
  const formatDayTick = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const options = { weekday: "short" }; // 'short' gives "Mon", "Tue", etc.
    // Use 'en-US' locale or adjust based on your desired language/format
    return date.toLocaleDateString("en-US", options);
  };

  return (
    <div style={{ width: "100%", height: 320 }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data}>
          <CartesianGrid stroke="#f5f5f5" vertical={false} />
          <XAxis
            dataKey="day" // This is the date string from backend (YYYY-MM-DD)
            tick={{ fontSize: 14, fill: "#888" }}
            // Add the tickFormatter to display abbreviated day names
            tickFormatter={formatDayTick}
          />
          <Tooltip />
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
