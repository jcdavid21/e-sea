import React, { useState, useEffect } from 'react';
import { 
  FiDownload, 
  FiCalendar, 
  FiTrendingUp, 
  FiDollarSign, 
  FiShoppingCart,
  FiPackage,
  FiBarChart2,
  FiFilter,
  FiChevronLeft,
  FiChevronRight,
  FiChevronsLeft,
  FiChevronsRight
} from 'react-icons/fi';
import Swal from 'sweetalert2';

function Reports() {
  const [reportType, setReportType] = useState('all');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedWeek, setSelectedWeek] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [summary, setSummary] = useState({
    totalSales: 0,
    totalOrders: 0,
    totalProducts: 0,
    averageOrderValue: 0
  });

  const seller_id = localStorage.getItem("seller_unique_id");

  useEffect(() => {
    // Set default week to current week
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const day = today.getDate();
    
    // Calculate ISO week number
    const tempDate = new Date(year, month, day);
    tempDate.setHours(0, 0, 0, 0);
    tempDate.setDate(tempDate.getDate() + 3 - (tempDate.getDay() + 6) % 7);
    const week1 = new Date(tempDate.getFullYear(), 0, 4);
    const weekNumber = 1 + Math.round(((tempDate.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
    
    setSelectedWeek(`${year}-W${String(weekNumber).padStart(2, '0')}`);
  }, []);

  useEffect(() => {
    if (seller_id) {
      fetchReportData();
    }
  }, [reportType, selectedDate, selectedWeek, selectedMonth, seller_id]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [reportType, selectedDate, selectedWeek, selectedMonth]);

  // Pagination calculations
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = reportData ? reportData.slice(indexOfFirstItem, indexOfLastItem) : [];
  const totalPages = reportData ? Math.ceil(reportData.length / itemsPerPage) : 0;

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const fetchReportData = async () => {
    setLoading(true);
    try {
      // Fetch all orders for the seller
      const res = await fetch(
        `${process.env.REACT_APP_SELLER_API_URL}/api/orders?seller_id=${encodeURIComponent(seller_id)}&limit=10000`
      );
      const data = await res.json();
      
      // Extract orders array and filter only completed orders (like SellerHome)
      const allOrders = (data.orders || []).filter(order => order.status === 'Completed');
      
      // Filter orders based on report type and date
      let filteredOrders = [];
      
      if (reportType === 'all') {
        // Show all completed orders
        filteredOrders = allOrders;
      } else if (reportType === 'daily') {
        filteredOrders = allOrders.filter(order => {
          const orderDate = new Date(order.orderDate).toISOString().split('T')[0];
          return orderDate === selectedDate;
        });
      } else if (reportType === 'weekly') {
        // Parse week format: YYYY-Www
        if (selectedWeek) {
          const [year, week] = selectedWeek.split('-W');
          const weekStart = getDateOfISOWeek(parseInt(week), parseInt(year));
          const weekEnd = getWeekEndDate(weekStart);
          
          filteredOrders = allOrders.filter(order => {
            const orderDate = new Date(order.orderDate);
            return orderDate >= weekStart && orderDate <= weekEnd;
          });
        }
      } else if (reportType === 'monthly') {
        // Parse month format: YYYY-MM
        const [year, month] = selectedMonth.split('-');
        filteredOrders = allOrders.filter(order => {
          const orderDate = new Date(order.orderDate);
          return orderDate.getFullYear() === parseInt(year) && 
                 (orderDate.getMonth() + 1) === parseInt(month);
        });
      }
      
      // Process orders to create report data
      const reportItems = [];
      filteredOrders.forEach(order => {
        if (order.items && Array.isArray(order.items)) {
          order.items.forEach(item => {
            reportItems.push({
              id: order.orderId,
              order_date: order.orderDate,
              customer_name: order.customerName,
              product_name: item.productName,
              quantity: item.quantity,
              price: item.price,
              item_total: (item.quantity * parseFloat(item.price)).toFixed(2),
              status: order.status
            });
          });
        }
      });
      
      setReportData(reportItems);
      calculateSummary(reportItems);
    } catch (err) {
      console.error('Failed to fetch report:', err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load report data',
        confirmButtonColor: '#1e3c72'
      });
      setReportData([]);
      calculateSummary([]);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get the date of ISO week
  const getDateOfISOWeek = (week, year) => {
    const simple = new Date(year, 0, 1 + (week - 1) * 7);
    const dow = simple.getDay();
    const ISOweekStart = simple;
    if (dow <= 4) {
      ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
    } else {
      ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
    }
    return ISOweekStart;
  };

  const getWeekEndDate = (weekStart) => {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    return weekEnd;
  };

  const generateMockData = (type) => {
    // This function is no longer used since we're fetching real data
    // Kept for reference only
    return [];
  };

  const calculateSummary = (data) => {
    if (!data || data.length === 0) {
      setSummary({
        totalSales: 0,
        totalOrders: 0,
        totalProducts: 0,
        averageOrderValue: 0
      });
      return;
    }

    const totalSales = data.reduce((sum, item) => sum + parseFloat(item.item_total || 0), 0);
    const totalOrders = data.length;
    const totalProducts = data.reduce((sum, item) => sum + parseInt(item.quantity || 0), 0);
    const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

    setSummary({
      totalSales,
      totalOrders,
      totalProducts,
      averageOrderValue
    });
  };

  const downloadCSV = () => {
    if (!reportData || reportData.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No Data',
        text: 'No data available to download',
        confirmButtonColor: '#1e3c72'
      });
      return;
    }

    const headers = ['Order Number', 'Date', 'Customer', 'Product', 'Quantity (kg)', 'Price (₱/kg)', 'Total (₱)', 'Status'];
    const csvContent = [
      headers.join(','),
      ...reportData.map(row => [
        `#${row.id}`,
        new Date(row.order_date).toLocaleDateString(),
        `"${row.customer_name}"`,
        `"${row.product_name}"`,
        row.quantity,
        row.price,
        row.item_total,
        row.status
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    const fileName = `sales_report_${reportType}_${
      reportType === 'daily' ? selectedDate : 
      reportType === 'weekly' ? selectedWeek : 
      selectedMonth
    }.csv`;

    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    Swal.fire({
      icon: 'success',
      title: 'Downloaded',
      text: 'Report downloaded successfully',
      confirmButtonColor: '#1e3c72',
      timer: 2000,
      timerProgressBar: true
    });
  };

  const getReportTitle = () => {
    if (reportType === 'all') return 'All Sales Report';
    if (reportType === 'daily') return `Daily Sales Report - ${selectedDate}`;
    if (reportType === 'weekly') return `Weekly Sales Report - ${selectedWeek}`;
    if (reportType === 'monthly') return `Monthly Sales Report - ${selectedMonth}`;
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>
          <div style={styles.spinner}></div>
          <p>Loading report...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Sales Reports</h2>
          <p style={styles.subtitle}>Track and analyze your sales performance</p>
        </div>
        <button
          onClick={downloadCSV}
          style={styles.downloadButton}
          onMouseEnter={(e) => e.target.style.background = '#218838'}
          onMouseLeave={(e) => e.target.style.background = '#28a745'}
        >
          <FiDownload size={18} />
          Download CSV
        </button>
      </div>

      {/* Report Type Selector */}
      <div style={styles.filterSection}>
        <div style={styles.reportTypeButtons}>
          <button
            style={{
              ...styles.reportTypeBtn,
              ...(reportType === 'all' ? styles.reportTypeBtnActive : {})
            }}
            onClick={() => setReportType('all')}
            onMouseEnter={(e) => {
              if (reportType !== 'all') {
                e.target.style.borderColor = '#1e3c72';
                e.target.style.color = '#1e3c72';
                e.target.style.transform = 'translateY(-2px)';
              }
            }}
            onMouseLeave={(e) => {
              if (reportType !== 'all') {
                e.target.style.borderColor = '#dee2e6';
                e.target.style.color = '#495057';
                e.target.style.transform = 'translateY(0)';
              }
            }}
          >
            <FiTrendingUp size={18} />
            All Sales
          </button>
          <button
            style={{
              ...styles.reportTypeBtn,
              ...(reportType === 'daily' ? styles.reportTypeBtnActive : {})
            }}
            onClick={() => setReportType('daily')}
            onMouseEnter={(e) => {
              if (reportType !== 'daily') {
                e.target.style.borderColor = '#1e3c72';
                e.target.style.color = '#1e3c72';
                e.target.style.transform = 'translateY(-2px)';
              }
            }}
            onMouseLeave={(e) => {
              if (reportType !== 'daily') {
                e.target.style.borderColor = '#dee2e6';
                e.target.style.color = '#495057';
                e.target.style.transform = 'translateY(0)';
              }
            }}
          >
            <FiCalendar size={18} />
            Daily
          </button>
          <button
            style={{
              ...styles.reportTypeBtn,
              ...(reportType === 'weekly' ? styles.reportTypeBtnActive : {})
            }}
            onClick={() => setReportType('weekly')}
            onMouseEnter={(e) => {
              if (reportType !== 'weekly') {
                e.target.style.borderColor = '#1e3c72';
                e.target.style.color = '#1e3c72';
                e.target.style.transform = 'translateY(-2px)';
              }
            }}
            onMouseLeave={(e) => {
              if (reportType !== 'weekly') {
                e.target.style.borderColor = '#dee2e6';
                e.target.style.color = '#495057';
                e.target.style.transform = 'translateY(0)';
              }
            }}
          >
            <FiBarChart2 size={18} />
            Weekly
          </button>
          <button
            style={{
              ...styles.reportTypeBtn,
              ...(reportType === 'monthly' ? styles.reportTypeBtnActive : {})
            }}
            onClick={() => setReportType('monthly')}
            onMouseEnter={(e) => {
              if (reportType !== 'monthly') {
                e.target.style.borderColor = '#1e3c72';
                e.target.style.color = '#1e3c72';
                e.target.style.transform = 'translateY(-2px)';
              }
            }}
            onMouseLeave={(e) => {
              if (reportType !== 'monthly') {
                e.target.style.borderColor = '#dee2e6';
                e.target.style.color = '#495057';
                e.target.style.transform = 'translateY(0)';
              }
            }}
          >
            <FiTrendingUp size={18} />
            Monthly
          </button>
        </div>

        <div style={styles.dateSelector}>
          {reportType === 'daily' && (
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={styles.dateInput}
              max={new Date().toISOString().split('T')[0]}
            />
          )}
          {reportType === 'weekly' && (
            <input
              type="week"
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(e.target.value)}
              style={styles.dateInput}
              max={new Date().toISOString().slice(0, 10)}
            />
          )}
          {reportType === 'monthly' && (
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={styles.dateInput}
              max={new Date().toISOString().slice(0, 7)}
            />
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div style={styles.summaryGrid}>
        <div style={styles.summaryCard}>
          <div style={{ ...styles.summaryIcon, background: '#e7f1ff' }}>
            <FiDollarSign size={24} color="#2a5298" />
          </div>
          <div>
            <div style={styles.summaryLabel}>Total Sales</div>
            <div style={styles.summaryValue}>₱{summary.totalSales.toFixed(2)}</div>
          </div>
        </div>

        <div style={styles.summaryCard}>
          <div style={{ ...styles.summaryIcon, background: '#fff8e1' }}>
            <FiShoppingCart size={24} color="#ffc107" />
          </div>
          <div>
            <div style={styles.summaryLabel}>Total Orders</div>
            <div style={{ ...styles.summaryValue, color: '#ffc107' }}>{summary.totalOrders}</div>
          </div>
        </div>

        <div style={styles.summaryCard}>
          <div style={{ ...styles.summaryIcon, background: '#e6f9ed' }}>
            <FiPackage size={24} color="#28a745" />
          </div>
          <div>
            <div style={styles.summaryLabel}>Products Sold</div>
            <div style={{ ...styles.summaryValue, color: '#28a745' }}>{summary.totalProducts} kg</div>
          </div>
        </div>

        <div style={styles.summaryCard}>
          <div style={{ ...styles.summaryIcon, background: '#fdecea' }}>
            <FiTrendingUp size={24} color="#dc3545" />
          </div>
          <div>
            <div style={styles.summaryLabel}>Avg Order Value</div>
            <div style={{ ...styles.summaryValue, color: '#dc3545' }}>₱{summary.averageOrderValue.toFixed(2)}</div>
          </div>
        </div>
      </div>

      {/* Report Title */}
      <div style={styles.reportTitleSection}>
        <h3 style={styles.reportTitle}>
          <FiFilter size={20} />
          {getReportTitle()}
        </h3>
      </div>

      {/* Data Table */}
      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Order #</th>
              <th style={styles.th}>Date</th>
              <th style={styles.th}>Customer</th>
              <th style={styles.th}>Product</th>
              <th style={styles.th}>Quantity (kg)</th>
              <th style={styles.th}>Price (₱/kg)</th>
              <th style={styles.th}>Total (₱)</th>
            </tr>
          </thead>
          <tbody>
            {!reportData || reportData.length === 0 ? (
              <tr>
                <td colSpan="7" style={styles.noData}>
                  <FiBarChart2 size={48} color="#ccc" />
                  <p>No completed sales data available for the selected period</p>
                </td>
              </tr>
            ) : (
              currentItems.map((row) => (
                <tr key={row.id} style={styles.tr}>
                  <td style={styles.td}>
                    <span style={styles.orderNumber}>#{row.id}</span>
                  </td>
                  <td style={styles.td}>{new Date(row.order_date).toLocaleDateString()}</td>
                  <td style={styles.td}>{row.customer_name}</td>
                  <td style={styles.td}>
                    <span style={styles.productName}>{row.product_name}</span>
                  </td>
                  <td style={{ ...styles.td, fontWeight: '600' }}>{row.quantity}</td>
                  <td style={styles.td}>₱{parseFloat(row.price).toFixed(2)}</td>
                  <td style={{ ...styles.td, fontWeight: '700', color: '#28a745' }}>
                    ₱{parseFloat(row.item_total).toFixed(2)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {reportData && reportData.length > itemsPerPage && (
          <div style={styles.paginationContainer}>
            <div style={styles.paginationWrapper}>
              <button
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
                style={{ ...styles.paginationBtn, ...(currentPage === 1 ? styles.paginationBtnDisabled : {}) }}
                title="First Page"
              >
                <FiChevronsLeft size={18} />
              </button>
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                style={{ ...styles.paginationBtn, ...(currentPage === 1 ? styles.paginationBtnDisabled : {}) }}
                title="Previous Page"
              >
                <FiChevronLeft size={18} />
              </button>
              
              <div style={styles.paginationInfo}>
                <span style={styles.pageText}>Page</span>
                <span style={styles.pageNumber}>{currentPage}</span>
                <span style={styles.pageText}>of</span>
                <span style={styles.pageNumber}>{totalPages}</span>
              </div>
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                style={{ ...styles.paginationBtn, ...(currentPage === totalPages ? styles.paginationBtnDisabled : {}) }}
                title="Next Page"
              >
                <FiChevronRight size={18} />
              </button>
              <button
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
                style={{ ...styles.paginationBtn, ...(currentPage === totalPages ? styles.paginationBtnDisabled : {}) }}
                title="Last Page"
              >
                <FiChevronsRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Summary Footer */}
      {reportData && reportData.length > 0 && (
        <div style={styles.summaryFooter}>
          <div style={styles.footerItem}>
            <span style={styles.footerLabel}>Total Records:</span>
            <span style={styles.footerValue}>{reportData.length}</span>
          </div>
          <div style={styles.footerItem}>
            <span style={styles.footerLabel}>Total Revenue:</span>
            <span style={{ ...styles.footerValue, color: '#28a745', fontSize: '1.3rem' }}>
              ₱{summary.totalSales.toFixed(2)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '40px auto',
    padding: '30px',
    background: '#ffffff',
    borderRadius: '16px',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
    fontFamily: "'Poppins', sans-serif",
  },
  header: {
    marginBottom: '30px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '16px',
  },
  title: {
    fontSize: '2rem',
    fontWeight: '700',
    color: '#1e3c72',
    margin: '0 0 8px 0',
  },
  subtitle: {
    fontSize: '0.95rem',
    color: '#666',
    margin: 0,
  },
  loading: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#555',
  },
  spinner: {
    width: '50px',
    height: '50px',
    margin: '0 auto 20px',
    border: '4px solid #f0f0f0',
    borderTop: '4px solid #1e3c72',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  downloadButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 24px',
    background: '#28a745',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '0.95rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 12px rgba(40, 167, 69, 0.3)',
  },
  filterSection: {
    background: '#f8f9fa',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '16px',
  },
  reportTypeButtons: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
  },
  reportTypeBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 20px',
    border: '2px solid #dee2e6',
    background: 'white',
    borderRadius: '10px',
    fontSize: '0.95rem',
    fontWeight: '600',
    color: '#495057',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  reportTypeBtnActive: {
    background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
    borderColor: '#1e3c72',
    color: 'white',
    boxShadow: '0 4px 12px rgba(30, 60, 114, 0.3)',
  },
  dateSelector: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  dateInput: {
    padding: '10px 16px',
    border: '2px solid #dee2e6',
    borderRadius: '8px',
    fontSize: '0.95rem',
    fontWeight: '500',
    color: '#333',
    background: 'white',
    cursor: 'pointer',
    transition: 'border-color 0.3s ease',
    outline: 'none',
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '20px',
    marginBottom: '30px',
  },
  summaryCard: {
    background: '#f8f9fa',
    padding: '20px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    transition: 'transform 0.2s ease',
    cursor: 'default',
  },
  summaryIcon: {
    width: '56px',
    height: '56px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  summaryLabel: {
    fontSize: '0.85rem',
    color: '#666',
    marginBottom: '4px',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: '1.8rem',
    fontWeight: '700',
    color: '#1e3c72',
  },
  reportTitleSection: {
    marginBottom: '20px',
    padding: '16px 20px',
    background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
    borderRadius: '12px',
  },
  reportTitle: {
    fontSize: '1.2rem',
    fontWeight: '600',
    color: '#fff',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  tableWrapper: {
    overflowX: 'auto',
    borderRadius: '12px',
    border: '1px solid #e0e0e0',
    marginBottom: '20px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '0.95rem',
  },
  th: {
    background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
    color: '#fff',
    padding: '16px 20px',
    textAlign: 'left',
    fontWeight: '600',
    fontSize: '0.85rem',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    borderBottom: '2px solid #1e3c72',
  },
  tr: {
    borderBottom: '1px solid #f0f0f0',
    transition: 'background 0.2s ease',
  },
  td: {
    padding: '16px 20px',
    color: '#333',
  },
  noData: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#999',
  },
  orderNumber: {
    fontWeight: '600',
    color: '#1e3c72',
    fontFamily: 'monospace',
  },
  productName: {
    fontWeight: '600',
    color: '#555',
  },
  summaryFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px',
    background: '#f8f9fa',
    borderRadius: '12px',
    border: '2px solid #e0e0e0',
  },
  footerItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  footerLabel: {
    fontSize: '0.85rem',
    color: '#666',
    fontWeight: '500',
  },
  footerValue: {
    fontSize: '1.1rem',
    fontWeight: '700',
    color: '#1e3c72',
  },
  paginationContainer: {
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    padding: '16px 0',
    marginTop: '20px',
  },
  paginationWrapper: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '8px',
    padding: '16px 20px',
    background: '#ffffff',
    borderRadius: '12px',
    flexWrap: 'nowrap',
    maxWidth: '100%',
  },
  paginationBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '36px',
    width: '36px',
    height: '36px',
    border: '2px solid #e0e0e0',
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
  },
  paginationInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    margin: '0 8px',
    fontSize: '14px',
    color: '#333',
    flexShrink: 0,
    whiteSpace: 'nowrap',
  },
  pageText: {
    fontSize: '14px',
    color: '#666',
  },
  pageNumber: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#1e3c72',
  },
};

// Add keyframe animation for spinner
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  @media (max-width: 768px) {
    .container {
      margin: 20px auto !important;
      padding: 16px !important;
    }
  }
`;
document.head.appendChild(styleSheet);

export default Reports;