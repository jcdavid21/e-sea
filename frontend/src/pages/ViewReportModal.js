import React from "react";
import { FiX, FiAlertCircle, FiUser, FiCalendar, FiMessageSquare, FiShoppingBag, FiCheckCircle } from "react-icons/fi";

const ViewReportModal = ({ report, onClose }) => {
  const isUserNotification = report.source === "user";
  
  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* MODAL HEADER */}
        <div style={styles.modalHeader}>
          <div style={styles.headerContent}>
            <FiAlertCircle size={24} style={{ color: '#fff' }} />
            <h3 style={styles.modalTitle}>Notification Details</h3>
          </div>
          <button style={styles.closeButton} onClick={onClose}>
            <FiX size={24} />
          </button>
        </div>

        {/* MODAL BODY */}
        <div style={styles.modalBody}>


          {/* Date */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <FiCalendar size={18} style={{ color: '#1e3c72' }} />
              <h4 style={styles.sectionTitle}>Date & Time</h4>
            </div>
            
            <div style={styles.dateBox}>
              <p style={styles.dateText}>
                {new Date(report.date_created).toLocaleString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>

          
          {/* Notification Info */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <FiMessageSquare size={18} style={{ color: '#1e3c72' }} />
              <h4 style={styles.sectionTitle}>Notification Information</h4>
            </div>
            
            <div style={styles.infoGrid}>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>ID:</span>
                <span style={styles.infoValue}>#{report.id}</span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Source:</span>
                <span style={{
                  ...styles.sourceBadge,
                  background: isUserNotification 
                    ? 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)'
                    : 'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)',
                  color: isUserNotification ? '#1565c0' : '#6a1b9a',
                  border: isUserNotification ? '2px solid #2196f3' : '2px solid #9c27b0'
                }}>
                  {report.source.toUpperCase()}
                </span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Type:</span>
                <span style={styles.infoValue}>{report.type || 'General'}</span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Status:</span>
                <span style={{
                  ...styles.statusBadge,
                  background: report.status === 1 || report.status === 'read'
                    ? 'linear-gradient(135deg, #d4edda 0%, #b8e6c0 100%)'
                    : 'linear-gradient(135deg, #fff6d5 0%, #ffeaa7 100%)',
                  color: report.status === 1 || report.status === 'read' ? '#155724' : '#856404',
                  border: report.status === 1 || report.status === 'read' 
                    ? '2px solid #28a745' 
                    : '2px solid #f9ca24'
                }}>
                  {report.status === 1 || report.status === 'read' ? '✓ Read' : '✗ Unread'}
                </span>
              </div>
            </div>
          </div>

          {/* User/Order Details */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <FiUser size={18} style={{ color: '#1e3c72' }} />
              <h4 style={styles.sectionTitle}>
                {isUserNotification ? 'Customer Details' : 'Seller Details'}
              </h4>
            </div>
            
            <div style={styles.infoGrid}>
              {isUserNotification && report.user_id && (
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>Customer ID:</span>
                  <span style={styles.infoValue}>{report.user_id}</span>
                </div>
              )}
              {!isUserNotification && report.seller_id && (
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>Seller ID:</span>
                  <span style={styles.infoValue}>{report.seller_id}</span>
                </div>
              )}
              {report.order_id && (
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>Order ID:</span>
                  <span style={styles.infoValue}>#{report.order_id}</span>
                </div>
              )}
            </div>
          </div>

          {/* Message */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <FiMessageSquare size={18} style={{ color: '#1e3c72' }} />
              <h4 style={styles.sectionTitle}>Message</h4>
            </div>
            
            <div style={styles.messageBox}>
              <p style={styles.messageText}>{report.message}</p>
            </div>
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div style={styles.modalFooter}>
          <button
            onClick={onClose}
            style={styles.closeButtonFooter}
            onMouseEnter={(e) => e.target.style.background = 'linear-gradient(135deg, #2a5298 0%, #1e3c72 100%)'}
            onMouseLeave={(e) => e.target.style.background = 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)'}
          >
            <FiCheckCircle size={18} />
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
    maxWidth: '700px',
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
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
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
  sourceBadge: {
    display: 'inline-block',
    padding: '6px 14px',
    borderRadius: '20px',
    fontSize: '0.85rem',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    width: 'fit-content',
  },
  statusBadge: {
    display: 'inline-block',
    padding: '6px 14px',
    borderRadius: '20px',
    fontSize: '0.85rem',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    width: 'fit-content',
  },
  messageBox: {
    padding: '16px',
    background: '#f8f9fa',
    borderRadius: '8px',
    border: '2px solid #e0e0e0',
  },
  messageText: {
    margin: 0,
    fontSize: '1rem',
    color: '#333',
    lineHeight: '1.6',
  },
  dateBox: {
    padding: '16px',
    background: '#e3f2fd',
    borderRadius: '8px',
    border: '2px solid #2196f3',
  },
  dateText: {
    margin: 0,
    fontSize: '1rem',
    color: '#1565c0',
    fontWeight: '500',
  },
  modalFooter: {
    padding: '20px 30px',
    borderTop: '1px solid #e0e0e0',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
  },
  closeButtonFooter: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
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

export default ViewReportModal;