import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BuyerHeader from "./BuyerHeader";
import ImgPlaceholder from "../assets/logo.png";
import BannerImg from "../assets/bg-1.jpg";
import { FaClock, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import './Shop.css';

const Shop = () => {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [storeHours, setStoreHours] = useState({});
  const navigate = useNavigate();

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

        // Fetch store hours for all shops
        fetchAllStoreHours(processedData);
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

  const isStoreOpen = (sellerId) => {
    if (!storeHours[sellerId]) return { isOpen: false, message: "Hours not set" };

    const now = new Date();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format

    const todayHours = storeHours[sellerId].find(h => h.day_of_week === currentDay);

    if (!todayHours || !todayHours.is_open) {
      // Find next open day
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

    // Handle midnight (00:00) as end of day (24:00)
    let effectiveCloseTime = closeTime;
    if (closeTime === '00:00') {
      effectiveCloseTime = '24:00';
    }

    // Check if currently within operating hours
    const isWithinHours = currentTime >= openTime && currentTime < effectiveCloseTime;

    if (isWithinHours) {
      // Display 12:00 AM instead of 24:00
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
      // Already closed for today, find next open time
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

  const handleShopClick = (shopId, shopName) => {
    navigate(`/shop/${shopId}`, { state: { shopName: shopName } });
  };

  // Filter shops by search term
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
          <p>Your one-stop shop for fresh seafood directly from the source!</p>
          <a href="#shopnow" className="explore-btn">Explore Shops</a>
        </div>
      </div>

      <div className="shop-container">
        <div className="shop-page-header" id="shopnow">
          <h1>🏪 All Shops</h1>
          <p className="shop-count">{filteredShops.length} shop{filteredShops.length !== 1 ? 's' : ''} available</p>
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading shops...</p>
          </div>
        ) : filteredShops.length === 0 ? (
          <div className="no-shops-container">
            <div className="empty-icon">🏪</div>
            <p className="no-shops-message">
              {searchTerm ? "No shops found matching your search." : "No shops available."}
            </p>
          </div>
        ) : (
          <div className="shops-grid">
            {filteredShops.map((shop) => {
              const storeStatus = isStoreOpen(shop.seller_id);

              return (
                <div
                  key={shop.seller_id}
                  className={`shop-card navigation-card ${!storeStatus.isOpen ? 'store-closed' : ''}`}
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
                            e.target.src = '/placeholder-logo.png';
                            console.log(`Failed to load logo for ${shop.shop_name}`);
                          }}
                        />
                      ) : (
                        <div className="shop-logo shop-logo-placeholder">
                          <img src={ImgPlaceholder} alt="Placeholder Logo"
                            className="shop-logo"
                          />
                        </div>
                      )}
                      <div className="shop-details">
                        <h2 className="shop-name">{shop.shop_name}</h2>

                        {/* Store Status Badge */}
                        <div className={`store-status-badge ${storeStatus.isOpen ? 'open' : 'closed'}`}>
                          {storeStatus.isOpen ? (
                            <>
                              <FaCheckCircle className="status-icon" />
                              <span>{storeStatus.message}</span>
                            </>
                          ) : (
                            <>
                              <FaClock className="status-icon" />
                              <span>{storeStatus.message}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="product-count">
                      {shop.products.length} Product{shop.products.length !== 1 ? 's' : ''}
                      <span className="toggle-icon right-arrow">&#10095;</span>
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