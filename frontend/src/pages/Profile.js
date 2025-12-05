import React, { useEffect, useState } from "react";
import { 
  FiUser, 
  FiMapPin, 
  FiImage, 
  FiCreditCard, 
  FiUpload, 
  FiCheck,
  FiAlertCircle,
  FiInfo,
  FiShoppingBag,
  FiEdit3,
  FiX,
  FiSave
} from "react-icons/fi";
import Swal from "sweetalert2";

function SellerProfile() {
  const [sellerInfo, setSellerInfo] = useState({
    unique_id: "",
    first_name: "",
    middle_name: "",
    last_name: "",
    shop_name: "",
    street: "",
    barangay: "",
    municipality: "",
    province: "",
  });

  const [editMode, setEditMode] = useState(false);
  const [editedInfo, setEditedInfo] = useState({});

  const [profileImages, setProfileImages] = useState({
    logo: "",
    qr: "",
  });

  const [selectedLogo, setSelectedLogo] = useState(null);
  const [selectedQr, setSelectedQr] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [qrPreview, setQrPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const seller_id = localStorage.getItem("seller_unique_id");

  useEffect(() => {
    if (!seller_id) {
      Swal.fire({
        icon: 'error',
        title: 'Authentication Required',
        text: 'Please log in to continue',
        confirmButtonColor: '#1e3c72'
      }).then(() => {
        window.location.href = "/seller-login";
      });
      return;
    }
    loadSellerData();
  }, [seller_id]);

  const loadSellerData = async () => {
    setLoading(true);
    try {
      const infoRes = await fetch(
        `${process.env.REACT_APP_API_URL}/api/seller/info/${seller_id}`
      );
      const infoData = await infoRes.json();
      
      if (infoRes.ok) {
        setSellerInfo(infoData);
        setEditedInfo(infoData);
      }

      const profileRes = await fetch(
        `${process.env.REACT_APP_API_URL}/api/seller/profile/${seller_id}`
      );
      const profileData = await profileRes.json();
      
      setProfileImages({
        logo: profileData.logo || "",
        qr: profileData.qr || "",
      });
    } catch (err) {
      console.error("Failed to load seller data:", err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load profile information',
        confirmButtonColor: '#1e3c72'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedLogo) {
      setLogoPreview(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setLogoPreview(reader.result);
    reader.readAsDataURL(selectedLogo);
  }, [selectedLogo]);

  useEffect(() => {
    if (!selectedQr) {
      setQrPreview(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setQrPreview(reader.result);
    reader.readAsDataURL(selectedQr);
  }, [selectedQr]);

  const handleEditToggle = () => {
    if (editMode) {
      // Cancel editing - reset to original
      setEditedInfo(sellerInfo);
      setEditMode(false);
    } else {
      setEditMode(true);
    }
  };

  const handleInputChange = (field, value) => {
    setEditedInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveChanges = async () => {
    // Check if anything changed
    const hasChanges = Object.keys(editedInfo).some(
      key => key !== 'unique_id' && editedInfo[key] !== sellerInfo[key]
    );

    if (!hasChanges) {
      Swal.fire({
        icon: 'info',
        title: 'No Changes',
        text: 'No changes were made to your profile',
        confirmButtonColor: '#1e3c72'
      });
      setEditMode(false);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/api/seller/update-info/${seller_id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editedInfo),
        }
      );

      const data = await res.json();

      if (res.ok) {
        await Swal.fire({
          icon: 'success',
          title: 'Profile Updated!',
          text: 'Your information has been updated successfully',
          confirmButtonColor: '#1e3c72',
          timer: 2000,
          showConfirmButton: false
        });
        
        setSellerInfo(editedInfo);
        setEditMode(false);
      } else {
        throw new Error(data.message || 'Failed to update profile');
      }
    } catch (err) {
      console.error("Failed to update profile:", err);
      Swal.fire({
        icon: 'error',
        title: 'Update Failed',
        text: err.message || 'Failed to update profile information',
        confirmButtonColor: '#1e3c72'
      });
    } finally {
      setSaving(false);
    }
  };

  const uploadFile = async (file, type) => {
    if (!file) {
      Swal.fire({
        icon: 'warning',
        title: 'No File Selected',
        text: `Please select a ${type === "logo" ? "logo" : "QR code"} first.`,
        confirmButtonColor: '#1e3c72'
      });
      return;
    }

    const formData = new FormData();
    formData.append(type, file);

    try {
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/api/seller/upload-${type}/${seller_id}`,
        {
          method: "POST",
          body: formData,
        }
      );
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Upload failed");

      await Swal.fire({
        icon: 'success',
        title: 'Upload Successful!',
        text: data.message,
        confirmButtonColor: '#1e3c72',
        timer: 2000,
        showConfirmButton: false
      });

      if (type === "logo") {
        setProfileImages((prev) => ({ ...prev, logo: data.logo }));
        setSelectedLogo(null);
        setLogoPreview(null);
      }
      if (type === "qr") {
        setProfileImages((prev) => ({ ...prev, qr: data.qr }));
        setSelectedQr(null);
        setQrPreview(null);
      }
    } catch (err) {
      console.error(`${type} upload failed:`, err);
      Swal.fire({
        icon: 'error',
        title: 'Upload Failed',
        text: err.message,
        confirmButtonColor: '#1e3c72'
      });
    }
  };

  const getFileUrl = (path) => {
    if (!path) return null;
    const normalized = path.startsWith("/") ? path : "/" + path;
    return `${process.env.REACT_APP_API_URL}${normalized}`;
  };

  const getFullAddress = () => {
    const info = editMode ? editedInfo : sellerInfo;
    const parts = [
      info.street,
      info.barangay,
      info.municipality,
      info.province,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : "N/A";
  };

  const getFullName = () => {
    const info = editMode ? editedInfo : sellerInfo;
    const parts = [
      info.first_name,
      info.middle_name,
      info.last_name,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(" ") : "N/A";
  };

  if (loading) {
    return (
      <div className="profile-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="page-header">
        <div className="header-content">
          <FiUser size={32} className="header-icon" />
          <div>
            <h1>Seller Profile</h1>
            <p className="header-subtitle">Manage your account and shop information</p>
          </div>
        </div>
      </div>
              {/* Personal Information Card */}
        <div className="profile-card">
          <div className="card-header">
            <div className="header-title">
              <FiUser size={20} />
              <h3>Personal Information</h3>
            </div>
            {!editMode ? (
              <button className="edit-btn" onClick={handleEditToggle}>
                <FiEdit3 />
                Edit Info
              </button>
            ) : (
              <div className="edit-actions">
                <button className="cancel-btn" onClick={handleEditToggle} disabled={saving}>
                  <FiX />
                  Cancel
                </button>
                <button className="save-btn" onClick={handleSaveChanges} disabled={saving}>
                  <FiSave />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>
          
          <div className="info-grid">
            <div className="info-item">
              <label>Seller ID</label>
              <div className="info-value readonly">{sellerInfo.unique_id || "N/A"}</div>
            </div>
            
            {editMode ? (
              <>
                <div className="info-item">
                  <label>First Name</label>
                  <input
                    type="text"
                    className="info-input"
                    value={editedInfo.first_name || ''}
                    onChange={(e) => handleInputChange('first_name', e.target.value)}
                  />
                </div>
                
                <div className="info-item">
                  <label>Middle Name</label>
                  <input
                    type="text"
                    className="info-input"
                    value={editedInfo.middle_name || ''}
                    onChange={(e) => handleInputChange('middle_name', e.target.value)}
                    placeholder="Optional"
                  />
                </div>
                
                <div className="info-item">
                  <label>Last Name</label>
                  <input
                    type="text"
                    className="info-input"
                    value={editedInfo.last_name || ''}
                    onChange={(e) => handleInputChange('last_name', e.target.value)}
                  />
                </div>
                
                <div className="info-item full-width">
                  <label>Shop Name</label>
                  <input
                    type="text"
                    className="info-input shop-input"
                    value={editedInfo.shop_name || ''}
                    onChange={(e) => handleInputChange('shop_name', e.target.value)}
                  />
                </div>
                
                <div className="info-item full-width">
                  <label>Street</label>
                  <input
                    type="text"
                    className="info-input"
                    value={editedInfo.street || ''}
                    onChange={(e) => handleInputChange('street', e.target.value)}
                  />
                </div>
                
                <div className="info-item">
                  <label>Barangay</label>
                  <input
                    type="text"
                    className="info-input"
                    value={editedInfo.barangay || ''}
                    onChange={(e) => handleInputChange('barangay', e.target.value)}
                  />
                </div>
                
                <div className="info-item">
                  <label>Municipality</label>
                  <input
                    type="text"
                    className="info-input"
                    value={editedInfo.municipality || ''}
                    onChange={(e) => handleInputChange('municipality', e.target.value)}
                  />
                </div>
                
                <div className="info-item full-width">
                  <label>Province</label>
                  <input
                    type="text"
                    className="info-input"
                    value={editedInfo.province || ''}
                    onChange={(e) => handleInputChange('province', e.target.value)}
                  />
                </div>
              </>
            ) : (
              <>
                <div className="info-item">
                  <label>Full Name</label>
                  <div className="info-value">{getFullName()}</div>
                </div>
                
                <div className="info-item full-width">
                  <label>Shop Name</label>
                  <div className="info-value shop-name">
                    <FiShoppingBag size={16} />
                    {sellerInfo.shop_name || "N/A"}
                  </div>
                </div>
                
                <div className="info-item full-width">
                  <label>Address</label>
                  <div className="info-value address">
                    <FiMapPin size={16} />
                    {getFullAddress()}
                  </div>
                </div>
              </>
            )}
          </div>
          
          {!editMode && (
            <div className="notice-box info">
              <FiInfo size={18} />
              <p>Click "Edit Info" to update your personal details. Your Seller ID cannot be changed.</p>
            </div>
          )}
        </div>
        <div className="content-grid">
          {/* Shop Logo Card */}
          <div className="profile-card">
            <div className="card-header">
              <div className="header-title">
                <FiImage size={20} />
                <h3>Shop Logo</h3>
              </div>
            </div>
            
            <div className="upload-section">
              <div className="preview-container logo-preview">
                {logoPreview || getFileUrl(profileImages.logo) ? (
                  <img
                    src={logoPreview || getFileUrl(profileImages.logo)}
                    alt="Shop Logo"
                    className="preview-image"
                  />
                ) : (
                  <div className="preview-placeholder">
                    <FiImage size={48} />
                    <p>No logo uploaded</p>
                  </div>
                )}
              </div>
              
              <div className="upload-controls">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setSelectedLogo(e.target.files[0])}
                  id="logo-input"
                  className="file-input"
                  
                />
                <label htmlFor="logo-input" className="file-label">
                  <FiUpload />
                  Choose Logo
                </label>
                
                {selectedLogo && (
                  <div className="selected-file" // the file name are overflowing
                  style={{ maxWidth: "150px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    <FiCheck />
                    <span>{selectedLogo.name}</span>
                  </div>
                )}
                
                <button
                  onClick={() => uploadFile(selectedLogo, "logo")}
                  className="upload-btn"
                  disabled={!selectedLogo}
                >
                  <FiUpload />
                  Upload Logo
                </button>
              </div>
            </div>
          </div>

          {/* GCash QR Code Card */}
          <div className="profile-card">
            <div className="card-header">
              <div className="header-title">
                <FiCreditCard size={20} />
                <h3>GCash QR Code</h3>
              </div>
            </div>
            
            <div className="upload-section">
              <div className="preview-container qr-preview">
                {qrPreview || getFileUrl(profileImages.qr) ? (
                  <img
                    src={qrPreview || getFileUrl(profileImages.qr)}
                    alt="GCash QR"
                    className="preview-image"
                  />
                ) : (
                  <div className="preview-placeholder">
                    <FiCreditCard size={48} />
                    <p>No QR code uploaded</p>
                  </div>
                )}
              </div>
              
              <div className="upload-controls">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setSelectedQr(e.target.files[0])}
                  id="qr-input"
                  className="file-input"
                />
                <label htmlFor="qr-input" className="file-label">
                  <FiUpload />
                  Choose QR Code
                </label>
                
                {selectedQr && (
                  <div className="selected-file" // the file name are overflowing
                  style={{ maxWidth: "150px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    <FiCheck />
                    <span>{selectedQr.name}</span>
                  </div>
                )}
                
                <button
                  onClick={() => uploadFile(selectedQr, "qr")}
                  className="upload-btn"
                  disabled={!selectedQr}
                >
                  <FiUpload />
                  Upload QR Code
                </button>
              </div>
            </div>
            
            <div className="notice-box success">
              <FiAlertCircle size={18} />
              <p>Upload your GCash QR code so customers can pay directly when placing orders.</p>
            </div>
          </div>
        </div>

      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .profile-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 32px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          background: #f8f9fa;
          min-height: 100vh;
        }

        .page-header {
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

        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 500px;
          text-align: center;
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

        .content-grid {
          display: grid;
          gap: 24px;
        }

        .profile-card {
          background: white;
          border-radius: 16px;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
          overflow: hidden;
          margin-bottom: 32px;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          border-bottom: 2px solid #1e3c72;
        }

        .header-title {
          display: flex;
          align-items: center;
          gap: 12px;
          color: #1e3c72;
        }

        .header-title h3 {
          font-size: 16px;
          font-weight: 600;
          margin: 0;
        }

        .edit-btn, .cancel-btn, .save-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
          outline: none;
        }

        .edit-btn {
          background: #1e3c72;
          color: white;
        }

        .edit-btn:hover {
          background: #16325a;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(30, 60, 114, 0.3);
        }

        .edit-actions {
          display: flex;
          gap: 8px;
        }

        .cancel-btn {
          background: white;
          border: 2px solid #6c757d;
          color: #6c757d;
        }

        .cancel-btn:hover:not(:disabled) {
          background: #f8f9fa;
          border-color: #495057;
          color: #495057;
        }

        .save-btn {
          background: #28a745;
          color: white;
        }

        .save-btn:hover:not(:disabled) {
          background: #218838;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
        }

        .save-btn:disabled, .cancel-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
          padding: 24px;
        }

        .info-item {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .info-item.full-width {
          grid-column: 1 / -1;
        }

        .info-item label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: 600;
          color: #6c757d;
        }

        .info-value, .info-input {
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 15px;
          color: #212529;
          font-weight: 500;
        }

        .info-value {
          background: #f8f9fa;
          border: 2px solid #e9ecef;
        }

        .info-value.readonly {
          background: #e9ecef;
          color: #6c757d;
          cursor: not-allowed;
        }

        .info-input {
          background: white;
          border: 2px solid #1e3c72;
          outline: none;
          transition: all 0.2s ease;
        }

        .info-input:focus {
          border-color: #2a5298;
          box-shadow: 0 0 0 3px rgba(30, 60, 114, 0.1);
        }

        .info-input::placeholder {
          color: #adb5bd;
          font-style: italic;
        }

        .info-value.shop-name,
        .info-value.address {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #1e3c72;
          font-weight: 600;
        }

        .notice-box {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 16px 24px;
          margin: 0 24px 24px;
          border-radius: 8px;
          font-size: 14px;
          line-height: 1.6;
        }

        .notice-box.info {
          background: #e3f2fd;
          color: #1565c0;
          border-left: 4px solid #1976d2;
        }

        .notice-box.success {
          background: #e8f5e9;
          color: #2e7d32;
          border-left: 4px solid #4caf50;
        }

        .notice-box p {
          margin: 0;
        }

        .upload-section {
          display: grid;
          grid-template-columns: 200px 1fr;
          gap: 32px;
          padding: 24px;
          align-items: center;
        }

        .preview-container {
          width: 200px;
          height: 200px;
          border: 3px solid #e9ecef;
          background: #f8f9fa;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          position: relative;
        }

        .preview-container.logo-preview {
          border-radius: 50%;
          border-color: #1e3c72;
        }

        .preview-container.qr-preview {
          border-radius: 12px;
          border-color: #1e3c72;
        }

        .preview-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .preview-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          color: #adb5bd;
          padding: 20px;
        }

        .preview-placeholder svg {
          margin-bottom: 12px;
          opacity: 0.5;
        }

        .preview-placeholder p {
          font-size: 14px;
          font-weight: 500;
        }

        .upload-controls {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .file-input {
          display: none;
        }

        .file-label,
        .upload-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
          outline: none;
        }

        .file-label {
          background: white;
          border: 2px solid #1e3c72;
          color: #1e3c72;
        }

        .file-label:hover {
          background: #f8f9fa;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(30, 60, 114, 0.2);
        }

        .upload-btn {
          background: #1e3c72;
          color: white;
          box-shadow: 0 2px 8px rgba(30, 60, 114, 0.3);
        }

        .upload-btn:hover:not(:disabled) {
          background: #16325a;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(30, 60, 114, 0.4);
        }

        .upload-btn:disabled {
          background: #adb5bd;
          cursor: not-allowed;
          box-shadow: none;
          opacity: 0.6;
        }

        .selected-file {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          background: #e8f5e9;
          border: 2px solid #4caf50;
          border-radius: 8px;
          font-size: 14px;
          color: #2e7d32;
          font-weight: 500;
        }

        .selected-file svg {
          color: #4caf50;
          flex-shrink: 0;
        }

        .selected-file span {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        @media (max-width: 768px) {
          .profile-container {
            padding: 16px;
          }

          .page-header {
            padding: 20px;
          }

          .header-content {
            flex-direction: column;
            text-align: center;
          }

          .page-header h1 {
            font-size: 24px;
          }

          .card-header {
            flex-direction: column;
            gap: 12px;
            align-items: flex-start;
          }

          .edit-actions {
            width: 100%;
          }

          .cancel-btn, .save-btn, .edit-btn {
            flex: 1;
          }

          .info-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }

          .upload-section {
            grid-template-columns: 1fr;
            gap: 24px;
            text-align: center;
          }

          .preview-container {
            margin: 0 auto;
          }

          .upload-controls {
            align-items: stretch;
          }
        }
      `}</style>
    </div>
  );
}

export default SellerProfile;