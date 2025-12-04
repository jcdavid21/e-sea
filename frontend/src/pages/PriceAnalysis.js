import React, { useEffect, useState } from "react";
import {
  FiTrendingUp,
  FiTrendingDown,
  FiMinus,
  FiDollarSign,
  FiPackage,
  FiCalendar,
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiPercent,
  FiEdit3,
  FiStar
} from "react-icons/fi";
import Swal from "sweetalert2";

const API_BASE_URL = "http://localhost:5001";

function PriceAnalysis() {
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [analysisData, setAnalysisData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [costPrice, setCostPrice] = useState(0);

  const SELLER_ID = localStorage.getItem("seller_unique_id");

  // Fetch all products
  useEffect(() => {
    if (!SELLER_ID) {
      Swal.fire({
        icon: 'error',
        title: 'Authentication Required',
        text: 'Please log in to continue',
        confirmButtonColor: '#1e3c72'
      });
      return;
    }
    
    const fetchProducts = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/api/seller/fish?seller_id=${encodeURIComponent(SELLER_ID)}`
        );
        if (!res.ok) throw new Error("Failed to fetch products.");
        const data = await res.json();
        setProducts(data);
      } catch (err) {
        console.error("Failed to load products:", err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to load products',
          confirmButtonColor: '#1e3c72'
        });
      }
    };
    
    fetchProducts();
  }, [SELLER_ID]);

  // Fetch analysis data for selected product
  const fetchPriceAnalysis = async (productId) => {
    if (!productId || !SELLER_ID) return;

    setLoading(true);
    setAnalysisData(null);
    
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/seller/price-analysis/${productId}?seller_id=${encodeURIComponent(SELLER_ID)}`
      );
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to fetch analysis.");
      }
      
      const data = await res.json();
      setAnalysisData(data);
      
    } catch (err) {
      console.error("Failed to load price analysis:", err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.message || 'Failed to load price analysis',
        confirmButtonColor: '#1e3c72'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewAnalysis = (productId) => {
    setSelectedProductId(productId);
    setCostPrice(0); 
    fetchPriceAnalysis(productId);
  };

  // Handle suggestion acceptance
  const handleApplySuggestion = async (suggestion) => {
    const newPrice = suggestion.price;
    
    const result = await Swal.fire({
      title: 'Apply Suggested Price?',
      html: `
        <div style="text-align: left; padding: 10px;">
          <p style="margin: 10px 0;"><strong>New Price:</strong> ₱${newPrice.toFixed(2)}/kg</p>
          <p style="margin: 10px 0;"><strong>Strategy:</strong> ${suggestion.label}</p>
          ${costPrice > 0 ? `<p style="margin: 10px 0;"><strong>Profit Margin:</strong> ${suggestion.margin.toFixed(1)}%</p>` : ''}
          <p style="margin: 10px 0; color: #666; font-size: 14px;">This will update your product price in stock management.</p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#1e3c72',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, apply it!',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/seller/fish/${selectedProductId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            price: newPrice, 
            seller_id: SELLER_ID 
          }),
        }
      );

      const data = await res.json();

      if (res.ok) {
        await Swal.fire({
          icon: 'success',
          title: 'Price Updated!',
          html: `Price successfully updated to <strong>₱${newPrice.toFixed(2)}/kg</strong>`,
          confirmButtonColor: '#1e3c72',
          timer: 2000,
          showConfirmButton: false
        });
        
        setProducts(prev => 
          prev.map(p => 
            p.id === parseInt(selectedProductId) 
              ? { ...p, price: newPrice } 
              : p
          )
        );
        
        setTimeout(() => fetchPriceAnalysis(selectedProductId), 800);
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Update Failed',
          text: data.message || 'Failed to update price',
          confirmButtonColor: '#1e3c72'
        });
      }
    } catch (err) {
      console.error("Failed to apply suggestion:", err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to communicate with server',
        confirmButtonColor: '#1e3c72'
      });
    }
  };

  const getTrendInfo = (history, currentPrice) => {
    if (history.length === 0) {
      return { icon: <FiStar />, text: 'New Product', class: 'new' };
    }
    
    const lastChange = history[0];
    const oldPrice = Number(lastChange.old_price);
    
    if (currentPrice > oldPrice) {
      return { icon: <FiTrendingUp />, text: 'Price Increased', class: 'up' };
    } else if (currentPrice < oldPrice) {
      return { icon: <FiTrendingDown />, text: 'Price Decreased', class: 'down' };
    } else {
      return { icon: <FiMinus />, text: 'Stable', class: 'stable' };
    }
  };

  const renderAnalysisDetails = () => {
    if (!selectedProductId) {
      return (
        <div className="empty-state">
          <FiPackage size={64} />
          <h3>No Product Selected</h3>
          <p>Select a product from the list to view its price analysis and recommendations</p>
        </div>
      );
    }

    if (loading) {
      return (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading analysis...</p>
        </div>
      );
    }

    if (!analysisData) return null;

    const { 
      productName, 
      currentPrice, 
      totalUpdates, 
      history, 
      suggestions,
      canGenerateSuggestions 
    } = analysisData;

    const trendInfo = getTrendInfo(history, currentPrice);

    return (
      <div className="analysis-content">
        <div className="analysis-header">
          <div className="header-left">
            <h2>{productName}</h2>
            <div className={`trend-badge trend-${trendInfo.class}`}>
              {trendInfo.icon}
              <span>{trendInfo.text}</span>
            </div>
          </div>
        </div>
        
        <div className="stats-grid">
          <div className="stat-card primary">
            <div className="stat-icon">
              <FiDollarSign />
            </div>
            <div className="stat-info">
              <span className="stat-label">Current Price</span>
              <span className="stat-value">₱{parseFloat(currentPrice).toFixed(2)}<small>/kg</small></span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <FiEdit3 />
            </div>
            <div className="stat-info">
              <span className="stat-label">Total Updates</span>
              <span className="stat-value">{totalUpdates}</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <FiClock />
            </div>
            <div className="stat-info">
              <span className="stat-label">Price Changes</span>
              <span className="stat-value">{history.length}</span>
            </div>
          </div>
        </div>
        
        <div className="suggestions-section">
          <div className="section-header">
            <div className="header-title">
              <FiTrendingUp size={20} />
              <h3>Price Recommendations</h3>
            </div>
          </div>
          
          <div className="cost-input-card">
            <label htmlFor="cost-price">
              <FiDollarSign />
              <span>Cost Price per Kilo (Optional)</span>
            </label>
            <div className="input-wrapper">
              <span className="currency">₱</span>
              <input
                id="cost-price"
                type="text"
                inputMode="decimal"
                value={costPrice > 0 ? costPrice : ''}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9.]/g, '');
                  setCostPrice(parseFloat(value) || 0);
                }}
                placeholder="Enter your cost price (e.g., 100.00)"
              />
            </div>
            <small className="input-hint">
              {costPrice > 0 
                ? `Cost: ₱${costPrice.toFixed(2)}/kg - Profit margins will be calculated` 
                : 'Enter the amount you paid per kilo to see profit margins'}
            </small>
          </div>
          
          {!canGenerateSuggestions ? (
            <div className="notice-card">
              <div className="notice-icon">
                <FiAlertCircle size={24} />
              </div>
              <div className="notice-content">
                <h4>Recommendations Not Available Yet</h4>
                <p>Update your price <strong>3 times</strong> to unlock AI-powered pricing suggestions</p>
                <div className="progress-container">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{width: `${(totalUpdates / 3) * 100}%`}}
                    ></div>
                  </div>
                  <span className="progress-label">{totalUpdates}/3 Updates</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="suggestions-grid">
              {suggestions.map((s, index) => {
                const isCurrentPrice = Math.abs(s.price - currentPrice) < 0.01;
                const difference = s.price - currentPrice;
                const profit = costPrice > 0 ? s.price - costPrice : null;
                const profitPercentage = costPrice > 0 ? ((profit / costPrice) * 100) : null;
                
                return (
                  <div key={index} className={`suggestion-card ${isCurrentPrice ? 'current' : ''}`}>
                    <div className="suggestion-header">
                      <span className="suggestion-number">#{index + 1}</span>
                      {isCurrentPrice && (
                        <span className="current-badge">
                          <FiCheckCircle />
                          Current
                        </span>
                      )}
                    </div>
                    
                    <h4 className="suggestion-label">{s.label}</h4>
                    
                    <div className="suggestion-price">
                      ₱{s.price.toFixed(2)}<small>/kg</small>
                    </div>
                    
                    {costPrice > 0 && (
                      <div className={`profit-info ${profit > 0 ? 'profit' : profit < 0 ? 'loss' : 'breakeven'}`}>
                        <div className="profit-label">
                          <FiPercent size={14} />
                          {profit > 0 ? 'Profit Margin' : profit < 0 ? 'Loss' : 'Break-even'}
                        </div>
                        <div className="profit-amount">
                          ₱{Math.abs(profit).toFixed(2)}/kg
                        </div>
                        {profitPercentage !== null && (
                          <div className="profit-percent">
                            ({profit > 0 ? '+' : ''}{profitPercentage.toFixed(1)}%)
                          </div>
                        )}
                      </div>
                    )}
                    
                    {!isCurrentPrice && (
                      <div className={`price-change ${difference > 0 ? 'increase' : 'decrease'}`}>
                        {difference > 0 ? <FiTrendingUp /> : <FiTrendingDown />}
                        {difference > 0 ? '+' : ''}₱{difference.toFixed(2)} vs current
                      </div>
                    )}
                    
                    <button 
                      onClick={() => handleApplySuggestion(s)}
                      className={`apply-btn ${isCurrentPrice ? 'disabled' : ''}`}
                      disabled={isCurrentPrice}
                    >
                      {isCurrentPrice ? (
                        <>
                          <FiCheckCircle />
                          Active Price
                        </>
                      ) : (
                        <>
                          <FiEdit3 />
                          Apply Price
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        <div className="history-section">
          <div className="section-header">
            <div className="header-title">
              <FiCalendar size={20} />
              <h3>Price History</h3>
            </div>
          </div>
          
          {history.length === 0 ? (
            <div className="empty-history">
              <FiClock size={48} />
              <p>No price changes recorded yet</p>
            </div>
          ) : (
            <div className="history-table-wrapper">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Date & Time</th>
                    <th>Previous Price</th>
                    <th>New Price</th>
                    <th>Change</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h, index) => {
                    const oldPrice = Number(h.old_price);
                    const newPrice = Number(h.new_price);
                    const difference = newPrice - oldPrice;
                    const isIncrease = difference > 0;
                    const isDecrease = difference < 0;
                    
                    return (
                      <tr key={index}>
                        <td>
                          <div className="date-cell">
                            <span className="date">
                              {new Date(h.change_date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </span>
                            <span className="time">
                              {new Date(h.change_date).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        </td>
                        <td className="price-cell">₱{oldPrice.toFixed(2)}</td>
                        <td className="price-cell">₱{newPrice.toFixed(2)}</td>
                        <td>
                          <div className={`change-badge ${isIncrease ? 'increase' : isDecrease ? 'decrease' : 'neutral'}`}>
                            {isIncrease ? <FiTrendingUp /> : isDecrease ? <FiTrendingDown /> : <FiMinus />}
                            <span>{isIncrease ? '+' : ''}₱{difference.toFixed(2)}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="price-analysis-container">
      <div className="page-header">
        <div className="header-content">
          <FiTrendingUp size={32} className="header-icon" />
          <div>
            <h1>Price Analysis</h1>
            <p className="header-subtitle">Track pricing trends and get smart recommendations</p>
          </div>
        </div>
        <div className="products-count">
          <span className="count-number">{products.length}</span>
          <span className="count-label">Products</span>
        </div>
      </div>

      <div className="content-layout">
        <div className="products-panel">
          <div className="panel-header">
            <FiPackage size={20} />
            <h3>Your Products</h3>
          </div>
          
          {products.length === 0 ? (
            <div className="empty-products">
              <FiPackage size={48} />
              <p>No products available</p>
              <small>Add products in Stock Management</small>
            </div>
          ) : (
            <div className="products-list">
              {products.map((product) => (
                <div 
                  key={product.id}
                  className={`product-item ${selectedProductId === product.id ? 'selected' : ''}`}
                  onClick={() => handleViewAnalysis(product.id)}
                >
                  <div className="product-info">
                    <h4>{product.name}</h4>
                    <span className="product-category">{product.category || 'Uncategorized'}</span>
                  </div>
                  <div className="product-details">
                    <div className="product-price">₱{parseFloat(product.price).toFixed(2)}/kg</div>
                    <div className="product-stock">{product.stock}kg</div>
                  </div>
                  <button className="view-analysis-btn">
                    {selectedProductId === product.id ? (
                      <>
                        <FiCheckCircle />
                        Viewing
                      </>
                    ) : (
                      <>
                        <FiTrendingUp />
                        Analyze
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="analysis-panel">
          {renderAnalysisDetails()}
        </div>
      </div>

      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .price-analysis-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 32px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          background: #f8f9fa;
          min-height: 100vh;
        }

        .page-header {
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

        .page-header h1 {
          font-size: 28px;
          font-weight: 700;
          margin-bottom: 4px;
        }

        .header-subtitle {
          font-size: 14px;
          opacity: 0.9;
        }

        .products-count {
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

        .content-layout {
          display: grid;
          grid-template-columns: 400px 1fr;
          gap: 24px;
          align-items: start;
        }

        .products-panel,
        .analysis-panel {
          background: white;
          border-radius: 16px;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
          overflow: hidden;
        }

        .panel-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 20px 24px;
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          border-bottom: 2px solid #1e3c72;
        }

        .panel-header h3 {
          font-size: 16px;
          font-weight: 600;
          color: #1e3c72;
          margin: 0;
        }

        .empty-products {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 64px 32px;
          text-align: center;
          color: #6c757d;
        }

        .empty-products svg {
          color: #dee2e6;
          margin-bottom: 16px;
        }

        .empty-products p {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .empty-products small {
          font-size: 14px;
          color: #adb5bd;
        }

        .products-list {
          max-height: calc(100vh - 280px);
          overflow-y: auto;
        }

        .product-item {
          padding: 20px 24px;
          border-bottom: 1px solid #e9ecef;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .product-item:hover {
          background: #f8f9fa;
        }

        .product-item.selected {
          background: #e7f3ff;
          border-left: 4px solid #1e3c72;
        }

        .product-info h4 {
          font-size: 15px;
          font-weight: 600;
          color: #212529;
          margin-bottom: 4px;
        }

        .product-category {
          font-size: 12px;
          color: #6c757d;
        }

        .product-details {
          display: flex;
          gap: 16px;
          margin: 12px 0;
        }

        .product-price {
          font-size: 16px;
          font-weight: 700;
          color: #1e3c72;
        }

        .product-stock {
          font-size: 14px;
          color: #6c757d;
        }

        .view-analysis-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          padding: 10px 16px;
          background: #1e3c72;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          justify-content: center;
        }

        .view-analysis-btn:hover {
          background: #16325a;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(30, 60, 114, 0.3);
        }

        .product-item.selected .view-analysis-btn {
          background: #28a745;
        }

        .empty-state,
        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 64px 32px;
          text-align: center;
          min-height: 500px;
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

        .loading-state p {
          font-size: 16px;
          color: #6c757d;
        }

        .analysis-content {
          padding: 24px;
        }

        .analysis-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          padding-bottom: 20px;
          border-bottom: 2px solid #e9ecef;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .analysis-header h2 {
          font-size: 24px;
          font-weight: 700;
          color: #212529;
          margin: 0;
        }

        .trend-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 600;
        }

        .trend-new {
          background: #e3f2fd;
          color: #1976d2;
        }

        .trend-up {
          background: #e8f5e9;
          color: #2e7d32;
        }

        .trend-down {
          background: #fff3e0;
          color: #f57c00;
        }

        .trend-stable {
          background: #e0f2f1;
          color: #00796b;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }

        .stat-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 20px;
          background: #f8f9fa;
          border-radius: 12px;
          border: 2px solid #e9ecef;
          transition: all 0.2s ease;
        }

        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .stat-card.primary {
          background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
          color: white;
          border-color: #1e3c72;
        }

        .stat-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          font-size: 24px;
        }

        .stat-card.primary .stat-icon {
          background: rgba(255, 255, 255, 0.2);
        }

        .stat-info {
          display: flex;
          flex-direction: column;
        }

        .stat-label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: 600;
          opacity: 0.7;
          margin-bottom: 4px;
        }

        .stat-value {
          font-size: 24px;
          font-weight: 700;
          line-height: 1;
        }

        .stat-card.primary .stat-label,
        .stat-card.primary .stat-value {
          color: white;
        }

        .stat-value small {
          font-size: 14px;
          font-weight: 500;
          opacity: 0.8;
        }

        .suggestions-section,
        .history-section {
          margin-bottom: 24px;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .header-title {
          display: flex;
          align-items: center;
          gap: 12px;
          color: #1e3c72;
        }

        .header-title h3 {
          font-size: 18px;
          font-weight: 600;
          margin: 0;
        }

        .cost-input-card {
          padding: 20px;
          background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
          border-radius: 12px;
          margin-bottom: 20px;
          border: 2px solid #ffb74d;
        }

        .cost-input-card label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 600;
          color: #e65100;
          margin-bottom: 12px;
        }

        .input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .currency {
          position: absolute;
          left: 16px;
          font-size: 16px;
          font-weight: 600;
          color: #f57c00;
        }

        .cost-input-card input {
          width: 100%;
          padding: 12px 16px 12px 36px;
          border: 2px solid #ffb74d;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          color: #e65100;
          background: white;
          transition: all 0.2s ease;
        }

        .cost-input-card input:focus {
          outline: none;
          border-color: #f57c00;
          box-shadow: 0 0 0 3px rgba(245, 124, 0, 0.1);
        }

        .cost-input-card input::placeholder {
          color: #ffb74d;
          font-weight: 500;
        }

        .input-hint {
          display: block;
          margin-top: 8px;
          font-size: 12px;
          color: #f57c00;
          font-weight: 500;
        }

        .notice-card {
          display: flex;
          gap: 16px;
          padding: 24px;
          background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
          border: 2px solid #ffb74d;
          border-radius: 12px;
        }

        .notice-icon {
          color: #f57c00;
          flex-shrink: 0;
        }

        .notice-content h4 {
          font-size: 16px;
          font-weight: 600;
          color: #e65100;
          margin-bottom: 8px;
        }

        .notice-content p {
          font-size: 14px;
          color: #f57c00;
          margin-bottom: 16px;
        }

        .notice-content strong {
          font-weight: 700;
        }

        .progress-container {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .progress-bar {
          flex: 1;
          height: 8px;
          background: rgba(255, 183, 77, 0.3);
          border-radius: 4px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #ff9800 0%, #f57c00 100%);
          border-radius: 4px;
          transition: width 0.3s ease;
        }

        .progress-label {
          font-size: 13px;
          font-weight: 600;
          color: #f57c00;
          white-space: nowrap;
        }

        .suggestions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 16px;
        }

        .suggestion-card {
          padding: 20px;
          background: white;
          border: 2px solid #e9ecef;
          border-radius: 12px;
          transition: all 0.2s ease;
          position: relative;
        }

        .suggestion-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
          border-color: #1e3c72;
        }

        .suggestion-card.current {
          background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
          border-color: #4caf50;
        }

        .suggestion-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .suggestion-number {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          background: #1e3c72;
          color: white;
          border-radius: 50%;
          font-size: 12px;
          font-weight: 700;
        }

        .current-badge {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px 12px;
          background: #4caf50;
          color: white;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
        }

        .suggestion-label {
          font-size: 14px;
          font-weight: 600;
          color: #495057;
          margin-bottom: 12px;
        }

        .suggestion-price {
          font-size: 32px;
          font-weight: 700;
          color: #1e3c72;
          margin-bottom: 12px;
          line-height: 1;
        }

        .suggestion-price small {
          font-size: 16px;
          font-weight: 500;
          color: #6c757d;
        }

        .profit-info {
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 12px;
        }

        .profit-info.profit {
          background: #e8f5e9;
          border: 1px solid #4caf50;
        }

        .profit-info.loss {
          background: #ffebee;
          border: 1px solid #f44336;
        }

        .profit-info.breakeven {
          background: #fff3e0;
          border: 1px solid #ff9800;
        }

        .profit-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: 600;
          margin-bottom: 6px;
        }

        .profit-info.profit .profit-label {
          color: #2e7d32;
        }

        .profit-info.loss .profit-label {
          color: #c62828;
        }

        .profit-info.breakeven .profit-label {
          color: #ef6c00;
        }

        .profit-amount {
          font-size: 18px;
          font-weight: 700;
        }

        .profit-info.profit .profit-amount {
          color: #1b5e20;
        }

        .profit-info.loss .profit-amount {
          color: #b71c1c;
        }

        .profit-info.breakeven .profit-amount {
          color: #e65100;
        }

        .profit-percent {
          font-size: 13px;
          font-weight: 600;
          margin-top: 2px;
        }

        .profit-info.profit .profit-percent {
          color: #2e7d32;
        }

        .profit-info.loss .profit-percent {
          color: #c62828;
        }

        .profit-info.breakeven .profit-percent {
          color: #ef6c00;
        }

        .price-change {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 12px;
        }

        .price-change.increase {
          background: #e8f5e9;
          color: #2e7d32;
        }

        .price-change.decrease {
          background: #fff3e0;
          color: #f57c00;
        }

        .apply-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          padding: 12px;
          background: #1e3c72;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .apply-btn:hover:not(.disabled) {
          background: #16325a;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(30, 60, 114, 0.3);
        }

        .apply-btn.disabled {
          background: #6c757d;
          cursor: not-allowed;
          opacity: 0.6;
        }

        .suggestion-card.current .apply-btn {
          background: #4caf50;
        }

        .empty-history {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 48px 24px;
          text-align: center;
          color: #6c757d;
        }

        .empty-history svg {
          color: #dee2e6;
          margin-bottom: 16px;
        }

        .empty-history p {
          font-size: 16px;
        }

        .history-table-wrapper {
          overflow-x: auto;
        }

        .history-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
        }

        .history-table thead {
          background: #f8f9fa;
        }

        .history-table th {
          padding: 16px;
          text-align: left;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #495057;
          border-bottom: 2px solid #dee2e6;
        }

        .history-table tbody tr {
          border-bottom: 1px solid #e9ecef;
          transition: background 0.2s ease;
        }

        .history-table tbody tr:hover {
          background: #f8f9fa;
        }

        .history-table td {
          padding: 16px;
          font-size: 14px;
          color: #495057;
        }

        .date-cell {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .date {
          font-weight: 600;
          color: #212529;
        }

        .time {
          font-size: 12px;
          color: #6c757d;
        }

        .price-cell {
          font-weight: 600;
          color: #1e3c72;
        }

        .change-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 600;
        }

        .change-badge.increase {
          background: #e8f5e9;
          color: #2e7d32;
        }

        .change-badge.decrease {
          background: #fff3e0;
          color: #f57c00;
        }

        .change-badge.neutral {
          background: #e0f2f1;
          color: #00796b;
        }

        @media (max-width: 1200px) {
          .content-layout {
            grid-template-columns: 1fr;
          }
          
          .products-panel {
            max-height: 400px;
          }
        }

        @media (max-width: 768px) {
          .price-analysis-container {
            padding: 16px;
          }

          .page-header {
            flex-direction: column;
            gap: 16px;
            text-align: center;
          }

          .header-content {
            flex-direction: column;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .suggestions-grid {
            grid-template-columns: 1fr;
          }

          .history-table-wrapper {
            overflow-x: scroll;
          }

          .history-table {
            min-width: 600px;
          }
        }
      `}</style>
    </div>
  );
}

export default PriceAnalysis;