import React, { useEffect, useState } from "react";
import axios from "axios";
import { 
  FiMessageSquare, 
  FiSearch, 
  FiDownload, 
  FiChevronLeft, 
  FiChevronRight, 
  FiChevronsLeft, 
  FiChevronsRight,
  FiStar,
  FiUser,
  FiShoppingBag,
  FiX,
  FiEye
} from "react-icons/fi";
import "./ManageFeedbacks.css";
import Swal from "sweetalert2";

const ManageFeedbacks = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [filteredFeedbacks, setFilteredFeedbacks] = useState([]);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterRating, setFilterRating] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  useEffect(() => {
    filterFeedbacksData();
    setCurrentPage(1);
  }, [feedbacks, searchTerm, filterType, filterRating]);

  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${process.env.REACT_APP_ADMIN_API_URL}/api/all-feedbacks`);
      setFeedbacks(res.data);
    } catch (error) {
      console.error("Error fetching feedbacks:", error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load feedbacks',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterFeedbacksData = () => {
    let filtered = [...feedbacks];

    // Filter by user type
    if (filterType !== "all") {
      filtered = filtered.filter(f => f.user_type === filterType);
    }

    // Filter by rating
    if (filterRating !== "all") {
      filtered = filtered.filter(f => f.rating === parseInt(filterRating));
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(f => {
        const userId = f.user_id?.toLowerCase() || "";
        const comment = f.comment?.toLowerCase() || "";
        return userId.includes(search) || comment.includes(search);
      });
    }

    setFilteredFeedbacks(filtered);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? "N/A" : date.toLocaleDateString("en-US", {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderStars = (rating) => {
    return [...Array(5)].map((_, index) => (
      <FiStar
        key={index}
        size={16}
        fill={index < rating ? "#fbbf24" : "none"}
        color={index < rating ? "#fbbf24" : "#d1d5db"}
      />
    ));
  };

  const handleViewFeedback = (feedback) => {
    setSelectedFeedback(feedback);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const exportToCSV = () => {
    if (filteredFeedbacks.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No Data to Export',
        text: 'There are no feedbacks to export.',
      });
      return;
    }

    Swal.fire({
      title: 'Export to CSV',
      text: 'Are you sure you want to export the feedback data to a CSV file?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Export',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        const headers = ["User ID", "User Type", "Rating", "Comment", "Date Submitted"];
        const rows = filteredFeedbacks.map(feedback => [
          feedback.user_id,
          feedback.user_type,
          feedback.rating,
          feedback.comment || "No comment",
          formatDate(feedback.created_at)
        ]);

        let csvContent = headers.join(",") + "\n";
        rows.forEach(row => {
          csvContent += row.map(cell => `"${cell}"`).join(",") + "\n";
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);

        link.setAttribute("href", url);
        link.setAttribute("download", `feedbacks_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        Swal.fire({
          icon: 'success',
          title: 'Exported!',
          text: 'Feedback data has been exported successfully.',
        });
      }
    });
  };

  const getAverageRating = () => {
    if (filteredFeedbacks.length === 0) return 0;
    const sum = filteredFeedbacks.reduce((acc, f) => acc + f.rating, 0);
    return (sum / filteredFeedbacks.length).toFixed(1);
  };

  const getRatingDistribution = () => {
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    filteredFeedbacks.forEach(f => {
      distribution[f.rating]++;
    });
    return distribution;
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredFeedbacks.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredFeedbacks.length / itemsPerPage);

  const buyerCount = feedbacks.filter(f => f.user_type === 'buyer').length;
  const sellerCount = feedbacks.filter(f => f.user_type === 'seller').length;
  const ratingDist = getRatingDistribution();

  if (loading) {
    return (
      <div className="manage-feedbacks-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading feedbacks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="manage-feedbacks-container">
      <div className="header-bar">
        <div>
          <h2>System Feedbacks</h2>
          <p className="header-subtitle">
            View all user feedback and ratings • {feedbacks.length} Total Feedbacks • Average Rating: {getAverageRating()} ⭐
          </p>
        </div>
        <div className="header-stats">
          <div className="stat-card">
            <FiUser size={24} />
            <div>
              <div className="stat-number">{buyerCount}</div>
              <div className="stat-label">Buyers</div>
            </div>
          </div>
          <div className="stat-card">
            <FiShoppingBag size={24} />
            <div>
              <div className="stat-number">{sellerCount}</div>
              <div className="stat-label">Sellers</div>
            </div>
          </div>
        </div>
      </div>

      <div className="filter-bar">
        <div className="search-container">
          <FiSearch size={18} />
          <input
            type="text"
            placeholder="Search by user ID or comment..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="filter-actions">
          <button className="export-btn" onClick={exportToCSV}>
            <FiDownload size={18} />
            Export CSV
          </button>
          <div className="filter-dropdowns">
            <select 
              value={filterType} 
              onChange={(e) => setFilterType(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Users</option>
              <option value="buyer">Buyers Only</option>
              <option value="seller">Sellers Only</option>
            </select>
            <select 
              value={filterRating} 
              onChange={(e) => setFilterRating(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
          </div>
        </div>
      </div>

      {/* Rating Distribution */}
      <div className="rating-distribution">
        <h3>Rating Distribution</h3>
        <div className="distribution-bars">
          {[5, 4, 3, 2, 1].map(rating => (
            <div key={rating} className="distribution-item">
              <span className="rating-label">{rating} ⭐</span>
              <div className="distribution-bar-container">
                <div 
                  className="distribution-bar"
                  style={{ 
                    width: `${filteredFeedbacks.length > 0 ? (ratingDist[rating] / filteredFeedbacks.length) * 100 : 0}%` 
                  }}
                />
              </div>
              <span className="rating-count">{ratingDist[rating]}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="table-card">
        <table className="feedbacks-table">
          <thead>
            <tr>
              <th>User ID</th>
              <th>User Type</th>
              <th>Rating</th>
              <th>Comment Preview</th>
              <th>Date Submitted</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.length > 0 ? (
              currentItems.map((feedback) => (
                <tr key={feedback.id}>
                  <td>{feedback.user_id}</td>
                  <td>
                    <span className={`user-type-badge ${feedback.user_type}`}>
                      {feedback.user_type === 'buyer' ? <FiUser size={14} /> : <FiShoppingBag size={14} />}
                      {feedback.user_type.charAt(0).toUpperCase() + feedback.user_type.slice(1)}
                    </span>
                  </td>
                  <td>
                    <div className="stars-container">
                      {renderStars(feedback.rating)}
                    </div>
                  </td>
                  <td>
                    <div className="comment-preview">
                      {feedback.comment 
                        ? feedback.comment.length > 50 
                          ? feedback.comment.substring(0, 50) + "..." 
                          : feedback.comment
                        : "No comment"}
                    </div>
                  </td>
                  <td>{formatDate(feedback.created_at)}</td>
                  <td>
                    <button
                      className="view-btn"
                      onClick={() => handleViewFeedback(feedback)}
                    >
                      <FiEye size={16} />
                      View
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="no-data">
                  No feedbacks found
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {filteredFeedbacks.length > itemsPerPage && (
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
              Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
              <span style={styles.paginationCount}>
                ({indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredFeedbacks.length)} of {filteredFeedbacks.length})
              </span>
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

      {/* Feedback Detail Modal */}
      {selectedFeedback && (
        <div style={styles.modalOverlay} onClick={() => setSelectedFeedback(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div style={styles.headerContent}>
                <FiMessageSquare size={24} style={{ color: '#fff' }} />
                <h3 style={styles.modalTitle}>Feedback Details</h3>
              </div>
              <button style={styles.closeButton} onClick={() => setSelectedFeedback(null)}>
                <FiX size={24} />
              </button>
            </div>

            <div style={styles.modalBody}>
              <div style={styles.section}>
                <div style={styles.infoGrid}>
                  <div style={styles.infoItem}>
                    <span style={styles.infoLabel}>User ID:</span>
                    <span style={styles.infoValue}>{selectedFeedback.user_id}</span>
                  </div>
                  <div style={styles.infoItem}>
                    <span style={styles.infoLabel}>User Type:</span>
                    <span className={`user-type-badge ${selectedFeedback.user_type}`}>
                      {selectedFeedback.user_type === 'buyer' ? <FiUser size={14} /> : <FiShoppingBag size={14} />}
                      {selectedFeedback.user_type.charAt(0).toUpperCase() + selectedFeedback.user_type.slice(1)}
                    </span>
                  </div>
                  <div style={styles.infoItem}>
                    <span style={styles.infoLabel}>Rating:</span>
                    <div className="stars-container">
                      {renderStars(selectedFeedback.rating)}
                      <span style={{ marginLeft: '8px', fontWeight: '600' }}>
                        {selectedFeedback.rating}/5
                      </span>
                    </div>
                  </div>
                  <div style={styles.infoItem}>
                    <span style={styles.infoLabel}>Date Submitted:</span>
                    <span style={styles.infoValue}>{formatDate(selectedFeedback.created_at)}</span>
                  </div>
                </div>

                <div style={{ marginTop: '24px' }}>
                  <span style={styles.infoLabel}>Comment:</span>
                  <div style={styles.commentBox}>
                    {selectedFeedback.comment || "No comment provided"}
                  </div>
                </div>
              </div>
            </div>

            <div style={styles.modalFooter}>
              <button
                onClick={() => setSelectedFeedback(null)}
                style={styles.closeButtonFooter}
              >
                Close
              </button>
            </div>
          </div>
        </div>
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
    flexWrap: 'wrap',
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
    flexShrink: 0,
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
    textAlign: 'center',
  },
  paginationCount: {
    fontSize: '0.8rem',
    fontWeight: '500',
    color: '#666',
    marginLeft: '8px',
    display: 'inline-block',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px',
  },
  modal: {
    background: '#fff',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '700px',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
    display: 'flex',
    flexDirection: 'column',
  },
  modalHeader: {
    padding: '24px 30px',
    borderBottom: '1px solid #e0e0e0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
    borderRadius: '16px 16px 0 0',
  },
  headerContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  modalTitle: {
    fontSize: '1.3rem',
    fontWeight: '700',
    color: '#fff',
    margin: 0,
  },
  closeButton: {
    background: 'transparent',
    border: 'none',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '32px',
    lineHeight: '1',
    padding: '0',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '4px',
    transition: 'background 0.2s ease',
  },
  modalBody: {
    padding: '30px',
    overflowY: 'auto',
    flex: '1 1 auto',
  },
  section: {
    marginBottom: '20px',
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
  },
  infoItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  infoLabel: {
    fontSize: '0.85rem',
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  infoValue: {
    fontSize: '1rem',
    fontWeight: '500',
    color: '#333',
  },
  commentBox: {
    marginTop: '8px',
    padding: '16px',
    background: '#f8fafc',
    border: '2px solid #e0f2fe',
    borderRadius: '8px',
    fontSize: '1rem',
    color: '#333',
    lineHeight: '1.6',
    minHeight: '100px',
    whiteSpace: 'pre-wrap',
  },
  modalFooter: {
    padding: '20px 30px',
    borderTop: '1px solid #e0e0e0',
    display: 'flex',
    justifyContent: 'flex-end',
  },
  closeButtonFooter: {
    padding: '12px 32px',
    background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '0.95rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background 0.3s ease',
  },
};

export default ManageFeedbacks;