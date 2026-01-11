import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiEye, FiChevronLeft, FiChevronRight, FiChevronsLeft, FiChevronsRight, FiFilter, FiDownload } from "react-icons/fi";
import "./ManageSellers.css";
import Swal from "sweetalert2";

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
      const res = await fetch(`${process.env.REACT_APP_ADMIN_API_URL}/api/admin/all-sellers`);

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
    return `${process.env.REACT_APP_SELLER_API_URL}${normalized}`;
  };

  const handleViewProducts = (sellerUniqueId) => {
    console.log("Navigating to products for seller:", sellerUniqueId);
    navigate(`/admin/dashboard/seller-products/${sellerUniqueId}`);
  };

  const downloadCSV = async () => {
    if (filteredSellers.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No Data',
        text: 'There are no sellers to export.',
        confirmButtonColor: '#1e3c72',
      });
      return;
    }

    const result = await Swal.fire({
      title: 'Download Report?',
      text: 'Do you want to download the Sellers report as CSV?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#1e3c72',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, Download',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) {
      return;
    }

    let csvData = [];
    csvData.push(['Shop Name', 'Seller Name', 'Generated ID']);

    filteredSellers.forEach(seller => {
      const fullName = getFullName(seller);

      csvData.push([
        seller.shop_name || 'N/A',
        fullName,
        seller.unique_id || 'N/A'
      ]);
    });

    const filename = `sellers_report_${new Date().toISOString().split('T')[0]}.csv`;

    const csvContent = csvData.map(row =>
      row.map(cell => {
        const cellStr = String(cell || '');
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      }).join(',')
    ).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    Swal.fire({
      icon: "success",
      title: "Downloaded!",
      text: `${filename} has been downloaded successfully`,
      confirmButtonColor: "#1e3c72",
      timer: 2000,
      timerProgressBar: true,
    });
  };

  const printReport = async () => {
    if (filteredSellers.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No Data',
        text: 'There are no sellers to print.',
        confirmButtonColor: '#1e3c72',
      });
      return;
    }

    const result = await Swal.fire({
      title: 'Print Report?',
      text: 'Do you want to print the Sellers report?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#1e3c72',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, Print',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) {
      return;
    }

    const printWindow = window.open('', '_blank');

    const sellersHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Sellers Report - ${new Date().toLocaleDateString()}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; }
        h1 { color: #1e3c72; margin-bottom: 10px; }
        .date { color: #666; margin-bottom: 30px; }
        .summary { background: #f0f9ff; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
        .summary-grid { display: grid; grid-template-columns: 1fr; gap: 20px; }
        .summary-item { text-align: center; }
        .summary-label { color: #666; font-size: 14px; margin-bottom: 5px; }
        .summary-value { color: #1e3c72; font-size: 24px; font-weight: bold; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { background: #1e3c72; color: white; padding: 12px; text-align: left; }
        td { padding: 10px; border-bottom: 1px solid #ddd; }
        tr:hover { background: #f5f5f5; }
        .seller-id { font-family: 'Courier New', monospace; background: #f0f0f0; padding: 4px 8px; border-radius: 4px; }
        @media print {
          body { padding: 20px; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <h1>Sellers Report</h1>
      <div class="date">Generated on: ${new Date().toLocaleString()}</div>
      
      <div class="summary">
        <div class="summary-grid">
          <div class="summary-item">
            <div class="summary-label">Total Sellers</div>
            <div class="summary-value">${filteredSellers.length}</div>
          </div>
        </div>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>Shop Name</th>
            <th>Seller Name</th>
            <th>Generated ID</th>
          </tr>
        </thead>
        <tbody>
          ${filteredSellers.map(seller => `
            <tr>
              <td>${seller.shop_name || 'N/A'}</td>
              <td>${getFullName(seller)}</td>
              <td><span class="seller-id">${seller.unique_id || 'N/A'}</span></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </body>
    </html>
  `;

    printWindow.document.write(sellersHTML);
    printWindow.document.close();

    printWindow.onload = function () {
      printWindow.focus();
      printWindow.print();
    };

    printWindow.onafterprint = function () {
      printWindow.close();
    };
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

      <div className="ms-download-section">
        <div className="ms-action-dropdown-group">
          <label htmlFor="ms-report-action">Generate Report:</label>
          <select
            id="ms-report-action"
            className="ms-action-select"
            onChange={(e) => {
              const [action, type] = e.target.value.split('-');
              if (action && type) {
                if (action === 'download') {
                  downloadCSV();
                } else if (action === 'print') {
                  printReport();
                }
              }
              e.target.value = '';
            }}
            defaultValue=""
          >
            <option value="" disabled>Select an action...</option>
            <optgroup label="Download CSV">
              <option value="download-sellers">Sellers Report</option>
            </optgroup>
            <optgroup label="Print Report">
              <option value="print-sellers">Sellers Report</option>
            </optgroup>
          </select>
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