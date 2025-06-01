import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

// Grayscale colors for Figma style
const COLORS = ["#cfcfcf", "#a8a8a8", "#7a7a7a"];

const OrderSummaryDonut = ({ served, dineIn, takeAway }) => {
  const total = served + dineIn + takeAway;
  const data = [
    { name: "Take Away", value: takeAway },
    { name: "Served", value: served },
    { name: "Dine In", value: dineIn },
  ];
  const percentData = data.map((d) => ({
    ...d,
    percent: total ? Math.round((d.value / total) * 100) : 0,
  }));

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 32,
        padding: "20px",
        backgroundColor: "#fff",
        borderRadius: "8px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
      }}
    >
      <div style={{ width: "160px", height: "160px" }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={percentData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={75}
              paddingAngle={2}
              dataKey="value"
              stroke="none"
            >
              {percentData.map((entry, idx) => (
                <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div style={{ minWidth: 180 }}>
        {percentData.map((entry, idx) => (
          <div
            key={entry.name}
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <span style={{ width: 80, color: "#888", fontSize: "14px" }}>
              {entry.name}
            </span>
            <span style={{ width: 40, color: "#aaa", fontSize: "14px" }}>
              ({entry.percent}%)
            </span>
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
                  width: `${entry.percent}%`,
                  height: "100%",
                  background: COLORS[idx],
                  borderRadius: 4,
                  transition: "width 0.4s ease-in-out",
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrderSummaryDonut;
