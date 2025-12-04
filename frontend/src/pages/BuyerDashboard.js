// src/components/pages/BuyerDashboard.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  FaShoppingBag,
  FaFire,
  FaFish,
  FaHistory,
  FaHeart,
  FaTruck,
  FaChartLine,
  FaArrowRight,
} from "react-icons/fa";
import BannerImg from "../assets/bg-2.jpg";
import "./BuyerDashboard.css";
import BuyerHeader from "./BuyerHeader";

// Import cart utilities
import { addToCart as addToCartUtil } from "../utils/cartUtils";

const BuyerDashboard = () => {
  const [bestSellers, setBestSellers] = useState([]);
  const [recentPurchases, setRecentPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [stats, setStats] = useState({
    totalOrders: 0,
    activeOrders: 0,
    completedOrders: 0,
    totalSpent: 0
  });

  const CUSTOMER_ID = sessionStorage.getItem("customer_id");
  const navigate = useNavigate();

  // Calculate user stats
  const calculateStats = (purchases) => {
    const totalOrders = purchases.length;
    const activeOrders = purchases.filter(p => p.status === 'Pending' || p.status === 'Preparing').length;
    const completedOrders = purchases.filter(p => p.status === 'Completed').length;
    const totalSpent = purchases.reduce((sum, p) => sum + (Number(p.price) * Number(p.quantity)), 0);
    
    setStats({
      totalOrders,
      activeOrders,
      completedOrders,
      totalSpent
    });
  };

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
      calculateStats(data);
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

       <div className="banner-bg">
          <img src={BannerImg} alt="Banner" />
          <div className="banner-text">
            <h1>Welcome to home of E-Sea Merkado</h1>
            <p>Your one-stop shop for fresh seafood directly from the source!</p>
            <a href="/buyer/shop" className="explore-btn">Shop Now</a>
          </div>
        </div>

      {/* Main Content */}
      <main className="dashboard-content">
        {/* Hero Banner */}
        <section className="hero-banner">
          <div className="hero-content">
            <h1>Welcome to E-Sea Merkado Market! 🐟</h1>
            <p>Discover the finest fresh seafood. Quality guaranteed, ocean to table.</p>
            <button className="hero-cta" onClick={()=> navigate('/buyer/shop')}>
              Shop Now <FaArrowRight />
            </button>
            <div className="hero-stats">
              <div className="stat-item">
                <div className="stat-number">{stats.totalOrders}</div>
                <div className="stat-label">Total Orders</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">{stats.activeOrders}</div>
                <div className="stat-label">Pending Orders</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">₱{stats.totalSpent.toFixed(2)}</div>
                <div className="stat-label">Total Spent</div>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <div className="quick-actions">
          <div className="action-card" onClick={() => navigate('/buyer/orders')}>
            <div className="action-icon purple">
              <FaHistory />
            </div>
            <div className="action-info">
              <h3>Order History</h3>
              <p>{stats.totalOrders} Orders</p>
            </div>
          </div>

          <div className="action-card" onClick={() => navigate('/buyer/cart')}>
            <div className="action-icon orange">
              <FaShoppingBag />
            </div>
            <div className="action-info">
              <h3>My Cart</h3>
              <p>View Items</p>
            </div>
          </div>

          <div className="action-card">
            <div className="action-icon blue">
              <FaTruck />
            </div>
            <div className="action-info">
              <h3>Pending Orders</h3>
              <p>{stats.activeOrders} Active</p>
            </div>
          </div>

          <div className="action-card">
            <div className="action-icon green">
              <FaHeart />
            </div>
            <div className="action-info">
              <h3>Favorites</h3>
              <p>Save Items</p>
            </div>
          </div>
        </div>

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
                  <div className="price-con">
                    <p className="product-price">₱{Number(prod.price).toFixed(2)}</p>
                    <p className="old-price">{prod.old_price ? `₱${Number(prod.old_price).toFixed(2)}` : "N/A"}</p>
                  </div>
                  <p className="freshness">
                    {prod.freshness || "N/A"}
                  </p>
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
                  <div style={{display: "flex", alignItems: "center", justifyContent:"space-between"}}>
                     <h4>{prod.name}</h4>
                    <p className="shop-name"><FaFish style={{color: "#16135d"}} /> {prod.shop_name || "Unknown Shop"}</p>
                  </div>
                  <div className="price-con">
                    <p className="product-price">₱{Number(prod.price).toFixed(2)}</p>
                    <p className="old-price">{prod.old_price ? `₱${Number(prod.old_price).toFixed(2)}` : "N/A"}</p>
                  </div>
                  <p className="freshness">
                    {prod.freshness || "N/A"}
                  </p>
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