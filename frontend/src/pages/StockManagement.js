import React, { useEffect, useState, useRef } from "react";
import Swal from 'sweetalert2';
import { FiEdit2, FiSave, FiX, FiPackage, FiAlertCircle, FiTrendingUp, FiChevronLeft, FiChevronRight, FiChevronsLeft, FiChevronsRight } from "react-icons/fi";

function StockManagement() {
  const [stockItems, setStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alertMessage, setAlertMessage] = useState(null);
  const [alertType, setAlertType] = useState("info");
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [categories, setCategories] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [showAddCategory, setShowAddCategory] = useState(false);
  const fileInputRef = useRef(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [filterCategory, setFilterCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination calculations
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = stockItems.slice(indexOfFirstItem, indexOfLastItem);

  const filteredStockItems = stockItems.filter((item) => {
    const matchesCategory = filterCategory === "All" || item.category === filterCategory;
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const indexOfLastItemFiltered = currentPage * itemsPerPage;
  const indexOfFirstItemFiltered = indexOfLastItemFiltered - itemsPerPage;
  const currentItemsFiltered = filteredStockItems.slice(indexOfFirstItemFiltered, indexOfLastItemFiltered);
  const totalPagesFiltered = Math.ceil(filteredStockItems.length / itemsPerPage);
   // Use filtered items for pagination
const totalPages = Math.ceil(filteredStockItems.length / itemsPerPage);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    stock: "",
    price: "",
    image: null
  });

  const seller_id = localStorage.getItem("seller_unique_id");

  const showAlert = (message, type = "info") => {
    const icon = type === "error" ? "error" : type === "success" ? "success" : "info";
    Swal.fire({
      icon: icon,
      title: type === "error" ? "Error" : type === "success" ? "Success" : "Info",
      text: message,
      confirmButtonColor: '#1e3c72',
      timer: type === "success" ? 3000 : undefined,
      timerProgressBar: type === "success",
    });
  };

  useEffect(() => {
    loadStock();
    loadCategories();
  }, [seller_id]);

  useEffect(() => {
    if (!formData.image) {
      setImagePreview(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result);
    reader.readAsDataURL(formData.image);
  }, [formData.image]);

  const loadStock = async () => {
    if (!seller_id) {
      showAlert("Seller not logged in! Redirecting to login page...", "error");
      window.location.href = "/seller-login";
      return;
    }
    try {
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/api/seller/fish?seller_id=${encodeURIComponent(seller_id)}`
      );
      const data = await res.json();
      setStockItems(data);
    } catch (err) {
      console.error("Failed to load stock:", err);
      showAlert("Error loading stock items", "error");
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/api/seller/categories?seller_id=${encodeURIComponent(seller_id)}`
      );
      const data = await res.json();
      setCategories(data);
    } catch (err) {
      console.error("Failed to load categories:", err);
    }
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      stock: item.stock.toString(),
      price: item.price.toString(),
      image: null
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setShowAddModal(false);
    setEditingItem(null);
    setShowAddCategory(false);
    setNewCategory("");
    setImagePreview(null);
    setFormData({
      name: "",
      category: "",
      stock: "",
      price: "",
      image: null
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({
      name: "",
      category: categories.length > 0 ? categories[0].category_name : "",
      stock: "",
      price: "",
      image: null
    });
    setImagePreview(null);
    setShowAddCategory(false);
    setShowModal(true);
    setShowAddModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    setFormData(prev => ({ ...prev, image: e.target.files[0] }));
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Invalid Input',
        text: 'Please enter a category name',
        confirmButtonColor: '#1e3c72'
      });
      return;
    }

    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/seller/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category_name: newCategory.trim(),
          seller_id: seller_id,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: data.message,
          confirmButtonColor: '#1e3c72',
          timer: 2000
        });
        await loadCategories();
        setFormData(prev => ({ ...prev, category: newCategory.trim() }));
        setNewCategory("");
        setShowAddCategory(false);
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: data.message,
          confirmButtonColor: '#1e3c72'
        });
      }
    } catch (err) {
      console.error("Error adding category:", err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error adding category',
        confirmButtonColor: '#1e3c72'
      });
    }
  };

  const addFishProduct = async () => {
    const newStock = parseFloat(formData.stock);
    const newPrice = parseFloat(formData.price);

    if (!formData.name.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Invalid Input',
        text: 'Product name is required',
        confirmButtonColor: '#1e3c72'
      });
      return;
    }
    if (!formData.category) {
      Swal.fire({
        icon: 'warning',
        title: 'Invalid Input',
        text: 'Please select a category',
        confirmButtonColor: '#1e3c72'
      });
      return;
    }
    if (isNaN(newStock) || newStock < 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Invalid Input',
        text: 'Please enter a valid stock amount',
        confirmButtonColor: '#1e3c72'
      });
      return;
    }
    if (isNaN(newPrice) || newPrice <= 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Invalid Input',
        text: 'Please enter a valid price',
        confirmButtonColor: '#1e3c72'
      });
      return;
    }
    if (!formData.image) {
      Swal.fire({
        icon: 'warning',
        title: 'Invalid Input',
        text: 'Product image is required',
        confirmButtonColor: '#1e3c72'
      });
      return;
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('unit', 'kg');
      formDataToSend.append('stock', newStock);
      formDataToSend.append('price', newPrice);
      formDataToSend.append('seller_id', seller_id);
      formDataToSend.append('image', formData.image);

      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/seller/add-fish`, {
        method: "POST",
        body: formDataToSend,
      });

      const data = await res.json();

      if (res.ok) {
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: data.message,
          confirmButtonColor: '#1e3c72',
          timer: 2000,
          timerProgressBar: true
        });
        await loadStock();
        closeModal();
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: data.message || "Error adding product",
          confirmButtonColor: '#1e3c72'
        });
      }
    } catch (err) {
      console.error("Failed to add product:", err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error adding product',
        confirmButtonColor: '#1e3c72'
      });
    }
  };

  const updateStock = async () => {
    const newStock = parseFloat(formData.stock);
    const newPrice = parseFloat(formData.price);

    if (!formData.name.trim()) {
      showAlert("Product name is required", "error");
      return;
    }
    if (isNaN(newStock) || newStock < 0) {
      showAlert("Please enter a valid stock amount", "error");
      return;
    }
    if (isNaN(newPrice) || newPrice <= 0) {
      showAlert("Please enter a valid price", "error");
      return;
    }

    const priceChanged = newPrice !== parseFloat(editingItem.price);

    const result = await Swal.fire({
      title: `Update ${formData.name}?`,
      html: `
        <div style="text-align: left; padding: 10px;">
          <p><strong>Stock:</strong> ${editingItem.stock}kg → ${newStock}kg</p>
          <p><strong>Price:</strong> ₱${parseFloat(editingItem.price).toFixed(2)} → ₱${newPrice.toFixed(2)}</p>
          ${priceChanged ? '<p style="color: #ffc107; margin-top: 10px;">⚠️ Price change will be recorded in Price Analysis</p>' : ''}
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#dc3545',
      confirmButtonText: 'Yes, update it!',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('stock', newStock);
      formDataToSend.append('price', newPrice);
      formDataToSend.append('seller_id', seller_id);
      if (formData.image) {
        formDataToSend.append('image', formData.image);
      }

      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/api/seller/fish/${editingItem.id}`,
        {
          method: "PUT",
          body: formDataToSend,
        }
      );

      const data = await res.json();

      if (res.ok) {
        if (priceChanged) {
          showAlert(
            `${data.message} Price change recorded in Price Analysis!`,
            "success"
          );
        } else {
          showAlert(data.message, "success");
        }

        await loadStock();
        closeModal();
      } else {
        showAlert(data.message || "Error updating product", "error");
      }
    } catch (err) {
      console.error("Failed to update stock:", err);
      showAlert("Error updating stock", "error");
    }
  };

  const handleSaveProduct = async () => {
    if (showAddModal) {
      await addFishProduct();
    } else {
      await updateStock();
    }
  };

  const getStockStatus = (stock) => {
    if (stock < 5) return { label: "Critical", color: "#dc3545" };
    if (stock <= 20) return { label: "Low", color: "#ffc107" };
    return { label: "Good", color: "#28a745" };
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>
          <div style={styles.spinner}></div>
          <p>Loading stock...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Stock Management</h2>
          <p style={styles.subtitle}>Manage your product inventory</p>
        </div>
        <button
          onClick={openAddModal}
          style={styles.addButton}
          onMouseEnter={(e) => e.target.style.background = '#218838'}
          onMouseLeave={(e) => e.target.style.background = '#28a745'}
        >
          <FiPackage size={18} />
          Add Product
        </button>
      </div>

      {alertMessage && (
        <div style={{ ...styles.alert, ...styles[`alert${alertType.charAt(0).toUpperCase() + alertType.slice(1)}`] }}>
          {alertMessage}
        </div>
      )}

      {/* Summary Cards */}
      {stockItems.length > 0 && (
        <div style={styles.summaryGrid}>
          <div style={styles.summaryCard}>
            <div style={{ ...styles.summaryIcon, background: "#e7f1ff" }}>
              <FiPackage size={24} color="#2a5298" />
            </div>
            <div>
              <div style={styles.summaryLabel}>Total Products</div>
              <div style={styles.summaryValue}>{stockItems.length}</div>
            </div>
          </div>

          <div style={styles.summaryCard}>
            <div style={{ ...styles.summaryIcon, background: "#fdecea" }}>
              <FiAlertCircle size={24} color="#dc3545" />
            </div>
            <div>
              <div style={styles.summaryLabel}>Critical Stock</div>
              <div style={{ ...styles.summaryValue, color: "#dc3545" }}>
                {stockItems.filter((item) => item.stock < 5).length}
              </div>
            </div>
          </div>

          <div style={styles.summaryCard}>
            <div style={{ ...styles.summaryIcon, background: "#fff8e1" }}>
              <FiTrendingUp size={24} color="#ffc107" />
            </div>
            <div>
              <div style={styles.summaryLabel}>Low Stock</div>
              <div style={{ ...styles.summaryValue, color: "#ffc107" }}>
                {stockItems.filter((item) => item.stock >= 5 && item.stock <= 20).length}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters Section */}
      {stockItems.length > 0 && (
        <div style={styles.filtersSection}>
          <div style={styles.searchBox}>
            <FiPackage style={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search by product name or category..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              style={styles.searchInput}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} style={styles.clearSearch}>
                <FiX />
              </button>
            )}
          </div>

          <div style={styles.statusFilters}>
            <button
              style={{
                ...styles.filterBtn,
                ...(filterCategory === "All" ? styles.filterBtnActive : {})
              }}
              onClick={() => {
                setFilterCategory("All");
                setCurrentPage(1);
              }}
              onMouseEnter={(e) => {
                if (filterCategory !== "All") {
                  e.target.style.borderColor = '#1e3c72';
                  e.target.style.color = '#1e3c72';
                  e.target.style.transform = 'translateY(-2px)';
                }
              }}
              onMouseLeave={(e) => {
                if (filterCategory !== "All") {
                  e.target.style.borderColor = '#dee2e6';
                  e.target.style.color = '#495057';
                  e.target.style.transform = 'translateY(0)';
                }
              }}
            >
              All Categories
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                style={{
                  ...styles.filterBtn,
                  ...(filterCategory === cat.category_name ? styles.filterBtnActive : {})
                }}
                onClick={() => {
                  setFilterCategory(cat.category_name);
                  setCurrentPage(1);
                }}
                onMouseEnter={(e) => {
                  if (filterCategory !== cat.category_name) {
                    e.target.style.borderColor = '#1e3c72';
                    e.target.style.color = '#1e3c72';
                    e.target.style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (filterCategory !== cat.category_name) {
                    e.target.style.borderColor = '#dee2e6';
                    e.target.style.color = '#495057';
                    e.target.style.transform = 'translateY(0)';
                  }
                }}
              >
                {cat.category_name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Empty filtered state */}
      {filteredStockItems.length === 0 && stockItems.length > 0 && (
        <div style={styles.tableWrapper}>
          <div style={styles.noData}>
            <FiAlertCircle size={48} color="#ccc" />
            <p style={{ marginTop: '16px', fontSize: '16px', color: '#666' }}>No products match your filters</p>
            <button
              onClick={() => {
                setSearchQuery("");
                setFilterCategory("All");
                setCurrentPage(1);
              }}
              style={{
                ...styles.editButton,
                marginTop: '16px'
              }}
              onMouseEnter={(e) => e.target.style.background = '#2d115b'}
              onMouseLeave={(e) => e.target.style.background = '#34238b'}
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Product</th>
              <th style={styles.th}>Category</th>
              <th style={styles.th}>Stock Status</th>
              <th style={styles.th}>Stock (kg)</th>
              <th style={styles.th}>Price (₱/kg)</th>
              <th style={{ ...styles.th, textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {stockItems.length === 0 ? (
              <tr>
                <td colSpan="6" style={styles.noData}>
                  <FiPackage size={48} color="#ccc" />
                  <p>No products yet. Add products to manage stock.</p>
                </td>
              </tr>
            ) : (
              currentItemsFiltered.map((item) => {
                const stockStatus = getStockStatus(item.stock);
                return (
                  <tr key={item.id} style={styles.tr}>
                    <td style={styles.td}>
                      <div style={styles.productCell}>
                        {item.image_url ? (
                          <img
                            src={
                              item.image_url
                                ? `${process.env.REACT_APP_API_URL}/uploads/${item.image_url}`
                                : "https://via.placeholder.com/150?text=No+Image"
                            }
                            alt={item.name}
                            style={styles.productImage}
                          />
                        ) : (
                          <div style={styles.productImagePlaceholder}>
                            <FiPackage size={20} color="#999" />
                          </div>
                        )}
                        <span style={styles.productName}>{item.name}</span>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.categoryBadge}>{item.category || "N/A"}</span>
                    </td>
                    <td style={styles.td}>
                      <span style={{ ...styles.statusBadge, background: stockStatus.color + '20', color: stockStatus.color }}>
                        {stockStatus.label}
                      </span>
                    </td>
                    <td style={{ ...styles.td, fontWeight: '600', color: stockStatus.color }}>
                      {item.stock} kg
                    </td>
                    <td style={{ ...styles.td, fontWeight: '600' }}>
                      ₱{parseFloat(item.price).toFixed(2)}
                    </td>
                    <td style={{ ...styles.td, textAlign: 'center' }}>
                      <button
                        onClick={() => openEditModal(item)}
                        style={styles.editButton}
                        onMouseEnter={(e) => e.target.style.background = '#2d115b'}
                        onMouseLeave={(e) => e.target.style.background = '#34238b'}
                      >
                        <FiEdit2 size={16} />
                        <span>Edit</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {stockItems.length > itemsPerPage && (
          <div style={styles.pagination}>
            <button
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
              style={{ ...styles.paginationBtn, ...(currentPage === 1 ? styles.paginationBtnDisabled : {}) }}
              title="First Page"
            >
              <FiChevronsLeft size={18} />
            </button>
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              style={{ ...styles.paginationBtn, ...(currentPage === 1 ? styles.paginationBtnDisabled : {}) }}
              title="Previous Page"
            >
              <FiChevronLeft size={18} />
            </button>
            <span style={styles.paginationInfo}>
              Page <strong>{currentPage}</strong> of <strong>{totalPagesFiltered}</strong>
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPagesFiltered}
              style={{ ...styles.paginationBtn, ...(currentPage === totalPagesFiltered ? styles.paginationBtnDisabled : {}) }}
              title="Next Page"
            >
              <FiChevronRight size={18} />
            </button>
            <button
              onClick={() => handlePageChange(totalPagesFiltered)}
              disabled={currentPage === totalPagesFiltered}
              style={{ ...styles.paginationBtn, ...(currentPage === totalPagesFiltered ? styles.paginationBtnDisabled : {}) }}
              title="Last Page"
            >
              <FiChevronsRight size={18} />
            </button>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showModal && (
        <div style={styles.modalOverlay} onClick={closeModal}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>{showAddModal ? "Add New Product" : "Edit Product"}</h3>
              <button style={styles.closeButton} onClick={closeModal}>
                <FiX size={24} />
              </button>
            </div>

            <div style={styles.modalBody}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Product Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  style={styles.input}
                  placeholder="Enter product name"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Category</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  style={styles.input}
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.category_name}>
                      {cat.category_name}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => setShowAddCategory(!showAddCategory)}
                  style={styles.addCategoryBtn}
                  onMouseEnter={(e) => e.target.style.background = '#2a5298'}
                  onMouseLeave={(e) => e.target.style.background = '#1e3c72'}
                >
                  {showAddCategory ? "✕ Cancel" : "+ Add Category"}
                </button>

                {showAddCategory && (
                  <div style={styles.newCategorySection}>
                    <input
                      type="text"
                      placeholder="Enter new category name"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      style={styles.input}
                    />
                    <button
                      type="button"
                      onClick={handleAddCategory}
                      style={styles.saveCategoryBtn}
                      onMouseEnter={(e) => e.target.style.background = '#218838'}
                      onMouseLeave={(e) => e.target.style.background = '#28a745'}
                    >
                      <FiSave size={16} />
                      Save Category
                    </button>
                  </div>
                )}
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Product Image {showAddModal && "*"}</label>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current.click()}
                    style={styles.uploadButton}
                    onMouseEnter={(e) => e.target.style.background = '#2a5298'}
                    onMouseLeave={(e) => e.target.style.background = '#1e3c72'}
                  >
                    <FiPackage size={18} />
                    {imagePreview ? "Change Image" : "Upload Image"}
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    style={{ display: 'none' }}
                  />

                  {imagePreview && (
                    <div style={styles.imagePreviewBox}>
                      <img src={imagePreview} alt="preview" style={styles.previewImage} />
                      <button
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, image: null }));
                          setImagePreview(null);
                          if (fileInputRef.current) fileInputRef.current.value = "";
                        }}
                        style={styles.removeImageBtn}
                        onMouseEnter={(e) => e.target.style.background = '#b52a37'}
                        onMouseLeave={(e) => e.target.style.background = '#dc3545'}
                      >
                        <FiX size={16} />
                        Remove Image
                      </button>
                    </div>
                  )}
                </div>

                <div style={styles.formGroup}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Price (₱/kg)</label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      style={styles.input}
                      placeholder="0.00"
                      step="0.01"
                    />
                  </div>

                  <label style={styles.label}>Stock {showAddModal && "*"}</label>
                  <input
                    type="number"
                    name="stock"
                    value={formData.stock}
                    onChange={handleInputChange}
                    style={styles.input}
                    placeholder="0"
                    step="1"
                  />
                </div>
              </div>
            </div>

            <div style={styles.modalFooter}>
              <button
                onClick={closeModal}
                style={styles.cancelButton}
                onMouseEnter={(e) => e.target.style.background = '#b52a37'}
                onMouseLeave={(e) => e.target.style.background = '#dc3545'}
              >
                <FiX size={18} />
                Cancel
              </button>
              <button
                onClick={handleSaveProduct}
                style={styles.saveButton}
                onMouseEnter={(e) => e.target.style.background = '#218838'}
                onMouseLeave={(e) => e.target.style.background = '#28a745'}
              >
                <FiSave size={18} />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '40px auto',
    padding: '30px',
    background: '#ffffff',
    borderRadius: '16px',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
    fontFamily: "'Poppins', sans-serif",
  },
  header: {
    marginBottom: '30px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: '2rem',
    fontWeight: '700',
    color: '#1e3c72',
    margin: '0 0 8px 0',
  },
  subtitle: {
    fontSize: '0.95rem',
    color: '#666',
    margin: 0,
  },
  loading: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#555',
  },
  spinner: {
    width: '50px',
    height: '50px',
    margin: '0 auto 20px',
    border: '4px solid #f0f0f0',
    borderTop: '4px solid #1e3c72',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  alert: {
    padding: '14px 18px',
    borderRadius: '10px',
    marginBottom: '24px',
    fontSize: '0.95rem',
    fontWeight: '500',
    animation: 'slideDown 0.3s ease',
  },
  alertInfo: {
    background: '#e7f1ff',
    color: '#1e3c72',
    border: '1px solid #a3c4f7',
  },
  alertSuccess: {
    background: '#e6f9ed',
    color: '#2e7d32',
    border: '1px solid #81c784',
  },
  alertError: {
    background: '#fdecea',
    color: '#c62828',
    border: '1px solid #ef9a9a',
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '20px',
    marginBottom: '30px',
  },
  summaryCard: {
    background: '#f8f9fa',
    padding: '20px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    transition: 'transform 0.2s ease',
    cursor: 'default',
  },
  summaryIcon: {
    width: '56px',
    height: '56px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryLabel: {
    fontSize: '0.85rem',
    color: '#666',
    marginBottom: '4px',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: '1.8rem',
    fontWeight: '700',
    color: '#1e3c72',
  },
  tableWrapper: {
    overflowX: 'auto',
    borderRadius: '12px',
    border: '1px solid #e0e0e0',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '0.95rem',
  },
  th: {
    background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
    color: '#fff',
    padding: '16px 20px',
    textAlign: 'left',
    fontWeight: '600',
    fontSize: '0.85rem',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    borderBottom: '2px solid #1e3c72',
  },
  tr: {
    borderBottom: '1px solid #f0f0f0',
    transition: 'background 0.2s ease',
  },
  td: {
    padding: '16px 20px',
    color: '#333',
  },
  productCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  productImage: {
    width: '48px',
    height: '48px',
    borderRadius: '8px',
    objectFit: 'cover',
    border: '2px solid #f0f0f0',
  },
  productImagePlaceholder: {
    width: '48px',
    height: '48px',
    borderRadius: '8px',
    background: '#f5f5f5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px solid #e0e0e0',
  },
  productName: {
    fontWeight: '600',
    color: '#1e3c72',
  },
  categoryBadge: {
    display: 'inline-block',
    padding: '6px 14px',
    background: '#f0f0f0',
    color: '#555',
    borderRadius: '20px',
    fontSize: '0.85rem',
    fontWeight: '500',
  },
  statusBadge: {
    display: 'inline-block',
    padding: '6px 14px',
    borderRadius: '20px',
    fontSize: '0.85rem',
    fontWeight: '600',
  },
  noData: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#999',
  },
  editButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 20px',
    background: '#34238b',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '0.9rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
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
  },
  formGroup: {
    marginBottom: '20px',
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontSize: '0.9rem',
    fontWeight: '600',
    color: '#333',
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
  },
  fileInput: {
    width: '100%',
    padding: '12px',
    border: '2px dashed #e0e0e0',
    borderRadius: '8px',
    fontSize: '0.9rem',
    cursor: 'pointer',
    boxSizing: 'border-box',
  },
  modalFooter: {
    padding: '20px 30px',
    borderTop: '1px solid #e0e0e0',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
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
  pagination: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '12px',
    padding: '24px',
    marginTop: '20px',
    background: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #e0e0e0',
  },
  paginationBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '40px',
    height: '40px',
    border: '2px solid #e0e0e0',
    background: '#fff',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    color: '#1e3c72',
  },
  paginationBtnDisabled: {
    opacity: 0.3,
    cursor: 'not-allowed',
  },
  paginationInfo: {
    margin: '0 16px',
    fontSize: '0.95rem',
    color: '#333',
  },
  addButton: {
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
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 12px rgba(40, 167, 69, 0.3)',
  },
  addCategoryBtn: {
    marginTop: '10px',
    padding: '10px 16px',
    background: '#1e3c72',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '0.85rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    width: '100%',
  },
  newCategorySection: {
    marginTop: '12px',
    padding: '12px',
    background: '#f8f9fa',
    borderRadius: '8px',
    border: '1px solid #e0e0e0',
  },
  saveCategoryBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    marginTop: '10px',
    padding: '10px 16px',
    background: '#28a745',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '0.85rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    width: '100%',
  },
  uploadButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '12px 16px',
    background: '#1e3c72',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '0.9rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    width: '100%',
  },
  imagePreviewBox: {
    marginTop: '16px',
    padding: '16px',
    background: '#f8f9fa',
    borderRadius: '8px',
    border: '2px dashed #e0e0e0',
    textAlign: 'center',
  },
  previewImage: {
    maxWidth: '100%',
    maxHeight: '200px',
    borderRadius: '8px',
    marginBottom: '12px',
    objectFit: 'contain',
  },
  removeImageBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    background: '#dc3545',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '0.85rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  filtersSection: {
    background: 'white',
    borderRadius: '16px',
    padding: '24px',
    marginBottom: '24px',
    boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
  },
  searchBox: {
    position: 'relative',
    marginBottom: '20px',
  },
  searchIcon: {
    position: 'absolute',
    left: '16px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#6c757d',
    fontSize: '20px',
  },
  searchInput: {
    width: '100%',
    padding: '14px 48px 14px 48px',
    border: '2px solid #dee2e6',
    borderRadius: '12px',
    fontSize: '15px',
    transition: 'all 0.2s ease',
    boxSizing: 'border-box',
  },
  clearSearch: {
    position: 'absolute',
    right: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: '#e9ecef',
    border: 'none',
    borderRadius: '50%',
    width: '28px',
    height: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#6c757d',
    transition: 'all 0.2s ease',
  },
  statusFilters: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
  },
  filterBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 18px',
    border: '2px solid #dee2e6',
    background: 'white',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#495057',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  filterBtnActive: {
    background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
    borderColor: '#1e3c72',
    color: 'white',
    boxShadow: '0 4px 12px rgba(30, 60, 114, 0.3)',
  },
};

export default StockManagement;