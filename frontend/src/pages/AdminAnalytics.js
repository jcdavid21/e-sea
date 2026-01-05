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
import { FiDownload } from 'react-icons/fi';
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

  const [supplyDemandData, setSupplyDemandData] = useState([]);
  const [priceTrendData, setPriceTrendData] = useState([]);
  const [selectedVariety, setSelectedVariety] = useState('all');
  const [allVarieties, setAllVarieties] = useState([]);

  const [salesTrendFilter, setSalesTrendFilter] = useState('all');
  const [topProductsFilter, setTopProductsFilter] = useState('all');
  const [rankingsFilter, setRankingsFilter] = useState('all');
  const [supplyDemandFilter, setSupplyDemandFilter] = useState('all');

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(4); // Show 6 sellers per page

  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 6);
    return date.toISOString().split('T')[0];
  });

  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  // 2. DEFINE ALL HELPER FUNCTIONS BEFORE useEffect
  const prepareSalesTrendData = (sortedSellers) => {
    const periods = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

    if (daysDiff <= 31) {
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

  const prepareSupplyDemandData = (allProducts, orders) => {
    const varietyStats = {};

    allProducts.forEach(product => {
      const variety = product.name.toLowerCase();
      if (!varietyStats[variety]) {
        varietyStats[variety] = {
          name: product.name,
          supply: 0,
          demand: 0,
          sellers: new Set()
        };
      }
      varietyStats[variety].supply += Number(product.stock);
      varietyStats[variety].sellers.add(product.seller_id);
    });

    orders.forEach(order => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach(item => {
          const variety = item.productName.toLowerCase();
          if (varietyStats[variety]) {
            varietyStats[variety].demand += Number(item.quantity);
          }
        });
      }
    });

    return Object.values(varietyStats).map(stat => ({
      name: stat.name,
      supply: stat.supply,
      demand: stat.demand,
      sellers: stat.sellers.size,
      trend: stat.supply > stat.demand ? 'Oversupply' : stat.demand > stat.supply ? 'High Demand' : 'Balanced'
    })).sort((a, b) => b.demand - a.demand);
  };

  const preparePriceTrendData = (allProducts) => {
    const priceByVariety = {};

    allProducts.forEach(product => {
      const variety = product.name.toLowerCase();
      if (!priceByVariety[variety]) {
        priceByVariety[variety] = {
          name: product.name,
          prices: []
        };
      }
      priceByVariety[variety].prices.push({
        seller: product.sellerName || 'Unknown',
        sellerId: product.seller_id,
        price: Number(product.price),
        stock: Number(product.stock)
      });
    });

    return Object.values(priceByVariety)
      .map(variety => ({
        name: variety.name,
        avgPrice: variety.prices.reduce((sum, p) => sum + p.price, 0) / variety.prices.length,
        minPrice: Math.min(...variety.prices.map(p => p.price)),
        maxPrice: Math.max(...variety.prices.map(p => p.price)),
        priceRange: Math.max(...variety.prices.map(p => p.price)) - Math.min(...variety.prices.map(p => p.price)),
        sellers: variety.prices
      }))
      .filter(v => v.sellers.length > 1)
      .sort((a, b) => b.priceRange - a.priceRange);
  };

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const sellersRes = await fetch(`${process.env.REACT_APP_ADMIN_API_URL}/api/sellers`);
      const sellers = await sellersRes.json();
      const acceptedSellers = sellers.filter(s => s.status === 'accepted');

      let totalRevenue = 0;
      let totalOrders = 0;
      let allProducts = [];
      let salesBySellerMonth = {};
      let productSales = {};
      const ordersWithItems = [];

      for (const seller of acceptedSellers) {
        try {
          const ordersRes = await fetch(`${process.env.REACT_APP_SELLER_API_URL}/api/orders?seller_id=${seller.unique_id}`);
          const ordersData = await ordersRes.json();
          const orders = ordersData.orders || [];

          ordersWithItems.push(...orders);

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
            if (order.items && Array.isArray(order.items)) {
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
            }
          });

          const productsRes = await fetch(`${process.env.REACT_APP_SELLER_API_URL}/api/seller/fish?seller_id=${seller.unique_id}`);
          const products = await productsRes.json();

          const productsWithSeller = products.map(p => ({
            ...p,
            sellerName: seller.shop_name
          }));

          allProducts = [...allProducts, ...productsWithSeller];
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

      const supplyDemand = prepareSupplyDemandData(allProducts, ordersWithItems);
      const priceTrends = preparePriceTrendData(allProducts);
      const varieties = [...new Set(allProducts.map(p => p.name))];

      setAnalytics({
        totalRevenue,
        activeSellers: acceptedSellers.length,
        totalOrders,
        fishVarieties: uniqueVarieties.size
      });

      setSalesData(salesTrendData);
      setTopProducts(topProductsData);
      setAllSellers(sortedSellers);
      setSupplyDemandData(supplyDemand);
      setPriceTrendData(priceTrends);
      setAllVarieties(varieties);
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  // 3. useEffect HOOKS
  useEffect(() => {
    fetchAnalytics();
  }, []);

  useEffect(() => {
    if (allSellers.length > 0) {
      const salesTrendData = prepareSalesTrendData(allSellers);
      setSalesData(salesTrendData);
      setDisplayedSellersCount(5);
    }
  }, [startDate, endDate, allSellers]);

  // Add the tooltip positioning useEffect here
  useEffect(() => {
    const handleTooltipPosition = () => {
      const tooltips = document.querySelectorAll('.recharts-tooltip-wrapper');
      tooltips.forEach(tooltip => {
        if (window.innerWidth <= 768) {
          tooltip.style.position = 'fixed';
          tooltip.style.zIndex = '9999';
        }
      });
    };

    window.addEventListener('resize', handleTooltipPosition);
    handleTooltipPosition();

    return () => window.removeEventListener('resize', handleTooltipPosition);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [rankingsFilter]);


  // 4. REST OF THE FUNCTIONS
  const getFilteredSalesTrend = () => {
    if (salesTrendFilter === 'all') return salesData;

    const seller = allSellers.find(s => s.sellerId === salesTrendFilter);
    if (!seller) return salesData;

    return salesData.map(dataPoint => {
      const filtered = { label: dataPoint.label };
      filtered[seller.sellerName] = dataPoint[seller.sellerName] || 0;
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

  const getFilteredSupplyDemand = () => {
    if (supplyDemandFilter === 'all') return supplyDemandData.slice(0, 10);
    const sellerProducts = topProducts.filter(p => p.sellerId === supplyDemandFilter);
    const sellerProductNames = new Set(sellerProducts.map(p => p.name.toLowerCase()));
    return supplyDemandData
      .filter(item => sellerProductNames.has(item.name.toLowerCase()))
      .slice(0, 10);
  };

  const getSellersForDisplay = () => {
    if (salesTrendFilter !== 'all') {
      const seller = allSellers.find(s => s.sellerId === salesTrendFilter);
      return seller ? [seller.sellerName] : [];
    }

    const filteredData = getFilteredSalesTrend();
    if (filteredData.length === 0) return [];
    const allSellerNames = Object.keys(filteredData[0]).filter(key => key !== 'label');
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

  // Get filtered sellers for report
  const getFilteredSellersForReport = () => {
    if (rankingsFilter === 'all') {
      return allSellers;
    }
    return allSellers.filter(s => s.sellerId === rankingsFilter);
  };

  // Download summary report as CSV
  const downloadSummaryReport = () => {
    const reportData = getFilteredSellersForReport();

    if (reportData.length === 0) {
      alert('No data to download');
      return;
    }

    // Prepare CSV headers
    const headers = [
      'Rank',
      'Seller Name',
      'Seller ID',
      'Total Revenue (₱)',
      'Products Listed',
      'Total Units Sold',
      'Average Order Value (₱)',
      'Top Product',
      'Top Product Sales (₱)',
      'Report Date'
    ];

    // Prepare CSV rows
    const rows = reportData.map((seller, index) => {
      const sellerProducts = topProducts.filter(p => p.sellerId === seller.sellerId);
      const totalProductsSold = sellerProducts.reduce((sum, p) => sum + p.quantity, 0);
      const avgOrderValue = seller.totalRevenue / (sellerProducts.length || 1);
      const topProduct = sellerProducts[0] || { name: 'N/A', totalSales: 0 };

      return [
        index + 1,
        seller.sellerName,
        seller.sellerId,
        seller.totalRevenue.toFixed(2),
        sellerProducts.length,
        totalProductsSold,
        avgOrderValue.toFixed(2),
        topProduct.name,
        topProduct.totalSales.toFixed(2),
        new Date().toLocaleDateString()
      ];
    });

    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Create download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    const fileName = `sales_summary_report_${rankingsFilter === 'all' ? 'all_sellers' : reportData[0]?.sellerName.replace(/\s+/g, '_')
      }_${new Date().toISOString().split('T')[0]}.csv`;

    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getPaginatedSellers = () => {
    const filteredSellers = getFilteredSellersForReport();
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return filteredSellers.slice(indexOfFirstItem, indexOfLastItem);
  };

  const totalPages = Math.ceil(getFilteredSellersForReport().length / itemsPerPage);


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
                      // center the pie chart in mobile view
                      cx={ window.innerWidth <= 768 ? '30%' : '50%' }
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
          <h3>Top Selling Products</h3>
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
              <p>No product sales data</p>
            </div>
          )}
        </div>
      </div>

      {/* Supply and Demand Analysis */}
      <div className="chart-card" style={{ marginTop: '28px' }}>
        <div className="card-header">
          <h3><FaChartLine size={18} style={{ display: 'inline', marginRight: '8px' }} /> Supply vs Demand Analysis</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FaFilter size={14} />
            <select
              value={supplyDemandFilter}
              onChange={(e) => setSupplyDemandFilter(e.target.value)}
              className="modern-select"
            >
              <option value="all">All Sellers</option>
              {allSellers.map(seller => (
                <option key={seller.sellerId} value={seller.sellerId}>
                  {seller.sellerName}
                </option>
              ))}
            </select>
            <span className="chart-period">Fish Varieties Overview</span>
          </div>
        </div>
        <div className="chart-content">
          {getFilteredSupplyDemand().length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={getFilteredSupplyDemand()} margin={{ top: 10, right: 30, left: 0, bottom: 80 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  fontSize={11}
                />
                <YAxis fontSize={11} />
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
                        <div style={{ fontWeight: '700', marginBottom: '8px' }}>{item.name}</div>
                        <div style={{ fontSize: '12px', marginBottom: '4px' }}>
                          Supply: <strong>{item.supply}</strong> units
                        </div>
                        <div style={{ fontSize: '12px', marginBottom: '4px' }}>
                          Demand: <strong>{item.demand}</strong> units
                        </div>
                        <div style={{ fontSize: '12px', marginBottom: '4px' }}>
                          Sellers: <strong>{item.sellers}</strong>
                        </div>
                        <div style={{
                          fontSize: '11px',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          marginTop: '4px',
                          background: item.trend === 'High Demand' ? '#fee2e2' :
                            item.trend === 'Oversupply' ? '#dbeafe' : '#f0fdf4',
                          color: item.trend === 'High Demand' ? '#dc2626' :
                            item.trend === 'Oversupply' ? '#2563eb' : '#16a34a',
                          fontWeight: '700'
                        }}>
                          {item.trend}
                        </div>
                      </div>
                    ];
                  }}
                />
                <Legend />
                <Bar dataKey="supply" fill="#3b82f6" name="Supply (Stock)" radius={[8, 8, 0, 0]} />
                <Bar dataKey="demand" fill="#10b981" name="Demand (Sold)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state">
              <p>No supply/demand data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Price Comparison Analysis */}
      <div className="chart-card" style={{ marginTop: '28px' }}>
        <div className="card-header">
          <h3><FaMoneyBillWave size={18} style={{ display: 'inline', marginRight: '8px' }} /> Price Comparison by Variety</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <FaFilter size={14} />
            <select
              value={selectedVariety}
              onChange={(e) => setSelectedVariety(e.target.value)}
              className="modern-select"
            >
              <option value="all">All Varieties</option>
              {priceTrendData.map((variety, idx) => (
                <option key={idx} value={variety.name}>
                  {variety.name}
                </option>
              ))}
            </select>
            <span className="chart-period">Multi-Seller Products</span>
          </div>
        </div>
        <div className="chart-content" style={{ position: 'relative', zIndex: 1 }}>
          {priceTrendData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={420}>
                <BarChart
                  data={selectedVariety === 'all' ? priceTrendData.slice(0, 10) : priceTrendData.filter(v => v.name === selectedVariety)}
                  margin={{ top: 40, right: 30, left: 20, bottom: 100 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    fontSize={11}
                    tick={{ fill: '#64748b' }}
                    axisLine={{ stroke: '#cbd5e1' }}
                  />
                  <YAxis
                    fontSize={11}
                    tick={{ fill: '#64748b' }}
                    axisLine={{ stroke: '#cbd5e1' }}
                    label={{
                      value: 'Price (₱)',
                      angle: -90,
                      position: 'insideLeft',
                      offset: 10,
                      style: {
                        fontSize: 13,
                        fontWeight: 700,
                        fill: '#0e7490',
                        textAnchor: 'middle'
                      }
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      padding: '12px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      zIndex: 1000
                    }}
                    wrapperStyle={{ zIndex: 1000 }}
                    formatter={(value, name, props) => {
                      const item = props.payload;
                      const priceType = name === 'minPrice' ? 'Minimum Price' :
                        name === 'avgPrice' ? 'Average Price' : 'Maximum Price';

                      return [
                        <div key="tooltip" style={{ minWidth: '180px' }}>
                          <div style={{ fontWeight: '700', marginBottom: '8px', fontSize: '13px', color: '#0e7490' }}>
                            {item.name}
                          </div>
                          <div style={{ fontSize: '12px', marginBottom: '6px', padding: '4px 8px', background: '#f1f5f9', borderRadius: '4px' }}>
                            <strong>{priceType}:</strong> ₱{Number(value).toFixed(2)}
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '8px', borderTop: '1px solid #e2e8f0', paddingTop: '6px' }}>
                            <div>Min: ₱{item.minPrice.toFixed(2)}</div>
                            <div>Avg: ₱{item.avgPrice.toFixed(2)}</div>
                            <div>Max: ₱{item.maxPrice.toFixed(2)}</div>
                            <div style={{ marginTop: '4px', fontWeight: '600' }}>
                              Range: ₱{item.priceRange.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      ];
                    }}
                  />
                  <Legend
                    verticalAlign="top"
                    height={36}
                    wrapperStyle={{
                      paddingBottom: '10px',
                      position: 'relative',
                      zIndex: 10,
                      top: '-10px'
                    }}
                    iconType="rect"
                    iconSize={12}
                    formatter={(value) => {
                      const labels = {
                        minPrice: 'Minimum Price (₱)',
                        avgPrice: 'Average Price (₱)',
                        maxPrice: 'Maximum Price (₱)'
                      };
                      return <span style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>{labels[value] || value}</span>;
                    }}
                  />
                  <Bar dataKey="minPrice" fill="#10b981" name="minPrice" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="avgPrice" fill="#0891b2" name="avgPrice" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="maxPrice" fill="#dc2626" name="maxPrice" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>

              {/* X-axis Label */}
              <div style={{
                textAlign: 'center',
                marginTop: '-30px',
                marginBottom: '10px',
                position: 'relative',
                zIndex: 10
              }}>
                <span style={{
                  fontSize: '13px',
                  fontWeight: 700,
                  color: '#0e7490'
                }}>
                  Product Name
                </span>
              </div>

              {/* Information Cards */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '12px',
                padding: '16px',
                background: '#f8fafc',
                borderRadius: '12px',
                marginTop: '16px',
                position: 'relative',
                zIndex: 10
              }}>
                <div style={{
                  textAlign: 'center',
                  padding: '12px',
                  background: 'white',
                  borderRadius: '8px',
                  border: '2px solid #e0f2fe'
                }}>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Product Name
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: '800', color: '#0e7490' }}>
                    Fish Variety
                  </div>
                </div>
                <div style={{
                  textAlign: 'center',
                  padding: '12px',
                  background: 'white',
                  borderRadius: '8px',
                  border: '2px solid #e0f2fe'
                }}>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Price Category
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: '800', color: '#0e7490' }}>
                    Min / Avg / Max
                  </div>
                </div>
                <div style={{
                  textAlign: 'center',
                  padding: '12px',
                  background: 'white',
                  borderRadius: '8px',
                  border: '2px solid #e0f2fe'
                }}>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Price Name
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: '800', color: '#0e7490' }}>
                    Philippine Peso (₱)
                  </div>
                </div>
              </div>

              {/* Detailed Price Breakdown */}
              {selectedVariety !== 'all' && (
                <div style={{ marginTop: '20px', padding: '16px', background: '#f8fafc', borderRadius: '12px', position: 'relative', zIndex: 5 }}>
                  <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '800', color: '#0f172a', borderBottom: '2px solid #e0f2fe', paddingBottom: '12px' }}>
                    Detailed Price Breakdown: {selectedVariety}
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
                    {(() => {
                      const variety = priceTrendData.find(v => v.name === selectedVariety);
                      if (!variety || !variety.sellers) return null;

                      // Create a copy of the array before sorting
                      const sortedSellers = [...variety.sellers].sort((a, b) => a.price - b.price);

                      return sortedSellers.map((seller, idx) => (
                        <div key={idx} style={{
                          background: 'white',
                          padding: '16px',
                          borderRadius: '12px',
                          border: '2px solid #e0f2fe',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                          transition: 'all 0.3s',
                          cursor: 'pointer',
                          position: 'relative',
                          zIndex: 1
                        }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-4px)';
                            e.currentTarget.style.boxShadow = '0 8px 16px rgba(8,145,178,0.15)';
                            e.currentTarget.style.borderColor = '#0891b2';
                            e.currentTarget.style.zIndex = '10';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
                            e.currentTarget.style.borderColor = '#e0f2fe';
                            e.currentTarget.style.zIndex = '1';
                          }}
                        >
                          {/* Shop Name */}
                          <div style={{
                            fontSize: '13px',
                            fontWeight: '800',
                            color: '#0e7490',
                            marginBottom: '10px',
                            paddingBottom: '8px',
                            borderBottom: '2px solid #e0f2fe',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}>
                            <FaStore size={12} />
                            {seller.seller}
                          </div>

                          {/* Price Category Badge */}
                          <div style={{ marginBottom: '12px' }}>
                            <span style={{
                              fontSize: '10px',
                              fontWeight: '700',
                              padding: '4px 10px',
                              borderRadius: '12px',
                              background: idx === 0 ? '#dcfce7' :
                                idx === sortedSellers.length - 1 ? '#fee2e2' : '#dbeafe',
                              color: idx === 0 ? '#16a34a' :
                                idx === sortedSellers.length - 1 ? '#dc2626' : '#2563eb',
                              letterSpacing: '0.5px',
                              display: 'inline-block'
                            }}>
                              {idx === 0 ? 'LOWEST PRICE' :
                                idx === sortedSellers.length - 1 ? 'HIGHEST PRICE' : 'COMPETITIVE'}
                            </span>
                          </div>

                          {/* Price Display */}
                          <div style={{ marginBottom: '12px' }}>
                            <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '600', marginBottom: '4px', letterSpacing: '0.5px' }}>
                              SELLING PRICE
                            </div>
                            <div style={{
                              fontSize: '24px',
                              fontWeight: '900',
                              color: '#0891b2',
                              display: 'flex',
                              alignItems: 'baseline',
                              gap: '4px'
                            }}>
                              ₱{seller.price.toFixed(2)}
                              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>
                                per kg
                              </span>
                            </div>
                          </div>

                          {/* Price Difference from Average */}
                          {sortedSellers.length > 1 && (
                            <div style={{ marginTop: '10px', fontSize: '10px', color: '#64748b', textAlign: 'center' }}>
                              {(() => {
                                const avgPrice = variety.avgPrice;
                                const diff = seller.price - avgPrice;
                                const percentage = ((diff / avgPrice) * 100).toFixed(1);

                                if (Math.abs(diff) < 0.01) {
                                  return <span style={{ color: '#0891b2', fontWeight: '600' }}>At average price</span>;
                                }

                                return (
                                  <span style={{
                                    color: diff < 0 ? '#16a34a' : '#dc2626',
                                    fontWeight: '700'
                                  }}>
                                    {diff < 0 ? '▼' : '▲'} {Math.abs(percentage)}% {diff < 0 ? 'below' : 'above'} average
                                  </span>
                                );
                              })()}
                            </div>
                          )}
                        </div>
                      ));
                    })()}
                  </div>

                  {/* Price Statistics Summary */}
                  {(() => {
                    const variety = priceTrendData.find(v => v.name === selectedVariety);
                    if (!variety) return null;

                    return (
                      <div style={{
                        marginTop: '20px',
                        padding: '16px',
                        background: 'white',
                        borderRadius: '12px',
                        border: '2px solid #e0f2fe',
                        position: 'relative',
                        zIndex: 1
                      }}>
                        <h5 style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>
                          Price Statistics
                        </h5>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
                          <div style={{ textAlign: 'center', padding: '12px', background: '#dcfce7', borderRadius: '8px' }}>
                            <div style={{ fontSize: '10px', color: '#166534', fontWeight: '600', marginBottom: '4px' }}>LOWEST</div>
                            <div style={{ fontSize: '18px', fontWeight: '900', color: '#16a34a' }}>₱{variety.minPrice.toFixed(2)}</div>
                          </div>
                          <div style={{ textAlign: 'center', padding: '12px', background: '#dbeafe', borderRadius: '8px' }}>
                            <div style={{ fontSize: '10px', color: '#1e40af', fontWeight: '600', marginBottom: '4px' }}>AVERAGE</div>
                            <div style={{ fontSize: '18px', fontWeight: '900', color: '#0891b2' }}>₱{variety.avgPrice.toFixed(2)}</div>
                          </div>
                          <div style={{ textAlign: 'center', padding: '12px', background: '#fee2e2', borderRadius: '8px' }}>
                            <div style={{ fontSize: '10px', color: '#991b1b', fontWeight: '600', marginBottom: '4px' }}>HIGHEST</div>
                            <div style={{ fontSize: '18px', fontWeight: '900', color: '#dc2626' }}>₱{variety.maxPrice.toFixed(2)}</div>
                          </div>
                          <div style={{ textAlign: 'center', padding: '12px', background: '#fef3c7', borderRadius: '8px' }}>
                            <div style={{ fontSize: '10px', color: '#92400e', fontWeight: '600', marginBottom: '4px' }}>PRICE RANGE</div>
                            <div style={{ fontSize: '18px', fontWeight: '900', color: '#d97706' }}>₱{variety.priceRange.toFixed(2)}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </>
          ) : (
            <div className="empty-state">
              <p>No price comparison data (need products sold by multiple sellers)</p>
            </div>
          )}
        </div>
      </div>

      {/* Top Products Table */}
      <div className="pending-orders-section">
        <div className="section-header">
          <h3> Product Rankings</h3>
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

      {/* Summary Report Section */}
      <div className="pending-orders-section revenue-section" style={{ marginTop: '28px' }}>
        <div className="section-header">
          <h3>Sales & Revenue Summary Report</h3>
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
            <button
              onClick={() => downloadSummaryReport()}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                background: 'linear-gradient(135deg, #0891b2 0%, #0e7490 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 4px 12px rgba(8, 145, 178, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }}
            >
              <FiDownload size={16} />
              Download CSV
            </button>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
          gap: '20px'
        }}>
          {getPaginatedSellers().map((seller) => {
            const sellerProducts = topProducts.filter(p => p.sellerId === seller.sellerId);
            const totalProductsSold = sellerProducts.reduce((sum, p) => sum + p.quantity, 0);
            const avgOrderValue = seller.totalRevenue / (sellerProducts.length || 1);
            const topProduct = sellerProducts[0] || null;

            return (
              <div
                key={seller.sellerId}
                style={{
                  background: 'white',
                  border: '2px solid #e0f2fe',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  transition: 'all 0.3s',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-6px)';
                  e.currentTarget.style.boxShadow = '0 12px 32px rgba(8, 145, 178, 0.2)';
                  e.currentTarget.style.borderColor = '#0891b2';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)';
                  e.currentTarget.style.borderColor = '#e0f2fe';
                }}
              >
                {/* Header */}
                <div style={{
                  background: 'linear-gradient(135deg, #0891b2 0%, #0e7490 100%)',
                  padding: '16px 20px'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <h4 style={{
                      margin: 0,
                      fontSize: '16px',
                      fontWeight: '700',
                      color: 'white',
                      letterSpacing: '0.5px'
                    }}>
                      <FaStore style={{ marginRight: '8px', display: 'inline' }} />
                      {seller.sellerName}
                    </h4>
                    <span style={{
                      background: 'white',
                      color: '#0891b2',
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: '700'
                    }}>
                      #{allSellers.indexOf(seller) + 1}
                    </span>
                  </div>
                </div>

                {/* Body */}
                <div style={{ padding: '20px' }}>
                  {/* Revenue Card */}
                  <div style={{
                    background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                    padding: '16px',
                    borderRadius: '12px',
                    marginBottom: '16px',
                    border: '2px solid #bae6fd'
                  }}>
                    <div style={{
                      fontSize: '11px',
                      color: '#0369a1',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      marginBottom: '8px'
                    }}>
                      Total Revenue
                    </div>
                    <div style={{
                      fontSize: '28px',
                      fontWeight: '900',
                      color: '#0891b2',
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: '4px'
                    }}>
                      ₱{seller.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '12px',
                    marginBottom: '16px'
                  }}>
                    <div style={{
                      background: '#f8fafc',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0'
                    }}>
                      <div style={{
                        fontSize: '10px',
                        color: '#64748b',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        marginBottom: '6px'
                      }}>
                        Products
                      </div>
                      <div style={{
                        fontSize: '20px',
                        fontWeight: '700',
                        color: '#0f172a'
                      }}>
                        {sellerProducts.length}
                      </div>
                    </div>

                    <div style={{
                      background: '#f8fafc',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0'
                    }}>
                      <div style={{
                        fontSize: '10px',
                        color: '#64748b',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        marginBottom: '6px'
                      }}>
                        Units Sold
                      </div>
                      <div style={{
                        fontSize: '20px',
                        fontWeight: '700',
                        color: '#0f172a'
                      }}>
                        {totalProductsSold}
                      </div>
                    </div>
                  </div>

                  {/* Average Order Value */}
                  <div style={{
                    background: '#fff7ed',
                    padding: '12px',
                    borderRadius: '8px',
                    marginBottom: '16px',
                    border: '1px solid #fed7aa'
                  }}>
                    <div style={{
                      fontSize: '10px',
                      color: '#c2410c',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      marginBottom: '6px'
                    }}>
                      Avg Order Value
                    </div>
                    <div style={{
                      fontSize: '18px',
                      fontWeight: '700',
                      color: '#ea580c'
                    }}>
                      ₱{avgOrderValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                  </div>

                  {/* Top Product */}
                  {topProduct && (
                    <div style={{
                      background: '#f0fdf4',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid #bbf7d0'
                    }}>
                      <div style={{
                        fontSize: '10px',
                        color: '#15803d',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        marginBottom: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        Top Selling Product
                      </div>
                      <div style={{
                        fontSize: '13px',
                        fontWeight: '700',
                        color: '#166534',
                        marginBottom: '4px'
                      }}>
                        {topProduct.name}
                      </div>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '12px',
                        color: '#15803d'
                      }}>
                        <span>{topProduct.quantity} units</span>
                        <span>₱{topProduct.totalSales.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '12px',
            marginTop: '24px',
            padding: '20px',
            background: 'white',
            borderRadius: '12px',
            border: '2px solid #e0f2fe'
          }}>
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              style={{
                padding: '8px 16px',
                background: currentPage === 1 ? '#e2e8f0' : 'linear-gradient(135deg, #0891b2 0%, #0e7490 100%)',
                color: currentPage === 1 ? '#94a3b8' : 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Previous
            </button>

            <div style={{
              display: 'flex',
              gap: '8px',
              alignItems: 'center'
            }}>
              {[...Array(totalPages)].map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentPage(index + 1)}
                  style={{
                    padding: '8px 12px',
                    background: currentPage === index + 1
                      ? 'linear-gradient(135deg, #0891b2 0%, #0e7490 100%)'
                      : 'white',
                    color: currentPage === index + 1 ? 'white' : '#0891b2',
                    border: '2px solid #0891b2',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    minWidth: '40px'
                  }}
                >
                  {index + 1}
                </button>
              ))}
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              style={{
                padding: '8px 16px',
                background: currentPage === totalPages ? '#e2e8f0' : 'linear-gradient(135deg, #0891b2 0%, #0e7490 100%)',
                color: currentPage === totalPages ? '#94a3b8' : 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Next
            </button>

            <span style={{
              marginLeft: '12px',
              fontSize: '14px',
              color: '#64748b',
              fontWeight: '600'
            }}>
              Page {currentPage} of {totalPages}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAnalytics;