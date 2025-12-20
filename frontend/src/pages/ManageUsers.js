import React, { useEffect, useState } from "react";
import axios from "axios";
import { FiEye, FiSearch, FiShoppingBag, FiUser, FiDownload, FiChevronLeft, FiChevronRight, FiChevronsLeft, FiChevronsRight, FiUserPlus, FiX, FiEdit2, FiShield } from "react-icons/fi";
import "./ManageUsers.css";
import Swal from "sweetalert2";

const ManageUsers = () => {
  const [buyers, setBuyers] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [filteredBuyers, setFilteredBuyers] = useState([]);
  const [filteredSellers, setFilteredSellers] = useState([]);
  const [selectedBuyer, setSelectedBuyer] = useState(null);
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("buyers");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [adminForm, setAdminForm] = useState({
    username: "",
    admin_id: "",
    password: ""
  });

  const [admins, setAdmins] = useState([]);
  const [filteredAdmins, setFilteredAdmins] = useState([]);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [showUpdatePasswordModal, setShowUpdatePasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    admin_id: "",
    old_password: "",
    new_password: "",
    confirm_password: ""
  });

  useEffect(() => {
    fetchBuyers();
    fetchSellers();
    fetchAdmins();
  }, []);

  useEffect(() => {
    const filterBuyersData = () => {
      if (!searchTerm.trim()) {
        setFilteredBuyers(buyers);
        return;
      }

      const filtered = buyers.filter(buyer => {
        const fullName = `${buyer.first_name} ${buyer.middle_name} ${buyer.last_name}`.toLowerCase();
        const username = buyer.username?.toLowerCase() || "";
        const email = buyer.email?.toLowerCase() || "";
        const search = searchTerm.toLowerCase();

        return fullName.includes(search) || username.includes(search) || email.includes(search);
      });

      setFilteredBuyers(filtered);
    };

    filterBuyersData();
    setCurrentPage(1);
  }, [buyers, searchTerm]);

  useEffect(() => {
    const filterSellersData = () => {
      if (!searchTerm.trim()) {
        setFilteredSellers(sellers);
        return;
      }

      const filtered = sellers.filter(seller => {
        const uniqueId = seller.unique_id?.toLowerCase() || "";
        const email = seller.email?.toLowerCase() || "";
        const search = searchTerm.toLowerCase();

        return uniqueId.includes(search) || email.includes(search);
      });

      setFilteredSellers(filtered);
    };

    filterSellersData();
    setCurrentPage(1);
  }, [sellers, searchTerm]);

  useEffect(() => {
    const filterAdminsData = () => {
      if (!searchTerm.trim()) {
        setFilteredAdmins(admins);
        return;
      }

      const filtered = admins.filter(admin => {
        const username = admin.username?.toLowerCase() || "";
        const adminId = admin.admin_id?.toLowerCase() || "";
        const search = searchTerm.toLowerCase();

        return username.includes(search) || adminId.includes(search);
      });

      setFilteredAdmins(filtered);
    };

    filterAdminsData();
    setCurrentPage(1);
  }, [admins, searchTerm]);

  const fetchBuyers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${process.env.REACT_APP_ADMIN_API_URL}/api/all-buyers`);
      setBuyers(res.data);
    } catch (error) {
      console.error("Error fetching buyers:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSellers = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_ADMIN_API_URL}/api/all-sellers`);
      setSellers(res.data);
    } catch (error) {
      console.error("Error fetching sellers:", error);
    }
  };

  const fetchAdmins = async () => {
  try {
    const res = await axios.get(`${process.env.REACT_APP_ADMIN_API_URL}/api/all-admins`);
    setAdmins(res.data);
  } catch (error) {
    console.error("Error fetching admins:", error);
  }
};

const filterAdmins = () => {
  if (!searchTerm.trim()) {
    setFilteredAdmins(admins);
    return;
  }

  const filtered = admins.filter(admin => {
    const username = admin.username?.toLowerCase() || "";
    const adminId = admin.admin_id?.toLowerCase() || "";
    const search = searchTerm.toLowerCase();

    return username.includes(search) || adminId.includes(search);
  });

  setFilteredAdmins(filtered);
};

const handleViewAdmin = (admin) => {
  setSelectedAdmin(admin);
};

const handlePasswordFormChange = (e) => {
  setPasswordForm({
    ...passwordForm,
    [e.target.name]: e.target.value
  });
};

const handleUpdatePassword = async (e) => {
  e.preventDefault();

  if (!passwordForm.admin_id || !passwordForm.old_password || !passwordForm.new_password || !passwordForm.confirm_password) {
    Swal.fire({
      icon: 'error',
      title: 'Validation Error',
      text: 'All fields are required!',
    });
    return;
  }

  if (passwordForm.new_password.length < 8) {
    Swal.fire({
      icon: 'error',
      title: 'Weak Password',
      text: 'New password must be at least 8 characters long!',
    });
    return;
  }

  if (passwordForm.new_password !== passwordForm.confirm_password) {
    Swal.fire({
      icon: 'error',
      title: 'Password Mismatch',
      text: 'New password and confirm password do not match!',
    });
    return;
  }

  try {
    const response = await axios.put(
      `${process.env.REACT_APP_ADMIN_API_URL}/api/admin/update-password`,
      {
        admin_id: passwordForm.admin_id,
        old_password: passwordForm.old_password,
        new_password: passwordForm.new_password
      }
    );

    Swal.fire({
      icon: 'success',
      title: 'Success!',
      text: response.data.message || 'Password updated successfully!',
    });

    setPasswordForm({
      admin_id: "",
      old_password: "",
      new_password: "",
      confirm_password: ""
    });
    setShowUpdatePasswordModal(false);
  } catch (error) {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: error.response?.data?.message || 'Failed to update password. Please try again.',
    });
  }
};



  const formatDate = (dateString) => {
    if (!dateString || dateString === "N/A") return "N/A";
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? "N/A" : date.toLocaleDateString("en-US", {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleViewBuyer = (buyer) => {
    setSelectedBuyer(buyer);
  };

  const handleViewSeller = (seller) => {
    setSelectedSeller(seller);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleAdminFormChange = (e) => {
    setAdminForm({
      ...adminForm,
      [e.target.name]: e.target.value
    });
  };

  const handleAddAdmin = async (e) => {
    e.preventDefault();

    // Validation
    if (!adminForm.username || !adminForm.admin_id || !adminForm.password) {
      Swal.fire({
        icon: 'error',
        title: 'Validation Error',
        text: 'All fields are required!',
      });
      return;
    }

    if (adminForm.password.length < 8) {
      Swal.fire({
        icon: 'error',
        title: 'Weak Password',
        text: 'Password must be at least 8 characters long!',
      });
      return;
    }

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_ADMIN_API_URL}/api/admin/register`,
        adminForm
      );

      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: response.data.message || 'Admin added successfully!',
      });

      // Reset form and close modal
      setAdminForm({
        username: "",
        admin_id: "",
        password: ""
      });
      setShowAddAdminModal(false);
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'Failed to add admin. Please try again.',
      });
    }
    fetchAdmins();
  };

  const exportToCSV = () => {
    let dataToExport;
    if (activeTab === "buyers") {
      dataToExport = filteredBuyers;
    } else if (activeTab === "sellers") {
      dataToExport = filteredSellers;
    } else {
      dataToExport = filteredAdmins;
    }

    if (dataToExport.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No Data to Export',
        text: 'There are no users to export in the current view.',
      }); 
      return;
    }

    Swal.fire({
      title: 'Export to CSV',
      text: `Are you sure you want to export the current ${activeTab} data to a CSV file?`,
      icon: 'question', 
      showCancelButton: true,
      confirmButtonText: 'Yes, Export',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        let csvContent = "";
        let headers = [];
        let rows = [];

        if (activeTab === "buyers") {
          headers = ["Full Name", "Username", "Email", "Contact", "Date Registered", "Account ID"];
          rows = dataToExport.map(buyer => [
            `${buyer.first_name} ${buyer.middle_name} ${buyer.last_name}`,
            buyer.username || "N/A",
            buyer.email || "N/A",
            buyer.contact || "N/A",
            formatDate(buyer.created_at),
            buyer.id
          ]);
        } else if (activeTab === "sellers") {
          headers = ["Unique ID", "Email", "Date Registered", "Account ID"];
          rows = dataToExport.map(seller => [
            seller.unique_id,
            seller.email || "N/A",
            formatDate(seller.date_registered),
            seller.id
          ]);
        } else {
          headers = ["Username", "Admin ID", "Date Created", "Account ID"];
          rows = dataToExport.map(admin => [
            admin.username,
            admin.admin_id,
            formatDate(admin.created_at),
            admin.id
          ]);
        }

        csvContent = headers.join(",") + "\n";
        rows.forEach(row => {
          csvContent += row.map(cell => `"${cell}"`).join(",") + "\n";
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);

        link.setAttribute("href", url);
        link.setAttribute("download", `${activeTab}_data_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    });
  };

  const currentData = activeTab === "buyers" ? filteredBuyers : activeTab === "sellers" ? filteredSellers : filteredAdmins;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = currentData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(currentData.length / itemsPerPage);

  if (loading) {
    return (
      <div className="manage-users-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="manage-users-container">
      <div className="header-bar">
        <div>
          <h2>Manage Users</h2>
          <p className="header-subtitle">
            View and manage all registered users • {buyers.length} Buyers • {sellers.length} Sellers • {admins.length} Admins
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="add-admin-btn" onClick={() => setShowUpdatePasswordModal(true)} style={{ background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)' }}>
            <FiEdit2 size={18} />
            Update Password
          </button>
          <button className="add-admin-btn" onClick={() => setShowAddAdminModal(true)}>
            <FiUserPlus size={18} />
            Add Admin
          </button>
        </div>
      </div>

      <div className="filter-bar">
        <div className="search-container">
          <FiSearch size={18} />
          <input
            type="text"
            placeholder="Search by name, email, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="filter-actions">
          <button className="export-btn" onClick={exportToCSV}>
            <FiDownload size={18} />
            Export CSV
          </button>
          <div className="tab-buttons">
            <button
              className={activeTab === "buyers" ? "active" : ""}
              onClick={() => {
                setActiveTab("buyers");
                setCurrentPage(1);
              }}
            >
              <FiUser size={16} />
              Buyers ({filteredBuyers.length})
            </button>
            <button
              className={activeTab === "sellers" ? "active" : ""}
              onClick={() => {
                setActiveTab("sellers");
                setCurrentPage(1);
              }}
            >
              <FiShoppingBag size={16} />
              Sellers ({filteredSellers.length})
            </button>
            <button
              className={activeTab === "admins" ? "active" : ""}
              onClick={() => {
                setActiveTab("admins");
                setCurrentPage(1);
              }}
            >
              <FiShield size={16} />
              Admins ({filteredAdmins.length})
            </button>
          </div>
        </div>
      </div>

      {activeTab === "buyers" && (
        <div className="table-card">
          <table className="users-table">
            <thead>
              <tr>
                <th>Full Name</th>
                <th>Username</th>
                <th>Email</th>
                <th>Contact</th>
                <th>Date Registered</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length > 0 ? (
                currentItems.map((buyer) => (
                  <tr key={buyer.id}>
                    <td>
                      {buyer.first_name} {buyer.middle_name} {buyer.last_name}
                    </td>
                    <td>{buyer.username || "N/A"}</td>
                    <td>{buyer.email || "N/A"}</td>
                    <td>{buyer.contact || "N/A"}</td>
                    <td>{formatDate(buyer.created_at)}</td>
                    <td>
                      <button
                        className="view-btn"
                        onClick={() => handleViewBuyer(buyer)}
                      >
                        <FiEye size={16} />
                        View
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="no-data">
                    No buyers found
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {filteredBuyers.length > itemsPerPage && (
            <div style={styles.pagination}>
              <button
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
                style={{
                  ...styles.paginationBtn,
                  ...(currentPage === 1 ? styles.paginationBtnDisabled : {})
                }}
                title="First Page"
              >
                <FiChevronsLeft size={18} />
              </button>
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                style={{
                  ...styles.paginationBtn,
                  ...(currentPage === 1 ? styles.paginationBtnDisabled : {})
                }}
                title="Previous Page"
              >
                <FiChevronLeft size={18} />
              </button>
              <span style={styles.paginationInfo}>
                <strong>{currentPage}</strong> / <strong>{totalPages}</strong>
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                style={{
                  ...styles.paginationBtn,
                  ...(currentPage === totalPages ? styles.paginationBtnDisabled : {})
                }}
                title="Next Page"
              >
                <FiChevronRight size={18} />
              </button>
              <button
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
                style={{
                  ...styles.paginationBtn,
                  ...(currentPage === totalPages ? styles.paginationBtnDisabled : {})
                }}
                title="Last Page"
              >
                <FiChevronsRight size={18} />
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === "sellers" && (
        <div className="table-card">
          <table className="users-table">
            <thead>
              <tr>
                <th>Unique ID</th>
                <th>Email</th>
                <th>Date Registered</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length > 0 ? (
                currentItems.map((seller) => (
                  <tr key={seller.id}>
                    <td>{seller.unique_id}</td>
                    <td>{seller.email || "N/A"}</td>
                    <td>{formatDate(seller.date_registered)}</td>
                    <td>
                      <button
                        className="view-btn"
                        onClick={() => handleViewSeller(seller)}
                      >
                        <FiEye size={16} />
                        View
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="no-data">
                    No sellers found
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {filteredSellers.length > itemsPerPage && (
            <div style={styles.pagination}>
              <button
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
                style={{
                  ...styles.paginationBtn,
                  ...(currentPage === 1 ? styles.paginationBtnDisabled : {})
                }}
                title="First Page"
              >
                <FiChevronsLeft size={18} />
              </button>
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                style={{
                  ...styles.paginationBtn,
                  ...(currentPage === 1 ? styles.paginationBtnDisabled : {})
                }}
                title="Previous Page"
              >
                <FiChevronLeft size={18} />
              </button>
              <span style={styles.paginationInfo}>
                Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
                <span style={styles.paginationCount}>
                  ({indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredSellers.length)} of {filteredSellers.length})
                </span>
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                style={{
                  ...styles.paginationBtn,
                  ...(currentPage === totalPages ? styles.paginationBtnDisabled : {})
                }}
                title="Next Page"
              >
                <FiChevronRight size={18} />
              </button>
              <button
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
                style={{
                  ...styles.paginationBtn,
                  ...(currentPage === totalPages ? styles.paginationBtnDisabled : {})
                }}
                title="Last Page"
              >
                <FiChevronsRight size={18} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Admins Table */}
      {activeTab === "admins" && (
        <div className="table-card">
          <table className="users-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Admin ID</th>
                <th>Date Created</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length > 0 ? (
                currentItems.map((admin) => (
                  <tr key={admin.id}>
                    <td>{admin.username}</td>
                    <td>{admin.admin_id}</td>
                    <td>{formatDate(admin.created_at)}</td>
                    <td>
                      <button
                        className="view-btn"
                        onClick={() => handleViewAdmin(admin)}
                      >
                        <FiEye size={16} />
                        View
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="no-data">
                    No admins found
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {filteredAdmins.length > itemsPerPage && (
            <div style={styles.pagination}>
              <button
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
                style={{
                  ...styles.paginationBtn,
                  ...(currentPage === 1 ? styles.paginationBtnDisabled : {})
                }}
                title="First Page"
              >
                <FiChevronsLeft size={18} />
              </button>
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                style={{
                  ...styles.paginationBtn,
                  ...(currentPage === 1 ? styles.paginationBtnDisabled : {})
                }}
                title="Previous Page"
              >
                <FiChevronLeft size={18} />
              </button>
              <span style={styles.paginationInfo}>
                Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
                <span style={styles.paginationCount}>
                  ({indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredAdmins.length)} of {filteredAdmins.length})
                </span>
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                style={{
                  ...styles.paginationBtn,
                  ...(currentPage === totalPages ? styles.paginationBtnDisabled : {})
                }}
                title="Next Page"
              >
                <FiChevronRight size={18} />
              </button>
              <button
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
                style={{
                  ...styles.paginationBtn,
                  ...(currentPage === totalPages ? styles.paginationBtnDisabled : {})
                }}
                title="Last Page"
              >
                <FiChevronsRight size={18} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Add Admin Modal */}
      {showAddAdminModal && (
        <div style={styles.modalOverlay} onClick={() => setShowAddAdminModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div style={styles.headerContent}>
                <FiUserPlus size={24} style={{ color: '#fff' }} />
                <h3 style={styles.modalTitle}>Add New Admin</h3>
              </div>
              <button style={styles.closeButton} onClick={() => setShowAddAdminModal(false)}>
                <FiX size={24} />
              </button>
            </div>

            <form onSubmit={handleAddAdmin}>
              <div style={styles.modalBody}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Username *</label>
                  <input
                    type="text"
                    name="username"
                    value={adminForm.username}
                    onChange={handleAdminFormChange}
                    style={styles.formInput}
                    placeholder="Enter username"
                    required
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Admin ID *</label>
                  <input
                    type="text"
                    name="admin_id"
                    value={adminForm.admin_id}
                    onChange={handleAdminFormChange}
                    style={styles.formInput}
                    placeholder="Enter admin ID (e.g., A123456)"
                    required
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Password *</label>
                  <input
                    type="password"
                    name="password"
                    value={adminForm.password}
                    onChange={handleAdminFormChange}
                    style={styles.formInput}
                    placeholder="Enter password (min. 8 characters)"
                    required
                  />
                  <small style={styles.helpText}>Password must be at least 8 characters long</small>
                </div>
              </div>

              <div style={styles.modalFooter}>
                <button
                  type="button"
                  onClick={() => setShowAddAdminModal(false)}
                  style={styles.cancelButton}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={styles.submitButton}
                  className="submit-btn"
                >
                  <FiUserPlus size={18} />
                  Add Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Update Password Modal */}
      {showUpdatePasswordModal && (
        <div style={styles.modalOverlay} onClick={() => setShowUpdatePasswordModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div style={styles.headerContent}>
                <FiEdit2 size={24} style={{ color: '#fff' }} />
                <h3 style={styles.modalTitle} className="modal-title">Update Admin Password</h3>
              </div>
              <button style={styles.closeButton} onClick={() => setShowUpdatePasswordModal(false)}>
                <FiX size={24} />
              </button>
            </div>

            <form onSubmit={handleUpdatePassword}>
              <div style={styles.modalBody}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Admin ID *</label>
                  <input
                    type="text"
                    name="admin_id"
                    value={passwordForm.admin_id}
                    onChange={handlePasswordFormChange}
                    style={styles.formInput}
                    placeholder="Enter your admin ID"
                    required
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Old Password *</label>
                  <input
                    type="password"
                    name="old_password"
                    value={passwordForm.old_password}
                    onChange={handlePasswordFormChange}
                    style={styles.formInput}
                    placeholder="Enter current password"
                    required
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>New Password *</label>
                  <input
                    type="password"
                    name="new_password"
                    value={passwordForm.new_password}
                    onChange={handlePasswordFormChange}
                    style={styles.formInput}
                    placeholder="Enter new password (min. 8 characters)"
                    required
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Confirm New Password *</label>
                  <input
                    type="password"
                    name="confirm_password"
                    value={passwordForm.confirm_password}
                    onChange={handlePasswordFormChange}
                    style={styles.formInput}
                    placeholder="Confirm new password"
                    required
                  />
                  <small style={styles.helpText}>Password must be at least 8 characters long</small>
                </div>
              </div>

              <div style={styles.modalFooter}>
                <button
                  type="button"
                  onClick={() => setShowUpdatePasswordModal(false)}
                  style={styles.cancelButton}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{...styles.submitButton, background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)'}}
                  className="submit-btn"
                >
                  <FiEdit2 size={18} />
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Modal */}
      {selectedAdmin && (
        <div style={styles.modalOverlay} onClick={() => setSelectedAdmin(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div style={styles.headerContent}>
                <FiShield size={24} style={{ color: '#fff' }} />
                <h3 style={styles.modalTitle} className="modal-title">Admin Information</h3>
              </div>
              <button style={styles.closeButton} onClick={() => setSelectedAdmin(null)}>
                <FiX size={24} />
              </button>
            </div>

            <div style={styles.modalBody}>
              <div style={styles.section}>
                <div style={styles.infoGrid}>
                  <div style={styles.infoItem}>
                    <span style={styles.infoLabel}>Username:</span>
                    <span style={styles.infoValue}>{selectedAdmin.username}</span>
                  </div>
                  <div style={styles.infoItem}>
                    <span style={styles.infoLabel}>Admin ID:</span>
                    <span style={styles.infoValue}>{selectedAdmin.admin_id}</span>
                  </div>
                  <div style={styles.infoItem}>
                    <span style={styles.infoLabel}>Date Created:</span>
                    <span style={styles.infoValue}>{formatDate(selectedAdmin.created_at)}</span>
                  </div>
                  <div style={styles.infoItem}>
                    <span style={styles.infoLabel}>Account ID:</span>
                    <span style={styles.infoValue}>#{selectedAdmin.id}</span>
                  </div>
                </div>
              </div>
            </div>

            <div style={styles.modalFooter}>
              <button
                onClick={() => setSelectedAdmin(null)}
                style={styles.closeButtonFooter}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Buyer Modal */}
      {selectedBuyer && (
        <div style={styles.modalOverlay} onClick={() => setSelectedBuyer(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div style={styles.headerContent}>
                <FiUser size={24} style={{ color: '#fff' }} />
                <h3 style={styles.modalTitle}>Buyer Information</h3>
              </div>
              <button style={styles.closeButton} onClick={() => setSelectedBuyer(null)}>
                <FiX size={24} />
              </button>
            </div>

            <div style={styles.modalBody}>
              <div style={styles.section}>
                <div style={styles.infoGrid}>
                  <div style={styles.infoItem}>
                    <span style={styles.infoLabel}>Full Name:</span>
                    <span style={styles.infoValue}>
                      {selectedBuyer.first_name} {selectedBuyer.middle_name} {selectedBuyer.last_name}
                    </span>
                  </div>
                  <div style={styles.infoItem}>
                    <span style={styles.infoLabel}>Username:</span>
                    <span style={styles.infoValue}>{selectedBuyer.username || "N/A"}</span>
                  </div>
                  <div style={styles.infoItem}>
                    <span style={styles.infoLabel}>Email:</span>
                    <span style={styles.infoValue}>{selectedBuyer.email || "N/A"}</span>
                  </div>
                  <div style={styles.infoItem}>
                    <span style={styles.infoLabel}>Contact Number:</span>
                    <span style={styles.infoValue}>{selectedBuyer.contact || "N/A"}</span>
                  </div>
                  <div style={styles.infoItem}>
                    <span style={styles.infoLabel}>Date Registered:</span>
                    <span style={styles.infoValue}>{formatDate(selectedBuyer.created_at)}</span>
                  </div>
                  <div style={styles.infoItem}>
                    <span style={styles.infoLabel}>Account ID:</span>
                    <span style={styles.infoValue}>#{selectedBuyer.id}</span>
                  </div>
                </div>
              </div>
            </div>

            <div style={styles.modalFooter}>
              <button
                onClick={() => setSelectedBuyer(null)}
                style={styles.closeButtonFooter}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Seller Modal */}
      {selectedSeller && (
        <div style={styles.modalOverlay} onClick={() => setSelectedSeller(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div style={styles.headerContent}>
                <FiShoppingBag size={24} style={{ color: '#fff' }} />
                <h3 style={styles.modalTitle}>Seller Information</h3>
              </div>
              <button style={styles.closeButton} onClick={() => setSelectedSeller(null)}>
                <FiX size={24} />
              </button>
            </div>

            <div style={styles.modalBody}>
              <div style={styles.section}>
                <div style={styles.infoGrid}>
                  <div style={styles.infoItem}>
                    <span style={styles.infoLabel}>Unique ID:</span>
                    <span style={styles.infoValue}>{selectedSeller.unique_id}</span>
                  </div>
                  <div style={styles.infoItem}>
                    <span style={styles.infoLabel}>Email:</span>
                    <span style={styles.infoValue}>{selectedSeller.email || "N/A"}</span>
                  </div>
                  <div style={styles.infoItem}>
                    <span style={styles.infoLabel}>Date Registered:</span>
                    <span style={styles.infoValue}>{formatDate(selectedSeller.date_registered)}</span>
                  </div>
                  <div style={styles.infoItem}>
                    <span style={styles.infoLabel}>Account ID:</span>
                    <span style={styles.infoValue}>#{selectedSeller.id}</span>
                  </div>
                </div>
              </div>
            </div>

            <div style={styles.modalFooter}>
              <button
                onClick={() => setSelectedSeller(null)}
                style={styles.closeButtonFooter}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  pagination: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '12px',
    padding: '24px',
    marginTop: '20px',
    background: '#ffffff',
    borderTop: '2px solid #e0f2fe',
  },
  paginationBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '40px',
    height: '40px',
    border: '2px solid #bae6fd',
    background: '#fff',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    color: '#1e3c72',
  },
  paginationBtnDisabled: {
    opacity: 0.3,
    cursor: 'not-allowed',
    borderColor: '#e0e0e0',
  },
  paginationInfo: {
    margin: '0 16px',
    fontSize: '1rem',
    color: '#1e3c72',
    fontWeight: '600',
  },
  paginationCount: {
    fontSize: '0.8rem',
    fontWeight: '500',
    color: '#666',
  },
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
    maxWidth: '600px',
    maxHeight: '90vh',
    overflow: 'auto',
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
    fontSize: '32px',
    lineHeight: '1',
    padding: '0',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '4px',
    transition: 'background 0.2s ease',
  },
  modalBody: {
    padding: '30px',
    overflowY: 'auto',
    flex: '1 1 auto',
    maxHeight: 'calc(80vh - 160px)',
  },
  formGroup: {
    marginBottom: '20px',
  },
  formLabel: {
    display: 'block',
    marginBottom: '8px',
    fontSize: '0.9rem',
    fontWeight: '600',
    color: '#333',
  },
  formInput: {
    width: '100%',
    padding: '12px 16px',
    fontSize: '1rem',
    border: '2px solid #e0f2fe',
    borderRadius: '8px',
    transition: 'border-color 0.2s ease',
    fontFamily: 'Poppins, sans-serif',
  },
  helpText: {
    display: 'block',
    marginTop: '6px',
    fontSize: '0.8rem',
    color: '#666',
  },
  section: {
    marginBottom: '20px',
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
  },
  infoItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
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
  modalFooter: {
    padding: '20px 30px',
    borderTop: '1px solid #e0e0e0',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
  },
  cancelButton: {
    padding: '12px 32px',
    background: '#f0f0f0',
    color: '#333',
    border: 'none',
    borderRadius: '8px',
    fontSize: '0.95rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background 0.3s ease',
  },
  submitButton: {
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

export default ManageUsers;