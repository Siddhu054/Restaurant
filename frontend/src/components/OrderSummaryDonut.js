import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

// Basic colors for the pie chart
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

const OrderSummaryDonut = ({ data, size }) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart width={size.width} height={size.height}>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={80}
          fill="#8884d8"
          paddingAngle={5}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        {/* Tooltip can be added later if needed */}
        {/* <Tooltip /> */}
      </PieChart>
    </ResponsiveContainer>
  );
};

export default OrderSummaryDonut;
