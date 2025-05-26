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
  return (
    <div style={{ width: "100%", height: 320 }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data}>
          <CartesianGrid stroke="#f5f5f5" vertical={false} />
          <XAxis dataKey="day" tick={{ fontSize: 14, fill: "#888" }} />
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
