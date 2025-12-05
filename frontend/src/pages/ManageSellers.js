import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiEye, FiChevronLeft, FiChevronRight, FiChevronsLeft, FiChevronsRight, FiFilter } from "react-icons/fi";
import "./ManageSellers.css";

function ManageSellers() {
  const [sellers, setSellers] = useState([]);
  const [filteredSellers, setFilteredSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchSellers();
  }, []);

  useEffect(() => {
    applyFilter();
  }, [searchQuery, sellers]);

  const fetchSellers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log("🔄 Fetching sellers from API...");
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/all-sellers`);
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      console.log("✅ Received sellers data:", data);
      console.log("📊 Number of sellers:", data.length);
      
      setSellers(data);
      setFilteredSellers(data);
    } catch (err) {
      console.error("❌ Failed to fetch sellers:", err);
      setError(err.message);
      setSellers([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilter = () => {
    if (!searchQuery.trim()) {
      setFilteredSellers(sellers);
    } else {
      const filtered = sellers.filter(seller => 
        seller.shop_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        seller.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        seller.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        seller.unique_id?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredSellers(filtered);
    }
    setCurrentPage(1);
  };

  const getFullName = (seller) => {
    const nameParts = [seller.first_name, seller.middle_name, seller.last_name]
      .filter(Boolean)
      .join(" ");
    return nameParts || "N/A";
  };

  const getFileUrl = (path) => {
    if (!path) return null;
    const normalized = path.startsWith("/") ? path : "/" + path;
    return `${process.env.REACT_APP_API_URL}${normalized}`;
  };

  const handleViewProducts = (sellerUniqueId) => {
    console.log("🔍 Navigating to products for seller:", sellerUniqueId);
    navigate(`/admin/dashboard/seller-products/${sellerUniqueId}`);
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentSellers = filteredSellers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredSellers.length / itemsPerPage);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Loading State
  if (loading) {
    return (
      <div className="ms-container">
        <div className="ms-loading-container">
          <div className="ms-loading-spinner"></div>
          <p className="ms-loading-text">Loading sellers...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="ms-container">
        <div className="ms-error-box">
          <h3>⚠️ Error Loading Sellers</h3>
          <p>{error}</p>
          <button onClick={fetchSellers} className="ms-retry-btn">
            🔄 Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="ms-container">
      <div className="ms-header-bar">
        <div>
          <h2>Manage Sellers</h2>
          <p className="ms-header-subtitle">
            View and manage all registered sellers • {filteredSellers.length} of {sellers.length} seller{sellers.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div className="ms-filter-bar">
        <FiFilter size={18} />
        <span>Search Sellers:</span>
        <input
          type="text"
          placeholder="Search by shop name, seller name, or ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="ms-search-input"
        />
        {searchQuery && (
          <button 
            onClick={() => setSearchQuery("")}
            className="ms-clear-btn"
          >
            Clear
          </button>
        )}
      </div>

      {filteredSellers.length === 0 ? (
        <div className="ms-no-sellers">
          <div className="ms-empty-state">
            <span className="ms-empty-icon">🪸</span>
            <h3>No Sellers Found</h3>
            <p>
              {searchQuery 
                ? `No sellers match your search "${searchQuery}"`
                : "There are no accepted sellers in the system yet."
              }
            </p>
            {!searchQuery && (
              <small>Make sure sellers have been approved in the "Approve Sellers" section.</small>
            )}
          </div>
        </div>
      ) : (
        <div className="ms-table-card">
          <table className="ms-table">
            <thead>
              <tr>
                <th>Logo</th>
                <th>Shop Name</th>
                <th>Seller Name</th>
                <th>Generated ID</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {currentSellers.map((seller) => (
                <tr key={seller.unique_id}>
                  <td>
                    <div className="ms-logo-container">
                      {seller.logo ? (
                        <img
                          src={getFileUrl(seller.logo)}
                          alt={`${seller.shop_name} logo`}
                          className="ms-logo-thumb"
                          onError={(e) => {
                            console.warn("❌ Failed to load logo:", seller.logo);
                            e.target.style.display = "none";
                            e.target.parentElement.querySelector('.ms-no-logo').style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div 
                        className="ms-no-logo" 
                        style={{ display: seller.logo ? "none" : "flex" }}
                      >
                        🪸
                      </div>
                    </div>
                  </td>
                  <td className="ms-shop-name">
                    {seller.shop_name || "N/A"}
                  </td>
                  <td className="ms-seller-name">
                    {getFullName(seller)}
                  </td>
                  <td className="ms-seller-id">
                    <code>{seller.unique_id || "N/A"}</code>
                  </td>
                  <td>
                    <button
                      className="ms-view-btn"
                      onClick={() => handleViewProducts(seller.unique_id)}
                    >
                      <FiEye size={16} />
                      View Products
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredSellers.length > itemsPerPage && (
            <div className="ms-pagination">
              <button
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
                className={`ms-pagination-btn ${currentPage === 1 ? 'disabled' : ''}`}
                title="First Page"
              >
                <FiChevronsLeft size={18} />
              </button>
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`ms-pagination-btn ${currentPage === 1 ? 'disabled' : ''}`}
                title="Previous Page"
              >
                <FiChevronLeft size={18} />
              </button>
              <span className="ms-pagination-info">
                <strong>{currentPage}</strong> / <strong>{totalPages}</strong>
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`ms-pagination-btn ${currentPage === totalPages ? 'disabled' : ''}`}
                title="Next Page"
              >
                <FiChevronRight size={18} />
              </button>
              <button
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
                className={`ms-pagination-btn ${currentPage === totalPages ? 'disabled' : ''}`}
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

export default ManageSellers;