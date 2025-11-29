// src/components/pages/BuyerDashboard.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  FaShoppingBag,
  FaFire,
  FaFish,
} from "react-icons/fa";
import "./BuyerDashboard.css";
import BuyerHeader from "./BuyerHeader";

// Import cart utilities
import { addToCart as addToCartUtil } from "../utils/cartUtils";

const BuyerDashboard = () => {
  const [bestSellers, setBestSellers] = useState([]);
  const [recentPurchases, setRecentPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const CUSTOMER_ID = sessionStorage.getItem("customer_id");
  const navigate = useNavigate();

  // Fetch best sellers with total sold
  const loadBestSellers = async () => {
    try {
      const res = await fetch("http://localhost:5002/api/products/best-sellers");
      const data = await res.json();
      setBestSellers(data);
    } catch (err) {
      console.error("Error fetching best sellers:", err);
    }
  };

  // Fetch recent purchases for THIS specific buyer
  const loadRecentPurchases = async () => {
    if (!CUSTOMER_ID) {
      setRecentPurchases([]);
      return;
    }

    try {
      const res = await fetch(
        `http://localhost:5002/api/buyer/purchases?buyer_id=${CUSTOMER_ID}`
      );
      
      if (!res.ok) {
        console.error(`HTTP error! status: ${res.status}`);
        setRecentPurchases([]);
        return;
      }
      
      const data = await res.json();
      setRecentPurchases(data);
    } catch (err) {
      console.error("Error fetching purchases:", err);
      setRecentPurchases([]);
    }
  };

  useEffect(() => {
    if (!CUSTOMER_ID) {
      navigate("/buyer/login");
      return;
    }

    loadBestSellers();
    loadRecentPurchases();
  }, [CUSTOMER_ID, navigate]);

  useEffect(() => {
    if (bestSellers.length > 0 || recentPurchases.length >= 0) {
      setLoading(false);
    }
  }, [bestSellers, recentPurchases]);

  const showToast = (message) => {
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 2000);
  };

  const addToCart = (product) => {
    addToCartUtil(product);
    
    // Dispatch cart update event
    window.dispatchEvent(new Event('cartUpdated'));
    
    // Show toast instead of alert
    showToast(`${product.name} added to cart!`);
  };

  if (loading) return <p>Loading dashboard...</p>;

  // Filter best sellers by search term
  const filteredBestSellers = searchTerm
    ? bestSellers.filter((prod) =>
        prod.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : bestSellers;

  return (
    <div className="buyer-dashboard">
      {/* Reusable Header Component */}
      <BuyerHeader 
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        currentPage="home"
      />

      {/* Main Content */}
      <main className="dashboard-content">
        {/* Recent Purchases Section */}
        <section className="recent-section">
          <div className="section-header">
            <FaShoppingBag className="section-icon" style={{ color: '#667eea' }} />
            <h2>Recent Purchases</h2>
          </div>
          {recentPurchases.length === 0 ? (
            <div className="empty-state">
              <FaShoppingBag className="empty-icon" />
              <p>No recent purchases yet</p>
              <span>Start shopping now!</span>
            </div>
          ) : (
            <div className="product-list">
              {recentPurchases.map((prod) => (
                <div key={prod.purchase_id} className="product-card recent-card">
                  <img
                    src={
                      prod.image_url
                        ? `http://localhost:5001/uploads/${prod.image_url}`
                        : "https://via.placeholder.com/150?text=No+Image"
                    }
                    alt={prod.product_name}
                    className="product-img"
                  />
                  <h4>{prod.product_name}</h4>
                  <p className="product-price">₱{Number(prod.price).toFixed(2)}</p>
                  <div className="product-meta">
                    <span className="quantity-badge">Qty: {prod.quantity}</span>
                    <span className={`status-badge ${prod.status.toLowerCase()}`}>
                      {prod.status}
                    </span>
                  </div>
                  <p className="order-number">Order: {prod.order_number}</p>
                  <p className="purchase-date">
                    {new Date(prod.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Best Sellers Section */}
        <section className="best-seller-section">
          <div className="section-header">
            <span className="section-icon">
              <FaFire style={{ color: '#f6ad55' }} />
            </span>
            <h2>{searchTerm ? "Search Results" : "Best Sellers"}</h2>
          </div>
          {filteredBestSellers.length === 0 ? (
            <p className="no-results">No products found.</p>
          ) : (
            <div className="product-list">
              {filteredBestSellers.map((prod) => (
                <div key={prod.id} className="product-card bestseller-card">
                  <div className="bestseller-badge">
                    <FaFish /> {prod.total_sold} Sold
                  </div>
                  <img
                    src={
                      prod.image_url
                        ? `http://localhost:5001/uploads/${prod.image_url}`
                        : "https://via.placeholder.com/150?text=No+Image"
                    }
                    alt={prod.name}
                    className="product-img"
                  />
                  <h4>{prod.name}</h4>
                  <p className="shop-name"><FaFish style={{color: "#16135d"}} /> {prod.shop_name || "Unknown Shop"}</p>
                  <p className="product-price">₱{Number(prod.price).toFixed(2)}/{prod.unit || "kg"}</p>
                  <div className="product-footer">
                    <span className="category-badge">{prod.category}</span>
                    <span className="stock-info">Stock: {prod.stock}</span>
                  </div>
                  <button 
                    onClick={() => addToCart(prod)}
                    className="add-to-cart-btn"
                    disabled={prod.stock === 0}
                  >
                    {prod.stock === 0 ? "Out of Stock" : "Add to Cart"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default BuyerDashboard;