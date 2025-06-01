import React from "react";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const RevenueChart = ({ data }) => {
  return (
    <div style={{ width: "100%", height: 300 }}>
      <ResponsiveContainer>
        <ComposedChart data={data}>
          <CartesianGrid stroke="#f5f5f5" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 14, fill: "#888" }} />
          <YAxis
            tick={{ fontSize: 14, fill: "#888" }}
            tickFormatter={(value) => `₹${value}`}
          />
          <Tooltip
            formatter={(value) => [`₹${value}`, "Revenue"]}
            labelStyle={{ color: "#444" }}
          />
          <Legend />
          <Bar
            dataKey="revenue"
            fill="#8884d8"
            radius={[4, 4, 0, 0]}
            barSize={20}
          />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="#82ca9d"
            strokeWidth={2}
            dot={{ fill: "#82ca9d", strokeWidth: 2 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RevenueChart;
