import React, { useState } from "react";
import { FiX, FiSave, FiUser, FiMapPin, FiHome, FiFileText } from "react-icons/fi";

const AddSellerModal = ({ onClose, onAddSeller }) => {
  const [formData, setFormData] = useState({
    first_name: "",
    middle_name: "",
    last_name: "",
    shop_name: "",
    street: "",
    barangay: "",
    municipality: "",
    province: "",
    requirements: {
      barangayClearance: false,
      businessPermit: false,
      idProof: false,
    },
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      requirements: { ...prev.requirements, [name]: checked },
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.first_name || !formData.last_name || !formData.shop_name) {
      alert("Please fill in all required fields (First Name, Last Name, Shop Name)");
      return;
    }

    // Generate unique ID
    const uniqueId = `SELLER-${Date.now()}`;
    
    const dataToSend = {
      ...formData,
      unique_id: uniqueId,
      requirements: JSON.stringify(formData.requirements),
      status: "pending",
    };

    onAddSeller(dataToSend);
  };

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* MODAL HEADER */}
        <div style={styles.modalHeader}>
          <div style={styles.headerContent}>
            <FiUser size={24} style={{ color: '#fff' }} />
            <h3 style={styles.modalTitle}>Add New Seller</h3>
          </div>
          <button style={styles.closeButton} onClick={onClose}>
            <FiX size={24} />
          </button>
        </div>

        {/* MODAL BODY */}
        <form onSubmit={handleSubmit} style={styles.modalBody}>
          {/* Personal Information Section */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <FiUser size={18} style={{ color: '#1e3c72' }} />
              <h4 style={styles.sectionTitle}>Personal Information</h4>
            </div>
            
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  First Name <span style={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  style={styles.input}
                  placeholder="Enter first name"
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Middle Name</label>
                <input
                  type="text"
                  name="middle_name"
                  value={formData.middle_name}
                  onChange={handleInputChange}
                  style={styles.input}
                  placeholder="Enter middle name"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>
                  Last Name <span style={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  style={styles.input}
                  placeholder="Enter last name"
                  required
                />
              </div>
            </div>
          </div>

          {/* Shop Information Section */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <FiHome size={18} style={{ color: '#1e3c72' }} />
              <h4 style={styles.sectionTitle}>Shop Information</h4>
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>
                Shop Name <span style={styles.required}>*</span>
              </label>
              <input
                type="text"
                name="shop_name"
                value={formData.shop_name}
                onChange={handleInputChange}
                style={styles.input}
                placeholder="Enter shop name"
                required
              />
            </div>
          </div>

          {/* Address Section */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <FiMapPin size={18} style={{ color: '#1e3c72' }} />
              <h4 style={styles.sectionTitle}>Address</h4>
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Street</label>
              <input
                type="text"
                name="street"
                value={formData.street}
                onChange={handleInputChange}
                style={styles.input}
                placeholder="Enter street address"
              />
            </div>

            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Barangay</label>
                <input
                  type="text"
                  name="barangay"
                  value={formData.barangay}
                  onChange={handleInputChange}
                  style={styles.input}
                  placeholder="Enter barangay"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Municipality</label>
                <input
                  type="text"
                  name="municipality"
                  value={formData.municipality}
                  onChange={handleInputChange}
                  style={styles.input}
                  placeholder="Enter municipality"
                />
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Province</label>
              <input
                type="text"
                name="province"
                value={formData.province}
                onChange={handleInputChange}
                style={styles.input}
                placeholder="Enter province"
              />
            </div>
          </div>

          {/* Requirements Section */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <FiFileText size={18} style={{ color: '#1e3c72' }} />
              <h4 style={styles.sectionTitle}>Requirements</h4>
            </div>
            
            <div style={styles.checkboxGrid}>
              {[
                { key: 'barangayClearance', label: 'Barangay Clearance' },
                { key: 'businessPermit', label: 'Business Permit' },
                { key: 'idProof', label: 'Valid ID Proof' }
              ].map((req) => (
                <label key={req.key} style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    name={req.key}
                    checked={formData.requirements[req.key]}
                    onChange={handleCheckboxChange}
                    style={styles.checkbox}
                  />
                  <span style={styles.checkboxText}>
                    {req.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* MODAL FOOTER */}
          <div style={styles.modalFooter}>
            <button
              type="button"
              onClick={onClose}
              style={styles.cancelButton}
              onMouseEnter={(e) => e.target.style.background = '#b52a37'}
              onMouseLeave={(e) => e.target.style.background = '#dc3545'}
            >
              <FiX size={18} />
              Cancel
            </button>
            <button
              type="submit"
              style={styles.saveButton}
              onMouseEnter={(e) => e.target.style.background = '#218838'}
              onMouseLeave={(e) => e.target.style.background = '#28a745'}
            >
              <FiSave size={18} />
              Add Seller
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const styles = {
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px',
  },
  modal: {
    background: '#fff',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '900px',
    maxHeight: '90vh',
    overflow: 'hidden',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
    display: 'flex',
    flexDirection: 'column',
  },
  modalHeader: {
    padding: '24px 30px',
    borderBottom: '1px solid #e0e0e0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
    borderRadius: '16px 16px 0 0',
  },
  headerContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  modalTitle: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#fff',
    margin: 0,
  },
  closeButton: {
    background: 'transparent',
    border: 'none',
    color: '#fff',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '4px',
    transition: 'background 0.2s ease',
  },
  modalBody: {
    padding: '30px',
    overflowY: 'auto',
    flex: 1,
  },
  section: {
    marginBottom: '30px',
    paddingBottom: '20px',
    borderBottom: '2px solid #f0f0f0',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '20px',
  },
  sectionTitle: {
    fontSize: '1.1rem',
    fontWeight: '600',
    color: '#1e3c72',
    margin: 0,
  },
  formGroup: {
    marginBottom: '20px',
    flex: 1,
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontSize: '0.9rem',
    fontWeight: '600',
    color: '#333',
  },
  required: {
    color: '#dc3545',
    marginLeft: '4px',
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    fontSize: '0.95rem',
    transition: 'border-color 0.3s ease',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'Poppins, sans-serif',
  },
  checkboxGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '16px',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    cursor: 'pointer',
    padding: '12px',
    background: '#f8f9fa',
    borderRadius: '8px',
    border: '2px solid #e0e0e0',
    transition: 'all 0.2s ease',
  },
  checkbox: {
    width: '18px',
    height: '18px',
    cursor: 'pointer',
    accentColor: '#1e3c72',
  },
  checkboxText: {
    fontSize: '0.9rem',
    color: '#333',
    fontWeight: '500',
  },
  modalFooter: {
    padding: '20px 0 0 0',
    borderTop: '1px solid #e0e0e0',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '20px',
  },
  cancelButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 24px',
    background: '#dc3545',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '0.95rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background 0.3s ease',
  },
  saveButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 24px',
    background: '#28a745',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '0.95rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background 0.3s ease',
  },
};

// Add input focus styles
const styleSheet = document.createElement("style");
styleSheet.innerText = `
  input:focus {
    border-color: #1e3c72 !important;
    box-shadow: 0 0 0 3px rgba(30, 60, 114, 0.1);
  }
  
  .checkbox-label:hover {
    background: #e3f2fd;
    border-color: #1e3c72;
  }
`;
document.head.appendChild(styleSheet);

export default AddSellerModal;