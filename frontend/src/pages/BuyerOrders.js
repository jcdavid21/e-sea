// src/components/pages/BuyerOrders.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BuyerHeader from "./BuyerHeader";
import Swal from "sweetalert2";
import {
  FiPackage,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiTruck,
  FiSearch,
  FiChevronLeft,
  FiChevronRight,
  FiChevronsLeft,
  FiChevronsRight,
  FiPrinter,
  FiDownload,
  FiEye,
  FiCalendar,
  FiDollarSign,
  FiShoppingBag,
} from "react-icons/fi";
import "./BuyerOrders.css";

const STATUS_OPTIONS = ["All", "Pending", "Preparing", "Ready for Pickup", "Completed", "Cancelled"];

const STATUS_ICONS = {
  "Pending": <FiClock className="status-icon" />,
  "Preparing": <FiPackage className="status-icon" />,
  "Ready for Pickup": <FiTruck className="status-icon" />,
  "Completed": <FiCheckCircle className="status-icon" />,
  "Cancelled": <FiXCircle className="status-icon" />
};

const BuyerOrders = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    completed: 0,
    totalSpent: 0
  });

  const CUSTOMER_ID = sessionStorage.getItem("customer_id");
  const navigate = useNavigate();

  useEffect(() => {
    if (!CUSTOMER_ID) {
      navigate("/buyer/login");
      return;
    }
    fetchOrders();
  }, [CUSTOMER_ID, navigate]);

  useEffect(() => {
    filterOrdersData();
    setCurrentPage(1);
  }, [orders, searchQuery, filterStatus]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
        // UPDATED: Changed endpoint to match your backend
        const res = await fetch(
        `${process.env.REACT_APP_BUYER_API_URL}/api/buyer/get_orders?buyer_id=${CUSTOMER_ID}`
        );
        
        if (!res.ok) {
        throw new Error("Failed to fetch orders");
        }
        
        const data = await res.json();
        
        // Group items by order_id from order_items table
        const ordersMap = {};
        
        data.forEach(row => {
        // Create order object if it doesn't exist
        if (!ordersMap[row.order_id]) {
            ordersMap[row.order_id] = {
            orderId: row.order_id,
            orderNumber: row.order_number,
            orderDate: row.created_at,
            status: row.status,
            shopName: row.shop_name,
            sellerId: row.seller_id,
            customerName: row.customer_name,
            address: row.address,
            contact: row.contact,
            notes: row.notes,
            paymentMode: row.payment_mode,
            paid: row.paid,
            proofOfPayment: row.proof_of_payment, // Store receipt image
            deliveryLatitude: row.delivery_latitude,
            deliveryLongitude: row.delivery_longitude,
            distanceKm: row.distance_km,
            total: row.total,
            items: []
            };
        }
        
        // Add item to the order (only if item exists)
        if (row.item_id) {
            ordersMap[row.order_id].items.push({
            itemId: row.item_id,
            productId: row.product_id,
            productName: row.product_name || "Unknown Product",
            quantity: row.quantity,
            price: row.price,
            imageUrl: row.image_url,
            itemTotal: row.quantity * row.price
            });
        }
        });

        // Convert ordersMap to array
        const ordersArray = Object.values(ordersMap);
        
        setOrders(ordersArray);
        calculateStats(ordersArray);
    } catch (error) {
        console.error("Error fetching orders:", error);
        Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to load orders",
        });
    } finally {
        setLoading(false);
    }
    };

  const calculateStats = (ordersData) => {
    const total = ordersData.length;
    const pending = ordersData.filter(o => o.status === 'Pending' || o.status === 'Preparing').length;
    const completed = ordersData.filter(o => o.status === 'Completed').length;
    const totalSpent = ordersData.reduce((sum, o) => sum + o.total, 0);

    setStats({ total, pending, completed, totalSpent });
  };

  const filterOrdersData = () => {
    let filtered = [...orders];

    // Filter by status
    if (filterStatus !== "All") {
      filtered = filtered.filter(order => order.status === filterStatus);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const search = searchQuery.toLowerCase();
      filtered = filtered.filter(order => {
        const orderNumber = order.orderNumber?.toLowerCase() || "";
        const shopName = order.shopName?.toLowerCase() || "";
        const orderId = order.orderId?.toString().toLowerCase() || "";
        return orderNumber.includes(search) || shopName.includes(search) || orderId.includes(search);
      });
    }

    setFilteredOrders(filtered);
  };

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setShowModal(true);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Print Functions
  const printOrder = (order) => {
    const printWindow = window.open('', '', 'height=800,width=600');
    
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Order #${order.orderNumber}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
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
          .section {
            margin: 15px 0;
            border-bottom: 1px dashed #000;
            padding-bottom: 15px;
          }
          .section:last-child { border-bottom: none; }
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
          .items-table {
            width: 100%;
            margin: 10px 0;
          }
          .items-table th {
            text-align: left;
            border-bottom: 2px solid #000;
            padding: 8px 0;
            font-size: 12px;
          }
          .items-table td {
            padding: 8px 0;
            font-size: 13px;
          }
          .total-row {
            font-weight: bold;
            font-size: 16px;
            margin-top: 10px;
            padding-top: 10px;
            border-top: 2px solid #000;
          }
          .footer {
            text-align: center;
            margin-top: 20px;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <h1>${order.shopName || 'E-SEA'}</h1>
            <p>Order Receipt</p>
          </div>
          
          <div class="section">
            <div class="section-title">Order Information</div>
            <div class="info-row">
              <span>Order Number:</span>
              <span><strong>#${order.orderNumber}</strong></span>
            </div>
            <div class="info-row">
              <span>Date:</span>
              <span>${new Date(order.orderDate).toLocaleString()}</span>
            </div>
            <div class="info-row">
              <span>Status:</span>
              <span><strong>${order.status}</strong></span>
            </div>
          </div>
          
          <div class="section">
            <div class="section-title">Customer Information</div>
            <div class="info-row">
              <span>Name:</span>
              <span>${order.customerName || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span>Contact:</span>
              <span>${order.contact || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span>Address:</span>
              <span>${order.address || 'N/A'}</span>
            </div>
          </div>
          
          <div class="section">
            <div class="section-title">Order Items</div>
            <table class="items-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${order.items.map(item => `
                  <tr>
                    <td>${item.productName}</td>
                    <td>${item.quantity} kg</td>
                    <td>₱${Number(item.price).toFixed(2)}</td>
                    <td>₱${Number(item.itemTotal).toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          
          <div class="section">
            <div class="section-title">Payment Details</div>
            <div class="info-row">
              <span>Payment Mode:</span>
              <span>${order.paymentMode || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span>Payment Status:</span>
              <span>${order.paid ? 'PAID' : 'UNPAID'}</span>
            </div>
            ${order.notes ? `
            <div class="info-row">
              <span>Notes:</span>
              <span>${order.notes}</span>
            </div>
            ` : ''}
          </div>
          
          <div class="total-row">
            <div class="info-row">
              <span>TOTAL AMOUNT:</span>
              <span>₱${Number(order.total).toFixed(2)}</span>
            </div>
          </div>
          
          <div class="footer">
            <p>Thank you for your order!</p>
            <p>E-SEA - Fresh Seafood Delivery</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  // Pagination
  const indexOfLastOrder = currentPage * itemsPerPage;
  const indexOfFirstOrder = indexOfLastOrder - itemsPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

  

  if (loading) {
    return (
      <div className="buyer-orders">
        <BuyerHeader />
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="buyer-orders">
      <BuyerHeader />
      <div className="orders-container">
        {/* Header */}
        <div className="orders-header">
          <div>
            <h1>My Orders</h1>
            <p className="header-subtitle">Track and manage your seafood orders</p>
          </div>
          <div className="header-actions">
            <button className="action-btn export-btn">
              <FiDownload size={18} />
              Export
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
              <FiShoppingBag size={28} />
            </div>
            <div className="stat-info">
              <div className="stat-value">{stats.total}</div>
              <div className="stat-label">Total Orders</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
              <FiClock size={28} />
            </div>
            <div className="stat-info">
              <div className="stat-value">{stats.pending}</div>
              <div className="stat-label">Pending Orders</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
              <FiCheckCircle size={28} />
            </div>
            <div className="stat-info">
              <div className="stat-value">{stats.completed}</div>
              <div className="stat-label">Completed</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>
              <FiDollarSign size={28} />
            </div>
            <div className="stat-info">
              <div className="stat-value">₱{stats.totalSpent.toFixed(2)}</div>
              <div className="stat-label">Total Spent</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="filters-section">
          <div className="search-container">
            <FiSearch className="search-icon" size={20} />
            <input
              type="text"
              className="search-input"
              placeholder="Search by order number, shop name, or order ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="status-filters">
            {STATUS_OPTIONS.map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`filter-btn ${filterStatus === status ? "active" : ""}`}
              >
                {status !== "All" && STATUS_ICONS[status]}
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Orders List */}
        {currentOrders.length === 0 ? (
          <div className="empty-state">
            <FiPackage className="empty-icon" />
            <h3>No orders found</h3>
            <p>You haven't placed any orders yet or no orders match your filters.</p>
            <button className="shop-now-btn" onClick={() => navigate('/buyer/shop')}>
              Start Shopping
            </button>
          </div>
        ) : (
          <>
            {/* Orders List */}
            <div className="orders-list">
              {currentOrders.map((order) => (
                <div key={order.orderId} className="order-card">
                  <div className="order-header">
                    <div className="order-info-group">
                      <div className="order-number">
                        <FiShoppingBag size={18} />
                        <span>#{order.orderNumber}</span>
                      </div>
                      <div className="order-meta">
                        <div className="meta-item">
                          <FiCalendar size={14} />
                          <span>{new Date(order.orderDate).toLocaleString()}</span>
                        </div>
                        <div className="meta-item">
                          <span className="shop-name">{order.shopName}</span>
                        </div>
                      </div>
                    </div>
                    <div className="order-status-group">
                      <div className={`status-badge status-${order.status.toLowerCase().replace(/\s+/g, '-')}`}>
                        {STATUS_ICONS[order.status]}
                        <span>{order.status}</span>
                      </div>
                    </div>
                  </div>

                  <div className="order-body">
                    <div className="order-items">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="order-item">
                          <img
                            src={
                              item.imageUrl
                                ? `${item.imageUrl.startsWith('http://') || item.imageUrl.startsWith('https://') ? item.imageUrl : ''}`
                                : "https://via.placeholder.com/60?text=No+Image"
                            }
                            alt={item.productName}
                            className="item-image"
                          />
                          <div className="item-details">
                            <div className="item-name">{item.productName}</div>
                            <div className="item-qty">Qty: {item.quantity} kg × ₱{Number(item.price).toFixed(2)}</div>
                          </div>
                          <div className="item-price">₱{Number(item.itemTotal).toFixed(2)}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="order-footer">
                    <div className="order-total">
                      <span>Total:</span>
                      <strong>₱{Number(order.total).toFixed(2)}</strong>
                    </div>
                    <div className="order-actions">
                      <button
                        className="action-btn-small view-btn"
                        onClick={() => handleViewOrder(order)}
                      >
                        <FiEye size={16} />
                        View Details
                      </button>
                      <button
                        className="action-btn-small print-btn"
                        onClick={() => printOrder(order)}
                      >
                        <FiPrinter size={16} />
                        Print
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination">
                <button
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1}
                  className="pagination-btn"
                >
                  <FiChevronsLeft size={18} />
                </button>
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="pagination-btn"
                >
                  <FiChevronLeft size={18} />
                </button>
                <span className="pagination-info">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="pagination-btn"
                >
                  <FiChevronRight size={18} />
                </button>
                <button
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage === totalPages}
                  className="pagination-btn"
                >
                  <FiChevronsRight size={18} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Order Detail Modal */}
      {showModal && selectedOrder && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Order Details</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-section">
                <h3>Order Information</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Order Number:</span>
                    <span className="detail-value">#{selectedOrder.orderNumber}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Date:</span>
                    <span className="detail-value">
                      {new Date(selectedOrder.orderDate).toLocaleString()}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Shop:</span>
                    <span className="detail-value">{selectedOrder.shopName}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Status:</span>
                    <span className={`status-badge status-${selectedOrder.status.toLowerCase().replace(/\s+/g, '-')}`}>
                      {selectedOrder.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h3>Customer Information</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Name:</span>
                    <span className="detail-value">{selectedOrder.customerName || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Contact:</span>
                    <span className="detail-value">{selectedOrder.contact || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Address:</span>
                    <span className="detail-value">{selectedOrder.address || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Payment Mode:</span>
                    <span className="detail-value">{selectedOrder.paymentMode || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h3>Order Items</h3>
                <div className="modal-items-list">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="modal-item">
                      <img
                        src={
                          item.imageUrl
                            ? `${item.imageUrl.startsWith('http://') || item.imageUrl.startsWith('https://') ? item.imageUrl : ''}`
                            : "https://via.placeholder.com/80?text=No+Image"
                        }
                        alt={item.productName}
                        className="modal-item-image"
                      />
                      <div className="modal-item-info">
                        <div className="modal-item-name">{item.productName}</div>
                        <div className="modal-item-meta">
                          <span>Quantity: {item.quantity} kg</span>
                          <span>Price: ₱{Number(item.price).toFixed(2)}/kg</span>
                        </div>
                      </div>
                      <div className="modal-item-total">
                        ₱{Number(item.itemTotal).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ADDED: Payment Receipt Image Section */}
              {selectedOrder.proofOfPayment && (
                <div className="detail-section">
                  <h3>Payment Receipt</h3>
                  <div style={{ textAlign: 'center', padding: '10px' }}>
                    <img
                      src={selectedOrder.proofOfPayment}
                      alt="Payment Receipt"
                      style={{
                        maxWidth: '100%',
                        maxHeight: '400px',
                        borderRadius: '8px',
                        border: '2px solid #e0e0e0',
                        cursor: 'pointer'
                      }}
                      onClick={() => window.open(selectedOrder.proofOfPayment, '_blank')}
                    />
                    <p style={{ marginTop: '10px', fontSize: '0.9rem', color: '#666' }}>
                      Click image to view full size
                    </p>
                  </div>
                </div>
              )}

              <div className="detail-section">
                <div className="modal-total">
                  <span>Total Amount:</span>
                  <strong>₱{Number(selectedOrder.total).toFixed(2)}</strong>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="modal-btn print-btn" onClick={() => printOrder(selectedOrder)}>
                <FiPrinter size={16} />
                Print Receipt
              </button>
              <button className="modal-btn close-modal-btn" onClick={() => setShowModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BuyerOrders;