import React, { useEffect, useState } from "react";
import "../App.css"; // Assuming shared styles or create a new css file

function TableManagement() {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTableData, setNewTableData] = useState({
    tableNumber: "",
    name: "",
    chairs: 4, // Default chairs
    status: "available", // Default status
  });
  const [editingTable, setEditingTable] = useState(null); // State to hold the table being edited
  const [editTableData, setEditTableData] = useState({
    // State to hold data for the edit form
    tableNumber: "",
    name: "",
    chairs: 4,
    status: "available",
  });

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/tables");
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      // Ensure tableNumber is padded with leading zeros for consistent display
      const formattedTables = data.map((table) => ({
        ...table,
        tableNumber: String(table.tableNumber).padStart(2, "0"),
      }));
      setTables(formattedTables);
    } catch (err) {
      setError("Failed to load tables");
      console.error("Failed to fetch tables:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e, formType) => {
    const { name, value } = e.target;
    if (formType === "add") {
      setNewTableData({ ...newTableData, [name]: value });
    } else if (formType === "edit") {
      setEditTableData({ ...editTableData, [name]: value });
    }
  };

  const handleAddTable = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:5000/api/tables", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newTableData),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(
          errorData.message || `HTTP error! status: ${res.status}`
        );
      }
      // After successful creation, refetch tables to update the list
      fetchTables();
      // Reset form and hide it
      setNewTableData({
        tableNumber: "",
        name: "",
        chairs: 4,
        status: "available",
      });
      setShowAddForm(false);
    } catch (err) {
      setError(`Failed to add table: ${err.message}`);
      console.error("Failed to add table:", err);
    }
  };

  const handleDeleteTable = async (id) => {
    if (window.confirm("Are you sure you want to delete this table?")) {
      try {
        const res = await fetch(`http://localhost:5000/api/tables/${id}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(
            errorData.message || `HTTP error! status: ${res.status}`
          );
        }
        // After successful deletion, refetch tables
        fetchTables();
      } catch (err) {
        setError(`Failed to delete table: ${err.message}`);
        console.error("Failed to delete table:", err);
      }
    }
  };

  const handleEditClick = (table) => {
    setEditingTable(table);
    setEditTableData({
      tableNumber: table.tableNumber,
      name: table.name || "", // Handle potential null/undefined name
      chairs: table.chairs,
      status: table.status,
    });
  };

  const handleCancelEdit = () => {
    setEditingTable(null);
    setEditTableData({
      tableNumber: "",
      name: "",
      chairs: 4,
      status: "available",
    });
  };

  const handleUpdateTable = async (e) => {
    e.preventDefault();
    if (!editingTable) return; // Should not happen if edit form is shown correctly

    try {
      // Note: Remove leading zeros from tableNumber before sending to backend
      const tableNumberToSend = parseInt(editTableData.tableNumber, 10);
      if (isNaN(tableNumberToSend)) {
        throw new Error("Invalid table number.");
      }

      const res = await fetch(
        `http://localhost:5000/api/tables/${editingTable._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...editTableData,
            tableNumber: tableNumberToSend, // Use parsed integer
          }),
        }
      );
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(
          errorData.message || `HTTP error! status: ${res.status}`
        );
      }
      // After successful update, refetch tables
      fetchTables();
      // Close edit form
      handleCancelEdit();
    } catch (err) {
      setError(`Failed to update table: ${err.message}`);
      console.error("Failed to update table:", err);
    }
  };

  if (loading) return <div className="main-content">Loading tables...</div>;
  if (error) return <div className="main-content">Error: {error}</div>;

  return (
    <div className="main-content">
      {" "}
      {/* Reuse main-content class or create a new layout */}
      <div className="table-management-header">
        <h2>Tables</h2>
        <input
          type="text"
          placeholder="Search..."
          className="search-bar"
        />{" "}
        {/* Reuse search-bar class */}
      </div>
      {/* Add Table Form Trigger Button */}
      <button
        onClick={() => setShowAddForm(!showAddForm)}
        className="add-table-button"
      >
        {showAddForm ? "Cancel Add" : "+ Add New Table"}
      </button>
      {/* Add Table Form */}
      {showAddForm && (
        <div className="add-table-form">
          <h3>Add New Table</h3>
          <form onSubmit={handleAddTable}>
            <input
              type="number"
              name="tableNumber"
              placeholder="Table Number"
              value={newTableData.tableNumber}
              onChange={(e) => handleInputChange(e, "add")}
              required
            />
            <input
              type="text"
              name="name"
              placeholder="Table name (optional)"
              value={newTableData.name}
              onChange={(e) => handleInputChange(e, "add")}
            />
            <label>Chairs:</label>
            <select
              name="chairs"
              value={newTableData.chairs}
              onChange={(e) => handleInputChange(e, "add")}
              required
            >
              {[2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <option key={num} value={num}>
                  {num}
                </option>
              ))}
            </select>
            <label>Status:</label>
            <select
              name="status"
              value={newTableData.status}
              onChange={(e) => handleInputChange(e, "add")}
              required
            >
              <option value="available">Available</option>
              <option value="reserved">Reserved</option>
            </select>
            <button type="submit">Create</button>
          </form>
        </div>
      )}
      {/* Edit Table Form */}
      {editingTable && (
        <div className="add-table-form">
          {/* Reuse the same form styling */}
          <h3>Edit Table {editingTable.tableNumber}</h3>
          <form onSubmit={handleUpdateTable}>
            <label>Table Number:</label>
            <input
              type="number"
              name="tableNumber"
              value={editTableData.tableNumber}
              onChange={(e) => handleInputChange(e, "edit")}
              required
            />
            <label>Table Name (Optional):</label>
            <input
              type="text"
              name="name"
              value={editTableData.name}
              onChange={(e) => handleInputChange(e, "edit")}
            />
            <label>Chairs:</label>
            <select
              name="chairs"
              value={editTableData.chairs}
              onChange={(e) => handleInputChange(e, "edit")}
              required
            >
              {[2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <option key={num} value={num}>
                  {num}
                </option>
              ))}
            </select>
            <label>Status:</label>
            <select
              name="status"
              value={editTableData.status}
              onChange={(e) => handleInputChange(e, "edit")}
              required
            >
              <option value="available">Available</option>
              <option value="occupied">Occupied</option>
              <option value="needs_cleaning">Needs Cleaning</option>
              <option value="reserved">Reserved</option>
            </select>
            <button type="submit">Update Table</button>
            <button type="button" onClick={handleCancelEdit}>
              Cancel
            </button>
          </form>
        </div>
      )}
      {/* Display Tables Grid */}
      <div className="tables-grid">
        {" "}
        {/* Reuse tables-grid class from dashboard */}
        {tables.length > 0 ? (
          tables.map((table) => (
            <div key={table._id} className={`table-box ${table.status}`}>
              {" "}
              {/* Reuse table-box class */}
              <div className="table-number">Table {table.tableNumber}</div>
              <div className="table-details">
                <div className="table-name">{table.name}</div>
                <div className="table-chairs">🪑 {table.chairs}</div>
              </div>
              <div className="table-actions">
                {" "}
                {/* Container for action buttons */}
                <button
                  onClick={() => handleEditClick(table)}
                  className="edit-table-button" // Add a class for styling
                >
                  ✏️ {/* Edit icon */}
                </button>
                <button
                  onClick={() => handleDeleteTable(table._id)}
                  className="delete-table-button"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        ) : (
          <div>No tables found.</div>
        )}
      </div>
    </div>
  );
}

export default TableManagement;
