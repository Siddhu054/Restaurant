import React from "react";
import { PieChart, Pie, Cell, Tooltip } from "recharts";

const PIE_COLORS = ["#7ED957", "#FFD966", "#6EC6FF"];

function OrderSummaryPie({ pieData, size }) {
  return (
    <PieChart width={size.width} height={size.height}>
      <Pie
        data={pieData}
        dataKey="value"
        nameKey="name"
        cx="50%"
        cy="50%"
        outerRadius={80}
        innerRadius={50}
        paddingAngle={5}
        label
      >
        {pieData.length > 0 ? (
          pieData.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={PIE_COLORS[index % PIE_COLORS.length]}
            />
          ))
        ) : (
          <Cell key="empty" fill="#ccc" />
        )}
      </Pie>
      <Tooltip
        formatter={(value) => [`${value} orders`, ""]}
        contentStyle={{
          backgroundColor: "#fff",
          border: "none",
          borderRadius: "4px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        }}
      />
    </PieChart>
  );
}

export default OrderSummaryPie;
