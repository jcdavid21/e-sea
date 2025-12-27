import React, { useState } from "react";
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
  const location = useLocation();

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
    const sellerId = localStorage.getItem('uniqueId');
    
    // Check if user has already submitted feedback
    const hasFeedback = await checkExistingFeedback(sellerId);
    
    if (hasFeedback) {
      // User has already submitted feedback, logout directly
      console.log("🚪 Seller has already submitted feedback, logging out directly...");
      localStorage.removeItem("sellerToken");
      localStorage.removeItem("uniqueId");
      window.location.href = "/role";
    } else {
      // Show feedback modal
      setShowFeedbackModal(true);
    }
  };

  const handleFeedbackSubmit = async (feedbackData) => {
    const sellerId = localStorage.getItem('uniqueId');
    
    try {
      await fetch(`${process.env.REACT_APP_SELLER_API_URL}/api/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...feedbackData,
          user_id: sellerId
        })
      });
      
      localStorage.removeItem("sellerToken");
      localStorage.removeItem("uniqueId");
      window.location.href = "/role";
    } catch (error) {
      console.error('Error submitting feedback:', error);
      localStorage.removeItem("sellerToken");
      localStorage.removeItem("uniqueId");
      window.location.href = "/role";
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
          <Link 
            to="/seller/dashboard/orders" 
            className="nav-link"
            style={isActive('/seller/dashboard/orders') ? activeLinkStyle : {}}
            onClick={() => setSidebarOpen(false)}
          >
            <FaShoppingCart />
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
          localStorage.removeItem("sellerToken");
          localStorage.removeItem("uniqueId");
          window.location.href = "/role";
        }}
        onSubmit={handleFeedbackSubmit}
        userType="seller"
      />
    </div>
  );
};

export default SellerDashboard;