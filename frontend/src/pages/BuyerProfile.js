import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { 
  FaUser, 
  FaEdit, 
  FaSignOutAlt, 
  FaSave, 
  FaTimes,
  FaEnvelope,
  FaPhone,
  FaIdCard,
  FaCalendarAlt
} from "react-icons/fa";
import BuyerHeader from "./BuyerHeader";
import FeedbackModal from "./FeedbackModal";
import "./BuyerProfile.css";

const BuyerProfile = () => {
  const [buyer, setBuyer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [editForm, setEditForm] = useState({
    username: "",
    email: "",
    contact: "",
    first_name: "",
    middle_name: "",
    last_name: ""
  });
  const [updateLoading, setUpdateLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBuyerProfile();
  }, []);

  const fetchBuyerProfile = async () => {
    const customer_id = sessionStorage.getItem("customer_id");
    
    if (!customer_id) {
      setError("Not logged in. Please login first.");
      setLoading(false);
      navigate("/buyer/login");
      return;
    }

    try {
      console.log("🔍 Fetching profile for customer_id:", customer_id);
      
      const res = await axios.get(
        `${process.env.REACT_APP_BUYER_API_URL}/api/buyer/profile/${customer_id}`
      );
      
      if (res.status === 200) {
        console.log("✅ Profile loaded:", res.data);
        setBuyer(res.data);
        setEditForm({
          username: res.data.username,
          email: res.data.email,
          contact: res.data.contact,
          first_name: res.data.first_name,
          middle_name: res.data.middle_name || "",
          last_name: res.data.last_name
        });
      }
    } catch (err) {
      console.error("❌ Error fetching profile:", err);
      setError(
        err.response?.data?.message || "Failed to load profile."
      );
    } finally {
      setLoading(false);
    }
  };

  // Check if user has already submitted feedback
  const checkExistingFeedback = async (customer_id) => {
    try {
      const res = await fetch(
        `${process.env.REACT_APP_BUYER_API_URL}/api/feedback/check/${customer_id}?user_type=buyer`
      );
      const data = await res.json();
      return data.hasFeedback;
    } catch (error) {
      console.error('Error checking feedback:', error);
      return false;
    }
  };

  // Modified handleLogout to check for existing feedback
  const handleLogout = async () => {
    const customer_id = sessionStorage.getItem("customer_id");
    
    // Check if user has already submitted feedback
    const hasFeedback = await checkExistingFeedback(customer_id);
    
    if (hasFeedback) {
      // User has already submitted feedback, logout directly
      console.log("🚪 User has already submitted feedback, logging out directly...");
      sessionStorage.removeItem("customer_id");
      sessionStorage.removeItem("buyerEmail");
      sessionStorage.removeItem("buyerName");
      navigate("/");
    } else {
      // Show feedback modal
      setShowFeedbackModal(true);
    }
  };

  const handleFeedbackSubmit = async (feedbackData) => {
    const customer_id = sessionStorage.getItem("customer_id");
    
    try {
      await fetch(`${process.env.REACT_APP_BUYER_API_URL}/api/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...feedbackData,
          user_id: customer_id
        })
      });
      
      console.log("🚪 Logging out customer:", customer_id);
      
      // Clear session data
      sessionStorage.removeItem("customer_id");
      sessionStorage.removeItem("buyerEmail");
      sessionStorage.removeItem("buyerName");

      console.log("Session cleared.");
      navigate("/");
    } catch (error) {
      console.error('Error submitting feedback:', error);
      // Still proceed with logout even if feedback fails
      sessionStorage.removeItem("customer_id");
      sessionStorage.removeItem("buyerEmail");
      sessionStorage.removeItem("buyerName");
      navigate("/");
    }
  };

  const handleEditToggle = () => {
    if (isEditing) {
      setEditForm({
        username: buyer.username,
        email: buyer.email,
        contact: buyer.contact,
        first_name: buyer.first_name,
        middle_name: buyer.middle_name || "",
        last_name: buyer.last_name
      });
    }
    setIsEditing(!isEditing);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    
    const customer_id = sessionStorage.getItem("customer_id");
    
    if (!customer_id) {
      alert("Session expired. Please login again.");
      navigate("/buyer/login");
      return;
    }

    if (!editForm.username || !editForm.email || !editForm.contact || 
        !editForm.first_name || !editForm.last_name) {
      alert("Please fill in all required fields.");
      return;
    }

    setUpdateLoading(true);

    try {
      const res = await axios.put(
        `${process.env.REACT_APP_BUYER_API_URL}/api/buyer/profile/${customer_id}`,
        editForm
      );

      if (res.status === 200) {
        alert("Profile updated successfully!");
        setBuyer(res.data.buyer);
        setIsEditing(false);
        
        sessionStorage.setItem("buyerEmail", res.data.buyer.email);
        sessionStorage.setItem("buyerName", res.data.buyer.first_name);
      }
    } catch (err) {
      console.error("❌ Error updating profile:", err);
      alert(err.response?.data?.message || "Failed to update profile.");
    } finally {
      setUpdateLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-page-wrapper">
        <BuyerHeader 
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          currentPage="profile" 
        />

        <div className="profile-container">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-page-wrapper">
        <BuyerHeader 
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          currentPage="profile"
        />
        <div className="profile-container">
          <div className="error-card">
            <div className="error-message">{error}</div>
            <button 
              className="btn-back" 
              onClick={() => navigate("/")}
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page-wrapper">
      <BuyerHeader 
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          currentPage="profile"
        />
      
      <div className="profile-container">
        <div className="profile-card">
          <div className="profile-header">
            <h2>
              <FaUser className="header-icon" />
              My Profile
            </h2>
            <div className="header-actions">
              <button 
                className="btn-edit" 
                onClick={handleEditToggle}
              >
                {isEditing ? (
                  <>
                    <FaTimes /> Cancel
                  </>
                ) : (
                  <>
                    <FaEdit /> Edit Profile
                  </>
                )}
              </button>
              <button className="btn-logout" onClick={handleLogout}>
                <FaSignOutAlt /> Logout
              </button>
            </div>
          </div>

          {buyer && (
            <>
              {isEditing ? (
                <form onSubmit={handleUpdateProfile} className="profile-edit-form">
                  <div className="info-section">
                    <h3>
                      <FaIdCard /> Account Information
                    </h3>
                    
                    <div className="form-group">
                      <label>Username *</label>
                      <input
                        type="text"
                        name="username"
                        value={editForm.username}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>
                        <FaEnvelope /> Email *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={editForm.email}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>
                        <FaPhone /> Contact Number *
                      </label>
                      <input
                        type="tel"
                        name="contact"
                        value={editForm.contact}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="info-section">
                    <h3>
                      <FaUser /> Personal Information
                    </h3>
                    
                    <div className="form-group">
                      <label>First Name *</label>
                      <input
                        type="text"
                        name="first_name"
                        value={editForm.first_name}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Middle Name</label>
                      <input
                        type="text"
                        name="middle_name"
                        value={editForm.middle_name}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="form-group">
                      <label>Last Name *</label>
                      <input
                        type="text"
                        name="last_name"
                        value={editForm.last_name}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="profile-actions">
                    <button 
                      type="submit" 
                      className="btn-save"
                      disabled={updateLoading}
                    >
                      <FaSave /> {updateLoading ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="profile-info">
                  <div className="info-section">
                    <h3>
                      <FaIdCard /> Account Information
                    </h3>
                    
                    <div className="info-row">
                      <span className="info-label">Customer ID:</span>
                      <span className="info-value">{buyer.id}</span>
                    </div>

                    <div className="info-row">
                      <span className="info-label">Username:</span>
                      <span className="info-value">{buyer.username}</span>
                    </div>

                    <div className="info-row">
                      <span className="info-label">
                        <FaEnvelope /> Email:
                      </span>
                      <span className="info-value">{buyer.email}</span>
                    </div>

                    <div className="info-row">
                      <span className="info-label">
                        <FaPhone /> Contact:
                      </span>
                      <span className="info-value">
                        {buyer.contact || "Not provided"}
                      </span>
                    </div>
                  </div>

                  <div className="info-section">
                    <h3>
                      <FaUser /> Personal Information
                    </h3>
                    
                    <div className="info-row">
                      <span className="info-label">First Name:</span>
                      <span className="info-value">
                        {buyer.first_name || "Not provided"}
                      </span>
                    </div>

                    <div className="info-row">
                      <span className="info-label">Middle Name:</span>
                      <span className="info-value">
                        {buyer.middle_name || "Not provided"}
                      </span>
                    </div>

                    <div className="info-row">
                      <span className="info-label">Last Name:</span>
                      <span className="info-value">
                        {buyer.last_name || "Not provided"}
                      </span>
                    </div>

                    <div className="info-row">
                      <span className="info-label">
                        <FaCalendarAlt /> Member Since:
                      </span>
                      <span className="info-value">
                        {new Date(buyer.created_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <FeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => {
          setShowFeedbackModal(false);
          sessionStorage.removeItem("customer_id");
          sessionStorage.removeItem("buyerEmail");
          sessionStorage.removeItem("buyerName");
          navigate("/");
        }}
        onSubmit={handleFeedbackSubmit}
        userType="buyer"
      />
    </div>
  );
};

export default BuyerProfile;