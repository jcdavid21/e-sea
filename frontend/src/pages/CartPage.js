import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./CartPage.css";
import BuyerHeader from "./BuyerHeader";
import Swal from 'sweetalert2';
import { FaClock, FaCheckCircle, FaTimesCircle, FaShoppingCart } from 'react-icons/fa';


// Import cart utilities
import { getCart, saveCart, getCustomerId } from "../utils/cartUtils";

const CartPage = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [orderData, setOrderData] = useState({
    name: "",
    address: "",
    contact: "",
    notes: "",
  });
  const [confirmPayment, setConfirmPayment] = useState(false);
  const [qrCode, setQrCode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [proofOfPayment, setProofOfPayment] = useState(null);
  const [proofPreview, setProofPreview] = useState(null);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [storeHours, setStoreHours] = useState([]);
  const [currentStoreStatus, setCurrentStoreStatus] = useState({ 
    isOpen: true, 
    openingTime: '7:00 AM', 
    closingTime: '10:00 PM' 
  });

  // Get customer ID from sessionStorage
  const CUSTOMER_ID = getCustomerId();

  // Check if user is logged in
  useEffect(() => {
    if (!CUSTOMER_ID) {
      console.warn("⚠️ User not logged in, redirecting to login page");
      Swal.fire({
        icon: 'warning',
        title: 'Not Logged In',
        text: 'Please log in to access your cart.',
        confirmButtonColor: '#3085d6'
      }).then(() => {
        navigate("/buyer/login");
      });
      return;
    }
    
    console.log("🛒 CartPage loaded for customer:", CUSTOMER_ID);
    loadCartWithProductDetails();
    loadSavedAddresses();
  }, [CUSTOMER_ID, navigate]);
  
  useEffect(() => {
    const fetchStoreHours = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_BUYER_API_URL}/api/store-hours/global`);
        const data = await response.json();
        setStoreHours(data);
        const status = checkIfStoreOpen(data);
        setCurrentStoreStatus(status);
      } catch (err) {
        console.error("Error fetching store hours:", err);
      }
    };

    fetchStoreHours();
    
    const interval = setInterval(() => {
      if (storeHours.length > 0) {
        const status = checkIfStoreOpen(storeHours);
        setCurrentStoreStatus(status);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [storeHours]);

  // Fetch QR code when items are selected
  useEffect(() => {
    if (selectedItems.length > 0) {
      const selectedItem = cart.find(item => item.id === selectedItems[0]);
      if (selectedItem && selectedItem.seller_id) {
        fetchSellerQrCode(selectedItem.seller_id);
      }
    } else {
      setQrCode(null);
    }
  }, [selectedItems, cart]);

  // HELPER: Get user-specific addresses key
  const getAddressesKey = () => `saved_addresses_${CUSTOMER_ID}`;

  // HELPER: Get sellers from selected items
  const getSellersFromSelectedItems = () => {
    const sellers = new Set();
    selectedCartItems.forEach(item => {
      if (item.seller_id) {
        sellers.add(item.seller_id);
      }
    });
    return Array.from(sellers);
  };

  const loadSavedAddresses = () => {
    if (!CUSTOMER_ID) return;
    
    const addresses = JSON.parse(localStorage.getItem(getAddressesKey())) || [];
    setSavedAddresses(addresses);
  };

  const saveNewAddress = () => {
    if (!orderData.name || !orderData.address || !orderData.contact) {
      Swal.fire({
        icon: 'warning',
        title: 'Incomplete Information',
        text: 'Please fill in name, address, and contact to save.',
        confirmButtonColor: '#3085d6'
      });
      return;
    }

    const newAddress = {
      id: Date.now().toString(),
      name: orderData.name,
      address: orderData.address,
      contact: orderData.contact,
      createdAt: new Date().toISOString()
    };

    const updatedAddresses = [...savedAddresses, newAddress];
    setSavedAddresses(updatedAddresses);
    localStorage.setItem(getAddressesKey(), JSON.stringify(updatedAddresses));
    Swal.fire({
      icon: 'success',
      title: 'Address Saved',
      text: 'Address saved successfully!',
      confirmButtonColor: '#3085d6'
    });
  };

  const deleteAddress = (addressId) => {
    if (window.confirm("Are you sure you want to delete this address?")) {
      const updatedAddresses = savedAddresses.filter(addr => addr.id !== addressId);
      setSavedAddresses(updatedAddresses);
      localStorage.setItem(getAddressesKey(), JSON.stringify(updatedAddresses));
      if (selectedAddressId === addressId) {
        setSelectedAddressId("");
      }
    }
  };

  const selectSavedAddress = (addressId) => {
    const address = savedAddresses.find(addr => addr.id === addressId);
    if (address) {
      setOrderData({
        name: address.name,
        address: address.address,
        contact: address.contact,
        notes: orderData.notes
      });
      setSelectedAddressId(addressId);
      setShowAddressForm(false);
    }
  };

  const loadCartWithProductDetails = async () => {
    if (!CUSTOMER_ID) {
      setLoading(false);
      return;
    }

    try {
      const savedCart = getCart();
      
      console.log("🛍 Loading cart for customer:", CUSTOMER_ID);
      console.log("🛒 Cart data:", savedCart);
      
      if (savedCart.length === 0) {
        setLoading(false);
        return;
      }

      const productIds = savedCart.map(item => item.id);
      const res = await fetch(`${process.env.REACT_APP_BUYER_API_URL}/api/products/details`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_ids: productIds })
      });

      if (!res.ok) {
        console.error("Failed to fetch product details");
        setCart(savedCart);
        // Don't auto-select items
        setSelectedItems([]);
        setLoading(false);
        return;
      }

      const products = await res.json();

      const updatedCart = savedCart.map(cartItem => {
        const product = products.find(p => p.id === cartItem.id);
        if (product) {
          return {
            ...cartItem,
            price: Number(product.price),
            stock: Number(product.stock),
            category: product.category,
            unit: product.unit || "kg",
            quantity: Math.min(Number(cartItem.quantity || 1), Number(product.stock)),
            seller_id: product.seller_id
          };
        }
        return cartItem;
      });

      setCart(updatedCart);
      // Don't auto-select items - let user choose
      setSelectedItems([]);
    } catch (err) {
      console.error("Error loading cart:", err);
      const savedCart = getCart();
      setCart(savedCart);
      // Don't auto-select items
      setSelectedItems([]);
    } finally {
      setLoading(false);
    }
  };

  const checkIfStoreOpen = (hours) => {
    if (!hours || hours.length === 0) {
      return { isOpen: true, openingTime: '7:00 AM', closingTime: '10:00 PM' };
    }

    const now = new Date();
    const phTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
    const currentDay = phTime.toLocaleDateString('en-US', { weekday: 'long' });
    const currentHour = phTime.getHours();
    const currentMinute = phTime.getMinutes();
    const currentTimeInMinutes = currentHour * 60 + currentMinute;

    const todayHours = hours.find(h => h.day_of_week === currentDay);
    
    if (!todayHours || !todayHours.is_open) {
      return { isOpen: false, openingTime: 'Closed', closingTime: 'Today' };
    }

    const [openHour, openMin] = todayHours.open_time.split(':').map(Number);
    const [closeHour, closeMin] = todayHours.close_time.split(':').map(Number);
    const openTimeInMinutes = openHour * 60 + openMin;
    
    // Handle midnight (00:00:00) as end of day (24:00 or 1440 minutes)
    let closeTimeInMinutes = closeHour * 60 + closeMin;
    if (closeHour === 0 && closeMin === 0) {
      closeTimeInMinutes = 24 * 60; // Treat 00:00 as end of day
    }

    const isOpen = currentTimeInMinutes >= openTimeInMinutes && currentTimeInMinutes < closeTimeInMinutes;

    const formatTime = (timeStr) => {
      const [h, m] = timeStr.split(':').map(Number);
      
      // Handle midnight display
      if (h === 0 && m === 0) {
        return '12:00 AM (Midnight)';
      }
      
      const period = h >= 12 ? 'PM' : 'AM';
      const hour12 = h % 12 || 12;
      return `${hour12}:${m.toString().padStart(2, '0')} ${period}`;
    };

    return {
      isOpen,
      openingTime: formatTime(todayHours.open_time),
      closingTime: formatTime(todayHours.close_time)
    };
  };


  // Fetch QR code for a specific seller
  const fetchSellerQrCode = async (seller_id) => {
    try {
      const qrRes = await fetch(`${process.env.REACT_APP_BUYER_API_URL}/api/seller/${seller_id}/qr`);
      if (qrRes.ok) {
        const qrData = await qrRes.json();
        if (qrData.qr) {
          setQrCode(qrData.qr);
          console.log("✅ QR Code loaded:", qrData.qr);
        }
      } else {
        console.log("⚠️ QR code not found for seller");
        setQrCode(null);
      }
    } catch (err) {
      console.error("Error fetching QR code:", err);
      setQrCode(null);
    }
  };

  const toggleSelectItem = (id) => {
    const itemToToggle = cart.find(item => item.id === id);
    
    if (selectedItems.includes(id)) {
      // Deselecting an item
      setSelectedItems((prev) => prev.filter((i) => i !== id));
    } else {
      // Selecting an item
      if (selectedItems.length === 0) {
        // First item being selected
        setSelectedItems([id]);
      } else {
        // Check if the item's seller matches the already selected items' seller
        const currentSeller = cart.find(item => item.id === selectedItems[0])?.seller_id;
        if (itemToToggle.seller_id === currentSeller) {
          setSelectedItems((prev) => [...prev, id]);
        } else {
          Swal.fire({
            icon: 'warning',
            title: 'Multiple Sellers Selected',
            text: "⚠️ You can only select items from a single seller. Please uncheck items from other sellers first.",
            confirmButtonColor: '#3085d6'
          });
        }
      }
    }
  };

  const toggleSelectAll = () => {
    if (selectedItems.length === cart.length) {
      setSelectedItems([]);
    } else {
      // Select all items from the first seller only
      const firstSeller = cart[0].seller_id;
      const itemsFromFirstSeller = cart
        .filter(item => item.seller_id === firstSeller)
        .map(item => item.id);
      setSelectedItems(itemsFromFirstSeller);
    }
  };

  const removeFromCart = (id) => {
    const updated = cart.filter((item) => item.id !== id);
    setCart(updated);
    saveCart(updated);
    setSelectedItems((prev) => prev.filter((i) => i !== id));
  };

  const updateQuantity = (id, newQty) => {
    const updated = cart.map((item) => {
      if (item.id === id) {
        const validQty = Math.max(1, Math.min(newQty, item.stock || 999));
        return { ...item, quantity: validQty };
      }
      return item;
    });
    setCart(updated);
    saveCart(updated);
  };

  const incrementQuantity = (id) => {
    const item = cart.find(i => i.id === id);
    if (item && item.quantity < (item.stock || 999)) {
      updateQuantity(id, item.quantity + 1);
    } else {
      Swal.fire({
        icon: 'warning',
        title: 'Stock Limit Reached',
        text: `Maximum available stock is ${item.stock} ${item.unit || "units"}`,
        confirmButtonColor: '#3085d6'
      });
    }
  };

  const decrementQuantity = (id) => {
    const item = cart.find(i => i.id === id);
    if (item && item.quantity > 1) {
      updateQuantity(id, item.quantity - 1);
    }
  };

  const handleProofFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      Swal.fire({
        icon: 'warning',
        title: 'Invalid File Type',
        text: "Please upload an image file (JPG, PNG, etc.)",
        confirmButtonColor: '#3085d6'
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      Swal.fire({
        icon: 'warning',
        title: 'File Too Large',
        text: "Image size must be less than 5MB",
        confirmButtonColor: '#3085d6'
      });
      return;
    }

    setProofOfPayment(file);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setProofPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeProofOfPayment = () => {
    setProofOfPayment(null);
    setProofPreview(null);
    setConfirmPayment(false);
  };

  const selectedCartItems = cart.filter((item) =>
    selectedItems.includes(item.id)
  );

  const totalPrice = selectedCartItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  const placeOrder = async () => {
    // Check if items are from multiple sellers
    const sellers = getSellersFromSelectedItems();
    if (sellers.length > 1) {
      Swal.fire({
        icon: 'warning',
        title: 'Multiple Sellers Selected',
        text: "⚠️ You can only checkout items from a single seller at a time.\n\nPlease uncheck items from other sellers.",
        confirmButtonColor: '#3085d6'
      });
      return;
    }

    if (!orderData.name || !orderData.address || !orderData.contact) {
      Swal.fire({
        icon: 'warning',
        title: 'Incomplete Information',
        text: "Please fill in all required delivery information.",
        confirmButtonColor: '#3085d6'
      });
      return;
    }

    if (!proofOfPayment) {
      Swal.fire({
        icon: 'warning',
        title: 'Proof of Payment Required',
        text: "Please upload proof of payment.",
        confirmButtonColor: '#3085d6'
      });
      return;
    }

    if (!confirmPayment) {
      Swal.fire({
        icon: 'warning',
        title: 'Payment Confirmation Required',
        text: "Please confirm payment.",
        confirmButtonColor: '#3085d6'
      });
      return;
    }

    if (selectedCartItems.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No Items Selected',
        text: "Please select at least one item.",
        confirmButtonColor: '#3085d6'
      });
      return;
    }

    setUploadingProof(true);

    try {
      const formData = new FormData();
      formData.append("proof", proofOfPayment);
      formData.append("customer_name", orderData.name);
      formData.append("customer_contact", orderData.contact);

      const uploadRes = await fetch(`${process.env.REACT_APP_SELLER_API_URL}/api/upload-payment-proof`, {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        throw new Error("Failed to upload proof of payment");
      }

      const uploadData = await uploadRes.json();
      const proofFilePath = uploadData.proof_path;

      const res = await fetch(`${process.env.REACT_APP_SELLER_API_URL}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: orderData,
          cart: selectedCartItems,
          total: totalPrice,
          payment_mode: "Gcash QR",
          paid: true,
          proof_of_payment: proofFilePath,
          buyer_id: CUSTOMER_ID,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        Swal.fire({
          icon: 'error',
          title: 'Order Failed',
          text: data.message || "Failed to place order.",
          confirmButtonColor: '#3085d6'
        });
        return;
      }

      Swal.fire({
        icon: 'success',
        title: 'Order Placed',
        text: "Your order has been placed successfully!",
        confirmButtonColor: '#3085d6'
      });

      const remainingCart = cart.filter(
        (item) => !selectedItems.includes(item.id)
      );
      setCart(remainingCart);
      saveCart(remainingCart);

      setSelectedItems([]);
      setShowCheckoutModal(false);
      setConfirmPayment(false);
      setProofOfPayment(null);
      setProofPreview(null);
      setOrderData({ name: "", address: "", contact: "", notes: "" });
      
    } catch (err) {
      console.error("Order error:", err);
      Swal.fire({
        icon: 'error',
        title: 'Order Error',
        text: "Error placing order. Please try again.",
        confirmButtonColor: '#3085d6'
      });
    } finally {
      setUploadingProof(false);
    }
  };

  if (loading) {
    return (
      <div className="cart-page-wrapper">
        <BuyerHeader 
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />
        <div className="cart-page">
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading your cart...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!CUSTOMER_ID) {
    return null;
  }

  if (cart.length === 0) {
    return (
      <div className="cart-page-wrapper">
        <BuyerHeader 
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />
        <div className="cart-page">
          <div className="empty-cart">
            <div className="empty-icon">🛒</div>
            <h2>Your cart is empty</h2>
            <p>Looks like you haven't added anything yet!</p>
            <button onClick={() => navigate("/buyer/shop")} className="btn-primary">
              Start Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page-wrapper">
      <BuyerHeader 
  searchTerm={searchTerm}
  onSearchChange={setSearchTerm}
/>
      
      <div className="cart-page">
        <div className="cart-header">
          <div className="header-title">
            <FaShoppingCart className="cart-icon" />
            <h1>Shopping Cart</h1>
          </div>
        </div>

        {/* Store Hours Display */}
        <div className="store-hours-container">
          <div className="store-hours-card">
            <div className="store-hours-header">
              <div className="header-left">
                <FaClock size={20} />
                <h3>Store Operating Hours</h3>
              </div>
              <div className="store-status-badge" style={{
                background: currentStoreStatus.isOpen 
                  ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
                  : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                color: 'white',
                padding: '8px 18px',
                borderRadius: '25px',
                fontSize: '13px',
                fontWeight: '800',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: currentStoreStatus.isOpen 
                  ? '0 4px 12px rgba(16, 185, 129, 0.4)' 
                  : '0 4px 12px rgba(239, 68, 68, 0.4)'
              }}>
                {currentStoreStatus.isOpen ? (
                  <>
                    <FaCheckCircle size={16} />
                    <span>Open Now</span>
                  </>
                ) : (
                  <>
                    <FaTimesCircle size={16} />
                    <span>Closed</span>
                  </>
                )}
              </div>
            </div>
            
            <div className="hours-grid">
              {storeHours.length > 0 ? (
                storeHours.map((hour, index) => {
                  const isToday = new Date().toLocaleDateString('en-US', { weekday: 'long' }) === hour.day_of_week;
                  
                  return (
                    <div 
                      key={hour.day_of_week} 
                      className={`hours-item ${isToday ? 'today' : ''} ${!hour.is_open ? 'closed' : ''}`}
                    >
                      <div className="day-label">
                        {isToday && <span className="today-badge">Today</span>}
                        <span className="day-name">{hour.day_of_week}</span>
                      </div>
                      
                      {hour.is_open ? (
                        <div className="time-display">
                          <span className="open-indicator">●</span>
                          <span className="time-text">
                            {new Date(`2000-01-01T${hour.open_time}`).toLocaleTimeString('en-US', { 
                              hour: 'numeric', 
                              minute: '2-digit',
                              hour12: true 
                            })}
                            {' - '}
                            {new Date(`2000-01-01T${hour.close_time}`).toLocaleTimeString('en-US', { 
                              hour: 'numeric', 
                              minute: '2-digit',
                              hour12: true 
                            })}
                          </span>
                        </div>
                      ) : (
                        <div className="time-display closed-display">
                          <span className="closed-indicator">●</span>
                          <span className="closed-text">Closed</span>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="no-hours-set">
                  <FaClock size={48} color="#94a3b8" />
                  <p>Store hours information not available</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="select-all-container">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={selectedItems.length === cart.length && cart.length > 0}
              onChange={toggleSelectAll}
            />
            <span>Select All ({cart.length} items)</span>
          </label>
        </div>

        <div className="cart-items">
          {cart.map((item) => (
            <div
              key={item.id}
              className={`cart-item ${selectedItems.includes(item.id) ? 'selected' : ''}`}
            >
              <div className="item-checkbox">
                <input
                  type="checkbox"
                  checked={selectedItems.includes(item.id)}
                  onChange={() => toggleSelectItem(item.id)}
                />
              </div>

              <div className="item-image">
                {item.image_url ? (
                  <img
                    src={`${process.env.REACT_APP_SELLER_API_URL}/uploads/${item.image_url}`}
                    alt={item.name}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/placeholder-fish.png';
                    }}
                  />
                ) : (
                  <div className="placeholder-img">🐟</div>
                )}
              </div>

              <div className="item-details">
                <h3 className="item-name">{item.name}</h3>
                <div className="item-meta">
                  <span className="category-badge">{item.category || "N/A"}</span>
                  <span className={`stock-badge ${(item.stock || 0) < 5 ? "low" : ""}`}>
                    Stock: {item.stock || "∞"}
                  </span>
                </div>
                <p className="item-price">₱{Number(item.price).toFixed(2)} / {item.unit || "kg"}</p>
              </div>

              <div className="item-quantity">
                <div className="quantity-controls">
                  <button
                    onClick={() => decrementQuantity(item.id)}
                    disabled={item.quantity <= 1}
                    className="qty-btn"
                  >
                    −
                  </button>
                  <span className="quantity-display">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => incrementQuantity(item.id)}
                    disabled={item.quantity >= (item.stock || 999)}
                    className="qty-btn"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="item-subtotal">
                <p className="subtotal-label">Subtotal</p>
                <p className="subtotal-amount">₱{(Number(item.price) * item.quantity).toFixed(2)}</p>
              </div>

              <button
                onClick={() => removeFromCart(item.id)}
                className="btn-remove"
                title="Remove item"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        <div className="cart-footer">
          <div className="cart-summary">
            <div className="summary-row">
              <span>Selected Items:</span>
              <span>{selectedCartItems.length}</span>
            </div>
            <div className="summary-row total">
              <span>Total:</span>
              <span className="total-price">₱{totalPrice.toFixed(2)}</span>
            </div>
          </div>

          <button
            onClick={() => {
              if (!currentStoreStatus.isOpen) {
                Swal.fire({
                  icon: 'warning',
                  title: 'Store Closed',
                  html: `
                    <div style="text-align: center;">
                      <p style="font-size: 16px; margin-bottom: 16px;">We're currently closed.</p>
                      <div style="background: #f8f9fa; padding: 16px; border-radius: 8px; margin-bottom: 12px;">
                        <p style="font-weight: 600; margin-bottom: 8px;">Operating Hours:</p>
                        <p style="font-size: 18px; color: #0066cc;">${currentStoreStatus.openingTime} - ${currentStoreStatus.closingTime}</p>
                      </div>
                      <p style="color: #666;">Please come back during our operating hours.</p>
                    </div>
                  `,
                  confirmButtonColor: '#3085d6',
                  confirmButtonText: 'Understood'
                });
                return;
              }
              if (selectedCartItems.length === 0) {
                Swal.fire({
                  icon: 'info',
                  title: 'No Items Selected',
                  text: 'Please select at least one item to checkout.',
                  confirmButtonColor: '#3085d6'
                });
                return;
              }
              const sellers = getSellersFromSelectedItems();
              if (sellers.length > 1) {
                Swal.fire({
                  icon: 'warning',
                  title: 'Multiple Sellers',
                  text: 'You can only checkout items from a single seller at a time. Please uncheck items from other sellers.',
                  confirmButtonColor: '#3085d6'
                });
                return;
              }
              setShowCheckoutModal(true);
            }}
            className="btn-checkout"
            disabled={selectedCartItems.length === 0 || !currentStoreStatus.isOpen}
          >
            {!currentStoreStatus.isOpen ? (
              <>
                <FaClock style={{ marginRight: '8px' }} />
                Store Closed
              </>
            ) : (
              'Proceed to Checkout'
            )}
          </button>
        </div>

        {showCheckoutModal && (
          <div className="modal-overlay" onClick={() => setShowCheckoutModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header modal-header-cartpage">
                <h2>Checkout</h2>
                <button className="modal-close" onClick={() => setShowCheckoutModal(false)}>
                  ×
                </button>
              </div>

              <div className="modal-body">
                {savedAddresses.length > 0 && (
                  <div className="saved-addresses-section">
                    <h3>Saved Addresses</h3>
                    <div className="addresses-grid">
                      {savedAddresses.map((addr) => (
                        <div
                          key={addr.id}
                          className={`address-card ${selectedAddressId === addr.id ? 'selected' : ''}`}
                          onClick={() => selectSavedAddress(addr.id)}
                        >
                          <div className="address-content">
                            <h4>{addr.name}</h4>
                            <p>{addr.address}</p>
                            <p className="contact">{addr.contact}</p>
                          </div>
                          <button
                            className="delete-address-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteAddress(addr.id);
                            }}
                          >
                            🗑️
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      className="btn-new-address"
                      onClick={() => {
                        setShowAddressForm(true);
                        setSelectedAddressId("");
                        setOrderData({ name: "", address: "", contact: "", notes: orderData.notes });
                      }}
                    >
                      + Add New Address
                    </button>
                  </div>
                )}

                {(showAddressForm || savedAddresses.length === 0) && (
                  <div className="checkout-form">
                    <h3>Delivery Information</h3>

                    <div className="form-group">
                      <label>Full Name *</label>
                      <input
                        type="text"
                        value={orderData.name}
                        onChange={(e) => setOrderData({ ...orderData, name: e.target.value })}
                        required
                        placeholder="Enter your full name"
                      />
                    </div>

                    <div className="form-group">
                      <label>Delivery Address *</label>
                      <textarea
                        value={orderData.address}
                        onChange={(e) => setOrderData({ ...orderData, address: e.target.value })}
                        required
                        placeholder="House/Unit No., Street, Barangay, City"
                        rows="3"
                      />
                    </div>

                    <div className="form-group">
                      <label>Contact Number *</label>
                      <input
                        type="tel"
                        value={orderData.contact}
                        onChange={(e) => setOrderData({ ...orderData, contact: e.target.value })}
                        required
                        placeholder="09XX XXX XXXX"
                      />
                    </div>

                    <div className="form-group">
                      <label>Order Notes (Optional)</label>
                      <textarea
                        value={orderData.notes}
                        onChange={(e) => setOrderData({ ...orderData, notes: e.target.value })}
                        placeholder="Special instructions"
                        rows="2"
                      />
                    </div>

                    <button type="button" className="btn-save-address" onClick={saveNewAddress}>
                      💾 Save this address
                    </button>
                  </div>
                )}

                <div className="payment-section">
                  <h3>Payment Method</h3>
                  <div className="payment-method-card">
                    <span className="payment-icon">💳</span>
                    <span>GCash QR Payment</span>
                  </div>

                  <div className="qr-container">
                    {qrCode ? (
                      <div className="qr-wrapper">
                        <img
                          src={`${process.env.REACT_APP_SELLER_API_URL}${qrCode}`}
                          alt="GCash QR Code"
                          className="qr-code"
                        />
                        <p className="qr-instruction">Scan with GCash app</p>
                      </div>
                    ) : (
                      <p className="no-qr">QR code not available for this seller</p>
                    )}
                  </div>

                  <div className="payment-total">
                    <span>Total Amount</span>
                    <span className="amount">₱{totalPrice.toFixed(2)}</span>
                  </div>

                  <div className="proof-of-payment-section">
                    <h4>Upload Proof of Payment *</h4>
                    <p className="proof-instruction">
                      Upload screenshot of GCash payment receipt
                    </p>
                    
                    {!proofPreview ? (
                      <div className="upload-area">
                        <input
                          type="file"
                          id="proof-upload"
                          accept="image/*"
                          onChange={handleProofFileChange}
                          style={{ display: 'none' }}
                        />
                        <label htmlFor="proof-upload" className="upload-label">
                          <div className="upload-icon">📸</div>
                          <span>Click to upload</span>
                          <span className="upload-hint">PNG, JPG (Max 5MB)</span>
                        </label>
                      </div>
                    ) : (
                      <div className="proof-preview">
                        <img src={proofPreview} alt="Proof" />
                        <button 
                          type="button" 
                          className="btn-remove-proof"
                          onClick={removeProofOfPayment}
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="payment-confirmation">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={confirmPayment}
                        onChange={() => setConfirmPayment(!confirmPayment)}
                        disabled={!proofOfPayment}
                        required
                      />
                      <span>I confirm payment and uploaded proof</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setShowCheckoutModal(false)}
                  className="btn-cancel"
                  disabled={uploadingProof}
                >
                  Cancel
                </button>
                <button
                  onClick={placeOrder}
                  className="btn-confirm"
                  disabled={
                    !confirmPayment || 
                    selectedCartItems.length === 0 || 
                    !orderData.name || 
                    !orderData.address || 
                    !orderData.contact ||
                    !proofOfPayment ||
                    uploadingProof
                  }
                >
                  {uploadingProof ? "Processing..." : "Place Order"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;  