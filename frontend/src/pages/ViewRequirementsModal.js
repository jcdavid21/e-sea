import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { FiX, FiFileText, FiCheckCircle, FiXCircle, FiUser, FiHome, FiMapPin, FiSave, FiUpload, FiEye, FiTrash2 } from "react-icons/fi";

const ViewRequirementsModal = ({ seller, onClose, onUpdate }) => {
  const [requirements, setRequirements] = useState(
    typeof seller.requirements === "string"
      ? JSON.parse(seller.requirements)
      : seller.requirements
  );
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [uploading, setUploading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [loading, setLoading] = useState(true);

  const requirementsList = [
    { key: "barangayClearance", label: "Barangay Clearance" },
    { key: "businessPermit", label: "Business Permit" },
    { key: "idProof", label: "Valid ID Proof" },
  ];

  useEffect(() => {
    console.log("🔍 Modal opened for seller:", seller);
    console.log("🔍 Seller ID:", seller.id);
    console.log("🔍 API URL:", process.env.REACT_APP_ADMIN_API_URL);
    fetchUploadedFiles();
  }, [seller]);

  const fetchUploadedFiles = async () => {
    setLoading(true);
    try {
      const url = `${process.env.REACT_APP_ADMIN_API_URL}/api/sellers/${seller.id}/requirement-files`;
      console.log("📡 Fetching files from:", url);

      const res = await axios.get(url);

      console.log("✅ Files response:", res.data);

      const filesMap = {};
      res.data.forEach(file => {
        filesMap[file.requirement_type] = file;
        console.log(`📄 File found: ${file.requirement_type}`, file);
      });
      setUploadedFiles(filesMap);
      console.log("📦 Uploaded files map:", filesMap);
    } catch (err) {
      console.error("❌ Error fetching files:", err);
      console.error("❌ Error details:", err.response?.data);
      // Don't show error to user if no files exist (404 is normal)
      if (err.response?.status !== 404) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to load requirement files",
          confirmButtonColor: "#1e3c72",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (requirementType, event) => {
    const file = event.target.files[0];
    if (!file) return;

    console.log("Uploading file:", file.name, "for", requirementType);

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      Swal.fire({
        icon: "error",
        title: "Invalid File Type",
        text: "Please upload JPG, PNG, or PDF files only",
        confirmButtonColor: "#1e3c72",
      });
      // Reset file input
      event.target.value = '';
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      Swal.fire({
        icon: "error",
        title: "File Too Large",
        text: "File size must be less than 5MB",
        confirmButtonColor: "#1e3c72",
      });
      // Reset file input
      event.target.value = '';
      return;
    }

    // Show confirmation dialog
    const result = await Swal.fire({
      title: "Upload File?",
      html: `
      <div style="text-align: left; margin-top: 10px;">
        <p><strong>File:</strong> ${file.name}</p>
        <p><strong>Size:</strong> ${(file.size / 1024).toFixed(2)} KB</p>
        <p><strong>Type:</strong> ${file.type}</p>
      </div>
    `,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#28a745",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Yes, upload it!",
      cancelButtonText: "Cancel"
    });

    if (!result.isConfirmed) {
      // Reset file input if user cancels
      event.target.value = '';
      return;
    }

    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("requirement_type", requirementType);
    formData.append("uploaded_by", "admin");

    try {
      const url = `${process.env.REACT_APP_ADMIN_API_URL}/api/sellers/${seller.id}/upload-requirement`;
      console.log("Uploading to:", url);

      const response = await axios.post(url, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      console.log("Upload response:", response.data);

      Swal.fire({
        icon: "success",
        title: "Uploaded!",
        text: "Requirement file uploaded successfully",
        confirmButtonColor: "#1e3c72",
        timer: 1500
      });

      // Refresh files and requirements
      await fetchUploadedFiles();

      const updatedReqs = { ...requirements, [requirementType]: true };
      setRequirements(updatedReqs);
      onUpdate(seller.id, updatedReqs);
    } catch (err) {
      console.error("Upload error:", err);
      console.error("Upload error details:", err.response?.data);
      Swal.fire({
        icon: "error",
        title: "Upload Failed",
        text: err.response?.data?.message || "Failed to upload file. Please try again.",
        confirmButtonColor: "#1e3c72",
      });
    } finally {
      setUploading(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const handleDeleteFile = async (requirementType) => {
    const file = uploadedFiles[requirementType];
    if (!file) return;

    console.log("🗑️ Deleting file:", file);

    const result = await Swal.fire({
      title: "Delete File?",
      text: "This will remove the uploaded requirement file",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc3545",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Yes, delete it",
      cancelButtonText: "Cancel"
    });

    if (!result.isConfirmed) return;

    try {
      const url = `${process.env.REACT_APP_ADMIN_API_URL}/api/sellers/${seller.id}/requirement-files/${file.id}`;
      console.log("📡 Deleting from:", url);

      await axios.delete(url);

      console.log("✅ File deleted successfully");

      Swal.fire({
        icon: "success",
        title: "Deleted!",
        text: "File has been deleted",
        confirmButtonColor: "#1e3c72",
        timer: 1500
      });

      // Refresh files and requirements
      await fetchUploadedFiles();

      const updatedReqs = { ...requirements, [requirementType]: false };
      setRequirements(updatedReqs);
      onUpdate(seller.id, updatedReqs);
    } catch (err) {
      console.error("❌ Delete error:", err);
      console.error("❌ Delete error details:", err.response?.data);
      Swal.fire({
        icon: "error",
        title: "Delete Failed",
        text: "Failed to delete file. Please try again.",
        confirmButtonColor: "#1e3c72",
      });
    }
  };

  const handleViewFile = (requirementType) => {
    const file = uploadedFiles[requirementType];
    if (!file) return;

    const fileUrl = `${process.env.REACT_APP_ADMIN_API_URL}${file.file_path}`;
    console.log("👁️ Opening file:", fileUrl);
    window.open(fileUrl, '_blank');
  };

  const toggleRequirement = (key) => {
    // Only allow toggling if status is pending and no file uploaded
    if (seller.display_status !== "pending" || uploadedFiles[key]) {
      console.log("⚠️ Cannot toggle:", {
        status: seller.display_status,
        hasFile: !!uploadedFiles[key]
      });
      return;
    }

    console.log("🔄 Toggling requirement:", key);
    setRequirements(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    console.log("💾 Saving requirements:", requirements);
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
                <strong>Note:</strong> Upload files or click on requirements to toggle status manually
              </div>
            )}
          </div>

          {/* Requirements List with File Upload */}
          <div style={styles.section}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <p>Loading files...</p>
              </div>
            ) : (
              <div style={styles.requirementsList}>
                {requirementsList.map(({ key, label }) => {
                  const hasFile = uploadedFiles[key];
                  console.log(`🔍 Rendering ${key}:`, { hasFile, file: uploadedFiles[key] });

                  return (
                    <div
                      key={key}
                      style={{
                        ...styles.requirementCard,
                        background: requirements[key]
                          ? 'linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%)'
                          : 'linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%)',
                        borderColor: requirements[key] ? '#28a745' : '#dc3545',
                      }}
                    >
                      <div
                        style={{
                          ...styles.requirementHeader,
                          cursor: seller.display_status === "pending" && !hasFile ? 'pointer' : 'default',
                        }}
                        onClick={() => toggleRequirement(key)}
                        title={
                          hasFile
                            ? "File uploaded - cannot toggle manually"
                            : seller.display_status === "pending"
                              ? "Click to toggle"
                              : "Cannot edit - status is finalized"
                        }
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

                      {/* File Upload Section */}
                      <div style={styles.fileSection}>
                        {hasFile ? (
                          <div style={styles.fileActions}>
                            <button
                              style={styles.viewButton}
                              onClick={() => handleViewFile(key)}
                              disabled={uploading}
                            >
                              <FiEye size={16} />
                              View File
                            </button>
                            {seller.display_status !== "rejected" && (
                              <button
                                style={styles.deleteButton}
                                onClick={() => handleDeleteFile(key)}
                                disabled={uploading}
                              >
                                <FiTrash2 size={16} />
                                Delete
                              </button>
                            )}
                            <span style={styles.fileDate}>
                              {new Date(hasFile.uploaded_at).toLocaleDateString()}
                            </span>
                          </div>
                        ) : seller.display_status !== "rejected" ? (
                          <div style={styles.uploadSection}>
                            <label style={styles.uploadButton}>
                              <input
                                type="file"
                                accept=".jpg,.jpeg,.png,.pdf"
                                onChange={(e) => handleFileUpload(key, e)}
                                disabled={uploading}
                                style={{ display: 'none' }}
                              />
                              <FiUpload size={16} />
                              {uploading ? 'Uploading...' : 'Upload File'}
                            </label>
                            <span style={styles.fileHint}>JPG, PNG or PDF (max 5MB)</span>
                          </div>
                        ) : (
                          <div style={styles.noFileMessage}>
                            <span style={{ fontSize: '0.85rem', color: '#666', fontStyle: 'italic' }}>
                              No file uploaded
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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
    width: 'max-content',
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
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '20px',
  },
  requirementCard: {
    padding: '20px',
    borderRadius: '12px',
    border: '2px solid',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  },
  requirementHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px',
  },
  requirementIcon: {
    flexShrink: 0,
  },
  requirementContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    flex: 1,
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
  fileSection: {
    paddingTop: '16px',
    borderTop: '1px solid rgba(0, 0, 0, 0.1)',
  },
  fileActions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    alignItems: 'center',
  },
  viewButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    background: '#1e3c72',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '0.85rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  deleteButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    background: '#dc3545',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '0.85rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  fileDate: {
    fontSize: '0.75rem',
    color: '#666',
    fontStyle: 'italic',
  },
  uploadSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  uploadButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '10px 16px',
    background: '#28a745',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '0.85rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    width: 'fit-content',
  },
  fileHint: {
    fontSize: '0.75rem',
    color: '#666',
    fontStyle: 'italic',
  },
  noFileMessage: {
    padding: '8px 0',
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