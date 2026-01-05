import React, { useState } from 'react';
import { FaStar, FaTimes } from 'react-icons/fa';
import './SellerFeedbackModal.css';

const SellerFeedbackModal = ({ isOpen, onClose, onSubmit, orderInfo }) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      alert('Please select a rating');
      return;
    }

    setIsSubmitting(true);
    
    try {
      await onSubmit({ rating, comment });
      setRating(0);
      setComment('');
    } catch (error) {
      console.error('Error submitting feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    setRating(0);
    setComment('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="feedback-modal-overlay">
      <div className="feedback-modal">
        <button className="feedback-modal-close" onClick={handleSkip}>
          <FaTimes />
        </button>

        <div className="feedback-modal-header">
          <h2>Rate Your Experience</h2>
          <p className="feedback-shop-name">
            Order #{orderInfo?.orderId} from {orderInfo?.shopName}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="feedback-form">
          <div className="feedback-rating-section">
            <label>How was your experience?</label>
            <div className="feedback-stars">
              {[1, 2, 3, 4, 5].map((star) => (
                <FaStar
                  key={star}
                  className={`feedback-star ${
                    star <= (hoveredRating || rating) ? 'active' : ''
                  }`}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                />
              ))}
            </div>
            <span className="feedback-rating-text">
              {rating === 0 && 'Select a rating'}
              {rating === 1 && 'Poor'}
              {rating === 2 && 'Fair'}
              {rating === 3 && 'Good'}
              {rating === 4 && 'Very Good'}
              {rating === 5 && 'Excellent'}
            </span>
          </div>

          <div className="feedback-comment-section">
            <label>Additional Comments (Optional)</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your thoughts about the seller and product quality..."
              rows="4"
              maxLength="500"
            />
            <span className="feedback-char-count">{comment.length}/500</span>
          </div>

          <div className="feedback-modal-actions">
            <button
              type="button"
              className="btn-feedback-skip"
              onClick={handleSkip}
              disabled={isSubmitting}
            >
              Skip
            </button>
            <button
              type="submit"
              className="btn-feedback-submit"
              disabled={isSubmitting || rating === 0}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SellerFeedbackModal;