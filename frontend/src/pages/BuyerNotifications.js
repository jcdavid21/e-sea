// src/components/pages/BuyerNotifications.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaBell, FaBox, FaExclamationTriangle, FaInbox } from "react-icons/fa";
import BuyerHeader from "./BuyerHeader";
import SellerFeedbackModal from "./SellerFeedbackModal";
import "./BuyerNotifications.css";

export default function BuyerNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const buyerId = sessionStorage.getItem("customer_id");
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    if (!buyerId) {
      setError("Buyer ID not found. Please log in.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(
        `${process.env.REACT_APP_BUYER_API_URL}/api/buyer/${buyerId}/notifications`,
        {
          method: 'GET',
        }
      );

      if (!res.ok) {
        throw new Error("Failed to fetch notifications");
      }

      const data = await res.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.count || 0);
      setError(null);
    } catch (err) {
      console.error("Error fetching notifications:", err);
      setError("Could not connect to the notification service.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Prevent caching
    window.history.pushState(null, null, window.location.href);
    window.onpopstate = function () {
      const customer_id = sessionStorage.getItem("customer_id");
      if (!customer_id) {
        window.location.replace("/buyer/login");
      }
    };
  }, []);

  useEffect(() => {
    if (!buyerId) {
      navigate("/buyer/login");
      return;
    }

    fetchNotifications();
    
    const interval = setInterval(fetchNotifications, 10000);
    
    return () => clearInterval(interval);
  }, [buyerId, navigate]);

  const checkExistingFeedback = async (orderId) => {
    try {
      console.log('Checking feedback for order:', orderId);
      
      // Get buyer's numeric ID
      const buyerRes = await fetch(
        `${process.env.REACT_APP_BUYER_API_URL}/api/buyer/get-numeric-id/${buyerId}`
      );
      
      if (!buyerRes.ok) {
        console.error('Failed to get buyer numeric ID');
        return false;
      }
      
      const buyerData = await buyerRes.json();
      const numericBuyerId = buyerData.buyer_id;

      const res = await fetch(
        `${process.env.REACT_APP_BUYER_API_URL}/api/seller-feedback/check/${orderId}/${numericBuyerId}`
      );
      const data = await res.json();
      return data.hasFeedback;
    } catch (error) {
      console.error('Error checking feedback:', error);
      return false;
    }
  };

  const markAsRead = async (notificationId, notification) => {
    try {
      console.log(`📌 Marking notification ${notificationId} as read for buyer ${buyerId}`);
      
      const res = await fetch(
        `${process.env.REACT_APP_BUYER_API_URL}/api/buyer/notifications/${notificationId}/read`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ buyer_id: buyerId }),
        }
      );

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || "Failed to mark notification as read");
      }

      console.log("✅ Notification marked as read:", result);

      // Update local state
      setNotifications(prev =>
        prev.map(n =>
          parseInt(n.id) === parseInt(notificationId) ? { ...n, is_read: true } : n
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));

      // Check if order is completed and show feedback modal
      if (notification.message.includes('Completed')) {
        const hasFeedback = await checkExistingFeedback(notification.order_id);
        
        if (!hasFeedback) {
          setSelectedOrder({
            orderId: notification.order_id,
            shopName: notification.shop_name
          });
          setShowFeedbackModal(true);
        }
      }
    } catch (err) {
      console.error("Error marking notification as read:", err);
      alert(`Failed to mark notification as read: ${err.message}`);
    }
  };

  const handleFeedbackSubmit = async (feedbackData) => {
    try {
      console.log('Submitting feedback from notification');
      
      // Get buyer's numeric ID
      const buyerRes = await fetch(
        `${process.env.REACT_APP_BUYER_API_URL}/api/buyer/get-numeric-id/${buyerId}`
      );
      
      if (!buyerRes.ok) {
        throw new Error('Failed to get buyer ID');
      }
      
      const buyerData = await buyerRes.json();
      const numericBuyerId = buyerData.buyer_id;

      // Get order details to find seller_id
      const orderRes = await fetch(
        `${process.env.REACT_APP_BUYER_API_URL}/api/buyer/orders/${selectedOrder.orderId}?buyer_id=${buyerId}`
      );
      const orderData = await orderRes.json();

      const payload = {
        ...feedbackData,
        order_id: selectedOrder.orderId,
        buyer_id: numericBuyerId,
        seller_id: orderData.order.seller_id
      };
      
      console.log('Sending payload:', payload);

      const response = await fetch(`${process.env.REACT_APP_BUYER_API_URL}/api/seller-feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to submit feedback');
      }
      
      console.log("✅ Seller feedback submitted:", result);
      setShowFeedbackModal(false);
      setSelectedOrder(null);
      
      alert('Thank you for your feedback!');
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert(error.message || 'Failed to submit feedback. Please try again.');
    }
  };

  const markAllAsRead = async () => {
    try {
      console.log(`📌 Marking all notifications as read for buyer ${buyerId}`);
      
      const res = await fetch(
        `${process.env.REACT_APP_BUYER_API_URL}/api/buyer/${buyerId}/notifications/read-all`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
        }
      );

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || "Failed to mark all notifications as read");
      }

      console.log("✅ All notifications marked as read:", result);

      // Update local state
      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
      alert(`Failed to mark all notifications as read: ${err.message}`);
    }
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="buyer-notifications-page">
        <BuyerHeader 
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          currentPage="notifications" 
        />
        <div className="notif-container">
          <div className="notif-loading">
            <div className="loading-spinner"></div>
            <p>Loading notifications...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="buyer-notifications-page">
        <BuyerHeader 
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          currentPage="notifications" 
        />
        <div className="notif-container">
          <div className="notif-error">
            <FaExclamationTriangle className="error-icon" style={{ color: '#f6ad55' }} />
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="buyer-notifications-page">
      <BuyerHeader 
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        currentPage="notifications" 
      />
      
      <div className="notif-container">
        <div className="notif-header">
          <div className="header-left">
            <h3>
              <FaBell className="bell-icon" style={{ color: '#667eea' }} />
              Notifications
            </h3>
            {unreadCount > 0 && (
              <span className="notif-badge">{unreadCount}</span>
            )}
          </div>
          
          {notifications.length > 0 && unreadCount > 0 && (
            <button 
              className="btn-mark-all-read"
              onClick={markAllAsRead}
            >
              Mark all as read
            </button>
          )}
        </div>

        <div className="notif-list">
          {notifications.length === 0 ? (
            <div className="notif-empty">
              <FaInbox className="notif-empty-icon" style={{ color: '#667eea' }} />
              <p>No notifications yet</p>
              <span>Order updates will appear here</span>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`notif-item ${notification.is_read ? 'read' : 'unread'}`}
                onClick={() => !notification.is_read && markAsRead(notification.id, notification)}
                style={{ cursor: notification.is_read ? 'default' : 'pointer' }}
              >
                <div className="notif-icon">
                  {notification.is_read ? (
                    <FaBox style={{ color: '#667eea' }} />
                  ) : (
                    <FaBell style={{ color: '#f6ad55' }} />
                  )}
                </div>
                
                <div className="notif-content">
                  <div className="notif-shop">
                    {notification.shop_name}
                  </div>
                  <div className="notif-message">
                    {notification.message}
                  </div>
                  <div className="notif-time">
                    {formatTimeAgo(notification.created_at)}
                  </div>
                </div>
                
                {!notification.is_read && (
                  <div className="notif-indicator"></div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <SellerFeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => {
          setShowFeedbackModal(false);
          setSelectedOrder(null);
        }}
        onSubmit={handleFeedbackSubmit}
        orderInfo={selectedOrder}
      />
    </div>
  );
}