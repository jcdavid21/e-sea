// src/components/pages/BuyerDashboard.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  FaShoppingBag,
  FaFire,
  FaSearch,
  FaFish,
  FaHistory,
  FaHeart,
  FaTruck,
  FaChartLine,
  FaArrowRight,
  FaClock,
  FaCheckCircle,
  FaTimesCircle
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
  const [storeHours, setStoreHours] = useState([]);
  const [currentStoreStatus, setCurrentStoreStatus] = useState({ 
    isOpen: true, 
    openTime: '7:00 AM', 
    closeTime: '10:00 PM' 
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

  const checkIfStoreOpen = (hours) => {
    if (!hours || hours.length === 0) {
      return { isOpen: true, openTime: '7:00 AM', closeTime: '10:00 PM' };
    }

    const now = new Date();
    const phTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
    const currentDay = phTime.toLocaleDateString('en-US', { weekday: 'long' });
    const currentHour = phTime.getHours();
    const currentMinute = phTime.getMinutes();
    const currentTimeInMinutes = currentHour * 60 + currentMinute;

    const todayHours = hours.find(h => h.day_of_week === currentDay);
    
    if (!todayHours || !todayHours.is_open) {
      return { isOpen: false, openTime: 'Closed', closeTime: 'Closed' };
    }

    const [openHour, openMin] = todayHours.open_time.split(':').map(Number);
    const [closeHour, closeMin] = todayHours.close_time.split(':').map(Number);
    const openTimeInMinutes = openHour * 60 + openMin;
    const closeTimeInMinutes = closeHour * 60 + closeMin;

    const isOpen = currentTimeInMinutes >= openTimeInMinutes && currentTimeInMinutes < closeTimeInMinutes;

    const formatTime = (timeStr) => {
      const [h, m] = timeStr.split(':').map(Number);
      const period = h >= 12 ? 'PM' : 'AM';
      const hour12 = h % 12 || 12;
      return `${hour12}:${m.toString().padStart(2, '0')} ${period}`;
    };

    return {
      isOpen,
      openTime: formatTime(todayHours.open_time),
      closeTime: formatTime(todayHours.close_time)
    };
  };

  // Fetch best sellers with total sold
  const loadBestSellers = async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_BUYER_API_URL}/api/products/best-sellers`);
      const data = await res.json();
      setBestSellers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching best sellers:", err);
      setBestSellers([]);
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
        `${process.env.REACT_APP_BUYER_API_URL}/api/buyer/purchases?buyer_id=${CUSTOMER_ID}`
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

  useEffect(() => {
    const fetchStoreHours = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_BUYER_API_URL}/api/store-hours/global`);
        const data = await response.json();
        setStoreHours(data);
        const status = checkIfStoreOpen(data);
        setCurrentStoreStatus(status);
      } catch (err) {
        console.error("Error fetching store hours:", err);
      }
    };

    fetchStoreHours();
    
    // Check status every minute
    const interval = setInterval(() => {
      const status = checkIfStoreOpen(storeHours);
      setCurrentStoreStatus(status);
    }, 60000);

    return () => clearInterval(interval);
  }, [storeHours]);

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
    ? (Array.isArray(bestSellers) ? bestSellers.filter((prod) =>
        prod.name.toLowerCase().includes(searchTerm.toLowerCase())
      ) : [])
    : (Array.isArray(bestSellers) ? bestSellers : []);

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
            <div style={{display: "flex", justifyContent: "space-between", alignItems: "center",
              width: "100%"
            }}>
              <h1>Welcome to E-Sea Merkado Market! 🐟</h1>
            </div>
            <p>Discover the finest fresh seafood. Quality guaranteed, ocean to table.</p>
            <button className="hero-cta" onClick={()=> navigate('/buyer/shop')}>
              Shop Now <FaArrowRight />
            </button>
            <div className="hero-stats">
              <div className="stat-item">
                <div className="stat-number" style={{color: "white"}}>{stats.totalOrders}</div>
                <div>Total Orders</div>
              </div>
              <div className="stat-item">
                <div className="stat-number" style={{color: "white"}}>{stats.activeOrders}</div>
                <div>Pending Orders</div>
              </div>
              <div className="stat-item stats-item-highlight">
                <div className="stat-number" style={{color: "white"}}>₱{stats.totalSpent.toFixed(2)}</div>
                <div className="">Total Spent</div>
              </div>
            </div>
          </div>
        </section>

        {/* Store Hours Section */}
        <div className="store-hours-container">
          <div className="store-hours-card">
            <div className="store-hours-header">
              <div className="header-left">
                <FaClock size={20} />
                <h3>Store Operating Hours</h3>
              </div>
              <div className="store-status-badge" style={{
                background: currentStoreStatus.isOpen 
                  ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
                  : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                color: 'white',
                padding: '8px 18px',
                borderRadius: '25px',
                fontSize: '13px',
                fontWeight: '800',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: currentStoreStatus.isOpen 
                  ? '0 4px 12px rgba(16, 185, 129, 0.4)' 
                  : '0 4px 12px rgba(239, 68, 68, 0.4)'
              }}>
                {currentStoreStatus.isOpen ? (
                  <>
                    <FaCheckCircle size={16} />
                    <span>Open Now</span>
                  </>
                ) : (
                  <>
                    <FaTimesCircle size={16} />
                    <span>Closed</span>
                  </>
                )}
              </div>
            </div>
            
            <div className="hours-grid">
              {storeHours.length > 0 ? (
                storeHours.map((hour, index) => {
                  const isToday = new Date().toLocaleDateString('en-US', { weekday: 'long' }) === hour.day_of_week;
                  
                  return (
                    <div 
                      key={hour.day_of_week} 
                      className={`hours-item ${isToday ? 'today' : ''} ${!hour.is_open ? 'closed' : ''}`}
                    >
                      <div className="day-label">
                        {isToday && <span className="today-badge">Today</span>}
                        <span className="day-name">{hour.day_of_week}</span>
                      </div>
                      
                      {hour.is_open ? (
                        <div className="time-display">
                          <span className="open-indicator">●</span>
                          <span className="time-text">
                            {new Date(`2000-01-01T${hour.open_time}`).toLocaleTimeString('en-US', { 
                              hour: 'numeric', 
                              minute: '2-digit',
                              hour12: true 
                            })}
                            {' - '}
                            {new Date(`2000-01-01T${hour.close_time}`).toLocaleTimeString('en-US', { 
                              hour: 'numeric', 
                              minute: '2-digit',
                              hour12: true 
                            })}
                          </span>
                        </div>
                      ) : (
                        <div className="time-display closed-display">
                          <span className="closed-indicator">●</span>
                          <span className="closed-text">Closed</span>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="no-hours-set">
                  <FaClock size={48} color="#94a3b8" />
                  <p>Store hours information not available</p>
                </div>
              )}
            </div>
          </div>
        </div>


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

          {/* <div className="action-card">
            <div className="action-icon green">
              <FaHeart />
            </div>
            <div className="action-info">
              <h3>Favorites</h3>
              <p>Save Items</p>
            </div>
          </div> */}
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
              {recentPurchases.map((prod, index) => (
                <div key={index} className="product-card recent-card">
                  <img
                    src={
                      prod.image_url
                        ? `${process.env.REACT_APP_SELLER_API_URL}/uploads/${prod.image_url}`
                        : "https://via.placeholder.com/150?text=No+Image"
                    }
                    alt={prod.product_name}
                    className="product-img"
                  />
                  <h4>{prod.product_name}</h4>
                  <div className="price-con">
                    <p className="product-price">₱{Number(prod.price).toFixed(2)}</p>
                    <p className="old-price">{prod.previous_price ? `₱${Number(prod.previous_price).toFixed(2)}` : ""}</p>
                  </div>
                  <p className={`freshness freshness-${prod.freshness?.toLowerCase() || 'na'}`}>
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
              {
                bestSellers.length > 0 && bestSellers[0].total_sold > 0 ? <FaFire style={{ color: '#ff5722' }} /> : <FaSearch />
              }
            </span>
            <h2>
              {searchTerm 
                ? "Search Results" 
                : (bestSellers.length > 0 && bestSellers[0].total_sold > 0) 
                  ? "Best Sellers" 
                  : "Recommended for You"}
            </h2>
          </div>
          {filteredBestSellers.length === 0 ? (
            <p className="no-results">No products found.</p>
          ) : (
            <div className="product-list">
              {filteredBestSellers.map((prod, index) => (
                <div key={index} className="product-card bestseller-card">
                  {prod.total_sold > 0 && (
                    <div className="bestseller-badge">
                      <FaFish /> {prod.total_sold} Sold
                    </div>
                  )}
                  <img
                    src={
                      prod.image_url
                        ? `${process.env.REACT_APP_SELLER_API_URL}/uploads/${prod.image_url}`
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
                   <p className="old-price">{prod.previous_price ? `₱${Number(prod.previous_price).toFixed(2)}` : "N/A"}</p>
                  </div>
                  <p className={`freshness freshness-${prod.freshness?.toLowerCase() || 'na'}`}>
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