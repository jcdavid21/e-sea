import React, { useEffect, useState } from "react";
import {
  FiPackage,
  FiUser,
  FiPhone,
  FiCalendar,
  FiImage,
  FiDownload,
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiChevronsLeft,
  FiChevronsRight,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiTruck,
  FiAlertCircle
} from "react-icons/fi";
import Swal from "sweetalert2";

const STATUS_OPTIONS = ["Pending", "Preparing", "Ready for Pickup", "Completed", "Cancelled"];

const STATUS_ICONS = {
  "Pending": <FiClock className="status-icon" />,
  "Preparing": <FiPackage className="status-icon" />,
  "Ready for Pickup": <FiTruck className="status-icon" />,
  "Completed": <FiCheckCircle className="status-icon" />,
  "Cancelled": <FiXCircle className="status-icon" />
};

export default function ViewOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProof, setSelectedProof] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const limit = 10;
  const [filterStatus, setFilterStatus] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const sellerId = localStorage.getItem("seller_unique_id");

  const fetchOrders = async (page = 1) => {
    if (!sellerId) {
      setError("Seller ID not found. Please log in.");
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${process.env.REACT_APP_SELLER_API_URL}/api/orders?seller_id=${sellerId}&page=${page}&limit=${limit}`);
      if (!res.ok) throw new Error("Failed to fetch orders");
      const data = await res.json();
      console.log("Fetched orders data:", data);
      setOrders(data.orders);
      setCurrentPage(data.pagination.currentPage);
      setTotalPages(data.pagination.totalPages);
      setTotalOrders(data.pagination.totalOrders);
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(1);
  }, []);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchOrders(newPage);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    const result = await Swal.fire({
      title: 'Update Order Status?',
      html: `Change order <strong>#${orderId}</strong> status to <strong>"${newStatus}"</strong>?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#1e3c72',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, update it!',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`${process.env.REACT_APP_SELLER_API_URL}/api/orders/${orderId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          seller_id: sellerId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        await Swal.fire({
          icon: 'error',
          title: 'Update Failed',
          text: data.message || 'Failed to update status',
          confirmButtonColor: '#1e3c72'
        });
        return;
      }

      setOrders((prev) =>
        prev.map((order) =>
          order.orderId === orderId ? { ...order, status: newStatus } : order
        )
      );

      await Swal.fire({
        icon: 'success',
        title: 'Status Updated!',
        html: `Order <strong>#${orderId}</strong> status updated to <strong>"${newStatus}"</strong><br>📬 Customer has been notified!`,
        confirmButtonColor: '#1e3c72',
        timer: 3000,
        timerProgressBar: true
      });

    } catch (err) {
      console.error("Error updating status:", err);
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error communicating with server.',
        confirmButtonColor: '#1e3c72'
      });
    }
  };

  const viewProof = (proofPath, order) => {
    if (!proofPath) {
      Swal.fire({
        icon: 'info',
        title: 'No Proof Available',
        text: 'No proof of payment available for this order.',
        confirmButtonColor: '#1e3c72'
      });
      return;
    }
    setSelectedProof(proofPath);
    setSelectedOrder(order);
  };

  const closeProofModal = () => {
    setSelectedProof(null);
    setSelectedOrder(null);
  };

  const filteredOrders = orders.filter((order) => {
    const matchesStatus = filterStatus === "All" || order.status === filterStatus;
    const matchesSearch =
      order.orderId.toString().includes(searchQuery.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.contact.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  if (loading) {
    return (
      <div className="view-orders-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="view-orders-container">
        <div className="error-state">
          <FiAlertCircle size={48} />
          <p>Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="view-orders-container">
      <div className="orders-header">
        <div className="header-content">
          <FiPackage size={32} className="header-icon" />
          <div>
            <h1>Orders Management</h1>
            <p className="header-subtitle">Track and manage your customer orders</p>
          </div>
        </div>
        <div className="orders-count">
          <span className="count-number">{totalOrders}</span>
          <span className="count-label">Total Orders</span>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="empty-state">
          <FiPackage size={64} />
          <h3>No Orders Yet</h3>
          <p>Orders will appear here once customers make purchases</p>
        </div>
      ) : (
        <>
          <div className="filters-section">
            <div className="search-box">
              <FiPackage className="search-icon" />
              <input
                type="text"
                placeholder="Search by Order ID, Customer, or Contact..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="clear-search">
                  <FiX />
                </button>
              )}
            </div>

            <div className="status-filters">
              <button
                className={`filter-btn ${filterStatus === "All" ? "active" : ""}`}
                onClick={() => setFilterStatus("All")}
              >
                All Orders
              </button>
              {STATUS_OPTIONS.map((status) => (
                <button
                  key={status}
                  className={`filter-btn ${filterStatus === status ? "active" : ""}`}
                  onClick={() => setFilterStatus(status)}
                >
                  {STATUS_ICONS[status]}
                  <span>{status}</span>
                </button>
              ))}
            </div>
          </div>
           {filteredOrders.length === 0 ? (
     <div className="empty-state">
        <FiAlertCircle size={64} />
        <h3>No Orders Found</h3>
        <p>No orders match your current filters. Try adjusting your search.</p>
      </div>
    ) : (
      <>
          <div className="orders-grid">
            {filteredOrders.map((order) => (
              <div key={order.orderId} className="order-card">
                <div className="order-card-header">
                  <div className="order-id-section">
                    <span className="order-id-label">Order ID</span>
                    <span className="order-id">#{order.orderId}</span>
                  </div>
                  <div className={`status-badge status-${order.status?.toLowerCase().replace(/\s+/g, '-') || 'pending'}`}>
                    {STATUS_ICONS[order.status || "Pending"]}
                    <span>{order.status || "Pending"}</span>
                  </div>
                </div>

                <div className="order-card-body">
                  <div className="order-info-row">
                    <div className="info-item">
                      <FiUser className="info-icon" />
                      <div>
                        <span className="info-label">Customer</span>
                        <span className="info-value">{order.customerName}</span>
                      </div>
                    </div>
                    <div className="info-item">
                      <FiPhone className="info-icon" />
                      <div>
                        <span className="info-label">Contact</span>
                        <span className="info-value">{order.contact}</span>
                      </div>
                    </div>
                  </div>

                  <div className="order-info-row">
                    <div className="info-item">
                      <FiCalendar className="info-icon" />
                      <div>
                        <span className="info-label">Order Date</span>
                        <span className="info-value">{new Date(order.orderDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="info-item total-section">
                      <div>
                        <span className="info-label">Total Amount</span>
                        <span className="info-value total-amount">₱{Number(order.total).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="items-section">
                    <h4 className="items-header">Order Items</h4>
                    {order.items.length === 0 ? (
                      <p className="no-items">No items in this order</p>
                    ) : (
                      <div className="items-list">
                        {order.items.map((item) => (
                          <div key={item.itemId} className="item-row">
                            <span className="item-name">{item.productName}</span>
                            <span className="item-qty">×{item.quantity}</span>
                            <span className="item-price">₱{item.price}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="order-actions">
                    {order.proofOfPayment ? (
                      <button
                        className="btn btn-view-proof"
                        onClick={() => viewProof(order.proofOfPayment, order)}
                      >
                        <FiImage />
                        View Proof
                      </button>
                    ) : (
                      <span className="no-proof-text">No proof available</span>
                    )}

                    <select
                      className="status-select"
                      value={order.status || "Pending"}
                      onChange={(e) => handleStatusChange(order.orderId, e.target.value)}
                      disabled={order.status === "Completed" || order.status === "Cancelled"}
                    >
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
          </>
        )}

          <div className="pagination">
            <button
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
              className="pagination-btn"
              title="First Page"
            >
              <FiChevronsLeft />
            </button>
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="pagination-btn"
              title="Previous Page"
            >
              <FiChevronLeft />
            </button>
            <span className="pagination-info">
              Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="pagination-btn"
              title="Next Page"
            >
              <FiChevronRight />
            </button>
            <button
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
              className="pagination-btn"
              title="Last Page"
            >
              <FiChevronsRight />
            </button>
          </div>
        </>
      )}

      {selectedProof && selectedOrder && (
        <div className="modal-overlay" onClick={closeProofModal}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Payment Verification</h3>
              <button className="modal-close" onClick={closeProofModal}>
                <FiX size={24} />
              </button>
            </div>
            <div className="modal-body-split">
              <div className="proof-details-section">
                <div className="detail-card">
                  <div className="detail-header">
                    <FiPackage size={20} />
                    <h4>Order Information</h4>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Order ID</span>
                    <span className="detail-value">#{selectedOrder.orderId}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Status</span>
                    <div className={`status-badge-small status-${selectedOrder.status?.toLowerCase().replace(/\s+/g, '-') || 'pending'}`}>
                      {STATUS_ICONS[selectedOrder.status || "Pending"]}
                      <span>{selectedOrder.status || "Pending"}</span>
                    </div>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Order Date</span>
                    <span className="detail-value">{new Date(selectedOrder.orderDate).toLocaleString()}</span>
                  </div>
                </div>

                <div className="detail-card">
                  <div className="detail-header">
                    <FiUser size={20} />
                    <h4>Customer Details</h4>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Name</span>
                    <span className="detail-value">{selectedOrder.customerName}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Contact</span>
                    <span className="detail-value">{selectedOrder.contact}</span>
                  </div>
                </div>

                <div className="detail-card">
                  <div className="detail-header">
                    <FiPackage size={20} />
                    <h4>Order Items</h4>
                  </div>
                  <div className="modal-items-list">
                    {selectedOrder.items.map((item) => (
                      <div key={item.itemId} className="modal-item-row">
                        <span className="modal-item-name">{item.productName}</span>
                        <span className="modal-item-qty">×{item.quantity}</span>
                        <span className="modal-item-price">₱{item.price}</span>
                      </div>
                    ))}
                  </div>
                  <div className="modal-total">
                    <span className="modal-total-label">Total Amount</span>
                    <span className="modal-total-value">₱{Number(selectedOrder.total).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="proof-image-section">
                <div className="proof-image-wrapper">
                  <img
                    src={`${process.env.REACT_APP_SELLER_API_URL}${selectedProof}`}
                    alt="Proof of Payment"
                    className="proof-image"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/placeholder-image.png';
                    }}
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <a
                href={`${process.env.REACT_APP_SELLER_API_URL}${selectedProof}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-download"
              >
                <FiDownload />
                Download Proof
              </a>
              <button className="btn btn-secondary" onClick={closeProofModal}>
                <FiX />
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .view-orders-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 32px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          background: #f8f9fa;
          min-height: 100vh;
        }

        .orders-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
          padding: 24px;
          background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
          border-radius: 16px;
          color: white;
          box-shadow: 0 4px 20px rgba(30, 60, 114, 0.2);
        }

        .header-content {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .header-icon {
          padding: 12px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          backdrop-filter: blur(10px);
        }

        .orders-header h1 {
          font-size: 28px;
          font-weight: 700;
          margin-bottom: 4px;
        }

        .header-subtitle {
          font-size: 14px;
          opacity: 0.9;
        }

        .orders-count {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 16px 24px;
          background: rgba(255, 255, 255, 0.15);
          border-radius: 12px;
          backdrop-filter: blur(10px);
        }

        .count-number {
          font-size: 32px;
          font-weight: 700;
          line-height: 1;
        }

        .count-label {
          font-size: 12px;
          opacity: 0.9;
          margin-top: 4px;
        }

        .loading-state,
        .error-state,
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 64px 32px;
          text-align: center;
          background: white;
          border-radius: 16px;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
        }

        .spinner {
          width: 48px;
          height: 48px;
          border: 4px solid #e9ecef;
          border-top-color: #1e3c72;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .loading-state p,
        .error-state p {
          font-size: 16px;
          color: #6c757d;
          margin-top: 16px;
        }

        .error-state {
          color: #dc3545;
        }

        .empty-state svg {
          color: #dee2e6;
          margin-bottom: 24px;
        }

        .empty-state h3 {
          font-size: 24px;
          color: #495057;
          margin-bottom: 8px;
        }

        .empty-state p {
          color: #6c757d;
          font-size: 14px;
        }

        .orders-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
          gap: 24px;
          margin-bottom: 32px;
        }

        .order-card {
          background: white;
          border-radius: 16px;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
          overflow: hidden;
          transition: all 0.3s ease;
          border: 1px solid #e9ecef;
        }

        .order-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(30, 60, 114, 0.15);
        }

        .order-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          border-bottom: 2px solid #1e3c72;
        }

        .order-id-section {
          display: flex;
          flex-direction: column;
        }

        .order-id-label {
          font-size: 11px;
          color: #6c757d;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: 600;
        }

        .order-id {
          font-size: 18px;
          font-weight: 700;
          color: #1e3c72;
          margin-top: 2px;
        }

        .status-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 600;
        }

        .status-icon {
          font-size: 16px;
        }

        .status-pending {
          background: #fff3cd;
          color: #856404;
        }

        .status-preparing {
          background: #cfe2ff;
          color: #084298;
        }

        .status-ready-for-pickup {
          background: #d1ecf1;
          color: #0c5460;
        }

        .status-completed {
          background: #d4edda;
          color: #155724;
        }

        .status-cancelled {
          background: #f8d7da;
          color: #721c24;
        }

        .order-card-body {
          padding: 20px;
        }

        .order-info-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 16px;
        }

        .info-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }

        .info-icon {
          color: #1e3c72;
          font-size: 20px;
          margin-top: 2px;
          flex-shrink: 0;
        }

        .info-label {
          display: block;
          font-size: 11px;
          color: #6c757d;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: 600;
          margin-bottom: 4px;
        }

        .info-value {
          display: block;
          font-size: 14px;
          color: #212529;
          font-weight: 500;
        }

        .total-section .info-value {
          font-size: 20px;
          font-weight: 700;
          color: #1e3c72;
        }

        .items-section {
          margin: 20px 0;
          padding: 16px;
          background: #f8f9fa;
          border-radius: 12px;
        }

        .items-header {
          font-size: 13px;
          color: #495057;
          font-weight: 600;
          margin-bottom: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .items-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .item-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 12px;
          background: white;
          border-radius: 8px;
          font-size: 13px;
        }

        .item-name {
          flex: 1;
          color: #212529;
          font-weight: 500;
        }

        .item-qty {
          color: #6c757d;
          margin: 0 12px;
          font-weight: 600;
        }

        .item-price {
          color: #1e3c72;
          font-weight: 700;
          min-width: 80px;
          text-align: right;
        }

        .no-items {
          font-size: 13px;
          color: #6c757d;
          font-style: italic;
          text-align: center;
          padding: 8px;
        }

        .order-actions {
          display: flex;
          gap: 12px;
          margin-top: 20px;
        }

        .btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          text-decoration: none;
        }

        .btn-view-proof {
          background: #1e3c72;
          color: white;
          flex: 1;
        }

        .btn-view-proof:hover {
          background: #16325a;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(30, 60, 114, 0.3);
        }

        .no-proof-text {
          flex: 1;
          text-align: center;
          font-size: 13px;
          color: #6c757d;
          font-style: italic;
          padding: 10px;
        }

        .status-select {
          flex: 1;
          padding: 10px 14px;
          border: 2px solid #dee2e6;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          color: #495057;
          background: white;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .status-select:hover:not(:disabled) {
          border-color: #1e3c72;
        }

        .status-select:focus {
          outline: none;
          border-color: #1e3c72;
          box-shadow: 0 0 0 3px rgba(30, 60, 114, 0.1);
        }

        .status-select:disabled {
          background: #e9ecef;
          color: #6c757d;
          cursor: not-allowed;
          opacity: 0.6;
        }

        .pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 12px;
          padding: 24px;
          background: white;
          border-radius: 16px;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
        }

        .pagination-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border: 2px solid #dee2e6;
          background: white;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          color: #495057;
        }

        .pagination-btn:hover:not(:disabled) {
          background: #1e3c72;
          border-color: #1e3c72;
          color: white;
          transform: translateY(-2px);
        }

        .pagination-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .pagination-info {
          margin: 0 16px;
          font-size: 14px;
          color: #495057;
        }

        .pagination-info strong {
          color: #1e3c72;
          font-weight: 700;
        }

        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.75);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fadeIn 0.2s ease;
          backdrop-filter: blur(4px);
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .modal-content {
          background: white;
          border-radius: 16px;
          width: 90%;
          max-width: 600px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          overflow: hidden;
          animation: slideUp 0.3s ease;
        }

        .modal-large {
          max-width: 1100px;
        }

        @keyframes slideUp {
          from {
            transform: translateY(30px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
          color: white;
        }

        .modal-header h3 {
          font-size: 18px;
          font-weight: 600;
        }

        .modal-close {
          background: transparent;
          border: none;
          color: white;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          transition: all 0.2s ease;
        }

        .modal-close:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .modal-body {
          padding: 24px;
          text-align: center;
          background: #f8f9fa;
        }

        .modal-body-split {
          display: grid;
          grid-template-columns: 400px 1fr;
          gap: 0;
          background: #f8f9fa;
          max-height: 600px;
        }

        .proof-details-section {
          padding: 24px;
          overflow-y: auto;
          background: white;
          border-right: 1px solid #e9ecef;
        }

        .proof-image-section {
          padding: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f8f9fa;
          overflow: auto;
        }

        .proof-image-wrapper {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .proof-image {
          max-width: 100%;
          max-height: 550px;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
          object-fit: contain;
        }

        .detail-card {
          background: #f8f9fa;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 16px;
          border: 1px solid #e9ecef;
        }

        .detail-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 2px solid #1e3c72;
          color: #1e3c72;
        }

        .detail-header h4 {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .detail-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 0;
          border-bottom: 1px solid #e9ecef;
        }

        .detail-item:last-child {
          border-bottom: none;
        }

        .detail-label {
          font-size: 12px;
          color: #6c757d;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .detail-value {
          font-size: 14px;
          color: #212529;
          font-weight: 600;
          text-align: right;
        }

        .status-badge-small {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 16px;
          font-size: 12px;
          font-weight: 600;
        }

        .status-badge-small .status-icon {
          font-size: 14px;
        }

        .modal-items-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 12px;
        }

        .modal-item-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 12px;
          background: white;
          border-radius: 8px;
          font-size: 13px;
        }

        .modal-item-name {
          flex: 1;
          color: #212529;
          font-weight: 500;
        }

        .modal-item-qty {
          color: #6c757d;
          margin: 0 12px;
          font-weight: 600;
        }

        .modal-item-price {
          color: #1e3c72;
          font-weight: 700;
          min-width: 80px;
          text-align: right;
        }

        .modal-total {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          background: white;
          border-radius: 8px;
          margin-top: 12px;
        }

        .modal-total-label {
          font-size: 13px;
          color: #6c757d;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .modal-total-value {
          font-size: 18px;
          color: #1e3c72;
          font-weight: 700;
        }

        .modal-footer {
          display: flex;
          gap: 12px;
          padding: 20px 24px;
          background: white;
          border-top: 1px solid #e9ecef;
        }

        .btn-download {
          flex: 1;
          background: #1e3c72;
          color: white;
          justify-content: center;
        }

        .btn-download:hover {
          background: #16325a;
        }

        .btn-secondary {
          flex: 1;
          background: #6c757d;
          color: white;
          justify-content: center;
        }

        .btn-secondary:hover {
          background: #5a6268;
        }

        @media (max-width: 768px) {
          .view-orders-container {
            padding: 16px;
          }

          .orders-header {
            flex-direction: column;
            gap: 16px;
            text-align: center;
          }

          .header-content {
            flex-direction: column;
          }

          .orders-grid {
            grid-template-columns: 1fr;
          }

          .order-info-row {
            grid-template-columns: 1fr;
          }

          .pagination {
            flex-wrap: wrap;
          }

          .modal-body-split {
            grid-template-columns: 1fr;
            max-height: 80vh;
          }

          .proof-details-section {
            border-right: none;
            border-bottom: 1px solid #e9ecef;
            max-height: 300px;
          }

          .proof-image-section {
            padding: 16px;
          }

          .proof-image {
            max-height: 300px;
          }
        }

        @media (max-width: 480px) {
          .order-actions {
            flex-direction: column;
          }

          .modal-content {
            width: 95%;
            margin: 16px;
          }

          .proof-image {
            max-height: 250px;
          }
        }

        .filters-section {
  background: white;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.search-box {
  position: relative;
  margin-bottom: 20px;
}

.search-icon {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: #6c757d;
  font-size: 20px;
}

.search-input {
  width: 100%;
  padding: 14px 48px 14px 48px;
  border: 2px solid #dee2e6;
  border-radius: 12px;
  font-size: 15px;
  transition: all 0.2s ease;
}

.search-input:focus {
  outline: none;
  border-color: #1e3c72;
  box-shadow: 0 0 0 3px rgba(30, 60, 114, 0.1);
}

.clear-search {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: #e9ecef;
  border: none;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #6c757d;
  transition: all 0.2s ease;
}

.clear-search:hover {
  background: #dee2e6;
  color: #495057;
}

.status-filters {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.filter-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border: 2px solid #dee2e6;
  background: white;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  color: #495057;
  cursor: pointer;
  transition: all 0.2s ease;
}

.filter-btn:hover {
  border-color: #1e3c72;
  color: #1e3c72;
  transform: translateY(-2px);
}

.filter-btn.active {
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
  border-color: #1e3c72;
  color: white;
  box-shadow: 0 4px 12px rgba(30, 60, 114, 0.3);
}

.filter-btn .status-icon {
  font-size: 16px;
}

@media (max-width: 768px) {
  .filters-section {
    padding: 16px;
  }

  .status-filters {
    gap: 8px;
  }

  .filter-btn {
    padding: 8px 14px;
    font-size: 13px;
  }
}
      `}</style>
    </div>
  );
}