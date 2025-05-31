import React from "react";
import { PieChart, Pie, Cell, Tooltip } from "recharts";

// Custom colors for the pie chart segments
const COLORS = ["#7ED957", "#FFD966", "#6EC6FF"]; // Using the original colors

const OrderSummaryDonut = ({ served, dineIn, takeAway, size }) => {
  const data = [
    { name: "Take Away", value: takeAway },
    { name: "Served", value: served },
    { name: "Dine In", value: dineIn },
  ];

  const total = data.reduce((sum, entry) => sum + entry.value, 0);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
      <PieChart width={size.width} height={size.height}>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={75}
          innerRadius={55}
          paddingAngle={total > 0 ? 2 : 0}
          dataKey="value"
          stroke="none"
        >
          {total > 0 ? (
            data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))
          ) : (
            <Cell key="empty" fill="#ccc" />
          )}
        </Pie>
        {total > 0 && (
          <Tooltip
            formatter={(value) => [`${value} orders`, ""]}
            contentStyle={{
              backgroundColor: "#fff",
              border: "none",
              borderRadius: "4px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            }}
          />
        )}
      </PieChart>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {data.map((entry, idx) => {
          const percentage =
            total > 0 ? ((entry.value / total) * 100).toFixed(0) : 0;
          return (
            <div
              key={entry.name}
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <span style={{ width: 80, color: "#888" }}>{entry.name}</span>
              <span style={{ width: 40, color: "#aaa" }}>({percentage}%)</span>
              <div
                style={{
                  flex: 1,
                  height: 8,
                  background: "#eee",
                  borderRadius: 4,
                  marginLeft: 8,
                  marginRight: 0,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${percentage}%`,
                    height: "100%",
                    background: COLORS[idx],
                    borderRadius: 4,
                    transition: "width 0.4s",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OrderSummaryDonut;
