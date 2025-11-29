import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; 
import BuyerHeader from "./BuyerHeader";
import ImgPlaceholder from "../assets/logo.png";
import './Shop.css'; 

const Shop = () => {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate(); 

  useEffect(() => {
    const loadShops = async () => {
      try {
        const res = await fetch("http://localhost:5002/api/shop");
        if (!res.ok) throw new Error("Failed to fetch shop data");
        const data = await res.json();
        const processedData = data.map(shop => ({
          ...shop,
          products: Array.isArray(shop.products) ? shop.products : []
        }));
        setShops(processedData);
      } catch (err) {
        console.error("Error fetching shops:", err);
        setShops([]);
      } finally {
        setLoading(false);
      }
    };

    loadShops();
  }, []);

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
      
      <div className="shop-container">
        <div className="shop-page-header">
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
            {filteredShops.map((shop) => (
              <div 
                key={shop.seller_id} 
                className="shop-card navigation-card"
                onClick={() => handleShopClick(shop.seller_id, shop.shop_name)}
              >
                <div className="shop-header">
                  <div className="shop-info">
                    {shop.logo ? (
                      <img
                        src={`http://localhost:5001${shop.logo}`}
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
                    </div>
                  </div>
                      <div className="product-count">
                        {shop.products.length} Product{shop.products.length !== 1 ? 's' : ''}
                        <span className="toggle-icon right-arrow">&#10095;</span>
                      </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Shop;