import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaFire, FaFish, FaShoppingCart } from "react-icons/fa";
import Swal from "sweetalert2";
import logo from "../assets/logo.png";
import background from "../assets/front_landscape.jpg";
import "./Home.css";

const Home = () => {
  const navigate = useNavigate();
  const [bestSellers, setBestSellers] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(["All"]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
    fetchBestSellers();
    fetchProductsByCategory("All");
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/shop`);
      const shops = await response.json();
      
      // Extract unique categories from all products
      const allProducts = shops.flatMap(shop => shop.products);
      const uniqueCategories = [...new Set(allProducts.map(p => p.category))];
      
      // Add "All" at the beginning
      setCategories(["All", ...uniqueCategories.filter(Boolean).sort()]);
    } catch (error) {
      console.error("Error fetching categories:", error);
      // Fallback to default categories if fetch fails
      setCategories([
        "All",
        "Freshwater",
        "Saltwater",
        "Shellfish",
        "Crustaceans",
        "Premium Fish"
      ]);
    }
  };

  const fetchBestSellers = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/products/best-sellers`);
      const data = await response.json();
      setBestSellers(data);
    } catch (error) {
      console.error("Error fetching best sellers:", error);
    }
  };

  const fetchProductsByCategory = async (category) => {
    setLoading(true);
    try {
      if (category === "All") {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/shop`);
        const shops = await response.json();
        const allProducts = shops.flatMap(shop => 
          shop.products.map(p => ({ ...p, shop_name: shop.shop_name }))
        );
        setProducts(allProducts.filter(p => p.stock > 0));
      } else {
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/api/products/by-category?category=${category}`
        );
        const data = await response.json();
        setProducts(data);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    fetchProductsByCategory(category);
  };

  const handleAddToCart = (product) => {
    Swal.fire({
      title: 'Login Required',
      text: 'Please login to add items to your cart',
      icon: 'info',
      showCancelButton: true,
      confirmButtonColor: '#667eea',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Go to Login',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        navigate('/buyer/login');
      }
    });
  };

  const ProductCard = ({ product, isBestSeller }) => (
    <div className="product-card">
      {isBestSeller && product.total_sold > 0 && (
        <div className="bestseller-badge">
          <FaFish /> {product.total_sold} Sold
        </div>
      )}
      <img
        src={
          product.image_url
            ? `${process.env.REACT_APP_API_URL}/uploads/${product.image_url}`
            : "https://via.placeholder.com/150?text=No+Image"
        }
        alt={product.name}
        className="product-img"
      />
      <div className="product-info-container">
        <h4 className="product-name">{product.name}</h4>
        <p className="shop-name">
          <FaFish style={{ color: "#16135d" }} /> {product.shop_name || "Unknown Shop"}
        </p>
        <div className="price-con">
          <p className="product-price">₱{Number(product.price).toFixed(2)}</p>
          {product.previous_price && product.previous_price > product.price && (
            <p className="old-price">₱{Number(product.previous_price).toFixed(2)}</p>
          )}
        </div>
        <p className={`freshness freshness-${product.freshness?.toLowerCase() || 'na'}`}>
          {product.freshness || "Fresh"}
        </p>
        <div className="product-footer">
          <span className="category-badge">{product.category}</span>
          <span className="stock-info">Stock: {product.stock}</span>
        </div>
        <button 
          onClick={() => handleAddToCart(product)}
          className="add-to-cart-btn"
          disabled={product.stock === 0}
        >
          <FaShoppingCart style={{ marginRight: '6px' }} />
          {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
        </button>
      </div>
    </div>
  );

  return (
    <div className="home-wrapper" style={{ backgroundImage: `url(${background})` }}>
      <header className="home-header">
        <img src={logo} alt="Sea Merkado Logo" className="home-logo" />
      </header>

      <main className="home-main">
        <div className="home-content">
          <h1 className="home-title">e-Sea-Merkado</h1>
          <p className="home-subtitle">Bringing Fresh Fish to Your Fingertips!</p>
        </div>

        <button className="get-started-btn" onClick={() => navigate("/role")}>
          Get Started
        </button>

        {/* Best Sellers Section */}
        {bestSellers.length > 0 && (
          <section className="products-showcase best-sellers-section">
            <div className="section-header">
              <span className="section-icon">
                {bestSellers[0]?.total_sold > 0 ? (
                  <FaFire style={{ color: '#ff5722' }} />
                ) : (
                  <FaShoppingCart style={{ color: '#667eea' }} />
                )}
              </span>
              <h2>
                {bestSellers[0]?.total_sold > 0 
                  ? "🔥 Best Sellers" 
                  : "Recommended for You"}
              </h2>
            </div>
            <div className="product-list">
              {bestSellers.map((product) => (
                <ProductCard key={product.id} product={product} isBestSeller={true} />
              ))}
            </div>
          </section>
        )}

        {/* Category Filter Section */}
        <section className="products-showcase category-section">
          <div className="section-header">
            <FaFish className="section-icon" style={{ color: '#1976d2' }} />
            <h2>Browse by Category</h2>
            {selectedCategory !== "All" && (
              <button 
                className="clear-filter-btn"
                onClick={() => handleCategoryChange("All")}
              >
                Clear Filter
              </button>
            )}
          </div>

          <div className="category-filter">
            {categories.map((category) => (
              <button
                key={category}
                className={`category-btn ${selectedCategory === category ? "active" : ""}`}
                onClick={() => handleCategoryChange(category)}
              >
                {category}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading products...</p>
            </div>
          ) : products.length > 0 ? (
            <div className="product-list-div">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} isBestSeller={false} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <FaFish className="empty-icon" />
              <p>No products available in this category</p>
              <span>Try selecting a different category</span>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Home;