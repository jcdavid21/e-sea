import React, { useEffect, useState } from "react";
import axios from "axios";
import { FiUserPlus, FiEye, FiCheck, FiChevronLeft, FiChevronRight, FiChevronsLeft, FiChevronsRight, FiFilter, FiPrinter } from "react-icons/fi";
import Swal from "sweetalert2";
import AddSellerModal from "./AddSellerModal";
import ViewRequirementsModal from "./ViewRequirementsModal";
import "./ApproveSellers.css";

const getDaysDiff = (dateString) => {
  if (!dateString) return 0;
  const oneDay = 24 * 60 * 60 * 1000;
  const dateCreated = new Date(dateString);
  const today = new Date();
  return Math.round(Math.abs((today - dateCreated) / oneDay));
};

const handlePrintSeller = (seller) => {
  const printWindow = window.open('', '_blank');
  const daysSince = getDaysDiff(seller.date_added);
  const isCompliant = Object.values(seller.requirements).every(Boolean);
  
  // Parse requirements if it's a string
  const requirements = typeof seller.requirements === 'string' 
    ? JSON.parse(seller.requirements) 
    : seller.requirements;
  
  const printHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Receipt - Seller ${seller.unique_id}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Courier New', monospace;
          padding: 20px;
          max-width: 400px;
          margin: 0 auto;
        }
        .receipt {
          border: 2px solid #000;
          padding: 20px;
        }
        .header {
          text-align: center;
          border-bottom: 2px dashed #000;
          padding-bottom: 15px;
          margin-bottom: 15px;
        }
        .header h1 {
          font-size: 24px;
          margin-bottom: 5px;
        }
        .header p {
          font-size: 12px;
          margin: 2px 0;
        }
        .section {
          margin: 15px 0;
          border-bottom: 1px dashed #000;
          padding-bottom: 15px;
        }
        .section:last-child {
          border-bottom: none;
        }
        .section-title {
          font-weight: bold;
          font-size: 14px;
          margin-bottom: 8px;
          text-transform: uppercase;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          margin: 5px 0;
          font-size: 13px;
        }
        .info-label {
          font-weight: bold;
        }
        .req-table {
          width: 100%;
          margin: 10px 0;
        }
        .req-table th {
          text-align: left;
          border-bottom: 2px solid #000;
          padding: 8px 0;
          font-size: 12px;
        }
        .req-table td {
          padding: 8px 0;
          font-size: 13px;
          border-bottom: 1px dashed #ccc;
        }
        .req-table .req-name {
          width: 70%;
        }
        .req-table .req-status {
          width: 30%;
          text-align: right;
        }
        .total-section {
          margin-top: 15px;
          padding-top: 15px;
          border-top: 2px solid #000;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          margin: 8px 0;
          font-size: 16px;
          font-weight: bold;
        }
        .footer {
          text-align: center;
          margin-top: 20px;
          padding-top: 15px;
          border-top: 2px dashed #000;
          font-size: 12px;
        }
        .status-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: bold;
          background: #f0f0f0;
          border: 1px solid #000;
        }
        .warning-box {
          margin: 15px 0;
          padding: 12px;
          border: 2px solid #000;
          background: #f0f0f0;
          text-align: center;
          font-size: 11px;
          font-weight: bold;
        }
        @media print {
          body {
            padding: 0;
          }
          .receipt {
            border: none;
          }
          .no-print {
            display: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="receipt">
        <div class="header">
          <h1>SELLER RECEIPT</h1>
          <p>E-SEA FISH MARKET</p>
          <p>Seller Management System</p>
        </div>

        <div class="section">
          <div class="section-title">Seller Details</div>
          <div class="info-row">
            <span class="info-label">Seller ID:</span>
            <span>${seller.unique_id}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Registration Date:</span>
            <span>${new Date(seller.date_added).toLocaleString()}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Days Since:</span>
            <span>${daysSince} day${daysSince !== 1 ? 's' : ''}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Status:</span>
            <span class="status-badge">${seller.display_status.toUpperCase()}</span>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Personal Information</div>
          <div class="info-row">
            <span class="info-label">Name:</span>
            <span>${seller.first_name} ${seller.middle_name || ''} ${seller.last_name}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Shop Name:</span>
            <span>${seller.shop_name || 'N/A'}</span>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Address</div>
          <div class="info-row">
            <span class="info-label">Street:</span>
            <span>${seller.street || 'N/A'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Barangay:</span>
            <span>${seller.barangay || 'N/A'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Municipality:</span>
            <span>${seller.municipality || 'N/A'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Province:</span>
            <span>${seller.province || 'N/A'}</span>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Requirements Status</div>
          <table class="req-table">
            <thead>
              <tr>
                <th class="req-name">Document</th>
                <th class="req-status">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="req-name">Barangay Clearance</td>
                <td class="req-status">${requirements.barangayClearance ? '[✓]' : '[✗]'}</td>
              </tr>
              <tr>
                <td class="req-name">Business Permit</td>
                <td class="req-status">${requirements.businessPermit ? '[✓]' : '[✗]'}</td>
              </tr>
              <tr>
                <td class="req-name">ID Proof</td>
                <td class="req-status">${requirements.idProof ? '[✓]' : '[✗]'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="total-section">
          <div class="total-row">
            <span>COMPLIANCE STATUS:</span>
            <span>${isCompliant ? 'COMPLETE' : 'INCOMPLETE'}</span>
          </div>
        </div>

        ${daysSince >= 3 && !isCompliant ? `
        <div class="warning-box">
          ⚠️ WARNING ⚠️<br>
          EXCEEDED 3-DAY DEADLINE<br>
          WITH INCOMPLETE REQUIREMENTS
        </div>
        ` : ''}

        <div class="footer">
          <p>This is an official receipt</p>
          <p>Generated on ${new Date().toLocaleString()}</p>
          <p style="margin-top: 10px;">For verification purposes only</p>
        </div>
      </div>

      <div class="no-print" style="text-align: center; margin-top: 20px;">
        <button onclick="window.print()" style="padding: 10px 20px; font-size: 14px; cursor: pointer; background: #1e3c72; color: white; border: none; border-radius: 5px;">
          Print Receipt
        </button>
        <button onclick="window.close()" style="padding: 10px 20px; font-size: 14px; cursor: pointer; background: #6c757d; color: white; border: none; border-radius: 5px; margin-left: 10px;">
          Close
        </button>
      </div>
    </body>
    </html>
  `;
  
  printWindow.document.write(printHTML);
  printWindow.document.close();
  
  // Auto-trigger print dialog when page loads
  printWindow.onload = function() {
    printWindow.print();
  };
};

const ApproveSellers = () => {
  const [sellers, setSellers] = useState([]);
  const [filteredSellers, setFilteredSellers] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [showRequirementsModal, setShowRequirementsModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState("all");

  const processSellers = (fetchedSellers) => {
    return fetchedSellers.map((seller) => {
      let displayStatus = seller.status;

      if (displayStatus === "accepted" || displayStatus === "rejected") {
        return { ...seller, display_status: displayStatus };
      }

      const requirements =
        typeof seller.requirements === "string"
          ? JSON.parse(seller.requirements)
          : seller.requirements;

      const isCompliant = Object.values(requirements).every(Boolean);
      const daysSinceCreation = getDaysDiff(seller.date_added);

      if (!isCompliant && daysSinceCreation >= 3) {
        displayStatus = "rejected";
      } else {
        displayStatus = "pending";
      }

      return { ...seller, display_status: displayStatus };
    });
  };

  const fetchSellers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${process.env.REACT_APP_ADMIN_API_URL}/api/sellers`);

      const data = res.data.map((s) => ({
        ...s,
        requirements:
          typeof s.requirements === "string"
            ? JSON.parse(s.requirements)
            : s.requirements,
      }));

      const processed = processSellers(data);
      setSellers(processed);
      applyFilter(processed, statusFilter);
    } catch (err) {
      console.error("❌ Error fetching sellers:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to fetch sellers data",
        confirmButtonColor: "#1e3c72",
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilter = (sellerList, filter) => {
    if (filter === "all") {
      setFilteredSellers(sellerList);
    } else {
      setFilteredSellers(sellerList.filter(s => s.display_status === filter));
    }
    setCurrentPage(1);
  };

  useEffect(() => {
    fetchSellers();
  }, []);

  useEffect(() => {
    applyFilter(sellers, statusFilter);
  }, [statusFilter, sellers]);

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

  const handleCheckRequirements = async (sellerId) => {
    try {
      const res = await axios.put(`${process.env.REACT_APP_ADMIN_API_URL}/api/sellers/${sellerId}/check-requirements`);
      
      if (res.data.status === "rejected") {
        Swal.fire({
          icon: "info",
          title: "Auto-Rejected",
          text: "This seller has been automatically rejected due to incomplete requirements after 3 days.",
          confirmButtonColor: "#1e3c72",
        });
      }
      
      fetchSellers();
    } catch (err) {
      console.error("❌ Error checking requirements:", err);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      if (status !== "accepted") return;

      const seller = sellers.find(s => s.id === id);
      const requirements = seller.requirements;
      const isCompliant = Object.values(requirements).every(Boolean);
      const daysSinceCreation = getDaysDiff(seller.date_added);

      // Check if requirements are complete
      if (!isCompliant) {
        Swal.fire({
          icon: "warning",
          title: "Incomplete Requirements",
          text: "Cannot accept seller with incomplete requirements. Please ensure all documents are submitted.",
          confirmButtonColor: "#1e3c72",
        });
        return;
      }

      // Check if exceeded 3-day deadline
      if (daysSinceCreation >= 3) {
        await axios.put(`${process.env.REACT_APP_ADMIN_API_URL}/api/sellers/${id}/status`, {
          status: "rejected"
        });
        
        Swal.fire({
          icon: "error",
          title: "Cannot Accept",
          text: "This seller has exceeded the 3-day deadline and has been automatically rejected.",
          confirmButtonColor: "#1e3c72",
        });
        
        fetchSellers();
        return;
      }

      const result = await Swal.fire({
        title: "Accept Seller?",
        text: "This seller will be approved and can register on the platform",
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#28a745",
        cancelButtonColor: "#6c757d",
        confirmButtonText: "Yes, accept!",
        cancelButtonText: "Cancel",
      });

      if (!result.isConfirmed) return;

      await axios.put(`${process.env.REACT_APP_ADMIN_API_URL}/api/sellers/${id}/status`, {
        status,
      });

      Swal.fire({
        icon: "success",
        title: "Success",
        text: `Seller ${status} successfully`,
        confirmButtonColor: "#1e3c72",
        timer: 2000,
        timerProgressBar: true,
      });

      fetchSellers();
    } catch (err) {
      console.error("❌ Error updating status:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to update seller status",
        confirmButtonColor: "#1e3c72",
      });
    }
  };

  const handleAddSeller = () => setShowAddModal(true);

  const handleAddSuccess = async (newSellerData) => {
    try {
      await axios.post(`${process.env.REACT_APP_ADMIN_API_URL}/api/sellers`, newSellerData);
      
      Swal.fire({
        icon: "success",
        title: "Success",
        text: "Seller added successfully!",
        confirmButtonColor: "#1e3c72",
        timer: 2000,
        timerProgressBar: true,
      });

      fetchSellers();
      setShowAddModal(false);
    } catch (error) {
      console.error("❌ Error adding seller:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to add seller",
        confirmButtonColor: "#1e3c72",
      });
    }
  };

  const handleViewRequirements = async (seller) => {
    await handleCheckRequirements(seller.id);
    setSelectedSeller(seller);
    setShowRequirementsModal(true);
  };

  const handleUpdateRequirements = async (sellerId, updatedRequirements) => {
    try {
      await axios.put(`${process.env.REACT_APP_ADMIN_API_URL}/api/sellers/${sellerId}/requirements`, {
        requirements: updatedRequirements
      });
      
      Swal.fire({
        icon: "success",
        title: "Updated",
        text: "Requirements updated successfully!",
        confirmButtonColor: "#1e3c72",
        timer: 1500,
        timerProgressBar: true,
      });
      
      fetchSellers();
    } catch (err) {
      console.error("❌ Error updating requirements:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to update requirements",
        confirmButtonColor: "#1e3c72",
      });
    }
  };

  if (loading) {
    return (
      <div className="approve-sellers-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading sellers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="approve-sellers-container">
      <div className="header-bar">
        <div>
          <h2>Approve Sellers</h2>
          <p className="header-subtitle">
            Review and approve seller applications • {filteredSellers.length} of {sellers.length} seller{sellers.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button className="add-seller-btn" onClick={handleAddSeller}>
          <FiUserPlus size={18} />
          Add Seller
        </button>
      </div>

      <div className="filter-bar">
        <FiFilter size={18} />
        <span>Filter by Status:</span>
        
        {/* Desktop filter buttons */}
        <div className="filter-buttons">
          <button 
            className={statusFilter === "all" ? "active" : ""} 
            onClick={() => setStatusFilter("all")}
          >
            All ({sellers.length})
          </button>
          <button 
            className={statusFilter === "pending" ? "active" : ""} 
            onClick={() => setStatusFilter("pending")}
          >
            Pending ({sellers.filter(s => s.display_status === "pending").length})
          </button>
          <button 
            className={statusFilter === "accepted" ? "active" : ""} 
            onClick={() => setStatusFilter("accepted")}
          >
            Accepted ({sellers.filter(s => s.display_status === "accepted").length})
          </button>
          <button 
            className={statusFilter === "rejected" ? "active" : ""} 
            onClick={() => setStatusFilter("rejected")}
          >
            Rejected ({sellers.filter(s => s.display_status === "rejected").length})
          </button>
        </div>

        {/* Mobile dropdown */}
        <div className="filter-dropdown">
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All ({sellers.length})</option>
            <option value="pending">Pending ({sellers.filter(s => s.display_status === "pending").length})</option>
            <option value="accepted">Accepted ({sellers.filter(s => s.display_status === "accepted").length})</option>
            <option value="rejected">Rejected ({sellers.filter(s => s.display_status === "rejected").length})</option>
          </select>
        </div>
      </div>

      <div className="table-card">
        <table className="sellers-table">
          <thead>
            <tr>
              <th>Generated ID</th>
              <th>Full Name</th>
              <th>Shop Name</th>
              <th>Address</th>
              <th>Days Since Registration</th>
              <th>Requirements</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {currentSellers.length > 0 ? (
              currentSellers.map((seller) => {
                const daysSince = getDaysDiff(seller.date_added);
                const isCompliant = Object.values(seller.requirements).every(Boolean);
                
                return (
                  <tr key={seller.id}>
                    <td>{seller.unique_id}</td>
                    <td>
                      {seller.first_name} {seller.middle_name} {seller.last_name}
                    </td>
                    <td>{seller.shop_name}</td>
                    <td>
                      {seller.street}, {seller.barangay}, {seller.municipality},{" "}
                      {seller.province}
                    </td>
                    <td>
                      <span className={daysSince >= 3 && !isCompliant ? "days-warning" : ""}>
                        {daysSince} day{daysSince !== 1 ? 's' : ''}
                      </span>
                    </td>
                    <td>
                      <button
                        className="view-btn"
                        onClick={() => handleViewRequirements(seller)}
                      >
                        <FiEye size={16} />
                        View
                      </button>
                    </td>
                    <td>
                      <span className={`status-badge ${seller.display_status}`}>
                        {seller.display_status}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="print-btn"
                          onClick={() => handlePrintSeller(seller)}
                          title="Print seller details"
                        >
                          <FiPrinter size={16} />
                          Print
                        </button>
                        <button
                          className="approve-btn"
                          onClick={() => updateStatus(seller.id, "accepted")}
                          disabled={seller.display_status !== "pending" || !isCompliant}
                          title={!isCompliant ? "Complete all requirements first" : ""}
                        >
                          <FiCheck size={16} />
                          Accept
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="8" className="no-data">
                  No sellers found
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {filteredSellers.length > itemsPerPage && (
          <div style={styles.pagination}>
            <button
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
              style={{
                ...styles.paginationBtn,
                ...(currentPage === 1 ? styles.paginationBtnDisabled : {})
              }}
              title="First Page"
            >
              <FiChevronsLeft size={18} />
            </button>
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              style={{
                ...styles.paginationBtn,
                ...(currentPage === 1 ? styles.paginationBtnDisabled : {})
              }}
              title="Previous Page"
            >
              <FiChevronLeft size={18} />
            </button>
            <span style={styles.paginationInfo}>
              <strong>{currentPage}</strong> / <strong>{totalPages}</strong>
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              style={{
                ...styles.paginationBtn,
                ...(currentPage === totalPages ? styles.paginationBtnDisabled : {})
              }}
              title="Next Page"
            >
              <FiChevronRight size={18} />
            </button>
            <button
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
              style={{
                ...styles.paginationBtn,
                ...(currentPage === totalPages ? styles.paginationBtnDisabled : {})
              }}
              title="Last Page"
            >
              <FiChevronsRight size={18} />
            </button>
          </div>
        )}
      </div>

      {showAddModal && (
        <AddSellerModal
          onClose={() => setShowAddModal(false)}
          onAddSeller={handleAddSuccess}
        />
      )}

      {showRequirementsModal && selectedSeller && (
        <ViewRequirementsModal
          seller={selectedSeller}
          onClose={() => {
            setShowRequirementsModal(false);
            fetchSellers();
          }}
          onUpdate={handleUpdateRequirements}
        />
      )}
    </div>
  );
};

const styles = {
  pagination: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '12px',
    padding: '24px',
    marginTop: '20px',
    background: '#ffffff',
    borderTop: '2px solid #e0f2fe',
  },
  paginationBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '40px',
    height: '40px',
    border: '2px solid #bae6fd',
    background: '#fff',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    color: '#1e3c72',
  },
  paginationBtnDisabled: {
    opacity: 0.3,
    cursor: 'not-allowed',
    borderColor: '#e0e0e0',
  },
  paginationInfo: {
    margin: '0 16px',
    fontSize: '1rem',
    color: '#1e3c72',
    fontWeight: '600',
  },
};

export default ApproveSellers;