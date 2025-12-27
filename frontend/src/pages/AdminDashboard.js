import React, { useState } from "react";
import { useNavigate, Outlet, useLocation } from "react-router-dom";
import "./AdminDashboard.css";
import ApproveSellers from "./ApproveSellers";
import ManageUsers from "./ManageUsers";
import AdminAnalytics from "./AdminAnalytics";
import ManageFeedbacks from "./ManageFeedbacks";
import Reports from "./Reports";
import logo from "../assets/logo.png";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("analytics");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Base path for nested "Manage Products" feature
  const MANAGE_PRODUCTS_PATH = "/admin/dashboard/manage-products";
  const SELLER_PRODUCTS_PATH = "/admin/dashboard/seller-products";

  // Render main content based on URL or activeTab
  const renderContent = () => {
    // Check if we're in any nested route (manage-products or seller-products)
    if (
      location.pathname.startsWith(MANAGE_PRODUCTS_PATH) ||
      location.pathname.startsWith(SELLER_PRODUCTS_PATH)
    ) {
      return <Outlet />;
    }

    // Render based on activeTab when on main dashboard route
    switch (activeTab) {
      case "analytics":
        return <AdminAnalytics />;
      case "approve":
        return <ApproveSellers />;
      case "manageUsers":
        return <ManageUsers />;
      case "reports":
        return <Reports />;
      case "feedbacks":
        return <ManageFeedbacks />;
      default:
        return <AdminAnalytics />;
    }
  };

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem("authToken");
    sessionStorage.clear();
    navigate("/");
  };

  const handleNavClick = (tabName, path) => {
    setActiveTab(tabName);
    setIsSidebarOpen(false); // Close sidebar on mobile after selection
    if (path) {
      navigate(path);
    } else {
      navigate("/admin/dashboard");
    }
  };

  return (
    <div className="admin-dashboard">
      <header className="mobile-header">
        <button 
          className="hamburger-btn" 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          aria-label="Toggle menu"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
        <div className="mobile-logo-section">
          <img src={logo} alt="Logo" className="mobile-logo" />
          <h2 className="mobile-brand-name">e-Sea-Merkado</h2>
        </div>
      </header>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div 
          className="sidebar-overlay" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-top">
          <div className="logo-section">
            <img src={logo} alt="Logo" className="logo" />
            <h2 className="brand-name">e-Sea-Merkado</h2>
          </div>

          <nav className="nav-links">
            <button
              className={activeTab === "analytics" ? "active" : ""}
              onClick={() => handleNavClick("analytics", "/admin/dashboard")}
            >
              <span className="material-symbols-outlined">analytics</span>
              Analytics
            </button>

            <button
              className={activeTab === "approve" ? "active" : ""}
              onClick={() => handleNavClick("approve")}
            >
              <span className="material-symbols-outlined">verified</span>
              Approve Sellers
            </button>

            <button
              className={activeTab === "manageUsers" ? "active" : ""}
              onClick={() => handleNavClick("manageUsers")}
            >
              <span className="material-symbols-outlined">group</span>
              Manage Users
            </button>

            <button
              className={
                location.pathname.startsWith(MANAGE_PRODUCTS_PATH) ||
                location.pathname.startsWith(SELLER_PRODUCTS_PATH)
                  ? "active"
                  : ""
              }
              onClick={() => handleNavClick("manageProducts", MANAGE_PRODUCTS_PATH)}
            >
              <span className="material-symbols-outlined">inventory_2</span>
              Seller Products
            </button>

            <button
              className={activeTab === "feedbacks" ? "active" : ""}
              onClick={() => handleNavClick("feedbacks")}
            >
              <span className="material-symbols-outlined">feedback</span>
              Feedbacks
            </button>

            <button
              className={activeTab === "reports" ? "active" : ""}
              onClick={() => handleNavClick("reports")}
            >
              <span className="material-symbols-outlined">bar_chart</span>
              Reports
            </button>
          </nav>
        </div>

        <div className="sidebar-bottom">
          <button className="logout-btn" onClick={()=> handleLogout()}>
            <span className="material-symbols-outlined">logout</span>
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">{renderContent()}</main>
    </div>
  );
};

export default AdminDashboard;