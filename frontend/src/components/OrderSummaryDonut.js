import React from "react";
import { PieChart, Pie, Cell, Tooltip } from "recharts";

// Grayscale colors for Figma style (used for the segments)
// const COLORS = ["#cfcfcf", "#a8a8a8", "#7a7a7a"];

// Use distinct colors from the original Pie chart component
const COLORS = ["#7ED957", "#FFD966", "#6EC6FF"]; // Colors for Served, Dine In, Take Away

// Component receives the aggregated counts as props
const OrderSummaryDonut = ({ pieData, size }) => {
  console.log("DEBUG: OrderSummaryDonut received props:", { pieData, size });

  // Calculate the total number of orders for the period from pieData
  const total = pieData.reduce((sum, entry) => sum + entry.value, 0);
  console.log("DEBUG: OrderSummaryDonut calculated total:", total);

  // Use the provided pieData directly, it should already be in the correct format
  const data = pieData;
  console.log("DEBUG: OrderSummaryDonut using data:", data);

  // Calculate percentages for display alongside the chart
  const percentData = data.map((d) => ({
    ...d,
    percent: total ? Math.round((d.value / total) * 100) : 0, // Avoid division by zero
  }));
  console.log("DEBUG: OrderSummaryDonut calculated percentages:", percentData);

  console.log(
    "DEBUG: OrderSummaryDonut rendering with total:",
    total,
    "and data:",
    data
  );

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
      {/* The PieChart component from Recharts */}
      <PieChart width={size.width} height={size.height}>
        {" "}
        {/* Use passed size */}
        <Pie
          data={total > 0 ? data : [{ value: 1 }]}
          dataKey="value" // Tell Recharts to use the 'value' property for segment size
          nameKey="name" // Tell Recharts to use the 'name' property for labels/tooltip
          cx="50%" // Center the chart
          cy="50%"
          innerRadius={55} // Doughnut chart hole size
          outerRadius={75} // Doughnut chart outer size
          paddingAngle={total > 0 ? 2 : 0} // Gap between segments, remove if total is 0
          stroke="none" // No stroke around segments
          label={total > 0} // Only show labels if there's data
        >
          {/* Map data entries to Pie chart Cells */}
          {total > 0 ? ( // Only map cells if there's data
            data.map((entry, idx) => (
              // Each Cell gets a fill color based on its index
              <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
            ))
          ) : (
            <Cell key="empty" fill="#ccc" /> // Placeholder for zero data
          )}
        </Pie>
        {total > 0 && ( // Only show tooltip if there's data
          <Tooltip
            formatter={(value, name) => [`${value} orders`, name]}
            contentStyle={{
              backgroundColor: "#fff",
              border: "none",
              borderRadius: "4px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            }}
          />
        )}
      </PieChart>

      {/* Section to display percentage labels next to the donut */}
      {/* This section might need adjustment based on actual design, using flex for now */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {percentData.map((entry, idx) => (
          <div
            key={entry.name}
            style={{ display: "flex", alignItems: "center", gap: 8 }}
          >
            {/* Display Category Name */}
            <span style={{ width: 80, color: "#888" }}>{entry.name}</span>
            {/* Display Percentage */}
            <span style={{ width: 40, color: "#aaa" }}>({entry.percent}%)</span>
            {/* Display Percentage Bar (optional visual) */}
            <div
              style={{
                width: 100,
                height: 8,
                background: "#eee",
                borderRadius: 4,
              }}
            >
              <div
                style={{
                  width: `${entry.percent}%`, // Bar width based on percentage
                  height: "100%",
                  background: COLORS[idx], // Bar color matches segment color
                  borderRadius: 4,
                  transition: "width 0.4s",
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
