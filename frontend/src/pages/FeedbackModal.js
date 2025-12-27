import React, { useState } from 'react';
import { FaStar, FaTimes, FaCheckCircle } from 'react-icons/fa';
import './FeedbackModal.css';

const FeedbackModal = ({ isOpen, onClose, onSubmit, userType }) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const maxChars = 500;

  const handleSubmit = async () => {
    if (rating === 0) {
      alert('Please select a rating');
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit({ rating, comment, userType });
      setShowSuccess(true);
      
      // Auto close after 2 seconds
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setRating(0);
    setComment('');
    setShowSuccess(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="feedback-modal-overlay" onClick={handleClose}>
      <div className="feedback-modal" onClick={(e) => e.stopPropagation()}>
        <button className="feedback-close-btn" onClick={handleClose}>
          <FaTimes />
        </button>

        {showSuccess ? (
          <div className="feedback-success">
            <FaCheckCircle className="feedback-success-icon" />
            <h3>Thank You!</h3>
            <p>Your feedback has been submitted successfully.</p>
          </div>
        ) : (
          <>
            <div className="feedback-modal-header">
              <h2>Rate Your Experience</h2>
              <p>Help us improve by sharing your thoughts</p>
            </div>

            <div className="rating-section">
              <label>How would you rate the system?</label>
              <div className="star-rating">
                {[1, 2, 3, 4, 5].map((star) => (
                  <FaStar
                    key={star}
                    className={`star ${star <= (hoveredRating || rating) ? 'active' : ''}`}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                  />
                ))}
              </div>
            </div>

            <div className="comment-section">
              <label>Additional Comments (Optional)</label>
              <textarea
                className="feedback-textarea"
                placeholder="Tell us what you think about the system..."
                value={comment}
                onChange={(e) => {
                  if (e.target.value.length <= maxChars) {
                    setComment(e.target.value);
                  }
                }}
                maxLength={maxChars}
              />
              <div className="char-count">
                {comment.length}/{maxChars} characters
              </div>
            </div>

            <div className="feedback-modal-actions">
              <button
                className="feedback-btn feedback-btn-cancel"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Skip
              </button>
              <button
                className="feedback-btn feedback-btn-submit"
                onClick={handleSubmit}
                disabled={isSubmitting || rating === 0}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FeedbackModal;