import React from "react";

const TablesStatus = ({ tables }) => {
  return (
    <div className="tables-grid">
      {tables && tables.length > 0 ? (
        tables.map((table) => (
          <div key={table.tableNumber} className={`table-box ${table.status}`}>
            <div className="table-number">{table.tableNumber}</div>
            <div className="table-details">
              <div className="table-chairs">🪑 {table.chairs}</div>
            </div>
          </div>
        ))
      ) : (
        <p>No tables available.</p>
      )}
    </div>
  );
};

export default TablesStatus;
