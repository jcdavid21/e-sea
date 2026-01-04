import React, { useEffect, useState } from "react";
import axios from "axios";
import { FiEye, FiDownload, FiAlertCircle, FiDollarSign, FiShoppingCart, FiTrendingUp, FiFilter, FiChevronLeft, FiChevronRight, FiChevronsLeft, FiChevronsRight } from "react-icons/fi";
import Swal from "sweetalert2";
import ViewReportModal from "./ViewReportModal";
import "./Reports.css";

const Reports = () => {
  const [notifications, setNotifications] = useState([]);
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [salesData, setSalesData] = useState([]);
  const [analytics, setAnalytics] = useState({
    totalSales: 0,
    completedOrders: 0,
    averageOrderValue: 0,
    totalRevenue: 0
  });
  const [selectedReport, setSelectedReport] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const handleKeyPress = (e) => {
      // Ctrl+P for print
      if (e.ctrlKey && e.key === 'p') {
        e.preventDefault();
        Swal.fire({
          title: 'Select Report to Print',
          text: 'Which report would you like to print?',
          icon: 'question',
          showDenyButton: true,
          showCancelButton: true,
          confirmButtonText: 'Sales Report',
          denyButtonText: 'Notifications Report',
          confirmButtonColor: '#1e3c72',
          denyButtonColor: '#4a6fa5',
          cancelButtonColor: '#6c757d',
        }).then((result) => {
          if (result.isConfirmed) {
            printReport('sales');
          } else if (result.isDenied) {
            printReport('notifications');
          }
        });
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [filteredNotifications, salesData, analytics]);

  useEffect(() => {
    applyFilters();
  }, [typeFilter, dateRange, notifications]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch notifications from users and sellers
      const [userRes, sellerRes, ordersRes] = await Promise.all([
        axios.get(`${process.env.REACT_APP_ADMIN_API_URL}/api/users/notifications`),
        axios.get(`${process.env.REACT_APP_ADMIN_API_URL}/api/sellers/notifications`),
        axios.get(`${process.env.REACT_APP_ADMIN_API_URL}/api/orders/completed`)
      ]);

      const userNotifications = userRes.data.map(n => ({ ...n, source: "user" }));
      const sellerNotifications = sellerRes.data.map(n => ({ ...n, source: "seller" }));

      const allNotifications = [...userNotifications, ...sellerNotifications].sort(
        (a, b) => new Date(b.date_created) - new Date(a.date_created)
      );

      setNotifications(allNotifications);
      setSalesData(ordersRes.data);

      calculateAnalytics(ordersRes.data);
    } catch (err) {
      console.error("Error fetching data:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to fetch reports data",
        confirmButtonColor: "#1e3c72",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateAnalytics = (orders) => {
    const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0);
    const completedOrders = orders.length;
    const averageOrderValue = completedOrders > 0 ? totalRevenue / completedOrders : 0;

    setAnalytics({
      totalSales: completedOrders,
      completedOrders,
      averageOrderValue,
      totalRevenue
    });
  };

  const applyFilters = () => {
    let filtered = [...notifications];

    if (typeFilter !== "all") {
      filtered = filtered.filter(n => n.source === typeFilter);
    }

    if (dateRange.start && dateRange.end) {
      filtered = filtered.filter(n => {
        const date = new Date(n.date_created);
        return date >= new Date(dateRange.start) && date <= new Date(dateRange.end);
      });
    }

    setFilteredNotifications(filtered);
    setCurrentPage(1);
  };

  const handleViewReport = (report) => {
    setSelectedReport(report);
    setShowModal(true);
  };

  const downloadCSV = async (type) => {
    // Show confirmation dialog first
    const result = await Swal.fire({
      title: 'Download Report?',
      text: `Do you want to download the ${type === 'notifications' ? 'Notifications' : 'Sales'} report as CSV?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#1e3c72',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, Download',
      cancelButtonText: 'Cancel'
    });

    // If user cancels, stop here
    if (!result.isConfirmed) {
      return;
    }

    let csvData = [];
    let filename = "";

    if (type === "notifications") {
      // Add headers
      csvData.push(['ID', 'Source', 'Type', 'Message', 'Date Created', 'Status']);

      // Add data rows
      filteredNotifications.forEach(n => {
        const statusText = n.status === 1 || n.status === 'read' ? 'Read' : 'Unread';
        csvData.push([
          n.id,
          n.source,
          n.type || 'General',
          n.message,
          new Date(n.date_created).toLocaleString(),
          statusText
        ]);
      });

      filename = `notifications_report_${new Date().toISOString().split('T')[0]}.csv`;
    } else if (type === "sales") {
      // Add headers
      csvData.push(['Order ID', 'Customer Name', 'Total Amount', 'Payment Method', 'Date Completed', 'Status']);

      // Add data rows
      salesData.forEach(s => {
        csvData.push([
          s.order_id,
          s.customer_name,
          `PHP ${parseFloat(s.total_amount || 0).toFixed(2)}`,
          s.payment_method,
          new Date(s.date_completed).toLocaleString(),
          s.status
        ]);
      });

      filename = `sales_report_${new Date().toISOString().split('T')[0]}.csv`;
    }

    // Convert array to CSV string
    const csvContent = csvData.map(row =>
      row.map(cell => {
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        const cellStr = String(cell || '');
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      }).join(',')
    ).join('\n');

    // Create blob and download
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

  const printReport = async (type) => {
    const result = await Swal.fire({
      title: 'Print Report?',
      text: `Do you want to print the ${type === 'notifications' ? 'Notifications' : 'Sales'} report?`,
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
    
    if (type === 'notifications') {
      const notificationsHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Notifications Report - ${new Date().toLocaleDateString()}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; }
            h1 { color: #1e3c72; margin-bottom: 10px; }
            .date { color: #666; margin-bottom: 30px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background: #1e3c72; color: white; padding: 12px; text-align: left; }
            td { padding: 10px; border-bottom: 1px solid #ddd; }
            tr:hover { background: #f5f5f5; }
            .source-badge { padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
            .source-badge.user { background: #dbeafe; color: #1e40af; }
            .source-badge.seller { background: #fef3c7; color: #92400e; }
            @media print {
              body { padding: 20px; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <h1>Notifications Report</h1>
          <div class="date">Generated on: ${new Date().toLocaleString()}</div>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Source</th>
                <th>Type</th>
                <th>Message</th>
                <th>Date Created</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${filteredNotifications.map(n => `
                <tr>
                  <td>${n.id}</td>
                  <td><span class="source-badge ${n.source}">${n.source}</span></td>
                  <td>${n.type || 'General'}</td>
                  <td>${n.message}</td>
                  <td>${new Date(n.date_created).toLocaleString()}</td>
                  <td>${n.status === 1 || n.status === 'read' ? 'Read' : 'Unread'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
        </html>
      `;
      printWindow.document.write(notificationsHTML);
    } else if (type === 'sales') {
      const salesHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Sales Report - ${new Date().toLocaleDateString()}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; }
            h1 { color: #1e3c72; margin-bottom: 10px; }
            .date { color: #666; margin-bottom: 20px; }
            .summary { background: #f0f9ff; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
            .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
            .summary-item { text-align: center; }
            .summary-label { color: #666; font-size: 14px; margin-bottom: 5px; }
            .summary-value { color: #1e3c72; font-size: 24px; font-weight: bold; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background: #1e3c72; color: white; padding: 12px; text-align: left; }
            td { padding: 10px; border-bottom: 1px solid #ddd; }
            tr:hover { background: #f5f5f5; }
            @media print {
              body { padding: 20px; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <h1>Sales Report</h1>
          <div class="date">Generated on: ${new Date().toLocaleString()}</div>
          
          <div class="summary">
            <div class="summary-grid">
              <div class="summary-item">
                <div class="summary-label">Total Orders</div>
                <div class="summary-value">${analytics.completedOrders}</div>
              </div>
              <div class="summary-item">
                <div class="summary-label">Total Revenue</div>
                <div class="summary-value">₱${analytics.totalRevenue.toFixed(2)}</div>
              </div>
              <div class="summary-item">
                <div class="summary-label">Average Order Value</div>
                <div class="summary-value">₱${analytics.averageOrderValue.toFixed(2)}</div>
              </div>
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer Name</th>
                <th>Total Amount</th>
                <th>Payment Method</th>
                <th>Date Completed</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${salesData.map(s => `
                <tr>
                  <td>${s.order_id}</td>
                  <td>${s.customer_name}</td>
                  <td>PHP ${parseFloat(s.total_amount || 0).toFixed(2)}</td>
                  <td>${s.payment_method}</td>
                  <td>${new Date(s.date_completed).toLocaleString()}</td>
                  <td>${s.status}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
        </html>
      `;
      printWindow.document.write(salesHTML);
    }
    
    printWindow.document.close();
    
    // Wait for content to load then print automatically
    printWindow.onload = function() {
      printWindow.focus();
      printWindow.print();
    };
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentNotifications = filteredNotifications.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <div className="reports-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="reports-container">
      {/* Header */}
      <div className="header-bar">
        <div>
          <h2>Reports & Analytics</h2>
          <p className="header-subtitle">
            Comprehensive view of notifications and sales data • {filteredNotifications.length} notification{filteredNotifications.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="analytics-grid">
        <div className="analytics-card">
          <div className="analytics-icon" style={{ background: 'linear-gradient(135deg, #4a6fa5 0%, #2c4875 100%)' }}>
            <FiShoppingCart size={28} />
          </div>
          <div className="analytics-content">
            <p className="analytics-label">Total Orders</p>
            <h3 className="analytics-value">{analytics.completedOrders}</h3>
          </div>
        </div>

        <div className="analytics-card">
          <div className="analytics-icon" style={{ background: 'linear-gradient(135deg, #5a7ca0 0%, #3d5a80 100%)' }}>
            <FiDollarSign size={28} />
          </div>
          <div className="analytics-content">
            <p className="analytics-label">Total Revenue</p>
            <h3 className="analytics-value">₱{analytics.totalRevenue.toFixed(2)}</h3>
          </div>
        </div>

        <div className="analytics-card">
          <div className="analytics-icon" style={{ background: 'linear-gradient(135deg, #6b8caf 0%, #4a6fa5 100%)' }}>
            <FiTrendingUp size={28} />
          </div>
          <div className="analytics-content">
            <p className="analytics-label">Average Order Value</p>
            <h3 className="analytics-value">₱{analytics.averageOrderValue.toFixed(2)}</h3>
          </div>
        </div>

        <div className="analytics-card">
          <div className="analytics-icon" style={{ background: 'linear-gradient(135deg, #7c9cbd 0%, #5a7ca0 100%)' }}>
            <FiAlertCircle size={28} />
          </div>
          <div className="analytics-content">
            <p className="analytics-label">Total Notifications</p>
            <h3 className="analytics-value">{notifications.length}</h3>
          </div>
        </div>
      </div>

      {/* Download and Print Section */}
      <div className="download-section">
        <div className="action-dropdown-group">
          <label htmlFor="report-action">Generate Report:</label>
          <select 
            id="report-action"
            className="action-select"
            onChange={(e) => {
              const [action, type] = e.target.value.split('-');
              if (action && type) {
                if (action === 'download') {
                  downloadCSV(type);
                } else if (action === 'print') {
                  printReport(type);
                }
              }
              e.target.value = ''; // Reset selection
            }}
            defaultValue=""
          >
            <option value="" disabled>Select an action...</option>
            <optgroup label="Download CSV">
              <option value="download-sales">Sales Report</option>
              <option value="download-notifications">Notifications Report</option>
            </optgroup>
            <optgroup label="Print Report">
              <option value="print-sales">Sales Report</option>
              <option value="print-notifications">Notifications Report</option>
            </optgroup>
          </select>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <FiFilter size={18} />
        <span>Filter by Source:</span>
        <div className="filter-buttons">
          <button
            className={typeFilter === "all" ? "active" : ""}
            onClick={() => setTypeFilter("all")}
          >
            All ({notifications.length})
          </button>
          <button
            className={typeFilter === "user" ? "active" : ""}
            onClick={() => setTypeFilter("user")}
          >
            Users ({notifications.filter(n => n.source === "user").length})
          </button>
          <button
            className={typeFilter === "seller" ? "active" : ""}
            onClick={() => setTypeFilter("seller")}
          >
            Sellers ({notifications.filter(n => n.source === "seller").length})
          </button>
        </div>

        <div className="date-filter">
          <span>Date Range:</span>
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            className="date-input"
          />
          <span>to</span>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            className="date-input"
          />
          {(dateRange.start || dateRange.end) && (
            <button
              className="clear-filter-btn"
              onClick={() => setDateRange({ start: "", end: "" })}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Notifications Table */}
      <div className="table-card">
        <table className="reports-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Source</th>
              <th>Type</th>
              <th>Message</th>
              <th>Date Created</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {currentNotifications.length > 0 ? (
              currentNotifications.map((notification) => (
                <tr key={`${notification.source}-${notification.id}`}>
                  <td>{notification.id}</td>
                  <td>
                    <span className={`source-badge ${notification.source}`}>
                      {notification.source}
                    </span>
                  </td>
                  <td>{notification.type || 'General'}</td>
                  <td className="message-cell">{notification.message}</td>
                  <td>{new Date(notification.date_created).toLocaleString()}</td>
                  <td>
                    <span className={`status-badge ${notification.status || 'unread'}`}>
                      {notification.status || 'Unread'}
                    </span>
                  </td>
                  <td>
                    <button
                      className="view-btn"
                      onClick={() => handleViewReport(notification)}
                    >
                      <FiEye size={16} />
                      View
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="no-data">
                  No notifications found
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {filteredNotifications.length > itemsPerPage && (
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

      {showModal && selectedReport && (
        <ViewReportModal
          report={selectedReport}
          onClose={() => {
            setShowModal(false);
            setSelectedReport(null);
          }}
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

export default Reports;