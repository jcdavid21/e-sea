import React, { useEffect, useState } from "react";
import { Clock, Save, AlertCircle } from 'lucide-react';
import Swal from 'sweetalert2';
import './StoreHours.css';

const StoreHours = () => {
  const [storeHours, setStoreHours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const SELLER_ID = localStorage.getItem("seller_unique_id");
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  useEffect(() => {
    fetchStoreHours();
  }, [SELLER_ID]);

  const fetchStoreHours = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_SELLER_API_URL}/api/seller/store-hours/${SELLER_ID}`);
      const data = await response.json();
      
      if (data.length === 0) {
        // Initialize with default hours
        setStoreHours(days.map(day => ({
          day_of_week: day,
          is_open: true,
          open_time: '09:00',
          close_time: '17:00'
        })));
      } else {
        // Format times for input fields (remove seconds)
        setStoreHours(data.map(hour => ({
          ...hour,
          open_time: hour.open_time.substring(0, 5),
          close_time: hour.close_time.substring(0, 5)
        })));
      }
    } catch (err) {
      console.error("Error fetching store hours:", err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load store hours',
        confirmButtonColor: '#10b981'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleDay = (day) => {
    setStoreHours(prev => prev.map(hour => 
      hour.day_of_week === day 
        ? { ...hour, is_open: !hour.is_open }
        : hour
    ));
  };

  const handleTimeChange = (day, field, value) => {
    setStoreHours(prev => prev.map(hour => 
      hour.day_of_week === day 
        ? { ...hour, [field]: value }
        : hour
    ));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });
    
    try {
      const response = await fetch(
        `${process.env.REACT_APP_SELLER_API_URL}/api/seller/store-hours/${SELLER_ID}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            hours: storeHours.map(hour => ({
              ...hour,
              open_time: `${hour.open_time}:00`,
              close_time: `${hour.close_time}:00`
            }))
          })
        }
      );
      
      if (response.ok) {
        await Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'Store hours updated successfully!',
          confirmButtonColor: '#10b981',
          timer: 2000,
          timerProgressBar: true
        });
      } else {
        throw new Error('Failed to update');
      }
    } catch (err) {
      console.error("Error saving store hours:", err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to update store hours. Please try again.',
        confirmButtonColor: '#10b981'
      });
    } finally {
      setSaving(false);
    }
  };

  const isToday = (day) => {
    return new Date().toLocaleDateString('en-US', { weekday: 'long' }) === day;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading store hours...</p>
      </div>
    );
  }

  return (
    <div className="store-hours-page">
      <div className="page-header">
        <div className="header-content">
          <Clock size={32} />
          <div>
            <h1 className="page-title">Store Operating Hours</h1>
            <p className="page-subtitle">Manage your store's weekly schedule</p>
          </div>
        </div>
        
        {message.text && (
          <div className={`message-banner ${message.type}`}>
            <AlertCircle size={20} />
            <span>{message.text}</span>
          </div>
        )}
      </div>

      <div className="hours-editor">
        {storeHours.map((hour) => (
          <div 
            key={hour.day_of_week} 
            className={`day-row ${isToday(hour.day_of_week) ? 'today' : ''} ${!hour.is_open ? 'closed' : ''}`}
          >
            <div className="day-info">
              <div className="day-header">
                <span className="day-name">{hour.day_of_week}</span>
                {isToday(hour.day_of_week) && <span className="today-badge">Today</span>}
              </div>
              
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={hour.is_open}
                  onChange={() => handleToggleDay(hour.day_of_week)}
                />
                <span className="toggle-slider"></span>
                <span className="toggle-label">{hour.is_open ? 'Open' : 'Closed'}</span>
              </label>
            </div>

            {hour.is_open && (
              <div className="time-inputs">
                <div className="time-group">
                  <label>Opening Time</label>
                  <input
                    type="time"
                    value={hour.open_time}
                    onChange={(e) => handleTimeChange(hour.day_of_week, 'open_time', e.target.value)}
                    className="time-input"
                  />
                </div>
                
                <span className="time-separator">to</span>
                
                <div className="time-group">
                  <label>Closing Time</label>
                  <input
                    type="time"
                    value={hour.close_time}
                    onChange={(e) => handleTimeChange(hour.day_of_week, 'close_time', e.target.value)}
                    className="time-input"
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="actions">
        <button 
          onClick={handleSave} 
          disabled={saving}
          className="save-button"
        >
          {saving ? (
            <>
              <div className="button-spinner"></div>
              Saving...
            </>
          ) : (
            <>
              <Save size={20} />
              Save Changes
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default StoreHours;