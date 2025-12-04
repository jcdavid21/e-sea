import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom"; 
import { FaFish } from "react-icons/fa";
import './ShopProductPage.css';
import BuyerHeader from "./BuyerHeader";

// ✅ Import cart utilities
import { addToCart as addToCartUtil, getCartCount } from "../utils/cartUtils";

const ShopProductPage = () => {
  const { shopId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();

  const shopName = state?.shopName || 'Shop Products';

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // ✅ Add to cart using utility (user-specific)
  const addToCart = (product) => {
    const priceNum = Number(product.new_price ?? product.price ?? 0);
    const productToAdd = { ...product, price: priceNum };
    
    addToCartUtil(productToAdd);
    
    // Dispatch cart update event
    window.dispatchEvent(new Event('cartUpdated'));
    
    showToast(`${product.name} added to cart!`);
  };

  // ✅ Toast notification helper
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

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const res = await fetch(`http://localhost:5002/api/shop/${shopId}/products`);
        
        if (!res.ok) {
          const allShopsRes = await fetch("http://localhost:5002/api/shop");
          if (!allShopsRes.ok) throw new Error("Failed to fetch products");
          
          const allShops = await allShopsRes.json();
          const shopData = allShops.find(shop => String(shop.seller_id) === shopId);
          setProducts(shopData?.products || []);
        } else {
          const data = await res.json();
          setProducts(data.products || data || []);
        }

      } catch (err) {
        console.error(`Error fetching products for shop ${shopId}:`, err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();

    if (state?.searchProduct) {
      setSearchTerm(state.searchProduct);
    }
  }, [shopId, state]);

  // Filter products by search term
  const filteredProducts = searchTerm
    ? products.filter((prod) =>
        prod.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : products;

  if (loading) return <p className="loading-message">Loading products...</p>;

  return (
    <div className="shop-product-page shop-page-col">
      {/* Use BuyerHeader */}
      <BuyerHeader 
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        currentPage="shop"
      />
      
      {/* Main Content */}
      <div className="product-page-container">
        <button onClick={() => navigate(-1)} className="back-btn">
          ← Back to Shops
        </button>
        
        <div className="page-header">
          <h1 className="page-title">{shopName}</h1>
          <p className="product-count">{filteredProducts.length} Products</p>
        </div>
        
        {filteredProducts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🛍️</div>
            <p>{searchTerm ? "No products found matching your search" : "This shop has no products available"}</p>
          </div>
        ) : (
          <div className="product-list-grid">
            {filteredProducts.map((prod) => {
              const price = Number(prod.new_price ?? prod.price ?? 0);
              const imageUrl = prod.image_url ? `http://localhost:5001/uploads/${prod.image_url}` : "";
              
              return (
                <div key={prod.id} className="product-card bestseller-card">
                  <img
                    src={imageUrl || "https://via.placeholder.com/200?text=No+Image"}
                    alt={prod.name}
                    className="product-image"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "https://via.placeholder.com/200?text=No+Image";
                    }}
                  />
                  <div className="product-info">
                    <h4 className="product-name">{prod.name}</h4>
                    <div className="price-con">
                      <p className="product-price">₱{Number(prod.price).toFixed(2)}</p>
                      <p className="old-price">{prod.previous_price ? `₱${Number(prod.previous_price).toFixed(2)}` : ""}</p>
                    </div>
                    <p className={`freshness freshness-${prod.freshness?.toLowerCase() || 'na'}`}>
                      {prod.freshness || "N/A"}
                    </p>
                    <div className="product-footer">
                      <span className="category-badge">{prod.category}</span>
                      <span className="stock-info">Stock: {prod.stock}</span>
                    </div>
                  </div>
                  <button 
                    className="add-to-cart-btn" 
                    onClick={() => addToCart(prod)}
                    disabled={prod.stock === 0}
                  >
                    {prod.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ShopProductPage;