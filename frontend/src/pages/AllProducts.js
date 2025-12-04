import React, { useEffect, useState } from "react";
import Swal from 'sweetalert2';
import { FiEdit2, FiSave, FiX, FiPackage, FiImage, FiChevronLeft, FiChevronRight, FiChevronsLeft, FiChevronsRight, FiAlertCircle } from "react-icons/fi";
import "./AllProducts.css";

function AllProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    stock: "",
    price: "",
    previous_price: "",
    freshness: "",
  });

  const seller_id = localStorage.getItem("seller_unique_id");

  useEffect(() => {
    if (!seller_id) {
      window.location.href = "/seller-login";
      return;
    }
    loadData();
  }, [seller_id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const catRes = await fetch(
        `http://localhost:5001/api/seller/categories?seller_id=${seller_id}`
      );
      const catData = await catRes.json();
      setCategories(catData);

      const prodRes = await fetch(
        `http://localhost:5001/api/seller/fish?seller_id=${seller_id}`
      );
      const prodData = await prodRes.json();
      setProducts(prodData);
    } catch (err) {
      console.error("Failed to load data:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getCategoryCount = (name) =>
    name === "All"
      ? products.length
      : products.filter((p) => p.category === name).length;

  // Pagination calculations
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      category: product.category,
      stock: product.stock.toString(),
      price: product.price.toString(),
      previous_price: product.previous_price?.toString() || "",
      freshness: product.freshness || "Fresh",
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    setFormData({
      name: "",
      category: "",
      stock: "",
      price: "",
      previous_price: "",
      freshness: "",
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProduct = async () => {
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

    const priceChanged = newPrice !== parseFloat(editingProduct.price);

    const result = await Swal.fire({
      title: `Update ${formData.name}?`,
      html: `
        <div style="text-align: left; padding: 10px;">
          <p><strong>Stock:</strong> ${editingProduct.stock}kg → ${newStock}kg</p>
          <p><strong>Price:</strong> ₱${parseFloat(editingProduct.price).toFixed(2)} → ₱${newPrice.toFixed(2)}</p>
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
      formDataToSend.append('freshness', formData.freshness);
      formDataToSend.append('seller_id', seller_id);

      const res = await fetch(
        `http://localhost:5001/api/seller/fish/${editingProduct.id}`,
        {
          method: "PUT",
          body: formDataToSend,
        }
      );

      const data = await res.json();

      if (res.ok) {
        if (priceChanged) {
          Swal.fire({
            icon: 'success',
            title: 'Success',
            text: `${data.message} Price change recorded in Price Analysis!`,
            confirmButtonColor: '#1e3c72',
            timer: 3000,
            timerProgressBar: true
          });
        } else {
          Swal.fire({
            icon: 'success',
            title: 'Success',
            text: data.message,
            confirmButtonColor: '#1e3c72',
            timer: 2000,
            timerProgressBar: true
          });
        }
        await loadData();
        closeModal();
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: data.message || "Error updating product",
          confirmButtonColor: '#1e3c72'
        });
      }
    } catch (err) {
      console.error("Failed to update product:", err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error updating product',
        confirmButtonColor: '#1e3c72'
      });
    }
  };

  if (loading) {
    return (
      <div className="ap-container">
        <div style={styles.loading}>
          <div style={styles.spinner}></div>
          <p>Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ap-container">
      {/* HEADER */}
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>All Products</h2>
          <p style={styles.subtitle}>View and manage your product catalog</p>
        </div>
        <div className="ap-product-count">
          {filteredProducts.length}{" "}
          {filteredProducts.length === 1 ? "Product" : "Products"}
        </div>
      </div>

      {/* FILTERS SECTION */}
      {products.length > 0 && (
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
                ...(selectedCategory === "All" ? styles.filterBtnActive : {})
              }}
              onClick={() => {
                setSelectedCategory("All");
                setCurrentPage(1);
              }}
              onMouseEnter={(e) => {
                if (selectedCategory !== "All") {
                  e.target.style.borderColor = '#1e3c72';
                  e.target.style.color = '#1e3c72';
                  e.target.style.transform = 'translateY(-2px)';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedCategory !== "All") {
                  e.target.style.borderColor = '#dee2e6';
                  e.target.style.color = '#495057';
                  e.target.style.transform = 'translateY(0)';
                }
              }}
            >
              All ({products.length})
            </button>

            {categories.map((cat) => (
              <button
                key={cat.id}
                style={{
                  ...styles.filterBtn,
                  ...(selectedCategory === cat.category_name ? styles.filterBtnActive : {})
                }}
                onClick={() => {
                  setSelectedCategory(cat.category_name);
                  setCurrentPage(1);
                }}
                onMouseEnter={(e) => {
                  if (selectedCategory !== cat.category_name) {
                    e.target.style.borderColor = '#1e3c72';
                    e.target.style.color = '#1e3c72';
                    e.target.style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedCategory !== cat.category_name) {
                    e.target.style.borderColor = '#dee2e6';
                    e.target.style.color = '#495057';
                    e.target.style.transform = 'translateY(0)';
                  }
                }}
              >
                {cat.category_name} ({getCategoryCount(cat.category_name)})
              </button>
            ))}
          </div>
        </div>
      )}

      {filteredProducts.length === 0 && products.length > 0 && (
        <div className="ap-table-wrapper">
          <div className="ap-no-products">
            <FiAlertCircle size={48} color="#ccc" />
            <p style={{ marginTop: '16px', fontSize: '16px', color: '#666' }}>No products match your filters</p>
            <button
              className="ap-view-all-btn"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("All");
                setCurrentPage(1);
              }}
              style={{
                marginTop: '16px',
                padding: '10px 20px',
                background: '#34238b',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {/* TABLE */}
      {filteredProducts.length > 0 && (
        <div className="ap-table-wrapper">
          <table className="ap-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Name</th>
                <th>Category</th>
                <th>Freshness</th>
                <th>Price (₱/kg)</th>
                <th>Stock</th>
                <th>Previous Price</th>
                <th style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>

            <tbody>
              {currentItems.map((p) => {
                let stockStatus = "high";
                if (p.stock < 5) stockStatus = "critical";
                else if (p.stock <= 20) stockStatus = "low";

                return (
                  <tr key={p.id}>
                    <td>
                      {p.image_url ? (
                        <img
                          src={`http://localhost:5001/uploads/${p.image_url}`}
                          alt={p.name}
                          className="ap-product-img"
                        />
                      ) : (
                        <div className="ap-no-image">
                          <FiImage size={20} />
                        </div>
                      )}
                    </td>

                    <td style={{ fontWeight: '600', color: '#1e3c72' }}>{p.name}</td>
                    <td>
                      <span style={styles.categoryBadge}>{p.category}</span>
                    </td>
                    <td>
                      <span style={{
                        ...styles.categoryBadge,
                        background: p.freshness === 'Fresh' ? '#d4edda' : 
                                   p.freshness === 'Chilled' ? '#d1ecf1' : '#cfe2ff',
                        color: p.freshness === 'Fresh' ? '#155724' : 
                               p.freshness === 'Chilled' ? '#0c5460' : '#084298',
                      }}>
                        {p.freshness || 'Fresh'}
                      </span>
                    </td>
                    <td style={{ fontWeight: '600' }}>₱{Number(p.price).toFixed(2)}</td>

                    <td className={`ap-stock-cell ${stockStatus}`}>
                      {p.stock} {p.unit || "kg"}
                    </td>

                    <td>
                      {p.previous_price &&
                      p.previous_price !== p.price
                        ? `₱${Number(p.previous_price).toFixed(2)}`
                        : "-"}
                    </td>

                    <td style={{ textAlign: 'center' }}>
                      <button
                        style={styles.editButton}
                        onClick={() => openEditModal(p)}
                        onMouseEnter={(e) => e.target.style.background = '#2d115b'}
                        onMouseLeave={(e) => e.target.style.background = '#34238b'}
                      >
                        <FiEdit2 size={16} />
                        <span>Edit</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* PAGINATION */}
          {filteredProducts.length > itemsPerPage && (
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
                Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                style={{ ...styles.paginationBtn, ...(currentPage === totalPages ? styles.paginationBtnDisabled : {}) }}
                title="Next Page"
              >
                <FiChevronRight size={18} />
              </button>
              <button
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
                style={{ ...styles.paginationBtn, ...(currentPage === totalPages ? styles.paginationBtnDisabled : {}) }}
                title="Last Page"
              >
                <FiChevronsRight size={18} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* NO PRODUCTS AT ALL */}
      {products.length === 0 && (
        <div className="ap-no-products">
          <FiPackage size={48} color="#ccc" />
          <p>No products available. Add some products to get started!</p>
        </div>
      )}

      {/* EDIT MODAL */}
      {showModal && editingProduct && (
        <div style={styles.modalOverlay} onClick={closeModal}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Edit Product</h3>
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
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Freshness</label>
                <select
                  name="freshness"
                  value={formData.freshness}
                  onChange={handleInputChange}
                  style={styles.input}
                >
                  <option value="Fresh">Fresh</option>
                  <option value="Chilled">Chilled</option>
                  <option value="Frozen">Frozen</option>
                </select>
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Stock (kg)</label>
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
              </div>

              {editingProduct.image_url && (
                <div style={styles.imagePreviewSection}>
                  <label style={styles.label}>Current Product Image</label>
                  <div style={styles.imagePreviewBox}>
                    <img
                      src={`http://localhost:5001/uploads/${editingProduct.image_url}`}
                      alt={editingProduct.name}
                      style={styles.previewImage}
                    />
                  </div>
                </div>
              )}
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
  header: {
    marginBottom: '30px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '16px',
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
  categoryBadge: {
    display: 'inline-block',
    padding: '6px 14px',
    background: '#f0f0f0',
    color: '#555',
    borderRadius: '20px',
    fontSize: '0.85rem',
    fontWeight: '500',
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
    maxHeight: '100vh',
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
  imagePreviewSection: {
    marginTop: '20px',
  },
  imagePreviewBox: {
    marginTop: '12px',
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
    objectFit: 'contain',
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

const styleSheet = document.createElement("style");
styleSheet.innerText = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);

export default AllProducts;