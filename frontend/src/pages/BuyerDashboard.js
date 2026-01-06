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
  FaShoppingCart,
  FaTruck,
  FaArrowRight,
  FaStar,
} from "react-icons/fa";
import BannerImg from "../assets/bg-2.jpg";
import "./BuyerDashboard.css";
import BuyerHeader from "./BuyerHeader";
import SellerFeedbackModal from "./SellerFeedbackModal";

// Import cart utilities
import { addToCart as addToCartUtil } from "../utils/cartUtils";

const BuyerDashboard = () => {
  const [bestSellers, setBestSellers] = useState([]);
  const [recentPurchases, setRecentPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [stats, setStats] = useState({
    totalOrders: 0,
    activeOrders: 0,
    completedOrders: 0,
    totalSpent: 0
  });
  const [feedbackStatus, setFeedbackStatus] = useState({});

  const CUSTOMER_ID = sessionStorage.getItem("customer_id");
  const navigate = useNavigate();

  useEffect(() => {
    // Prevent caching
    window.history.pushState(null, null, window.location.href);
    window.onpopstate = function () {
      const customer_id = sessionStorage.getItem("customer_id");
      if (!customer_id) {
        window.location.replace("/buyer/login");
      }
    };
  }, []);

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
      const res = await fetch(`${process.env.REACT_APP_BUYER_API_URL}/api/products/best-sellers`);
      const data = await res.json();
      setBestSellers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching best sellers:", err);
      setBestSellers([]);
    }
  };

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
      
      const uniquePurchases = data.reduce((acc, current) => {
        const exists = acc.find(
          item => item.order_id === current.order_id && 
                  item.product_id === current.product_id
        );
        if (!exists) {
          acc.push(current);
        }
        return acc;
      }, []);
      
      setRecentPurchases(uniquePurchases);
      calculateStats(uniquePurchases);
      
      // Check feedback status for completed orders
      await checkAllFeedbackStatus(uniquePurchases);
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


// Check feedback status for all completed orders
const checkAllFeedbackStatus = async (purchases) => {
  const completedOrders = purchases.filter(p => p.status === 'Completed');
  const statusMap = {};
  
  for (const order of completedOrders) {
    const hasFeedback = await checkExistingFeedback(order.order_id);
    statusMap[order.order_id] = hasFeedback;
  }
  
  setFeedbackStatus(statusMap);
};

  // Check if buyer has already submitted feedback for an order
const checkExistingFeedback = async (orderId) => {
  try {
    console.log('Checking feedback for order:', orderId, 'customer:', CUSTOMER_ID);
    
    // Get buyer's numeric ID from buyer_authentication table
    const buyerRes = await fetch(
      `${process.env.REACT_APP_BUYER_API_URL}/api/buyer/get-numeric-id/${CUSTOMER_ID}`
    );
    
    if (!buyerRes.ok) {
      console.error('Failed to get buyer numeric ID');
      return false;
    }
    
    const buyerData = await buyerRes.json();
    const numericBuyerId = buyerData.buyer_id;
    
    console.log('Got numeric buyer ID:', numericBuyerId);

    const res = await fetch(
      `${process.env.REACT_APP_BUYER_API_URL}/api/seller-feedback/check/${orderId}/${numericBuyerId}`
    );
    const data = await res.json();
    
    console.log('Feedback exists:', data.hasFeedback);
    return data.hasFeedback;
  } catch (error) {
    console.error('Error checking feedback:', error);
    return false;
  }
};


  const handleCompletedOrderClick = async (purchase) => {
    if (purchase.status !== 'Completed') return;

    console.log('Clicked completed order:', purchase.order_id);

    const hasFeedback = await checkExistingFeedback(purchase.order_id);
    
    if (hasFeedback) {
      showToast('You have already submitted feedback for this order');
      return;
    }

    // Set selected order info
    setSelectedOrder({
      orderId: purchase.order_id,
      shopName: purchase.shop_name || 'Shop',
      sellerId: purchase.seller_id
    });
    
    console.log('Opening feedback modal for:', {
      orderId: purchase.order_id,
      sellerId: purchase.seller_id
    });
    
    setShowFeedbackModal(true);
  };

  // Handle feedback submission
  const handleFeedbackSubmit = async (feedbackData) => {
    try {
      console.log('Submitting feedback:', feedbackData);
      console.log('Order info:', selectedOrder);
      
      // Get buyer's numeric ID
      const buyerRes = await fetch(
        `${process.env.REACT_APP_BUYER_API_URL}/api/buyer/get-numeric-id/${CUSTOMER_ID}`
      );
      
      if (!buyerRes.ok) {
        throw new Error('Failed to get buyer ID');
      }
      
      const buyerData = await buyerRes.json();
      const numericBuyerId = buyerData.buyer_id;
      
      console.log('Got numeric buyer ID:', numericBuyerId);

      // Submit feedback
      const payload = {
        ...feedbackData,
        order_id: selectedOrder.orderId,
        buyer_id: numericBuyerId,
        seller_id: selectedOrder.sellerId
      };
      
      console.log('Sending payload:', payload);

      const response = await fetch(`${process.env.REACT_APP_BUYER_API_URL}/api/seller-feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      
      console.log('Response:', result);

      if (!response.ok) {
        throw new Error(result.message || 'Failed to submit feedback');
      }
      
      console.log("Seller feedback submitted successfully");
      setShowFeedbackModal(false);
      setSelectedOrder(null);
      
      // Reload purchases to update the UI
      loadRecentPurchases();
      
      showToast('Thank you for your feedback!');
    } catch (error) {
      console.error('Error submitting feedback:', error);
      showToast(error.message || 'Failed to submit feedback. Please try again.');
    }
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
              <h1>Welcome to E-Sea Merkado Market!</h1>
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
                <div 
                  key={index} 
                  className={`product-card recent-card ${prod.status === 'Completed' ? 'completed-order' : ''}`}
                  onClick={() => handleCompletedOrderClick(prod)}
                  style={{ cursor: prod.status === 'Completed' ? 'pointer' : 'default' }}
                >
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
                  
                  {prod.status === 'Completed' && (
                    <div 
                      className="rate-order-badge"
                      style={{
                        background: feedbackStatus[prod.order_id] === true 
                          ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
                          : 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)',
                        cursor: feedbackStatus[prod.order_id] === true ? 'default' : 'pointer'
                      }}
                    >
                      {feedbackStatus[prod.order_id] === false ? (
                        <>
                          Rate this order
                        </>
                      ) : feedbackStatus[prod.order_id] === true ? (
                        <>
                          Feedback submitted
                        </>
                      ) : (
                        <>Checking...</>
                      )}
                    </div>
                  )}
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
                bestSellers.length > 0 && bestSellers[0].total_sold > 0 ? <FaShoppingCart /> : <FaSearch />
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

      {/* Seller Feedback Modal */}
      <SellerFeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => {
          setShowFeedbackModal(false);
          setSelectedOrder(null);
        }}
        onSubmit={handleFeedbackSubmit}
        orderInfo={selectedOrder}
      />
    </div>
  );
};


export default BuyerDashboard;