import React, { useEffect, useState } from "react";
import { Fish, Package, DollarSign, Clock, TrendingUp, TrendingDown, Minus, Calendar, User, Phone, MapPin, MessageCircle, Trophy, AlertTriangle, CheckCircle, List, BarChart3, Waves, ShoppingCart } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import './SellerHome.css';
import { useNavigate } from "react-router-dom";
import SellerMapModal from './SellerMapModal';

const SellerHome = () => {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [sellerInfo, setSellerInfo] = useState({ shop_name: "", first_name: "", last_name: "" });
  const [profile, setProfile] = useState({ logo: "" });
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [priceAnalysisData, setPriceAnalysisData] = useState([]);


  // Filter states
  const [salesPeriod, setSalesPeriod] = useState('7days'); // 7days, 30days, 90days, all
  const [categoryFilter, setCategoryFilter] = useState('all'); // all, or specific category
  const [orderStatusFilter, setOrderStatusFilter] = useState('Pending');
  const [supplyDemandData, setSupplyDemandData] = useState([]);

  // Map Modal State
  const [showMapModal, setShowMapModal] = useState(false);
  const [storeLocation, setStoreLocation] = useState(null);

  const SELLER_ID = localStorage.getItem("seller_unique_id");
  const navigate = useNavigate();

  const prepareSupplyDemandData = (productsData, ordersData) => {
    const varietyStats = {};

    // Calculate supply from products
    productsData.forEach(product => {
      const variety = product.name.toLowerCase();
      if (!varietyStats[variety]) {
        varietyStats[variety] = {
          name: product.name,
          supply: 0,
          demand: 0,
          category: product.category || 'Uncategorized'
        };
      }
      varietyStats[variety].supply += Number(product.stock);
    });

    // Calculate demand from completed orders
    ordersData
      .filter(order => order.status === 'Completed')
      .forEach(order => {
        if (order.items && Array.isArray(order.items)) {
          order.items.forEach(item => {
            const variety = item.productName.toLowerCase();
            if (varietyStats[variety]) {
              varietyStats[variety].demand += Number(item.quantity);
            }
          });
        }
      });

    // Calculate trends and sort by demand
    return Object.values(varietyStats).map(stat => ({
      name: stat.name,
      supply: stat.supply,
      demand: stat.demand,
      category: stat.category,
      ratio: stat.supply / (stat.demand || 1),
      trend: stat.supply > stat.demand * 1.5 ? 'Oversupply' :
        stat.demand > stat.supply ? 'High Demand' : 'Balanced'
    })).sort((a, b) => b.demand - a.demand);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, orderRes, profileRes, infoRes] = await Promise.all([
          fetch(`${process.env.REACT_APP_SELLER_API_URL}/api/seller/fish?seller_id=${SELLER_ID}`),
          fetch(`${process.env.REACT_APP_SELLER_API_URL}/api/orders?seller_id=${SELLER_ID}&limit=1000`),
          fetch(`${process.env.REACT_APP_SELLER_API_URL}/api/seller/profile/${SELLER_ID}`),
          fetch(`${process.env.REACT_APP_SELLER_API_URL}/api/seller/info/${SELLER_ID}`)
        ]);

        const prodData = await prodRes.json();
        const orderData = await orderRes.json();
        const profileData = await profileRes.json();
        const infoData = await infoRes.json();

        setProducts(Array.isArray(prodData) ? prodData : []);

        // Extract orders array from the response
        const ordersArray = orderData.orders || [];
        setOrders(Array.isArray(ordersArray) ? ordersArray : []);

        setProfile(profileData || {});
        setSellerInfo(infoData || {});
        const supplyDemand = prepareSupplyDemandData(Array.isArray(prodData) ? prodData : [], Array.isArray(ordersArray) ? ordersArray : []);
        setSupplyDemandData(supplyDemand);
        await fetchStoreLocation();
        await fetchPriceAnalysisData(prodData);
      } catch (err) {
        console.error("Error fetching seller data:", err);
        setProducts([]);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [SELLER_ID]);



  // Get unique categories from products
  const getCategories = () => {
    const categories = [...new Set(products.map(p => p.category || "Uncategorized"))];
    return categories;
  };

  // Filter products by category
  const getFilteredProducts = () => {
    if (categoryFilter === 'all') return products;
    return products.filter(p => p.category === categoryFilter);
  };

  const fetchStoreLocation = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_SELLER_API_URL}/api/seller/location/${SELLER_ID}`
      );
      if (response.ok) {
        const data = await response.json();
        // API returns lat/lng directly, not latitude/longitude
        if (data.lat && data.lng) {
          setStoreLocation({
            lat: parseFloat(data.lat),
            lng: parseFloat(data.lng)
          });
        }
      } else if (response.status === 404) {
        // No location set yet
        setStoreLocation(null);
      }
    } catch (error) {
      console.error('Error fetching store location:', error);
      setStoreLocation(null);
    }
  };

  const fetchPriceAnalysisData = async (productsData) => {
    try {
      const priceData = [];

      for (const product of productsData.slice(0, 5)) {
        try {
          const res = await fetch(
            `${process.env.REACT_APP_SELLER_API_URL}/api/seller/price-analysis/${product.id}?seller_id=${SELLER_ID}`
          );

          if (res.ok) {
            const data = await res.json();
            if (data.suggestions && data.suggestions.length > 0) {
              priceData.push({
                name: product.name.length > 15 ? product.name.substring(0, 15) + '...' : product.name,
                current: parseFloat(data.currentPrice),
                suggested: data.suggestions[0]?.price || parseFloat(data.currentPrice),
                min: Math.min(...data.suggestions.map(s => s.price)),
                max: Math.max(...data.suggestions.map(s => s.price))
              });
            }
          }
        } catch (err) {
          console.log(`Could not fetch price analysis for product ${product.id}`);
        }
      }

      setPriceAnalysisData(priceData);
    } catch (err) {
      console.error("Error fetching price analysis:", err);
      setPriceAnalysisData([]);
    }
  };

  // Get products by category for chart
  const getProductsByCategory = () => {
    const filteredProducts = getFilteredProducts();
    const categoryCount = {};
    filteredProducts.forEach(product => {
      const category = product.category || "Uncategorized";
      categoryCount[category] = (categoryCount[category] || 0) + 1;
    });

    return Object.entries(categoryCount).map(([name, count]) => ({
      name,
      count
    }));
  };

  // Get products for pie chart
  // const getProductsForPieChart = () => {
  //   const filteredProducts = getFilteredProducts();
  //   const categoryCount = {};
  //   filteredProducts.forEach(product => {
  //     const category = product.category || "Uncategorized";
  //     categoryCount[category] = (categoryCount[category] || 0) + 1;
  //   });

  //   return Object.entries(categoryCount).map(([name, value]) => ({
  //     name,
  //     value
  //   }));
  // };

  const COLORS = ['#0891b2', '#06b6d4', '#22d3ee', '#67e8f9', '#a5f3fc', '#cffafe'];

  // Get total revenue (completed orders only - like original code)
  const getTotalRevenue = () => {
    return orders
      .filter(o => o.status === 'Completed')
      .reduce((sum, order) => sum + Number(order.total), 0);
  };

  // Get pending revenue
  const getPendingRevenue = () => {
    return orders
      .filter(o => o.status === 'Pending')
      .reduce((sum, order) => sum + Number(order.total), 0);
  };

  // Get orders by date for chart with period filter
  const getOrdersByDate = () => {
    const dateCount = {};
    const revenueByDate = {};

    orders
      .filter(order => order.status === 'Completed')
      .forEach(order => {
        const date = new Date(order.orderDate).toISOString().split('T')[0];
        dateCount[date] = (dateCount[date] || 0) + 1;
        revenueByDate[date] = (revenueByDate[date] || 0) + Number(order.total);
      });

    // Calculate days based on period
    let days = 7;
    if (salesPeriod === '30days') days = 30;
    else if (salesPeriod === '90days') days = 90;
    else if (salesPeriod === 'all') days = 365;

    const result = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      result.push({
        date: dateStr,
        orders: dateCount[dateStr] || 0,
        revenue: revenueByDate[dateStr] || 0
      });
    }

    return result;
  };

  // Get order status distribution
  const getOrderStatusDistribution = () => {
    const statusCount = {};
    orders.forEach(order => {
      const status = order.status || "Unknown";
      statusCount[status] = (statusCount[status] || 0) + 1;
    });

    return Object.entries(statusCount).map(([name, value]) => ({
      name,
      value
    }));
  };

  // Get top selling products (only from completed orders)
  const getTopSellingProducts = () => {
    const productSales = {};

    // Only count completed orders
    orders
      .filter(order => order.status === 'Completed')
      .forEach(order => {
        if (order.items && Array.isArray(order.items)) {
          order.items.forEach(item => {
            const productName = item.productName || "Unknown";
            if (!productSales[productName]) {
              productSales[productName] = { name: productName, quantity: 0, revenue: 0 };
            }
            productSales[productName].quantity += item.quantity;
            productSales[productName].revenue += item.quantity * Number(item.price);
          });
        }
      });

    return Object.values(productSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  };

  // Get low stock products
  const getLowStockProducts = () => {
    return products
      .filter(p => p.stock < 10)
      .sort((a, b) => a.stock - b.stock)
      .slice(0, 5);
  };

  // Filter orders by selected date
  const getOrdersForDate = (date) => {
    return orders.filter(order => {
      const orderDate = new Date(order.orderDate).toISOString().split('T')[0];
      return orderDate === date;
    });
  };

  // Calculate average order value (only completed orders)
  const getAverageOrderValue = () => {
    const completedOrders = orders.filter(o => o.status === 'Completed');
    if (completedOrders.length === 0) return 0;
    const total = completedOrders.reduce((sum, order) => sum + Number(order.total), 0);
    return total / completedOrders.length;
  };

  // Get order growth percentage (only completed orders)
  const getOrderGrowth = () => {
    const today = new Date();
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000);

    const lastWeekOrders = orders.filter(o => {
      const orderDate = new Date(o.orderDate);
      return o.status === 'Completed' && orderDate >= lastWeek && orderDate < today;
    }).length;

    const previousWeekOrders = orders.filter(o => {
      const orderDate = new Date(o.orderDate);
      return o.status === 'Completed' && orderDate >= twoWeeksAgo && orderDate < lastWeek;
    }).length;

    if (previousWeekOrders === 0) return lastWeekOrders > 0 ? 100 : 0;
    return ((lastWeekOrders - previousWeekOrders) / previousWeekOrders * 100).toFixed(1);
  };

  const pendingOrders = orderStatusFilter === 'all'
    ? orders
    : orders.filter(o => o.status === orderStatusFilter);
  const ordersForSelectedDate = getOrdersForDate(selectedDate);
  const orderGrowth = getOrderGrowth();

  const getFileUrl = (path) => {
    if (!path) return "https://via.placeholder.com/100";
    const normalized = path.replace(/^\/+/, '').replace(/^uploads\//, '');
    return `${process.env.REACT_APP_SELLER_API_URL}/uploads/${normalized}`;
  };

  const handleNavigateToPriceAnalysis = () => {
    navigate('/seller/dashboard/price');
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="seller-home">
      {/* Top Bar with Shop Info */}
      <div className="top-bar">
        <div className="shop-branding">
          <img
            src={getFileUrl(profile.logo)}
            alt="Shop Logo"
            className="shop-logo"
          />
          <div className="shop-info">
            <h1 className="shop-name">{sellerInfo.shop_name || "Your Shop"}</h1>
            <p className="shop-owner">
              {sellerInfo.first_name} {sellerInfo.middle_name} {sellerInfo.last_name}
            </p>
          </div>
        </div>

        <div className="user-profile">
          <span className="seller-id">ID: {SELLER_ID}</span>
          <button
            onClick={() => setShowMapModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              background: storeLocation
                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '25px',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
              transition: 'all 0.3s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.3)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
            }}
          >
            <MapPin size={16} />
            {storeLocation ? 'Update Location' : 'Set Location'}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div
          className="stat-card stat-products"
          onClick={() => navigate('/seller/dashboard/products')}
          style={{ cursor: 'pointer' }}
        >
          <div className="stat-icon-wrapper">
            <Fish className="stat-icon" size={24} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Total Products</p>
            <h2 className="stat-value">{products.length}</h2>
            <p className="stat-subtext">{getLowStockProducts().length} low stock items</p>
          </div>
        </div>

        <div
          className="stat-card stat-orders"
          onClick={() => navigate('/seller/dashboard/orders')}
          style={{ cursor: 'pointer' }}
        >
          <div className="stat-icon-wrapper">
            <Package className="stat-icon" size={24} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Total Orders</p>
            <h2 className="stat-value">{orders.length}</h2>
            <p className="stat-subtext">
              {orderGrowth > 0 ? <TrendingUp size={14} /> : orderGrowth < 0 ? <TrendingDown size={14} /> : <Minus size={14} />}
              {orderGrowth}% vs last week
            </p>
          </div>
        </div>

        <div
          className="stat-card stat-revenue"
          onClick={() => navigate('/seller/dashboard/reports')}
          style={{ cursor: 'pointer' }}
        >
          <div className="stat-icon-wrapper">
            <DollarSign className="stat-icon" size={24} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Revenue</p>
            <h2 className="stat-value">₱{getTotalRevenue().toLocaleString()}</h2>
            <p className="stat-subtext">From completed orders</p>
          </div>
        </div>

        <div
          className="stat-card stat-pending"
          onClick={() => navigate('/seller/dashboard/orders')}
          style={{
            background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
            borderLeft: '4px solid #f59e0b',
            cursor: 'pointer'
          }}
        >
          <div className="stat-icon-wrapper">
            <Clock className="stat-icon" size={24} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Pending Orders</p>
            <h2 className="stat-value">{pendingOrders.length}</h2>
            <p className="stat-subtext">₱{getPendingRevenue().toLocaleString()} pending</p>
          </div>
        </div>
      </div>


      {/* Main Content Grid */}
      <div className="content-grid">
        <div className="chart-card chart-large">
          <div
            className="card-header clickable-header"
            onClick={() => navigate('/seller/dashboard/reports')}
            style={{ cursor: 'pointer' }}
          >
            <h3><Waves size={18} style={{ display: 'inline', marginRight: '8px' }} /> Sales & Revenue Overview</h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <select
                value={salesPeriod}
                onChange={(e) => {
                  e.stopPropagation(); // Prevent navigation when clicking select
                  setSalesPeriod(e.target.value);
                }}
                className="chart-filter"
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: '2px solid #cbd5e1',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  background: 'white'
                }}
              >
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
                <option value="90days">Last 90 Days</option>
                <option value="all">All Time</option>
              </select>
            </div>
          </div>
          <div className="chart-content">
            {orders.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={getOrdersByDate()} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0891b2" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#0891b2" stopOpacity={0.1} />
                    </linearGradient>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis
                    dataKey="date"
                    stroke="#6b7280"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <YAxis
                    yAxisId="left"
                    stroke="#6b7280"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
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
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="orders"
                    stroke="#0891b2"
                    strokeWidth={2}
                    fill="url(#colorOrders)"
                    name="Orders"
                  />
                  <Area
                    yAxisId="right"
                    type="monotone"
                    dataKey="revenue"
                    stroke="#10b981"
                    strokeWidth={2}
                    fill="url(#colorRevenue)"
                    name="Revenue (₱)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state">
                <p><Waves size={18} style={{ display: 'inline', marginRight: '8px' }} /> No order data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Order Status Distribution */}
        <div className="chart-card">
          <div
            className="card-header clickable-header"
            onClick={() => navigate('/seller/dashboard/orders')}
            style={{ cursor: 'pointer' }}
          >
            <h3><BarChart3 size={18} style={{ display: 'inline', marginRight: '8px' }} /> Order Status</h3>
          </div>
          <div className="chart-content pie-chart-container">
            {orders.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={getOrderStatusDistribution()}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {getOrderStatusDistribution().map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                          stroke="white"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        padding: '8px 12px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        fontSize: '12px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pie-legend">
                  {getOrderStatusDistribution().map((entry, index) => (
                    <div key={index} className="legend-item">
                      <span
                        className="legend-color"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      ></span>
                      <span className="legend-text">{entry.name}</span>
                      <span className="legend-value">{entry.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="empty-state">
                <p><BarChart3 size={18} style={{ display: 'inline', marginRight: '8px' }} /> No order data</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Price Analysis Chart */}
      <div className="price-analysis-card" onClick={handleNavigateToPriceAnalysis}>
        <div className="card-header clickable-header">
          <h3><TrendingUp size={18} style={{ display: 'inline', marginRight: '8px' }} /> Price Analysis Overview</h3>
          <span className="chart-period" style={{ fontSize: '11px', color: '#64748b' }}>
            Click to view detailed analysis →
          </span>
        </div>
        <div className="chart-content">
          {priceAnalysisData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={priceAnalysisData} margin={{ top: 10, right: 10, left: -20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="#6b7280"
                  fontSize={10}
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
                  formatter={(value) => [`₱${value.toFixed(2)}`, '']}
                />
                <Legend />
                <Bar dataKey="current" fill="#0891b2" name="Current Price" radius={[8, 8, 0, 0]} />
                <Bar dataKey="suggested" fill="#10b981" name="Suggested Price" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state">
              <p><TrendingUp size={18} style={{ display: 'inline', marginRight: '8px' }} /> Update prices 3+ times to see analysis</p>
            </div>
          )}
        </div>
      </div>

      <div className="chart-card" style={{ marginTop: '28px' }}>
        <div
          className="card-header clickable-header"
          onClick={() => navigate('/seller/dashboard/stock')}
          style={{ cursor: 'pointer' }}
        >
          <h3><BarChart3 size={18} style={{ display: 'inline', marginRight: '8px' }} /> Supply vs Demand Analysis</h3>
          <span className="chart-period">Fish Varieties Overview</span>
        </div>
        <div className="chart-content">
          {supplyDemandData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={supplyDemandData.slice(0, 10)} margin={{ top: 10, right: 30, left: 0, bottom: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    fontSize={11}
                    stroke="#6b7280"
                    tickLine={false}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <YAxis
                    fontSize={11}
                    stroke="#6b7280"
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
                          <div style={{ fontWeight: '700', marginBottom: '8px' }}>{item.name}</div>
                          <div style={{ fontSize: '12px', marginBottom: '4px' }}>
                            Supply: <strong>{item.supply}</strong> units
                          </div>
                          <div style={{ fontSize: '12px', marginBottom: '4px' }}>
                            Demand: <strong>{item.demand}</strong> units
                          </div>
                          <div style={{ fontSize: '12px', marginBottom: '4px' }}>
                            Category: <strong>{item.category}</strong>
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

              {/* Insights Cards */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '16px',
                marginTop: '24px'
              }}>
                {/* High Demand Items */}
                {supplyDemandData.filter(item => item.trend === 'High Demand').length > 0 && (
                  <div style={{
                    background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
                    padding: '16px',
                    borderRadius: '12px',
                    border: '2px solid #fca5a5'
                  }}>
                    <h4 style={{
                      margin: '0 0 12px 0',
                      fontSize: '14px',
                      fontWeight: '800',
                      color: '#991b1b',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <TrendingUp size={16} />
                      High Demand Items
                    </h4>
                    {supplyDemandData.filter(item => item.trend === 'High Demand').slice(0, 3).map((item, idx) => (
                      <div key={idx} style={{
                        fontSize: '12px',
                        color: '#7f1d1d',
                        marginBottom: '6px',
                        fontWeight: '600'
                      }}>
                        • {item.name}: {item.demand} sold vs {item.supply} in stock
                      </div>
                    ))}
                  </div>
                )}

                {/* Oversupply Items */}
                {supplyDemandData.filter(item => item.trend === 'Oversupply').length > 0 && (
                  <div style={{
                    background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                    padding: '16px',
                    borderRadius: '12px',
                    border: '2px solid #93c5fd'
                  }}>
                    <h4 style={{
                      margin: '0 0 12px 0',
                      fontSize: '14px',
                      fontWeight: '800',
                      color: '#1e40af',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <Package size={16} />
                      Oversupply Items
                    </h4>
                    {supplyDemandData.filter(item => item.trend === 'Oversupply').slice(0, 3).map((item, idx) => (
                      <div key={idx} style={{
                        fontSize: '12px',
                        color: '#1e3a8a',
                        marginBottom: '6px',
                        fontWeight: '600'
                      }}>
                        • {item.name}: {item.supply} in stock vs {item.demand} sold
                      </div>
                    ))}
                  </div>
                )}

                {/* Balanced Items */}
                {supplyDemandData.filter(item => item.trend === 'Balanced').length > 0 && (
                  <div style={{
                    background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
                    padding: '16px',
                    borderRadius: '12px',
                    border: '2px solid #6ee7b7'
                  }}>
                    <h4 style={{
                      margin: '0 0 12px 0',
                      fontSize: '14px',
                      fontWeight: '800',
                      color: '#065f46',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <CheckCircle size={16} />
                      Well-Balanced Items
                    </h4>
                    {supplyDemandData.filter(item => item.trend === 'Balanced').slice(0, 3).map((item, idx) => (
                      <div key={idx} style={{
                        fontSize: '12px',
                        color: '#064e3b',
                        marginBottom: '6px',
                        fontWeight: '600'
                      }}>
                        • {item.name}: {item.supply} stock, {item.demand} sold
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="empty-state">
              <p><BarChart3 size={18} style={{ display: 'inline', marginRight: '8px' }} /> No supply/demand data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Product Distribution with Filter */}
      <div className="chart-card">
        <div
          className="card-header clickable-header"
          onClick={() => navigate('/seller/dashboard/products')}
          style={{ cursor: 'pointer' }}
        >
          <h3><Fish size={18} style={{ display: 'inline', marginRight: '8px' }} /> Products by Category</h3>
          <select
            value={categoryFilter}
            onChange={(e) => {
              e.stopPropagation(); // Prevent navigation when clicking select
              setCategoryFilter(e.target.value);
            }}
            className="chart-filter"
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              border: '2px solid #cbd5e1',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              background: 'white'
            }}
          >
            <option value="all">All Categories</option>
            {getCategories().map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        <div className="chart-content">
          {products.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={getProductsByCategory()} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis
                  dataKey="name"
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
                    padding: '8px 12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                  }}
                />
                <Bar
                  dataKey="count"
                  fill="#0891b2"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state">
              <p><Fish size={18} style={{ display: 'inline', marginRight: '8px' }} /> No product data</p>
            </div>
          )}
        </div>
      </div>

      {/* Secondary Analytics Row */}
      <div className="content-grid">

        {/* Top Selling Products */}
        <div className="chart-card">
          <div
            className="card-header clickable-header"
            onClick={() => navigate('/seller/dashboard/products')}
            style={{ cursor: 'pointer' }}
          >
            <h3><Trophy size={18} style={{ display: 'inline', marginRight: '8px' }} /> Top Selling Products</h3>
          </div>
          <div className="chart-content">
            {getTopSellingProducts().length > 0 ? (
              <div style={{ padding: '10px 0' }}>
                {getTopSellingProducts().map((product, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px',
                    marginBottom: '8px',
                    background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                    borderRadius: '8px',
                    borderLeft: '3px solid #0891b2'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '700', fontSize: '13px', color: '#0f172a', marginBottom: '4px' }}>
                        #{index + 1} {product.name}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        {product.quantity} sold • ₱{product.revenue.toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>🏆 No sales data yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="chart-card" style={{ borderTop: '3px solid #ef4444' }}>
          <div
            className="card-header clickable-header"
            onClick={() => navigate('/seller/dashboard/stock')}
            style={{ cursor: 'pointer' }}
          >
            <h3><AlertTriangle size={18} style={{ display: 'inline', marginRight: '8px' }} /> Low Stock Alert</h3>
          </div>
          <div className="chart-content">
            {getLowStockProducts().length > 0 ? (
              <div style={{ padding: '10px 0' }}>
                {getLowStockProducts().map((product, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px',
                    marginBottom: '8px',
                    background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
                    borderRadius: '8px',
                    borderLeft: '3px solid #ef4444'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '700', fontSize: '13px', color: '#0f172a', marginBottom: '4px' }}>
                        {product.name}
                      </div>
                      <div style={{ fontSize: '11px', color: '#dc2626' }}>
                        Only {product.stock} {product.unit || 'units'} left
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p><CheckCircle size={48} color="#10b981" /> All products well stocked</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Calendar Section */}
      <div className="calendar-section">
        <div className="calendar-card">
          <div
            className="card-header clickable-header"
            onClick={() => navigate('/seller/dashboard/orders')}
            style={{ cursor: 'pointer' }}
          >
            <h3><Calendar size={18} style={{ display: 'inline', marginRight: '8px' }} /> Orders by Date</h3>
            <div
              className="date-picker-wrapper"
              onClick={(e) => e.stopPropagation()} // Prevent navigation when clicking date picker
            >
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="date-picker"
              />
              <span className="order-count-badge">
                {ordersForSelectedDate.length}
              </span>
            </div>
          </div>

          <div className="orders-list">
            {ordersForSelectedDate.length > 0 ? (
              ordersForSelectedDate.map(order => (
                <div key={order.orderId} className="order-item-compact">
                  <div className="order-left">
                    <div className="order-id-compact">#{order.orderId}</div>
                    <div className="order-customer-compact">{order.customerName}</div>
                    <div className="order-details-compact">
                      {order.items.length} items • {order.contact}
                    </div>
                  </div>
                  <div className="order-right">
                    <span className={`order-status-compact status-${order.status.toLowerCase().replace(' ', '-')}`}>
                      {order.status}
                    </span>
                    <div className="order-amount-compact">
                      ₱{Number(order.total).toFixed(2)}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state-inline">
                <p>No orders on {new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Orders Section with Filter */}
      <div className="pending-orders-section">
        <div className="section-header">
          <h3
            className="clickable-header"
            onClick={() => navigate('/seller/dashboard/orders')}
            style={{ cursor: 'pointer' }}
          >
            <List size={18} style={{ display: 'inline', marginRight: '8px' }} /> Orders
          </h3>
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '12px' }}
            onClick={(e) => e.stopPropagation()} // Prevent navigation when clicking filter
          >
            <select
              value={orderStatusFilter}
              onChange={(e) => setOrderStatusFilter(e.target.value)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: '2px solid #cbd5e1',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                background: 'white'
              }}
            >
              <option value="all">All Orders</option>
              <option value="Pending">Pending</option>
              <option value="Preparing">Preparing</option>
              <option value="Ready for Pickup">Ready for Pickup</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
            <span className="pending-count">{pendingOrders.length}</span>
          </div>
        </div>

        <div className="pending-orders-grid">
          {pendingOrders.length > 0 ? (
            pendingOrders.map(order => (
              <div key={order.orderId} className="pending-order-card">
                <div className="pending-order-header">
                  <div className="pending-order-id-section">
                    <span className="pending-order-number">#{order.orderId}</span>
                    <span
                      className="pending-badge"
                      style={{
                        color: '#fff',
                        backgroundColor:
                          order.status === 'Completed' ? '#10b981' :
                            order.status === 'Preparing' ? '#3ec7d1ff' :
                              order.status === 'Ready for Pickup' ? '#3b82f6' :
                                order.status === 'Cancelled' ? '#ef4444' :
                                  '#4e6986ff'
                      }}
                    >
                      {order.status.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="pending-order-body">
                  <div className="customer-section">
                    <div className="customer-name-compact"><User size={14} style={{ display: 'inline', marginRight: '4px' }} /> {order.customerName}</div>
                    <div className="customer-detail"><Phone size={14} style={{ display: 'inline', marginRight: '4px' }} /> {order.contact}</div>
                    <div className="customer-detail"><MapPin size={14} style={{ display: 'inline', marginRight: '4px' }} /> {order.address}</div>
                  </div>

                  <div className="order-summary">
                    <div className="summary-row">
                      <span className="summary-label">Items:</span>
                      <span className="summary-value">{order.items.length}</span>
                    </div>
                    <div className="summary-row">
                      <span className="summary-label">Payment:</span>
                      <span className="summary-value">{order.paymentMode}</span>
                    </div>
                    {order.notes && (
                      <div className="order-notes-compact">
                        <MessageCircle size={14} style={{ display: 'inline', marginRight: '4px' }} /> {order.notes}
                      </div>
                    )}
                  </div>

                  <div className="order-footer-info">
                    <span className="order-time">
                      {new Date(order.orderDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      })} • {new Date(order.orderDate).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                    <span className="order-total-compact">₱{Number(order.total).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-pending">
              <div className="empty-icon"><ShoppingCart size={48} color="#0891b2" /></div>
              <h4>No Orders Found!</h4>
              <p>No {orderStatusFilter === 'all' ? '' : orderStatusFilter.toLowerCase()} orders at the moment</p>
            </div>
          )}
        </div>
      </div>

      {/* Map Modal */}
      <SellerMapModal
        isOpen={showMapModal}
        onClose={() => setShowMapModal(false)}
        sellerId={SELLER_ID}
        currentLocation={storeLocation}
        onSave={(location) => {
          setStoreLocation(location);
          fetchStoreLocation();
        }}
      />
    </div>
  );
};

export default SellerHome;