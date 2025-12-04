import React, { useEffect, useState } from 'react';
import {
  FaStore,
  FaShoppingCart,
  FaFish,
  FaMoneyBillWave,
  FaChartLine,
  FaTrophy,
  FaFilter
} from 'react-icons/fa';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import './AdminAnalytics.css';



const AdminAnalytics = () => {
  const [analytics, setAnalytics] = useState({
    totalRevenue: 0,
    activeSellers: 0,
    totalOrders: 0,
    fishVarieties: 0
  });

  const [salesData, setSalesData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [allSellers, setAllSellers] = useState([]);
  const [displayedSellersCount, setDisplayedSellersCount] = useState(5);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [salesTrendFilter, setSalesTrendFilter] = useState('all');
  const [topProductsFilter, setTopProductsFilter] = useState('all');
  const [rankingsFilter, setRankingsFilter] = useState('all');

  // Date states - MUST BE BEFORE useEffect that uses them
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 6);
    return date.toISOString().split('T')[0];
  });

  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  // useEffect hooks
  useEffect(() => {
    if (allSellers.length > 0) {
      const salesTrendData = prepareSalesTrendData(allSellers);
      setSalesData(salesTrendData);
      setDisplayedSellersCount(5);
    }
  }, [startDate, endDate, allSellers]);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const sellersRes = await fetch('http://localhost:5003/api/sellers');
      const sellers = await sellersRes.json();
      const acceptedSellers = sellers.filter(s => s.status === 'accepted');

      let totalRevenue = 0;
      let totalOrders = 0;
      let allProducts = [];
      let salesBySellerMonth = {};
      let productSales = {};

      for (const seller of acceptedSellers) {
        try {
          const ordersRes = await fetch(`http://localhost:5001/api/orders?seller_id=${seller.unique_id}`);
          const ordersData = await ordersRes.json();
          const orders = ordersData.orders || [];

          const completedOrders = orders.filter(o => o.status === 'Completed');
          const sellerRevenue = completedOrders.reduce((sum, order) => sum + Number(order.total), 0);
          totalRevenue += sellerRevenue;
          totalOrders += orders.length;

          orders.forEach(order => {
            const date = new Date(order.orderDate);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const dayKey = date.toISOString().split('T')[0];

            if (!salesBySellerMonth[seller.unique_id]) {
              salesBySellerMonth[seller.unique_id] = {
                sellerName: seller.shop_name,
                sellerId: seller.unique_id,
                totalRevenue: 0,
                months: {},
                days: {}
              };
            }

            if (!salesBySellerMonth[seller.unique_id].months[monthKey]) {
              salesBySellerMonth[seller.unique_id].months[monthKey] = 0;
            }
            if (!salesBySellerMonth[seller.unique_id].days[dayKey]) {
              salesBySellerMonth[seller.unique_id].days[dayKey] = 0;
            }

            const orderTotal = Number(order.total);
            salesBySellerMonth[seller.unique_id].months[monthKey] += orderTotal;
            salesBySellerMonth[seller.unique_id].days[dayKey] += orderTotal;
            salesBySellerMonth[seller.unique_id].totalRevenue += orderTotal;
          });

          orders.forEach(order => {
            order.items.forEach(item => {
              const key = `${item.productName}_${seller.shop_name}`;
              if (!productSales[key]) {
                productSales[key] = {
                  name: item.productName,
                  seller: seller.shop_name,
                  sellerId: seller.unique_id,
                  totalSales: 0,
                  quantity: 0
                };
              }
              productSales[key].totalSales += Number(item.price) * Number(item.quantity);
              productSales[key].quantity += Number(item.quantity);
            });
          });

          const productsRes = await fetch(`http://localhost:5001/api/seller/fish?seller_id=${seller.unique_id}`);
          const products = await productsRes.json();
          allProducts = [...allProducts, ...products];
        } catch (err) {
          console.error(`Error fetching data for seller ${seller.unique_id}:`, err);
        }
      }

      const uniqueVarieties = new Set(allProducts.map(p => p.name.toLowerCase()));

      const sortedSellers = Object.values(salesBySellerMonth)
        .sort((a, b) => b.totalRevenue - a.totalRevenue);

      const salesTrendData = prepareSalesTrendData(sortedSellers);

      const topProductsData = Object.values(productSales)
        .sort((a, b) => b.totalSales - a.totalSales);

      setAnalytics({
        totalRevenue,
        activeSellers: acceptedSellers.length,
        totalOrders,
        fishVarieties: uniqueVarieties.size
      });

      setSalesData(salesTrendData);
      setTopProducts(topProductsData);
      setAllSellers(sortedSellers);
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const prepareSalesTrendData = (sortedSellers) => {
    const periods = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

    if (daysDiff <= 31) {
      // Show daily data
      for (let i = 0; i <= daysDiff; i++) {
        const date = new Date(start);
        date.setDate(start.getDate() + i);
        const dateKey = date.toISOString().split('T')[0];
        periods.push({
          label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          dateKey,
          type: 'day'
        });
      }
    } else {
      // Show monthly data
      const monthsDiff = Math.ceil(daysDiff / 30);
      const startMonth = new Date(start.getFullYear(), start.getMonth(), 1);

      for (let i = 0; i <= monthsDiff; i++) {
        const date = new Date(startMonth.getFullYear(), startMonth.getMonth() + i, 1);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        periods.push({
          label: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          dateKey: monthKey,
          type: 'month'
        });
      }
    }

    return periods.map(({ label, dateKey, type }) => {
      const dataPoint = { label };

      sortedSellers.forEach((seller) => {
        if (type === 'day') {
          dataPoint[seller.sellerName] = seller.days?.[dateKey] || 0;
        } else {
          dataPoint[seller.sellerName] = seller.months?.[dateKey] || 0;
        }
      });

      return dataPoint;
    });
  };

  const preparePieChartData = () => {
    return allSellers.slice(0, 8).map(seller => ({
      name: seller.sellerName,
      value: seller.totalRevenue
    }));
  };

  const getFilteredSalesTrend = () => {
    if (salesTrendFilter === 'all') return salesData;

    return salesData.map(monthData => {
      const filtered = { month: monthData.month };
      const seller = allSellers.find(s => s.sellerId === salesTrendFilter);
      if (seller) {
        filtered[seller.sellerName] = monthData[seller.sellerName] || 0;
      }
      return filtered;
    });
  };

  const getFilteredTopProducts = () => {
    if (topProductsFilter === 'all') return topProducts.slice(0, 10);

    return topProducts
      .filter(p => p.sellerId === topProductsFilter)
      .slice(0, 10);
  };

  const getFilteredRankings = () => {
    if (rankingsFilter === 'all') return topProducts;

    return topProducts.filter(p => p.sellerId === rankingsFilter);
  };

  const getSellersForDisplay = () => {
    const filteredData = getFilteredSalesTrend();
    if (filteredData.length === 0) return [];
    const allSellerNames = Object.keys(filteredData[0]).filter(key => key !== 'month');
    return allSellerNames.slice(0, displayedSellersCount);
  };

  const handleShowMore = () => {
    setDisplayedSellersCount(prev => {
      const filteredData = getFilteredSalesTrend();
      const allSellerNames = Object.keys(filteredData[0] || {}).filter(key => key !== 'month');
      return Math.min(prev + 5, allSellerNames.length);
    });
  };

  const hasMoreSellers = () => {
    const filteredData = getFilteredSalesTrend();
    if (filteredData.length === 0) return false;
    const allSellerNames = Object.keys(filteredData[0]).filter(key => key !== 'month');
    return displayedSellersCount < allSellerNames.length;
  };

  const COLORS = ['#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7'];

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div style={{ width: '50px', height: '50px', border: '4px solid #e5e7eb', borderTop: '4px solid #0891b2', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <p style={{ marginTop: '16px', color: '#6b7280' }}>Loading analytics dashboard...</p>
      </div>
    );
  }

  const displayedSellers = getSellersForDisplay();
  const filteredSalesTrendData = getFilteredSalesTrend();
  const filteredTopProducts = getFilteredTopProducts();
  const filteredRankings = getFilteredRankings();

  return (
    <div className="seller-home">
      <div className="top-bar">
        <div className="shop-branding">
          <div className="shop-info">
            <h1 className="shop-name">Analytics Dashboard</h1>
            <p className="shop-owner">Overview of all sellers performance</p>
          </div>
        </div>

        <div className="user-profile">
          <span className="seller-id">ADMIN PANEL</span>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card stat-revenue">
          <div className="stat-icon-wrapper">
            <FaMoneyBillWave className="stat-icon" size={48} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Total Revenue</p>
            <h2 className="stat-value">₱{analytics.totalRevenue.toLocaleString()}</h2>
            <p className="stat-subtext">From completed orders</p>
          </div>
        </div>

        <div className="stat-card stat-orders">
          <div className="stat-icon-wrapper">
            <FaStore className="stat-icon" size={48} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Active Sellers</p>
            <h2 className="stat-value">{analytics.activeSellers}</h2>
            <p className="stat-subtext">Approved and registered</p>
          </div>
        </div>

        <div className="stat-card stat-products">
          <div className="stat-icon-wrapper">
            <FaShoppingCart className="stat-icon" size={48} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Total Orders</p>
            <h2 className="stat-value">{analytics.totalOrders}</h2>
            <p className="stat-subtext">All time orders</p>
          </div>
        </div>

        <div className="stat-card stat-pending">
          <div className="stat-icon-wrapper">
            <FaFish className="stat-icon" size={48} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Fish Varieties</p>
            <h2 className="stat-value">{analytics.fishVarieties}</h2>
            <p className="stat-subtext">Unique products</p>
          </div>
        </div>
      </div>

      <div className="charts-container">
        <div className='chart-grid'>
          <div className="chart-card chart-area">
            <div className="card-header">
              <h3><FaChartLine size={18} style={{ display: 'inline', marginRight: '8px' }} /> Sales Trend by Seller</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FaFilter size={14} />
                  <select
                    value={salesTrendFilter}
                    onChange={(e) => setSalesTrendFilter(e.target.value)}
                    className="modern-select"
                  >
                    <option value="all">All Sellers</option>
                    {allSellers.map(seller => (
                      <option key={seller.sellerId} value={seller.sellerId}>
                        {seller.sellerName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="date-filter-container">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="date-input"
                  />
                  <span style={{ fontSize: '12px', fontWeight: '600', color: '#64748b' }}>to</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="date-input"
                  />
                </div>
              </div>
            </div>
            <div className="chart-content">
              {filteredSalesTrendData.length > 0 && displayedSellers.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <AreaChart data={filteredSalesTrendData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <defs>
                      {displayedSellers.map((seller, index) => (
                        <linearGradient key={seller} id={`color${index}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.8} />
                          <stop offset="95%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.1} />
                        </linearGradient>
                      ))}
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                    <XAxis
                      dataKey="label"
                      stroke="#6b7280"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: '#e5e7eb' }}
                    />
                    <YAxis
                      stroke="#6b7280"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: '#e5e7eb' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        padding: '12px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                      }}
                      labelStyle={{ fontSize: '12px', fontWeight: '600', color: '#0e7490' }}
                    />
                    <Legend />
                    {displayedSellers.map((seller, index) => (
                      <Area
                        key={seller}
                        type="monotone"
                        dataKey={seller}
                        stroke={COLORS[index % COLORS.length]}
                        strokeWidth={2}
                        fill={`url(#color${index})`}
                        name={seller}
                      />
                    ))}
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="empty-state">
                  <p><FaChartLine size={18} style={{ display: 'inline', marginRight: '8px' }} /> No sales data available</p>
                </div>
              )}
            </div>
            {hasMoreSellers() && (
              <div className="show-more-container">
                <button className="show-more-btn" onClick={handleShowMore}>
                  Show More Sellers
                </button>
              </div>
            )}
          </div>

          <div className="chart-card chart-pie">
            <div className="card-header">
              <h3><FaTrophy size={18} style={{ display: 'inline', marginRight: '8px' }} /> Revenue Distribution</h3>
              <span className="chart-period">Top 8 Sellers</span>
            </div>
            <div className="chart-content">
              {preparePieChartData().length > 0 ? (
                <ResponsiveContainer width="100%" height={380}>
                  <PieChart>
                    <Pie
                      data={preparePieChartData()}
                      cx="50%"
                      cy="45%"
                      labelLine={false}
                      label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                      outerRadius={90}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {preparePieChartData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => `₱${Number(value).toLocaleString()}`}
                      contentStyle={{
                        backgroundColor: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        padding: '12px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={60}
                      wrapperStyle={{ fontSize: '11px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="empty-state">
                  <p><FaTrophy size={18} style={{ display: 'inline', marginRight: '8px' }} /> No revenue data</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="chart-card">
        <div className="card-header">
          <h3><FaTrophy size={18} style={{ display: 'inline', marginRight: '8px' }} /> Top Selling Products</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FaFilter size={14} />
            <select
              value={topProductsFilter}
              onChange={(e) => setTopProductsFilter(e.target.value)}
              style={{
                padding: '4px 8px',
                borderRadius: '6px',
                border: '1px solid #e5e7eb',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              <option value="all">All Sellers</option>
              {allSellers.map(seller => (
                <option key={seller.sellerId} value={seller.sellerId}>
                  {seller.sellerName}
                </option>
              ))}
            </select>
            <span className="chart-period">Top 10 by Revenue</span>
          </div>
        </div>

        <div className="chart-content">
          {filteredTopProducts.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart
                data={filteredTopProducts}
                margin={{ top: 10, right: 10, left: -20, bottom: 80 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="#6b7280"
                  fontSize={9}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  tickLine={false}
                  axisLine={{ stroke: '#e5e7eb' }}
                />
                <YAxis
                  stroke="#6b7280"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#e5e7eb' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                  }}
                  formatter={(value, name, props) => {
                    const item = props.payload;
                    return [
                      <div key="tooltip">
                        <div style={{ fontWeight: '700', marginBottom: '4px' }}>{item.name}</div>
                        <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>
                          {item.seller}
                        </div>
                        <div style={{ fontWeight: '600' }}>
                          ₱{Number(value).toLocaleString()}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                          {item.quantity} sold
                        </div>
                      </div>
                    ];
                  }}
                />
                <Bar dataKey="totalSales" radius={[8, 8, 0, 0]} fill="#0891b2" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state">
              <p><FaTrophy size={18} style={{ display: 'inline', marginRight: '8px' }} /> No product sales data</p>
            </div>
          )}
        </div>
      </div>

      {/* Top Products Table */}
      <div className="pending-orders-section">
        <div className="section-header">
          <h3><FaTrophy size={18} style={{ display: 'inline', marginRight: '8px' }} /> Product Rankings</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FaFilter size={14} />
            <select
              value={rankingsFilter}
              onChange={(e) => setRankingsFilter(e.target.value)}
              style={{
                padding: '4px 8px',
                borderRadius: '6px',
                border: '1px solid #e5e7eb',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              <option value="all">All Sellers</option>
              {allSellers.map(seller => (
                <option key={seller.sellerId} value={seller.sellerId}>
                  {seller.sellerName}
                </option>
              ))}
            </select>
            <span className="pending-count">{filteredRankings.length}</span>
          </div>
        </div>

        <div className="pending-orders-grid">
          {filteredRankings.length > 0 ? (
            filteredRankings.map((product, index) => (
              <div key={index} className="pending-order-card">
                <div className="pending-order-header" style={{
                  background: index === 0 ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)' :
                    index === 1 ? 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)' :
                      index === 2 ? 'linear-gradient(135deg, #f87171 0%, #dc2626 100%)' :
                        'linear-gradient(135deg, #0891b2 0%, #0e7490 100%)'
                }}>
                  <div className="pending-order-id-section">
                    <span className="pending-order-number">#{index + 1} {product.name}</span>
                    <span className="pending-badge">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '⭐'}
                    </span>
                  </div>
                </div>

                <div className="pending-order-body">
                  <div className="customer-section">
                    <div className="customer-name-compact">{product.seller}</div>
                    <div className="customer-detail">Quantity Sold: {product.quantity} units</div>
                  </div>

                  <div className="order-footer-info">
                    <span className="order-time">Total Revenue</span>
                    <span className="order-total-compact">₱{product.totalSales.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-pending">
              <div className="empty-icon"><FaTrophy size={48} color="#0891b2" /></div>
              <h4>No Product Data</h4>
              <p>No sales data available yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;