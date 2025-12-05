// src/components/common/BuyerHeader.js
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import logo from "../assets/logo.png";
import { 
  FaShoppingCart, 
  FaHome, 
  FaStore, 
  FaBell, 
  FaUser, 
  FaSearch 
} from "react-icons/fa";
import { getCartCount } from "../utils/cartUtils";
import "./BuyerDashboard.css";

const BuyerHeader = ({ searchTerm, onSearchChange, onNavClick, currentPage }) => {
  const [cartCount, setCartCount] = useState(0);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const searchRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Update cart count
  const updateCartCount = () => {
    const count = getCartCount();
    setCartCount(count);
  };

  useEffect(() => {
    updateCartCount();

    // Listen for cart updates
    const handleCartUpdate = () => {
      updateCartCount();
    };

    window.addEventListener('cartUpdated', handleCartUpdate);
    
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
    };
  }, []);

  // Fetch product suggestions based on search term
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!searchTerm || searchTerm.trim().length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/products/search-suggestions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ searchTerm: searchTerm.trim() }),
        });

        if (response.ok) {
          const data = await response.json();
          setSuggestions(data);
          setShowSuggestions(data.length > 0);
        }
      } catch (error) {
        console.error("Error fetching suggestions:", error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    console.log("📊 BuyerHeader searchTerm prop updated:", searchTerm);
  }, [searchTerm]);

  const handleSuggestionClick = (product) => {
    setShowSuggestions(false);
    
    // Navigate to the shop product page
    navigate(`/shop/${product.seller_id}`, {
      state: { 
        shopName: product.shop_name || 'Shop Products',
        searchProduct: product.name 
      }
    });
  };

  const highlightMatch = (text, query) => {
    if (!query) return text;
    
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, index) => 
      part.toLowerCase() === query.toLowerCase() 
        ? <strong key={index}>{part}</strong> 
        : part
    );
  };

  return (
    <header className="dashboard-header">
      <div className="header-top">
        <div className="left-section">
          <img 
            src={logo} 
            alt="Sea Merkado Logo" 
            className="dashboard-logo"
            onClick={() => {
              if (onNavClick) {
                onNavClick("home");
              } else {
                navigate("/buyer/dashboard");
              }
            }}
            style={{ cursor: "pointer" }}
          />
          <div className="search-container" ref={searchRef}>
            <input
              type="text"
              className="search-bar"
              placeholder="Search products..."
              value={searchTerm || ""}
              onChange={(e) => {
                console.log("🔍 Search input change:", e.target.value); // DEBUG
                console.log("🎯 onSearchChange callback exists?", !!onSearchChange); // DEBUG
                
                if (onSearchChange) {
                  onSearchChange(e.target.value);
                  console.log("✅ onSearchChange called"); // DEBUG
                } else {
                  console.warn("⚠️ onSearchChange is NOT defined"); // DEBUG
                }
              }}
              onFocus={() => {
                if (suggestions.length > 0) {
                  setShowSuggestions(true);
                }
              }}
            />
            
            {/* Search Suggestions Dropdown */}
            {showSuggestions && (
              <div className="search-suggestions">
                {isLoading ? (
                  <div className="suggestion-item loading">
                    <span>Loading...</span>
                  </div>
                ) : (
                  suggestions.map((product) => (
                    <div
                      key={product.id}
                      className="suggestion-item"
                      onClick={() => handleSuggestionClick(product)}
                    >
                      <img
                        src={
                          product.image_url
                            ? `${process.env.REACT_APP_API_URL}/uploads/${product.image_url}`
                            : "https://via.placeholder.com/40?text=No+Image"
                        }
                        alt={product.name}
                        className="suggestion-image"
                      />
                      <div className="suggestion-info">
                        <div className="suggestion-name">
                          {highlightMatch(product.name, searchTerm)}
                        </div>
                        <div className="suggestion-meta">
                          <span className="suggestion-price">₱{Number(product.price).toFixed(2)}</span>
                          <span className="suggestion-shop">{product.shop_name || 'Unknown Shop'}</span>
                        </div>
                      </div>
                      <div className="suggestion-category">{product.category}</div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        <div className="right-section">
          <div className="cart-button" onClick={() => navigate("/buyer/cart")}>
            <FaShoppingCart className="cart-icon" />
            {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
          </div>
        </div>
      </div>

      {/* Navigation Bar */}
      <nav className="main-nav">
        <div
          className={`nav-item ${currentPage === "home" && location.pathname !== "/buyer/shop" && !location.pathname.startsWith("/shop/") ? "active" : ""}`}
          onClick={() => {
            if (onNavClick) {
              onNavClick("home");
            } else {
              navigate("/buyer/dashboard");
            }
          }}
        >
          <FaHome />
          <span>Home</span>
        </div>

        <div
          className={`nav-item ${currentPage === "shop" || location.pathname === "/buyer/shop" || location.pathname.startsWith("/shop/") ? "active" : ""}`}
          onClick={() => {
            if (onNavClick) {
              onNavClick("shop");
            } else {
              navigate("/buyer/shop");
            }
          }}
        >
          <FaStore />
          <span>Shop</span>
        </div>

        <div 
          className={`nav-item ${location.pathname === "/buyer/notifications" ? "active" : ""}`}
          onClick={() => navigate("/buyer/notifications")}
        >
          <FaBell />
          <span>Notifications</span>
        </div>

        <div 
          className={`nav-item ${location.pathname === "/buyer/profile" ? "active" : ""}`}
          onClick={() => navigate("/buyer/profile")}
        >
          <FaUser />
          <span>Profile</span>
        </div>
      </nav>
    </header>
  );
};

export default BuyerHeader;