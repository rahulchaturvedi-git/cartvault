import React, { useState } from "react";

function App() {
  const [email, setEmail] = useState("");
  const [items, setItems] = useState([]);

  const fetchItems = async () => {
    if (!email) return;
    const response = await fetch(`http://127.0.0.1:8000/items/${email}`);
    const data = await response.json();
    setItems(data);
  };

  const deleteItem = async (id) => {
    await fetch(`http://127.0.0.1:8000/item/${id}`, {
      method: "DELETE",
    });
    fetchItems();
  };

  return (
    <div
      style={{
        maxWidth: "1000px",
        margin: "auto",
        padding: "20px",
      }}
    >
      <h2>CartVault Dashboard</h2>

      <input
        type="email"
        placeholder="Enter email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <button onClick={fetchItems}>Load Items</button>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: "20px",
          marginTop: "20px",
        }}
      >
        {items.map((item) => (
          <div
            key={item._id}
            style={{
              border: "1px solid #ddd",
              padding: "15px",
              borderRadius: "8px",
              boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
              background: "#fff",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Fixed Image Container */}
            <div
              style={{
                width: "100%",
                height: "180px",
                overflow: "hidden",
                borderRadius: "6px",
                marginBottom: "10px",
              }}
            >
              <img
                src={item.image}
                alt={item.title}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            </div>

            <h4 style={{ margin: "5px 0" }}>{item.title}</h4>
            <p style={{ margin: "4px 0" }}>₹ {item.price}</p>
            <p style={{ margin: "4px 0" }}>{item.website}</p>

            <div style={{ marginTop: "auto" }}>
              <a href={item.url} target="_blank" rel="noreferrer">
                View Product
              </a>
              <br />
              <button onClick={() => deleteItem(item._id)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
