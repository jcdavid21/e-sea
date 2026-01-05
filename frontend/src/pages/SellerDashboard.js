import React, { useState, useEffect } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import {
  FaHome,
  FaBoxOpen,
  FaClipboardList,
  FaChartBar,
  FaUserCircle,
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaShoppingCart,
  FaClock,
} from "react-icons/fa";
import FeedbackModal from './FeedbackModal';
import "./SellerDashboard.css";
import logo from "../assets/logo.png";

const SellerDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0); // ✅ NEW STATE
  const location = useLocation();

  const sellerId = localStorage.getItem("seller_unique_id");

  // ✅ NEW: Fetch pending orders count
  const fetchPendingOrdersCount = async () => {
    if (!sellerId) return;

    try {
      const res = await fetch(
        `${process.env.REACT_APP_SELLER_API_URL}/api/orders?seller_id=${sellerId}&page=1&limit=999`
      );
      if (!res.ok) return;
      
      const data = await res.json();
      const pendingCount = data.orders.filter(
        order => order.status === "Pending"
      ).length;
      
      setPendingOrdersCount(pendingCount);
    } catch (error) {
      console.error("Error fetching pending orders count:", error);
    }
  };

  // ✅ NEW: Fetch count on mount and every 30 seconds
  useEffect(() => {
    fetchPendingOrdersCount();
    
    const interval = setInterval(fetchPendingOrdersCount, 30000);
    
    return () => clearInterval(interval);
  }, [sellerId]);

  // Check if seller has already submitted feedback
  const checkExistingFeedback = async (sellerId) => {
    try {
      const res = await fetch(
        `${process.env.REACT_APP_SELLER_API_URL}/api/feedback/check/${sellerId}?user_type=seller`
      );
      const data = await res.json();
      return data.hasFeedback;
    } catch (error) {
      console.error('Error checking feedback:', error);
      return false;
    }
  };

  const handleLogoutClick = async () => {
    const sellerId = localStorage.getItem('seller_unique_id');
    
    const hasFeedback = await checkExistingFeedback(sellerId);
    
    if (hasFeedback) {
      console.log("🚪 Seller has already submitted feedback, logging out directly...");
      localStorage.removeItem("seller_unique_id");
      localStorage.removeItem("sellerToken");
      localStorage.removeItem("uniqueId");
      localStorage.removeItem("loginTime");
      window.location.href = "/seller/login";
    } else {
      setShowFeedbackModal(true);
    }
  };

  const handleFeedbackSubmit = async (feedbackData) => {
    const sellerId = localStorage.getItem('seller_unique_id');
    
    try {
      await fetch(`${process.env.REACT_APP_SELLER_API_URL}/api/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...feedbackData,
          user_id: sellerId
        })
      });
      
      localStorage.removeItem("seller_unique_id");
      localStorage.removeItem("sellerToken");
      localStorage.removeItem("uniqueId");
      localStorage.removeItem("loginTime");
      window.location.href = "/seller/login";
    } catch (error) {
      console.error('Error submitting feedback:', error);
      localStorage.removeItem("seller_unique_id");
      localStorage.removeItem("sellerToken");
      localStorage.removeItem("uniqueId");
      localStorage.removeItem("loginTime");
      window.location.href = "/seller/login";
    }
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const activeLinkStyle = {
    backgroundColor: '#1f2d48',
    color: '#ffffff',
    fontWeight: '600',
    boxShadow: '0 2px 8px rgba(31, 45, 72, 0.7)',
  };

  return (
    <div className="dashboard-container">
      <header className="mobile-header">
        <button
          className="menu-toggle"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <FaTimes /> : <FaBars />}
        </button>
        <div className="mobile-logo-section">
          <img src={logo} alt="Sea-Merkado Logo" className="mobile-logo" />
          <h2 className="mobile-brand-name">e-Sea-Merkado</h2>
        </div>
      </header>

      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <img src={logo} alt="e-Sea-Merkado Logo" className="sidebar-logo" />
          <h3>e-Sea-Merkado</h3>
        </div>
        <nav className="sidebar-nav">
          <Link 
            to="/seller/dashboard/home" 
            className="nav-link"
            style={isActive('/seller/dashboard/home') ? activeLinkStyle : {}}
            onClick={() => setSidebarOpen(false)}
          >
            <FaHome />
            <span>Home</span>
          </Link>
          <Link 
            to="/seller/dashboard/stock" 
            className="nav-link"
            style={isActive('/seller/dashboard/stock') ? activeLinkStyle : {}}
            onClick={() => setSidebarOpen(false)}
          >
            <FaClipboardList />
            <span>Stock Management</span>
          </Link>
          
          {/* ✅ UPDATED: Orders link with notification badge */}
          <Link 
            to="/seller/dashboard/orders" 
            className="nav-link"
            style={isActive('/seller/dashboard/orders') ? activeLinkStyle : {}}
            onClick={() => setSidebarOpen(false)}
          >
            <div style={{ position: 'relative' }}>
              <FaShoppingCart />
              {pendingOrdersCount > 0 && (
                <span className="sidebar-notif-badge">{pendingOrdersCount}</span>
              )}
            </div>
            <span>View Orders</span>
          </Link>

          <Link 
            to="/seller/dashboard/products" 
            className="nav-link"
            style={isActive('/seller/dashboard/products') ? activeLinkStyle : {}}
            onClick={() => setSidebarOpen(false)}
          >
            <FaBoxOpen />
            <span>All Products</span>
          </Link>
          <Link 
            to="/seller/dashboard/price" 
            className="nav-link"
            style={isActive('/seller/dashboard/price') ? activeLinkStyle : {}}
            onClick={() => setSidebarOpen(false)}
          >
            <FaChartBar />
            <span>Price Analysis</span>
          </Link>
          <Link 
            to="/seller/dashboard/store-hours" 
            className="nav-link"
            style={isActive('/seller/dashboard/store-hours') ? activeLinkStyle : {}}
            onClick={() => setSidebarOpen(false)}
          >
            <FaClock />
            <span>Store Hours</span>
          </Link>
          <Link 
            to="/seller/dashboard/reports" 
            className="nav-link"
            style={isActive('/seller/dashboard/reports') ? activeLinkStyle : {}}
            onClick={() => setSidebarOpen(false)}
          >
            <FaClipboardList />
            <span>Reports</span>
          </Link>
          <Link 
            to="/seller/dashboard/profile" 
            className="nav-link"
            style={isActive('/seller/dashboard/profile') ? activeLinkStyle : {}}
            onClick={() => setSidebarOpen(false)}
          >
            <FaUserCircle />
            <span>Profile</span>
          </Link>
        </nav>
        <button onClick={handleLogoutClick} className="logout-btn">
          <FaSignOutAlt />
          <span>Logout</span>
        </button>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>

      <FeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => {
          setShowFeedbackModal(false);
          localStorage.removeItem("seller_unique_id");
          localStorage.removeItem("sellerToken");
          localStorage.removeItem("uniqueId");
          localStorage.removeItem("loginTime");
          window.location.href = "/seller/login";
        }}
        onSubmit={handleFeedbackSubmit}
        userType="seller"
      />
    </div>
  );
};

export default SellerDashboard;