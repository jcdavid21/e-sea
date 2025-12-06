import React, { useEffect, useState } from "react";
import axios from "axios";
import { 
  FiShoppingBag, 
  FiEye, 
  FiSearch, 
  FiPackage, 
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiDownload,
  FiChevronLeft,
  FiChevronRight,
  FiChevronsLeft,
  FiChevronsRight,
  FiTruck,
  FiAlertCircle
} from "react-icons/fi";
import "./OrderHistory.css";
import Swal from "sweetalert2";
import BuyerHeader from "./BuyerHeader";

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const CUSTOMER_ID = sessionStorage.getItem("customer_id");

  useEffect(() => {
    if (!CUSTOMER_ID) {
      Swal.fire({
        icon: 'error',
        title: 'Not Logged In',
        text: 'Please log in to view your order history.',
      });
      return;
    }
    fetchOrders();
  }, [CUSTOMER_ID]);

  useEffect(() => {
    filterOrders();
    setCurrentPage(1);
  }, [orders, searchTerm, statusFilter]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${process.env.REACT_APP_BUYER_API_URL}/api/buyer/purchases?buyer_id=${CUSTOMER_ID}`);
      console.log("Fetched Orders:", res.data);
      
      // Ensure the response is an array
      const ordersData = Array.isArray(res.data) ? res.data : [];
      setOrders(ordersData);
    } catch (error) {
      console.error("Error fetching orders:", error);
      // Set orders to empty array on error
      setOrders([]);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load order history.',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    // Ensure orders is an array before filtering
    if (!Array.isArray(orders)) {
      setFilteredOrders([]);
      return;
    }

    let filtered = [...orders];

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(order => 
        order.status?.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    // Search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(order => {
        const orderNumber = order.order_number?.toLowerCase() || "";
        const productName = order.product_name?.toLowerCase() || "";
        const status = order.status?.toLowerCase() || "";
        
        return orderNumber.includes(search) || 
               productName.includes(search) || 
               status.includes(search);
      });
    }

    setFilteredOrders(filtered);
  };

  const getStatusStats = () => {
    // Ensure orders is an array before filtering
    const ordersArray = Array.isArray(orders) ? orders : [];
    
    return {
      total: ordersArray.length,
      pending: ordersArray.filter(o => o.status === 'Pending').length,
      preparing: ordersArray.filter(o => o.status === 'Preparing').length,
      completed: ordersArray.filter(o => o.status === 'Completed').length,
      cancelled: ordersArray.filter(o => o.status === 'Cancelled').length
    };
  };

  const stats = getStatusStats();

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return <FiClock style={{ color: '#f59e0b' }} />;
      case 'preparing':
        return <FiPackage style={{ color: '#3b82f6' }} />;
      case 'ready for pickup':
        return <FiTruck style={{ color: '#8b5cf6' }} />;
      case 'completed':
        return <FiCheckCircle style={{ color: '#10b981' }} />;
      case 'cancelled':
        return <FiXCircle style={{ color: '#ef4444' }} />;
      default:
        return <FiAlertCircle style={{ color: '#6b7280' }} />;
    }
  };

  const getStatusClass = (status) => {
    return `status-badge ${(status || '').toLowerCase().replace(/\s+/g, '-')}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return "N/A";
    }
  };

  const formatPrice = (price) => {
    const numPrice = Number(price) || 0;
    return `₱${numPrice.toFixed(2)}`;
  };

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const exportToCSV = () => {
    if (filteredOrders.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No Data to Export',
        text: 'There are no orders to export.',
      });
      return;
    }

    Swal.fire({
      title: 'Export to CSV',
      text: 'Are you sure you want to export your order history to a CSV file?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Export',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        const headers = ["Order Number", "Product Name", "Quantity", "Price", "Total", "Status", "Order Date"];
        const rows = filteredOrders.map(order => [
          order.order_number || '',
          order.product_name || '',
          order.quantity || 0,
          `PHP ${Number(order.price || 0).toFixed(2)}`,
          `PHP ${((Number(order.price || 0)) * (Number(order.quantity || 0))).toFixed(2)}`,
          order.status || '',
          formatDate(order.created_at)
        ]);

        let csvContent = headers.join(",") + "\n";
        rows.forEach(row => {
          csvContent += row.map(cell => `"${cell}"`).join(",") + "\n";
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);

        link.setAttribute("href", url);
        link.setAttribute("download", `order_history_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        Swal.fire({
          icon: 'success',
          title: 'Exported!',
          text: 'Your order history has been exported successfully.',
          timer: 2000,
          showConfirmButton: false
        });
      }
    });
  };

  // Pagination calculations
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

  if (loading) {
    return (
      <div className="order-history-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading order history...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Reusable Header Component */}
      <BuyerHeader 
        searchTerm=""
        onSearchChange={() => {}}
        currentPage="orders"
      />

      <div className="order-history-container">
        <div className="header-bar">
          <div>
            <h2>Order History</h2>
            <p className="header-subtitle">
              View all your past orders • {stats.total} Total Orders
            </p>
          </div>
          <div className="header-stats">
            <div className="stat-card">
              <FiClock size={24} />
              <div>
                <div className="stat-number">{stats.pending}</div>
                <div className="stat-label">Pending</div>
              </div>
            </div>
            <div className="stat-card">
              <FiPackage size={24} />
              <div>
                <div className="stat-number">{stats.preparing}</div>
                <div className="stat-label">Preparing</div>
              </div>
            </div>
            <div className="stat-card">
              <FiCheckCircle size={24} />
              <div>
                <div className="stat-number">{stats.completed}</div>
                <div className="stat-label">Completed</div>
              </div>
            </div>
          </div>
        </div>

        <div style={styles.filterBar}>
          <div style={styles.searchContainer}>
            <FiSearch size={18} />
            <input
              type="text"
              placeholder="Search by order number or product name..."
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
            <div className="tab-buttons">
              <button
                className={statusFilter === "all" ? "active" : ""}
                onClick={() => setStatusFilter("all")}
              >
                All ({orders.length})
              </button>
              <button
                className={statusFilter === "pending" ? "active" : ""}
                onClick={() => setStatusFilter("pending")}
              >
                <FiClock size={16} />
                Pending ({stats.pending})
              </button>
              <button
                className={statusFilter === "preparing" ? "active" : ""}
                onClick={() => setStatusFilter("preparing")}
              >
                <FiPackage size={16} />
                Preparing ({stats.preparing})
              </button>
              <button
                className={statusFilter === "completed" ? "active" : ""}
                onClick={() => setStatusFilter("completed")}
              >
                <FiCheckCircle size={16} />
                Completed ({stats.completed})
              </button>
            </div>
          </div>
        </div>

        <div className="table-card">
          <table className="orders-table">
            <thead>
              <tr>
                <th>Order Number</th>
                <th>Product</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Total</th>
                <th>Status</th>
                <th>Order Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length > 0 ? (
                currentItems.map((order, index) => (
                  <tr key={index}>
                    <td className="order-number-cell">{order.order_number}</td>
                    <td>{order.product_name}</td>
                    <td>{order.quantity}</td>
                    <td>{formatPrice(order.price)}</td>
                    <td className="total-cell">
                      {formatPrice(Number(order.price || 0) * Number(order.quantity || 0))}
                    </td>
                    <td>
                      <span className={getStatusClass(order.status)}>
                        {getStatusIcon(order.status)}
                        {order.status}
                      </span>
                    </td>
                    <td>{formatDate(order.created_at)}</td>
                    <td>
                      <button
                        className="view-btn"
                        onClick={() => handleViewOrder(order)}
                      >
                        <FiEye size={16} />
                        View
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="no-data">
                    {statusFilter !== "all" 
                      ? `No ${statusFilter} orders found` 
                      : "No orders found"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {filteredOrders.length > itemsPerPage && (
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
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="modal-overlay-fullscreen" onClick={() => setSelectedOrder(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div style={styles.headerContent}>
                <FiShoppingBag size={24} style={{ color: '#fff' }} />
                <h3 style={styles.modalTitle}>Order Details</h3>
              </div>
              <button style={styles.closeButton} onClick={() => setSelectedOrder(null)}>
                ×
              </button>
            </div>

            <div style={styles.modalBody}>
              <div style={styles.section}>
                <h4 style={styles.sectionTitle}>Order Information</h4>
                <div style={styles.infoGrid}>
                  <div style={styles.infoItem}>
                    <span style={styles.infoLabel}>Order Number:</span>
                    <span style={styles.infoValue}>{selectedOrder.order_number}</span>
                  </div>
                  <div style={styles.infoItem}>
                    <span style={styles.infoLabel}>Status:</span>
                    <span className={getStatusClass(selectedOrder.status)}>
                      {getStatusIcon(selectedOrder.status)}
                      {selectedOrder.status}
                    </span>
                  </div>
                  <div style={styles.infoItem}>
                    <span style={styles.infoLabel}>Order Date:</span>
                    <span style={styles.infoValue}>{formatDate(selectedOrder.created_at)}</span>
                  </div>
                </div>
              </div>

              <div style={styles.section}>
                <h4 style={styles.sectionTitle}>Product Details</h4>
                <div style={styles.infoGrid}>
                  <div style={styles.infoItem}>
                    <span style={styles.infoLabel}>Product Name:</span>
                    <span style={styles.infoValue}>{selectedOrder.product_name}</span>
                  </div>
                  <div style={styles.infoItem}>
                    <span style={styles.infoLabel}>Quantity:</span>
                    <span style={styles.infoValue}>{selectedOrder.quantity}</span>
                  </div>
                  <div style={styles.infoItem}>
                    <span style={styles.infoLabel}>Unit Price:</span>
                    <span style={styles.infoValue}>{formatPrice(selectedOrder.price)}</span>
                  </div>
                  <div style={styles.infoItem}>
                    <span style={styles.infoLabel}>Total Amount:</span>
                    <span style={{...styles.infoValue, fontSize: '1.2rem', fontWeight: '700', color: '#1e3c72'}}>
                      {formatPrice(Number(selectedOrder.price || 0) * Number(selectedOrder.quantity || 0))}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div style={styles.modalFooter}>
              <button
                onClick={() => setSelectedOrder(null)}
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
  searchContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flex: 1,
    maxWidth: '400px',
    padding: '10px 16px',
    background: '#f8fafc',
    border: '2px solid #e0f2fe',
    borderRadius: '8px',
    transition: 'border-color 0.2s ease',
  },
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
  paginationCount: {
    fontSize: '0.8rem',
    fontWeight: '500',
    color: '#666',
    marginLeft: '8px',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw !important;',
    height: '100vh',
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
    overflow: 'hidden',
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
    fontSize: '1.5rem',
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
    flex: 1,
  },
  section: {
    marginBottom: '24px',
  },
  sectionTitle: {
    fontSize: '1.1rem',
    fontWeight: '600',
    color: '#1e3c72',
    marginBottom: '16px',
    paddingBottom: '8px',
    borderBottom: '2px solid #e0f2fe',
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
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
  modalFooter: {
    padding: '20px 30px',
    borderTop: '1px solid #e0e0e0',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
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
    transition: 'all 0.3s ease',
  },
  filterBar:{
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
    padding: '16px 24px !important;',
    background: 'white',
    borderRadius: '12px',
    marginBottom: '20px',
    border: '2px solid #bae6fd',
    boxShadow: '0 4px 16px rgba(8, 47, 73, 0.08)',
    marginTop: '24px',
  }
};

export default OrderHistory;