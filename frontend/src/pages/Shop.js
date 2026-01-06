import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaStar } from "react-icons/fa";
import BuyerHeader from "./BuyerHeader";
import ImgPlaceholder from "../assets/logo.png";
import BannerImg from "../assets/bg-1.jpg";
import './Shop.css';

const Shop = () => {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [storeHours, setStoreHours] = useState({});
  const [ratings, setRatings] = useState({});
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

  useEffect(() => {
    const loadShops = async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_BUYER_API_URL}/api/shop`);
        if (!res.ok) throw new Error("Failed to fetch shop data");
        const data = await res.json();
        const processedData = data.map(shop => ({
          ...shop,
          products: Array.isArray(shop.products) ? shop.products : []
        }));
        setShops(processedData);

        // Fetch store hours and ratings for all shops
        fetchAllStoreHours(processedData);
        fetchAllRatings(processedData);
      } catch (err) {
        console.error("Error fetching shops:", err);
        setShops([]);
      } finally {
        setLoading(false);
      }
    };

    loadShops();
  }, []);

  const fetchAllStoreHours = async (shopsData) => {
    try {
      const hoursData = {};

      for (const shop of shopsData) {
        if (shop.seller_id) {
          const response = await fetch(
            `${process.env.REACT_APP_SELLER_API_URL}/api/seller/store-hours/${shop.seller_id}`
          );
          if (response.ok) {
            const hours = await response.json();
            hoursData[shop.seller_id] = hours;
          }
        }
      }

      setStoreHours(hoursData);
    } catch (err) {
      console.error("Error fetching store hours:", err);
    }
  };

  const fetchAllRatings = async (shopsData) => {
    try {
      const ratingsData = {};

      for (const shop of shopsData) {
        if (shop.seller_id) {
          const response = await fetch(
            `${process.env.REACT_APP_BUYER_API_URL}/api/seller/${shop.seller_id}/rating`
          );
          if (response.ok) {
            const data = await response.json();
            ratingsData[shop.seller_id] = data;
          }
        }
      }

      setRatings(ratingsData);
    } catch (err) {
      console.error("Error fetching ratings:", err);
    }
  };

  const isStoreOpen = (sellerId) => {
    if (!storeHours[sellerId]) return { isOpen: false, message: "Hours not available" };

    const now = new Date();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
    const currentTime = now.toTimeString().slice(0, 5);

    const todayHours = storeHours[sellerId].find(h => h.day_of_week === currentDay);

    if (!todayHours || !todayHours.is_open) {
      const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      const currentDayIndex = daysOfWeek.indexOf(currentDay);

      for (let i = 1; i <= 7; i++) {
        const nextDayIndex = (currentDayIndex + i) % 7;
        const nextDay = daysOfWeek[nextDayIndex];
        const nextDayHours = storeHours[sellerId].find(h => h.day_of_week === nextDay);

        if (nextDayHours && nextDayHours.is_open) {
          const openTime = nextDayHours.open_time.substring(0, 5);
          return {
            isOpen: false,
            message: `Opens ${i === 1 ? 'tomorrow' : nextDay} at ${formatTime(openTime)}`
          };
        }
      }

      return { isOpen: false, message: "Closed today" };
    }

    const openTime = todayHours.open_time.substring(0, 5);
    const closeTime = todayHours.close_time.substring(0, 5);

    let effectiveCloseTime = closeTime;
    if (closeTime === '00:00') {
      effectiveCloseTime = '24:00';
    }

    const isWithinHours = currentTime >= openTime && currentTime < effectiveCloseTime;

    if (isWithinHours) {
      const displayCloseTime = closeTime === '00:00' ? '12:00 AM' : formatTime(closeTime);
      return {
        isOpen: true,
        message: `Open until ${displayCloseTime}`
      };
    } else if (currentTime < openTime) {
      return {
        isOpen: false,
        message: `Opens today at ${formatTime(openTime)}`
      };
    } else {
      const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      const currentDayIndex = daysOfWeek.indexOf(currentDay);

      for (let i = 1; i <= 7; i++) {
        const nextDayIndex = (currentDayIndex + i) % 7;
        const nextDay = daysOfWeek[nextDayIndex];
        const nextDayHours = storeHours[sellerId].find(h => h.day_of_week === nextDay);

        if (nextDayHours && nextDayHours.is_open) {
          const openTime = nextDayHours.open_time.substring(0, 5);
          return {
            isOpen: false,
            message: `Opens ${i === 1 ? 'tomorrow' : nextDay} at ${formatTime(openTime)}`
          };
        }
      }

      return { isOpen: false, message: "Closed" };
    }
  };

  const formatTime = (time24) => {
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<FaStar key={i} />);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<FaStar key={i} style={{ opacity: 0.5 }} />);
      } else {
        stars.push(<FaStar key={i} style={{ opacity: 0.2 }} />);
      }
    }
    return stars;
  };

  const handleShopClick = (shopId, shopName) => {
    navigate(`/shop/${shopId}`, { state: { shopName: shopName } });
  };

  const filteredShops = searchTerm
    ? shops.filter((shop) =>
      shop.shop_name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    : shops;

  return (
    <div className="shop-page-wrapper">
      <BuyerHeader
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        currentPage="shop"
      />
      <div className="banner-bg">
        <img src={BannerImg} alt="Banner" />
        <div className="banner-text">
          <h1>Welcome to E-Sea-Merkado</h1>
          <p>Your one-stop marketplace for fresh seafood directly from local sellers!</p>
          <a href="#shopnow" className="explore-btn">Explore Shops</a>
        </div>
      </div>

      <div className="shop-container">
        <div className="shop-page-header" id="shopnow">
          <h1>Discover Local Seafood Shops</h1>
          <p className="shop-count">{filteredShops.length} {filteredShops.length === 1 ? 'shop' : 'shops'} ready to serve you</p>
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading shops...</p>
          </div>
        ) : filteredShops.length === 0 ? (
          <div className="no-shops-container">
            <div className="empty-icon">🪧</div>
            <p className="no-shops-message">
              {searchTerm ? "No shops found matching your search." : "No shops available at the moment."}
            </p>
          </div>
        ) : (
          <div className="shops-grid">
            {filteredShops.map((shop) => {
              const storeStatus = isStoreOpen(shop.seller_id);
              const shopRating = ratings[shop.seller_id];

              return (
                <div
                  key={shop.seller_id}
                  className={`shop-card ${!storeStatus.isOpen ? 'store-closed' : ''}`}
                  onClick={() => handleShopClick(shop.seller_id, shop.shop_name)}
                >
                  <div className="shop-header">
                    <div className="shop-info">
                      {shop.logo ? (
                        <img
                          src={`${process.env.REACT_APP_SELLER_API_URL}${shop.logo}`}
                          alt={`${shop.shop_name} logo`}
                          className="shop-logo"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = ImgPlaceholder;
                          }}
                        />
                      ) : (
                        <div className="shop-logo shop-logo-placeholder">
                          <img src={ImgPlaceholder} alt="Placeholder Logo" className="shop-logo" />
                        </div>
                      )}
                      <div className="shop-details">
                        <h2 className="shop-name">{shop.shop_name}</h2>
                        <div className={`store-status-badge ${storeStatus.isOpen ? 'open' : 'closed'}`}>
                          {storeStatus.message}
                        </div>
                        {shopRating && (
                          <div className="shop-rating">
                            <div className="rating-stars-display">
                              {renderStars(shopRating.averageRating)}
                            </div>
                            <span className="rating-text">
                              {shopRating.averageRating.toFixed(1)}
                            </span>
                            <span className="rating-count">
                              ({shopRating.totalReviews}{shopRating.totalReviews === 1 ? '' : ''})
                            </span>
                          </div>
                        )}
                        {!shopRating && (
                          <div className="shop-rating">
                            <span className="no-ratings">No ratings yet</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="product-count">
                      {shop.products.length}
                      <span className="product-label">Products</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Shop;