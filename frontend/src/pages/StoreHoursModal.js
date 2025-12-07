import React, { useState, useEffect } from 'react';
import { Clock, X, Save } from 'lucide-react';
import Swal from 'sweetalert2';
import './StoreHoursModal.css';

const StoreHoursModal = ({ isOpen, onClose, sellerId }) => {
  const [hours, setHours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  useEffect(() => {
    if (isOpen && sellerId) {
      fetchStoreHours();
    }
  }, [isOpen, sellerId]);

  const fetchStoreHours = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_SELLER_API_URL}/api/seller/store-hours/${sellerId}`);
      const data = await response.json();
      setHours(data);
    } catch (err) {
      console.error("Error fetching store hours:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleDay = (index) => {
    const newHours = [...hours];
    newHours[index].is_open = !newHours[index].is_open;
    setHours(newHours);
  };

  const handleTimeChange = (index, field, value) => {
    const newHours = [...hours];
    newHours[index][field] = value;
    setHours(newHours);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
        const response = await fetch(`${process.env.REACT_APP_SELLER_API_URL}/api/seller/store-hours/${sellerId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hours })
        });

        if (response.ok) {
        Swal.fire({
            icon: 'success',
            title: 'Store hours updated successfully',
            showConfirmButton: false,
            timer: 1500
        });
        onClose(true); // Pass true to indicate success
        } else {
        Swal.fire({
            icon: 'error',
            title: 'Failed to update store hours',
            text: 'Please try again later.'
        });
        }
    } catch (err) {
        console.error("Error saving store hours:", err);
        Swal.fire({
            icon: 'error',
            title: 'Error updating store hours',
            text: 'Please try again later.'
        });
    } finally {
        setSaving(false);
    }
    };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="store-hours-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <Clock size={24} />
            <h2>Store Hours</h2>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="modal-body">
          {loading ? (
            <div className="loading-state">Loading...</div>
          ) : (
            <div className="hours-list">
              {hours.map((hour, index) => (
                <div key={hour.day_of_week} className="hour-row">
                  <div className="day-toggle">
                    <input
                      type="checkbox"
                      id={`day-${index}`}
                      checked={hour.is_open}
                      onChange={() => handleToggleDay(index)}
                    />
                    <label htmlFor={`day-${index}`} className="day-name">
                      {hour.day_of_week}
                    </label>
                  </div>

                  {hour.is_open ? (
                    <div className="time-inputs">
                      <input
                        type="time"
                        value={hour.open_time}
                        onChange={(e) => handleTimeChange(index, 'open_time', e.target.value)}
                        className="time-input"
                      />
                      <span className="time-separator">to</span>
                      <input
                        type="time"
                        value={hour.close_time}
                        onChange={(e) => handleTimeChange(index, 'close_time', e.target.value)}
                        className="time-input"
                      />
                    </div>
                  ) : (
                    <span className="closed-label">Closed</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="cancel-btn" onClick={onClose}>
            Cancel
          </button>
          <button className="save-btn" onClick={handleSave} disabled={saving}>
            <Save size={18} />
            {saving ? 'Saving...' : 'Save Hours'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StoreHoursModal;