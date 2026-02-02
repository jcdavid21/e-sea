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
  FiAlertCircle,
  FiPrinter  // Add this
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

      const ordersData = Array.isArray(res.data) ? res.data : [];
      setOrders(ordersData);
    } catch (error) {
      console.error("Error fetching orders:", error);
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
        const status = order.status?.toLowerCase() || "";
        const shopName = order.shop_name?.toLowerCase() || "";

        // Search in items as well
        const itemMatch = order.items?.some(item =>
          item.product_name?.toLowerCase().includes(search)
        );

        return orderNumber.includes(search) ||
          status.includes(search) ||
          shopName.includes(search) ||
          itemMatch;
      });
    }

    setFilteredOrders(filtered);
  };

  const getStatusStats = () => {
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
        const headers = ["Order Number", "Shop Name", "Items", "Total Amount", "Status", "Order Date"];
        const rows = filteredOrders.map(order => [
          order.order_number || '',
          order.shop_name || '',
          order.items?.map(item => `${item.product_name} (x${item.quantity})`).join('; ') || '',
          `PHP ${Number(order.total || 0).toFixed(2)}`,
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

  const printReceipt = (order) => {
    const printWindow = window.open('', '_blank');
    
    const receiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt - ${order.order_number}</title>
        <style>
          @media print {
            @page {
              margin: 0.5cm;
            }
            body {
              margin: 0;
              padding: 20px;
            }
          }
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Arial', sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px 20px;
            background: #fff;
            color: #333;
          }
          
          .receipt-container {
            border: 2px solid #1e3c72;
            border-radius: 8px;
            padding: 30px;
          }
          
          .receipt-header {
            text-align: center;
            border-bottom: 3px double #1e3c72;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          
          .company-name {
            font-size: 28px;
            font-weight: bold;
            color: #1e3c72;
            margin-bottom: 5px;
          }
          
          .receipt-title {
            font-size: 18px;
            color: #666;
            margin-top: 10px;
          }
          
          .receipt-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
            padding: 20px;
            background: #f8fafc;
            border-radius: 8px;
          }
          
          .info-group {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }
          
          .info-label {
            font-size: 11px;
            text-transform: uppercase;
            color: #666;
            font-weight: 600;
            letter-spacing: 0.5px;
          }
          
          .info-value {
            font-size: 14px;
            color: #333;
            font-weight: 500;
          }
          
          .order-number {
            font-family: 'Courier New', monospace;
            font-weight: bold;
            color: #1e3c72;
            font-size: 16px;
          }
          
          .items-section {
            margin-bottom: 30px;
          }
          
          .section-title {
            font-size: 16px;
            font-weight: bold;
            color: #1e3c72;
            margin-bottom: 15px;
            padding-bottom: 8px;
            border-bottom: 2px solid #e0f2fe;
          }
          
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          
          .items-table thead {
            background: #1e3c72;
            color: white;
          }
          
          .items-table th {
            padding: 12px;
            text-align: left;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .items-table td {
            padding: 12px;
            border-bottom: 1px solid #e0f2fe;
            font-size: 14px;
          }
          
          .items-table tbody tr:last-child td {
            border-bottom: none;
          }
          
          .items-table tbody tr:nth-child(even) {
            background: #f8fafc;
          }
          
          .text-right {
            text-align: right;
          }
          
          .text-center {
            text-align: center;
          }
          
          .total-section {
            border-top: 3px double #1e3c72;
            padding-top: 20px;
            margin-top: 20px;
          }
          
          .total-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0;
          }
          
          .total-label {
            font-size: 14px;
            color: #666;
          }
          
          .total-value {
            font-size: 14px;
            font-weight: 500;
          }
          
          .grand-total {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px 20px;
            background: #1e3c72;
            color: white;
            border-radius: 8px;
            margin-top: 10px;
          }
          
          .grand-total-label {
            font-size: 18px;
            font-weight: bold;
          }
          
          .grand-total-value {
            font-size: 24px;
            font-weight: bold;
          }
          
          .payment-info {
            margin-top: 30px;
            padding: 20px;
            background: #f0f9ff;
            border-left: 4px solid #1e3c72;
            border-radius: 4px;
          }
          
          .delivery-info {
            margin-top: 20px;
            padding: 20px;
            background: #f8fafc;
            border-radius: 8px;
          }
          
          .status-badge {
            display: inline-block;
            padding: 6px 14px;
            border-radius: 50px;
            font-size: 12px;
            font-weight: 600;
            text-transform: capitalize;
          }
          
          .status-pending {
            background: #fef3c7;
            color: #92400e;
          }
          
          .status-preparing {
            background: #dbeafe;
            color: #1e40af;
          }
          
          .status-ready-for-pickup {
            background: #ede9fe;
            color: #5b21b6;
          }
          
          .status-completed {
            background: #d1fae5;
            color: #065f46;
          }
          
          .status-cancelled {
            background: #fee2e2;
            color: #991b1b;
          }
          
          .receipt-footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px dashed #e0e0e0;
            text-align: center;
            color: #666;
            font-size: 12px;
          }
          
          .proof-of-payment {
            margin-top: 20px;
            text-align: center;
          }
          
          .proof-of-payment img {
            max-width: 300px;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            margin-top: 10px;
          }
        </style>
      </head>
      <body>
        <div class="receipt-container">
          <div class="receipt-header">
            <div class="company-name">E-SEA MARKETPLACE</div>
            <div class="receipt-title">ORDER RECEIPT</div>
          </div>
          
          <div class="receipt-info">
            <div class="info-group">
              <span class="info-label">Order Number</span>
              <span class="order-number">${order.order_number}</span>
            </div>
            <div class="info-group">
              <span class="info-label">Order Date</span>
              <span class="info-value">${formatDate(order.created_at)}</span>
            </div>
            <div class="info-group">
              <span class="info-label">Shop Name</span>
              <span class="info-value">${order.shop_name || 'N/A'}</span>
            </div>
            <div class="info-group">
              <span class="info-label">Status</span>
              <span class="status-badge status-${(order.status || '').toLowerCase().replace(/\s+/g, '-')}">${order.status}</span>
            </div>
            ${order.customer_name ? `
              <div class="info-group">
                <span class="info-label">Customer Name</span>
                <span class="info-value">${order.customer_name}</span>
              </div>
            ` : ''}
            ${order.contact ? `
              <div class="info-group">
                <span class="info-label">Contact</span>
                <span class="info-value">${order.contact}</span>
              </div>
            ` : ''}
          </div>
          
          ${order.address ? `
            <div class="delivery-info">
              <div class="info-group">
                <span class="info-label">Delivery Address</span>
                <span class="info-value">${order.address}</span>
              </div>
            </div>
          ` : ''}
          
          ${order.notes ? `
            <div class="delivery-info" style="margin-top: 15px;">
              <div class="info-group">
                <span class="info-label">Order Notes</span>
                <span class="info-value">${order.notes}</span>
              </div>
            </div>
          ` : ''}
          
          <div class="items-section">
            <h3 class="section-title">Order Items</h3>
            <table class="items-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Product Name</th>
                  <th class="text-center">Quantity</th>
                  <th class="text-right">Unit Price</th>
                  <th class="text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${order.items && order.items.length > 0 ? order.items.map((item, idx) => `
                  <tr>
                    <td>${idx + 1}</td>
                    <td>${item.product_name}</td>
                    <td class="text-center">${item.quantity}</td>
                    <td class="text-right">${formatPrice(item.price)}</td>
                    <td class="text-right"><strong>${formatPrice(Number(item.price) * Number(item.quantity))}</strong></td>
                  </tr>
                `).join('') : '<tr><td colspan="5" class="text-center">No items</td></tr>'}
              </tbody>
            </table>
            
            <div class="total-section">
              <div class="total-row">
                <span class="total-label">Items Total:</span>
                <span class="total-value">${formatPrice(order.items?.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity)), 0) || 0)}</span>
              </div>
              
              <div class="grand-total">
                <span class="grand-total-label">TOTAL AMOUNT</span>
                <span class="grand-total-value">${formatPrice(order.total)}</span>
              </div>
            </div>
          </div>
          
          ${order.payment_mode ? `
            <div class="payment-info">
              <div class="info-group">
                <span class="info-label">Payment Method</span>
                <span class="info-value">${order.payment_mode}</span>
              </div>
              ${order.proof_of_payment_url ? `
                <div class="proof-of-payment">
                  <img src="${order.proof_of_payment_url}" alt="Proof of Payment" />
                </div>
              ` : ''}
            </div>
          ` : ''}
          
          <div class="receipt-footer">
            <p>Thank you for your order!</p>
            <p style="margin-top: 10px;">This is a computer-generated receipt.</p>
            <p style="margin-top: 5px;">Printed on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        </div>
        
        <script>
          // Auto-trigger print dialog when page loads
          window.onload = function() {
            window.print();
            
            // Optional: Close the window after printing or canceling
            window.onafterprint = function() {
              window.close();
            };
          };
        </script>
      </body>
      </html>
    `;
    
    printWindow.document.write(receiptHTML);
    printWindow.document.close();

    // close the tab after printing or canceling
    printWindow.onafterprint = function() {
      printWindow.close();
    }

    
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
        onSearchChange={() => { }}
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
          <div className="filter-actions">
            <div style={styles.searchContainer}>
              <FiSearch size={18} style={{ color: '#666' }} />
              <input
                type="text"
                placeholder="Search orders, products, shop..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>

            <div className="tab-buttons">
              <button
                className={statusFilter === "all" ? "active" : ""}
                onClick={() => setStatusFilter("all")}
              >
                <FiShoppingBag size={16} />
                All Orders
              </button>
              <button
                className={statusFilter === "Pending" ? "active" : ""}
                onClick={() => setStatusFilter("Pending")}
              >
                <FiClock size={16} />
                Pending
              </button>
              <button
                className={statusFilter === "Preparing" ? "active" : ""}
                onClick={() => setStatusFilter("Preparing")}
              >
                <FiPackage size={16} />
                Preparing
              </button>
              <button
                className={statusFilter === "Completed" ? "active" : ""}
                onClick={() => setStatusFilter("Completed")}
              >
                <FiCheckCircle size={16} />
                Completed
              </button>
            </div>
          </div>

          <button className="export-btn" onClick={exportToCSV}>
            <FiDownload size={16} />
            Export CSV
          </button>
        </div>

        <div className="table-card">
          <table className="orders-table">
            <thead>
              <tr>
                <th>Order Number</th>
                <th>Shop Name</th>
                <th>Items</th>
                <th>Order Date</th>
                <th>Total Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length > 0 ? (
                currentItems.map((order) => (
                  <tr key={order.order_id}>
                    <td className="order-number-cell">{order.order_number}</td>
                    <td>{order.shop_name || 'N/A'}</td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {order.items && order.items.length > 0 ? (
                          <>
                            {order.items.slice(0, 2).map((item, idx) => (
                              <div key={idx} style={{ fontSize: '0.85rem', color: '#666' }}>
                                {item.product_name} <span style={{ fontWeight: '600', color: '#1e3c72' }}>×{item.quantity}</span>
                              </div>
                            ))}
                            {order.items.length > 2 && (
                              <div style={{ fontSize: '0.8rem', color: '#999', fontStyle: 'italic' }}>
                                +{order.items.length - 2} more item{order.items.length - 2 > 1 ? 's' : ''}
                              </div>
                            )}
                          </>
                        ) : (
                          <span style={{ color: '#999' }}>No items</span>
                        )}
                      </div>
                    </td>
                    <td>{formatDate(order.created_at)}</td>
                    <td className="total-cell">{formatPrice(order.total)}</td>
                    <td>
                      <span className={getStatusClass(order.status)}>
                        {getStatusIcon(order.status)}
                        {order.status}
                      </span>
                    </td>
                    <td>
                      <button
                        className="view-btn"
                        onClick={() => handleViewOrder(order)}
                      >
                        <FiEye size={14} />
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="no-data">
                    No orders found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {totalPages > 1 && (
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
                Page {currentPage} of {totalPages}
                <span style={styles.paginationCount}>
                  ({filteredOrders.length} orders)
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
                    <span style={styles.infoLabel}>Shop Name:</span>
                    <span style={styles.infoValue}>{selectedOrder.shop_name || 'N/A'}</span>
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
                <h4 style={styles.sectionTitle}>Order Items ({selectedOrder.items?.length || 0})</h4>
                <div style={styles.itemsList}>
                  {selectedOrder.items && selectedOrder.items.length > 0 ? (
                    selectedOrder.items.map((item, idx) => (
                      <div key={idx} style={styles.itemCard}>
                        <div style={styles.itemDetails}>
                          <div style={styles.itemName}>{item.product_name}</div>
                          <div style={styles.itemMeta}>
                            Quantity: <strong>{item.quantity}</strong> × {formatPrice(item.price)}
                          </div>
                        </div>
                        <div style={styles.itemTotal}>
                          {formatPrice(Number(item.price) * Number(item.quantity))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p style={{ color: '#999', textAlign: 'center' }}>No items in this order</p>
                  )}
                </div>

                <h4 style={{ ...styles.sectionTitle, marginTop: '32px' }}>Proof of Payment</h4>
                {selectedOrder.proof_of_payment_url ? (
                  <img
                    src={selectedOrder.proof_of_payment_url}
                    alt="Proof of Payment"
                    style={{
                      maxHeight: '400px',
                      maxWidth: '100%',
                      marginTop: '16px',
                      borderRadius: '8px',
                      border: '1px solid #e0e0e0'
                    }}
                  />
                ) : (
                  <p style={{ color: '#999', fontSize: '0.9rem', marginTop: '16px' }}>
                    No proof of payment uploaded
                  </p>
                )}
              </div>

              <div style={styles.section}>
                <div style={styles.totalSection}>
                  <span style={styles.totalLabel}>Total Amount:</span>
                  <span style={styles.totalAmount}>{formatPrice(selectedOrder.total)}</span>
                </div>
              </div>
            </div>

            <div style={styles.modalFooter}>
              <button
                onClick={() => printReceipt(selectedOrder)}
                style={styles.printButton}
              >
                <FiPrinter size={16} />
                Print Receipt
              </button>
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
  modal: {
    background: '#fff',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '800px',
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
  printButton: {
    padding: '12px 32px',
    background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '0.95rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
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
  itemsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  itemCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
    background: '#f8fafc',
    border: '2px solid #e0f2fe',
    borderRadius: '8px',
  },
  itemDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  itemName: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#333',
  },
  itemMeta: {
    fontSize: '0.85rem',
    color: '#666',
  },
  itemTotal: {
    fontSize: '1.1rem',
    fontWeight: '700',
    color: '#1e3c72',
  },
  totalSection: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px',
    background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
    borderRadius: '8px',
    border: '2px solid #bae6fd',
  },
  totalLabel: {
    fontSize: '1.2rem',
    fontWeight: '600',
    color: '#1e3c72',
  },
  totalAmount: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#1e3c72',
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
  filterBar: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
    padding: '16px 24px',
    background: 'white',
    borderRadius: '12px',
    marginBottom: '20px',
    border: '2px solid #bae6fd',
    boxShadow: '0 4px 16px rgba(8, 47, 73, 0.08)',
    marginTop: '24px',
  }
};

export default OrderHistory;