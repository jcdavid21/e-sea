import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiArrowLeft, FiFilter, FiChevronLeft, FiChevronRight, FiChevronsLeft, FiChevronsRight } from "react-icons/fi";
import "./SellerProducts.css";

function SellerProducts() {
  const { sellerId } = useParams();
  const navigate = useNavigate();
  
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [shopName, setShopName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (sellerId) {
      loadData();
    }
  }, [sellerId]);

  useEffect(() => {
    applyFilters();
  }, [selectedCategory, searchQuery, products]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch(
        `${process.env.REACT_APP_ADMIN_API_URL}/api/admin/seller-products?seller_id=${sellerId}`
      );
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || `HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      
      console.log("✅ Loaded seller products:", data);
      
      setProducts(data.products || []);
      setCategories(data.categories || []);
      setShopName(data.shop_name || `Seller ${sellerId}`);
      
    } catch (err) {
      console.error("❌ Failed to load seller products:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = products;

    // Category filter
    if (selectedCategory !== "All") {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(p => 
        p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredProducts(filtered);
    setCurrentPage(1);
  };

  const getCategoryCount = (name) =>
    name === "All"
      ? products.length
      : products.filter((p) => p.category === name).length;

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Loading State
  if (loading) {
    return (
      <div className="sp-container">
        <div className="sp-loading-container">
          <div className="sp-loading-spinner"></div>
          <p className="sp-loading-text">Loading products...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="sp-container">
        <button onClick={() => navigate(-1)} className="sp-back-btn">
          <FiArrowLeft size={18} />
          Back to Sellers
        </button>
        <div className="sp-error-box">
          <h3>Error Loading Products</h3>
          <p>{error}</p>
          <button onClick={loadData} className="sp-retry-btn">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="sp-container">
      <div className="sp-header-bar">
        <div>
          <button onClick={() => navigate(-1)} className="sp-back-btn">
            <FiArrowLeft size={18} />
            Back to Sellers
          </button>
          <h2>Products for {shopName}</h2>
          <p className="sp-header-subtitle">
            Viewing all products • {filteredProducts.length} of {products.length} product{products.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div className="sp-filter-bar">
        <FiFilter size={18} />
        <span>Search Products:</span>
        <input
          type="text"
          placeholder="Search by product name or category..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="sp-search-input"
        />
        {searchQuery && (
          <button 
            onClick={() => setSearchQuery("")}
            className="sp-clear-btn"
          >
            Clear
          </button>
        )}
      </div>

      <div className="sp-filter-bar">
        <FiFilter size={18} />
        <span>Category:</span>
        
        {/* Desktop: Button filters */}
        <div className="sp-filter-buttons">
          <button
            className={`sp-category-btn ${selectedCategory === "All" ? "active" : ""}`}
            onClick={() => setSelectedCategory("All")}
          >
            All ({products.length})
          </button>

          {categories.map((cat) => (
            <button
              key={cat.id}
              className={`sp-category-btn ${
                selectedCategory === cat.category_name ? "active" : ""
              }`}
              onClick={() => setSelectedCategory(cat.category_name)}
            >
              {cat.category_name} ({getCategoryCount(cat.category_name)})
            </button>
          ))}
        </div>

        {/* Mobile: Dropdown select */}
        <select 
          className="sp-category-select"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="All">All Categories ({products.length})</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.category_name}>
              {cat.category_name} ({getCategoryCount(cat.category_name)})
            </option>
          ))}
        </select>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="sp-no-products">
          <div className="sp-empty-state">
            <span className="sp-empty-icon">📦</span>
            <h3>No Products Found</h3>
            <p>
              {searchQuery 
                ? `No products match your search "${searchQuery}"`
                : `${shopName} has no products${selectedCategory !== "All" ? ` in "${selectedCategory}" category` : ''}.`
              }
            </p>
          </div>
        </div>
      ) : (
        <div className="sp-table-card">
          <div className="sp-table-wrapper">
            <table className="sp-table">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Product Name</th>
                  <th>Category</th>
                  <th>Current Price</th>
                  <th>Stock</th>
                  <th>Unit</th>
                  <th>Previous Price</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {currentProducts.map((p) => {
                  const hasPriceChange = p.previous_price && p.previous_price !== p.price;
                  const priceIncreased = hasPriceChange && p.price > p.previous_price;
                  const isOutOfStock = p.stock === 0;
                  const isLowStock = p.stock > 0 && p.stock < 10;

                  return (
                    <tr key={p.id}>
                      <td className="sp-td-image">
                        {p.image_url ? (
                          <img
                            src={`${process.env.REACT_APP_SELLER_API_URL}/uploads/${p.image_url}`}
                            alt={p.name}
                            className="sp-product-img"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = "/placeholder-fish.png";
                            }}
                          />
                        ) : (
                          <div className="sp-no-image">📷</div>
                        )}
                      </td>

                      <td className="sp-td-name">
                        <span className="sp-product-name">{p.name}</span>
                      </td>

                      <td className="sp-td-category">
                        <span className="sp-category-badge">{p.category}</span>
                      </td>

                      <td className="sp-td-price">
                        <div className="sp-price-container">
                          <span className="sp-current-price">
                            ₱{Number(p.price).toFixed(2)}
                          </span>
                          {hasPriceChange && (
                            <span className={`sp-price-indicator ${priceIncreased ? 'up' : 'down'}`}>
                              {priceIncreased ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="sp-td-stock">
                        <span className={`sp-stock-number ${isOutOfStock ? 'out' : isLowStock ? 'low' : ''}`}>
                          {p.stock}
                        </span>
                      </td>

                      <td className="sp-td-unit">
                        <span className="sp-unit-text">{p.unit || 'kg'}</span>
                      </td>

                      <td className="sp-td-previous">
                        {hasPriceChange ? (
                          <span className="sp-old-price">
                            ₱{Number(p.previous_price).toFixed(2)}
                          </span>
                        ) : (
                          <span className="sp-no-change">—</span>
                        )}
                      </td>

                      <td className="sp-td-status">
                        <span className={`sp-status-badge ${isOutOfStock ? 'out-of-stock' : 'active'}`}>
                          {isOutOfStock ? 'Out of Stock' : 'Available'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredProducts.length > itemsPerPage && (
            <div className="sp-pagination">
              <button
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
                className="sp-pagination-btn"
                title="First Page"
              >
                <FiChevronsLeft size={18} />
              </button>
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="sp-pagination-btn"
                title="Previous Page"
              >
                <FiChevronLeft size={18} />
              </button>
              <span className="sp-pagination-info">
                Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="sp-pagination-btn"
                title="Next Page"
              >
                <FiChevronRight size={18} />
              </button>
              <button
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
                className="sp-pagination-btn"
                title="Last Page"
              >
                <FiChevronsRight size={18} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SellerProducts;