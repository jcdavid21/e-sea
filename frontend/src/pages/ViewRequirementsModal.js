import React, { useState } from "react";
import { FiX, FiFileText, FiCheckCircle, FiXCircle, FiUser, FiHome, FiMapPin, FiSave } from "react-icons/fi";

const ViewRequirementsModal = ({ seller, onClose, onUpdate }) => {
  const [requirements, setRequirements] = useState(
    typeof seller.requirements === "string" 
      ? JSON.parse(seller.requirements) 
      : seller.requirements
  );
  const [hasChanges, setHasChanges] = useState(false);

  const requirementsList = [
    { key: "barangayClearance", label: "Barangay Clearance" },
    { key: "businessPermit", label: "Business Permit" },
    { key: "idProof", label: "Valid ID Proof" },
  ];

  const toggleRequirement = (key) => {
    // Only allow toggling if status is pending
    if (seller.display_status !== "pending") {
      return;
    }
    
    setRequirements(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    onUpdate(seller.id, requirements);
    setHasChanges(false);
    onClose();
  };

  const allComplete = Object.values(requirements).every(Boolean);
  const completedCount = Object.values(requirements).filter(Boolean).length;
  const totalCount = Object.keys(requirements).length;

  const daysSinceRegistration = Math.round(
    Math.abs((new Date() - new Date(seller.date_added)) / (24 * 60 * 60 * 1000))
  );

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* MODAL HEADER */}
        <div style={styles.modalHeader}>
          <div style={styles.headerContent}>
            <FiFileText size={24} style={{ color: '#fff' }} />
            <h3 style={styles.modalTitle}>Seller Requirements</h3>
          </div>
          <button style={styles.closeButton} onClick={onClose}>
            <FiX size={24} />
          </button>
        </div>

        {/* MODAL BODY */}
        <div style={styles.modalBody}>
          {/* Seller Information */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <FiUser size={18} style={{ color: '#1e3c72' }} />
              <h4 style={styles.sectionTitle}>Seller Information</h4>
            </div>
            
            <div style={styles.infoGrid}>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Generated ID:</span>
                <span style={styles.infoValue}>{seller.unique_id}</span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Full Name:</span>
                <span style={styles.infoValue}>
                  {seller.first_name} {seller.middle_name} {seller.last_name}
                </span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Days Since Registration:</span>
                <span style={{
                  ...styles.infoValue,
                  color: daysSinceRegistration >= 3 && !allComplete ? '#dc2626' : '#333',
                  fontWeight: daysSinceRegistration >= 3 && !allComplete ? '700' : '500'
                }}>
                  {daysSinceRegistration} day{daysSinceRegistration !== 1 ? 's' : ''}
                  {daysSinceRegistration >= 3 && !allComplete && (
                    <span style={styles.warningBadge}> ⚠️ Auto-reject pending</span>
                  )}
                </span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Status:</span>
                <span style={{
                  ...styles.statusBadge,
                  background: seller.display_status === 'accepted' ? '#d4edda' : 
                             seller.display_status === 'rejected' ? '#f8d7da' : '#fff6d5',
                  color: seller.display_status === 'accepted' ? '#155724' : 
                         seller.display_status === 'rejected' ? '#721c24' : '#856404',
                  border: seller.display_status === 'accepted' ? '2px solid #28a745' : 
                          seller.display_status === 'rejected' ? '2px solid #dc3545' : '2px solid #ffc107'
                }}>
                  {seller.display_status.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Shop Information */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <FiHome size={18} style={{ color: '#1e3c72' }} />
              <h4 style={styles.sectionTitle}>Shop Details</h4>
            </div>
            
            <div style={styles.infoGrid}>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Shop Name:</span>
                <span style={styles.infoValue}>{seller.shop_name}</span>
              </div>
            </div>
          </div>

          {/* Address */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <FiMapPin size={18} style={{ color: '#1e3c72' }} />
              <h4 style={styles.sectionTitle}>Address</h4>
            </div>
            
            <div style={styles.addressBox}>
              <p style={styles.addressText}>
                {seller.street}, {seller.barangay}, {seller.municipality}, {seller.province}
              </p>
            </div>
          </div>

          {/* Requirements Progress */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <FiFileText size={18} style={{ color: '#1e3c72' }} />
              <h4 style={styles.sectionTitle}>Requirements Status</h4>
            </div>
            
            <div style={styles.progressContainer}>
              <div style={styles.progressBar}>
                <div 
                  style={{
                    ...styles.progressFill,
                    width: `${(completedCount / totalCount) * 100}%`,
                    background: allComplete 
                      ? 'linear-gradient(135deg, #28a745 0%, #20c997 100%)'
                      : 'linear-gradient(135deg, #ffc107 0%, #ff9800 100%)'
                  }}
                />
              </div>
              <div style={styles.progressText}>
                <span style={styles.progressCount}>
                  {completedCount} of {totalCount} completed
                </span>
                <span style={{
                  ...styles.progressBadge,
                  background: allComplete ? '#d4edda' : '#fff6d5',
                  color: allComplete ? '#155724' : '#856404',
                  border: allComplete ? '2px solid #28a745' : '2px solid #ffc107'
                }}>
                  {allComplete ? '✓ 100% Complete' : `${Math.round((completedCount / totalCount) * 100)}% Complete`}
                </span>
              </div>
            </div>
            
            {seller.display_status === "pending" && (
              <div style={styles.infoNote}>
                <strong>Note:</strong> Click on any requirement below to toggle its status
              </div>
            )}
          </div>

          {/* Requirements List */}
          <div style={styles.section}>
            <div style={styles.requirementsList}>
              {requirementsList.map(({ key, label }) => (
                <div 
                  key={key} 
                  style={{
                    ...styles.requirementItem,
                    background: requirements[key] 
                      ? 'linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%)'
                      : 'linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%)',
                    borderColor: requirements[key] ? '#28a745' : '#dc3545',
                    cursor: seller.display_status === "pending" ? 'pointer' : 'default',
                    opacity: seller.display_status === "pending" ? 1 : 0.7
                  }}
                  onClick={() => toggleRequirement(key)}
                  title={seller.display_status === "pending" ? "Click to toggle" : "Cannot edit - status is finalized"}
                >
                  <div style={styles.requirementIcon}>
                    {requirements[key] ? (
                      <FiCheckCircle size={24} color="#28a745" />
                    ) : (
                      <FiXCircle size={24} color="#dc3545" />
                    )}
                  </div>
                  <div style={styles.requirementContent}>
                    <span style={styles.requirementLabel}>{label}</span>
                    <span style={{
                      ...styles.requirementStatus,
                      color: requirements[key] ? '#155724' : '#721c24'
                    }}>
                      {requirements[key] ? '✓ Submitted' : '✗ Not Submitted'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Warning message if approaching deadline */}
          {!allComplete && daysSinceRegistration >= 2 && seller.display_status === "pending" && (
            <div style={styles.warningBox}>
              <strong>⚠️ Warning:</strong> This seller will be automatically rejected in {3 - daysSinceRegistration} day{3 - daysSinceRegistration !== 1 ? 's' : ''} if requirements are not completed.
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div style={styles.modalFooter}>
          {hasChanges && seller.display_status === "pending" && (
            <button
              onClick={handleSave}
              style={styles.saveButton}
              onMouseEnter={(e) => e.target.style.background = 'linear-gradient(135deg, #20c997 0%, #28a745 100%)'}
              onMouseLeave={(e) => e.target.style.background = 'linear-gradient(135deg, #28a745 0%, #20c997 100%)'}
            >
              <FiSave size={18} />
              Save Changes
            </button>
          )}
          <button
            onClick={onClose}
            style={styles.closeButtonFooter}
            onMouseEnter={(e) => e.target.style.background = 'linear-gradient(135deg, #2a5298 0%, #1e3c72 100%)'}
            onMouseLeave={(e) => e.target.style.background = 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)'}
          >
            Close
          </button>
        </div>
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
    maxWidth: '800px',
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
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '16px',
  },
  infoItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  infoLabel: {
    fontSize: '0.85rem',
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  infoValue: {
    fontSize: '1rem',
    fontWeight: '500',
    color: '#333',
  },
  statusBadge: {
    display: 'inline-block',
    padding: '6px 14px',
    borderRadius: '20px',
    fontSize: '0.85rem',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  warningBadge: {
    fontSize: '0.85rem',
    fontWeight: '600',
    marginLeft: '8px',
  },
  addressBox: {
    padding: '16px',
    background: '#f8f9fa',
    borderRadius: '8px',
    border: '2px solid #e0e0e0',
  },
  addressText: {
    margin: 0,
    fontSize: '1rem',
    color: '#333',
    lineHeight: '1.6',
  },
  progressContainer: {
    marginBottom: '20px',
  },
  progressBar: {
    width: '100%',
    height: '12px',
    background: '#e0e0e0',
    borderRadius: '6px',
    overflow: 'hidden',
    marginBottom: '12px',
  },
  progressFill: {
    height: '100%',
    transition: 'width 0.3s ease',
    borderRadius: '6px',
  },
  progressText: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressCount: {
    fontSize: '0.9rem',
    fontWeight: '600',
    color: '#666',
  },
  progressBadge: {
    padding: '6px 14px',
    borderRadius: '20px',
    fontSize: '0.8rem',
    fontWeight: '600',
  },
  infoNote: {
    padding: '12px',
    background: '#e3f2fd',
    border: '2px solid #2196f3',
    borderRadius: '8px',
    fontSize: '0.9rem',
    color: '#1565c0',
    marginTop: '12px',
  },
  requirementsList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '16px',
  },
  requirementItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px',
    borderRadius: '10px',
    border: '2px solid',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  },
  requirementIcon: {
    flexShrink: 0,
  },
  requirementContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  requirementLabel: {
    fontSize: '0.95rem',
    fontWeight: '600',
    color: '#333',
  },
  requirementStatus: {
    fontSize: '0.8rem',
    fontWeight: '500',
  },
  warningBox: {
    padding: '16px',
    background: '#fff6d5',
    border: '2px solid #ffc107',
    borderRadius: '10px',
    color: '#856404',
    fontSize: '0.95rem',
    fontWeight: '500',
    marginTop: '20px',
  },
  modalFooter: {
    padding: '20px 30px',
    borderTop: '1px solid #e0e0e0',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
  },
  saveButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 32px',
    background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '0.95rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background 0.3s ease',
  },
  closeButtonFooter: {
    padding: '12px 32px',
    background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '0.95rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background 0.3s ease',
  },
};

export default ViewRequirementsModal;