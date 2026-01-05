import React, { useEffect, useState } from "react";
import { FaStar, FaComments } from "react-icons/fa";
import './ShopFeedback.css';

const ShopFeedback = ({ sellerId }) => {
  const [feedback, setFeedback] = useState([]);
  const [ratingData, setRatingData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch rating summary
        const ratingRes = await fetch(
          `${process.env.REACT_APP_BUYER_API_URL}/api/seller/${sellerId}/rating`
        );
        if (ratingRes.ok) {
          const rating = await ratingRes.json();
          setRatingData(rating);
        }

        // Fetch feedback
        const feedbackRes = await fetch(
          `${process.env.REACT_APP_BUYER_API_URL}/api/seller/${sellerId}/feedback`
        );
        if (feedbackRes.ok) {
          const feedbackData = await feedbackRes.json();
          setFeedback(feedbackData);
        }
      } catch (err) {
        console.error("Error fetching feedback:", err);
      } finally {
        setLoading(false);
      }
    };

    if (sellerId) {
      fetchData();
    }
  }, [sellerId]);

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 0; i < 5; i++) {
      stars.push(
        <FaStar
          key={i}
          style={{ opacity: i < rating ? 1 : 0.2 }}
        />
      );
    }
    return stars;
  };

  const getRatingDistribution = () => {
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    feedback.forEach(item => {
      if (distribution[item.rating] !== undefined) {
        distribution[item.rating]++;
      }
    });
    return distribution;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  if (loading) {
    return (
      <div className="feedback-section">
        <p className="feedback-loading">Loading feedback...</p>
      </div>
    );
  }

  const distribution = getRatingDistribution();
  const totalReviews = feedback.length;

  return (
    <div className="feedback-section">
      <div className="feedback-header">
        <div className="feedback-title-section">
          <FaComments className="feedback-icon" />
          <h2 className="feedback-title">Customer Reviews</h2>
        </div>
      </div>

      {ratingData && totalReviews > 0 && (
        <div className="rating-summary">

            <div className="rating-distribution">
                {/* Mobile view - add header inside rating-distribution */}
                <div className="rating-distribution-header">
                <div className="rating-distribution-average">
                    <div className="average-rating-number">
                    {ratingData.averageRating.toFixed(1)}
                    </div>
                    <div className="rating-stars-large">
                    {renderStars(Math.round(ratingData.averageRating))}
                    </div>
                    <div className="total-reviews-text">
                    {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
                    </div>
                </div>
                </div>
            {[5, 4, 3, 2, 1].map(star => {
              const count = distribution[star];
              const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
              
              return (
                <div key={star} className="rating-bar-row">
                  <div className="rating-bar-label">
                    {star} <FaStar />
                  </div>
                  <div className="rating-bar-container">
                    <div 
                      className="rating-bar-fill" 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="rating-bar-count">{count}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {feedback.length === 0 ? (
        <div className="no-feedback-container">
          <div className="no-feedback-icon">💬</div>
          <p className="no-feedback-text">
            No reviews yet. Be the first to share your experience!
          </p>
        </div>
      ) : (
        <div className="feedback-list">
          {feedback.map((item) => (
            <div key={item.id} className="feedback-item">
              <div className="feedback-item-header">
                <div className="feedback-user-info">
                  <div className="feedback-avatar">
                    {getInitials(item.first_name, item.last_name)}
                  </div>
                  <div className="feedback-user-details">
                    <h4 className="feedback-user-name">
                      {item.first_name} {item.last_name}
                    </h4>
                    <span className="feedback-date">
                      {formatDate(item.created_at)}
                    </span>
                  </div>
                </div>
                <div className="feedback-rating-stars">
                  {renderStars(item.rating)}
                </div>
              </div>
              {item.comment && (
                <p className="feedback-comment">{item.comment}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ShopFeedback;