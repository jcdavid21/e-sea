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
import "./SellerDashboard.css";
import logo from "../assets/logo.png";

const SellerDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("sellerToken");
    localStorage.removeItem("uniqueId");
    window.location.href = "/role";
  };

  // Function to check if current route is active
  const isActive = (path) => {
    return location.pathname === path;
  };

  // Active link styles
  const activeLinkStyle = {
    backgroundColor: '#1f2d48',
    color: '#ffffff',
    fontWeight: '600',
    boxShadow: '0 2px 8px rgba(31, 45, 72, 0.7)',
  };

  return (
    <div className="dashboard-container">
      {/* Mobile Header */}
      <header className="mobile-header">
        <button
          className="menu-toggle"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <FaTimes /> : <FaBars />}
        </button>
        <img src={logo} alt="Sea-Merkado Logo" className="mobile-logo" />
      </header>

      {/* Sidebar */}
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
          {/* store hours */}
          <Link 
            to="/seller/dashboard/store-hours" 
            className="nav-link"
            style={isActive('/seller/dashboard/store-hours') ? activeLinkStyle : {}}
            onClick={() => setSidebarOpen(false)}
          >
            <FaClock />
            <span>Store Hours</span>
          </Link>
          {/* reports */}
          <Link 
            to="/seller/dashboard/reports" 
            className="nav-link"
            style={isActive('/seller/dashboard/reports') ? activeLinkStyle : {}}
            onClick={() => setSidebarOpen(false)}
          >
            <FaClipboardList />
            <span>Reports</span>
          </Link>
          {/* end reports */}
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
        <button onClick={handleLogout} className="logout-btn">
          <FaSignOutAlt />
          <span>Logout</span>
        </button>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <Outlet /> {/* This will render the selected page */}
      </main>
    </div>
  );
};

export default SellerDashboard;