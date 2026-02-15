import React, { useState } from "react";

function App() {
  const [email, setEmail] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [websiteFilter, setWebsiteFilter] = useState("all");
  const [sortOption, setSortOption] = useState("newest");

  const fetchItems = async () => {
    if (!email) return;

    setLoading(true);

    try {
      const response = await fetch(`http://127.0.0.1:8000/items/${email}`);
      const data = await response.json();

      if (Array.isArray(data)) {
        setItems(data);
      } else {
        setItems([]);
      }
    } catch (error) {
      console.error("Fetch error:", error);
      setItems([]);
    }

    setLoading(false);
  };

  const deleteItem = async (id) => {
  const confirmDelete = window.confirm("Delete this item?");

  if (!confirmDelete) return;

  await fetch(`http://127.0.0.1:8000/item/${id}`, {
    method: "DELETE",
  });

  fetchItems();
};

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  //Price Format
  const formatPrice = (price) => {
  const num = Number(price) || 0;
  return num.toLocaleString("en-IN");
};

  // Search + Website Filter
  let filteredItems = items.filter((item) => {
    const matchesSearch = item.title
      .toLowerCase()
      .includes(searchText.toLowerCase());

    const matchesWebsite =
      websiteFilter === "all" || item.website === websiteFilter;

    return matchesSearch && matchesWebsite;
  });

  // Sorting
  filteredItems = filteredItems.sort((a, b) => {
    if (sortOption === "newest") {
      return new Date(b.created_at) - new Date(a.created_at);
    }

    if (sortOption === "oldest") {
      return new Date(a.created_at) - new Date(b.created_at);
    }

    if (sortOption === "price_low") {
      return Number(a.price) - Number(b.price);
    }

    if (sortOption === "price_high") {
      return Number(b.price) - Number(a.price);
    }

    return 0;
  });

  // Dashboard stats
const totalItems = filteredItems.length;

const totalValue = filteredItems.reduce((sum, item) => {
  const price = Number(item.price) || 0;
  return sum + price;
}, 0);

const websiteCount = new Set(
  filteredItems.map((item) => item.website)
).size;

  return (
    <div
      style={{
        maxWidth: "1000px",
        margin: "auto",
        padding: "20px",
      }}
    >
      <h2>CartVault Dashboard</h2>

      {/* Email input */}
      <input
        type="email"
        placeholder="Enter email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <button onClick={fetchItems}>Load Items</button>

      {/* Search */}
      {items.length > 0 && (
        <input
          type="text"
          placeholder="Search items..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{
            marginLeft: "10px",
            padding: "6px",
            width: "220px",
          }}
        />
      )}

      {/* Website Filter */}
      {items.length > 0 && (
        <div style={{ marginTop: "10px" }}>
          {["all", "amazon", "myntra", "meesho"].map((site) => (
            <button
              key={site}
              onClick={() => setWebsiteFilter(site)}
              style={{
                marginLeft: "5px",
                background: websiteFilter === site ? "#333" : "#eee",
                color: websiteFilter === site ? "#fff" : "#000",
                border: "1px solid #ccc",
                padding: "5px 10px",
                cursor: "pointer",
              }}
            >
              {site.charAt(0).toUpperCase() + site.slice(1)}
            </button>
          ))}
        </div>
      )}

      {/* Sorting */}
      {items.length > 0 && (
        <div style={{ marginTop: "10px" }}>
          <label style={{ marginRight: "8px" }}>Sort:</label>
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="price_low">Price: Low to High</option>
            <option value="price_high">Price: High to Low</option>
          </select>
        </div>
      )}

      {/* Dashboard Stats */}
        {items.length > 0 && (
          <div
            style={{
              display: "flex",
              gap: "20px",
              marginTop: "15px",
              padding: "10px",
              border: "1px solid #ddd",
              borderRadius: "8px",
              background: "#f9f9f9",
            }}
          >
            <div>
              <strong>{totalItems}</strong>
              <div style={{ fontSize: "12px", color: "#666" }}>Items</div>
            </div>

            <div>
              <strong>₹ {totalValue}</strong>
              <div style={{ fontSize: "12px", color: "#666" }}>Total Value</div>
            </div>

            <div>
              <strong>{websiteCount}</strong>
              <div style={{ fontSize: "12px", color: "#666" }}>Websites</div>
            </div>
          </div>
        )}

      {loading && (
        <p style={{ marginTop: "15px" }}>Loading items...</p>
      )}

      {!loading && items.length === 0 && email && (
        <p style={{ marginTop: "15px", color: "#666" }}>
          No items found for this email.
        </p>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: "20px",
          marginTop: "20px",
        }}
      >
        {Array.isArray(filteredItems) &&
          filteredItems.map((item) => (
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
              {/* Image */}
              <div
                style={{
                  width: "100%",
                  height: "180px",
                  overflow: "hidden",
                  borderRadius: "6px",
                  marginBottom: "10px",
                  background: "#f5f5f5",
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
                  onError={(e) => {
                    e.target.src =
                      "https://via.placeholder.com/300x300?text=No+Image";
                  }}
                />
              </div>

              <h4 style={{ margin: "5px 0" }}>{item.title}</h4>
              <p style={{ margin: "4px 0" }}>₹ {formatPrice(item.price)}</p>
              <p style={{ margin: "4px 0" }}>{item.website}</p>

              <p
                style={{
                  margin: "4px 0",
                  fontSize: "12px",
                  color: "#666",
                }}
              >
                Saved on: {formatDate(item.created_at)}
              </p>

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
