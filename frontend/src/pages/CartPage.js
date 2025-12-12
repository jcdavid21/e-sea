import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "./CartPage.css";
import BuyerHeader from "./BuyerHeader";
import Swal from 'sweetalert2';
import MapPicker from './MapPicker';
import {
  FaClock, FaCheckCircle, FaTimesCircle, FaShoppingCart, FaCar, FaMapMarkerAlt
} from 'react-icons/fa';

// Import cart utilities
import { getCart, saveCart, getCustomerId } from "../utils/cartUtils";

// Calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
}

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
  const [storeHours, setStoreHours] = useState({});
  const [uploadingProof, setUploadingProof] = useState(false);

  const [sellerLocation, setSellerLocation] = useState(null);
  const [deliveryLocation, setDeliveryLocation] = useState(null);
  const [showMapPicker, setShowMapPicker] = useState(false);

  // Get customer ID from sessionStorage
  const CUSTOMER_ID = getCustomerId();

  const fetchSellerLocation = async (sellerId) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_SELLER_API_URL}/api/seller/location/${sellerId}`
      );
      if (response.ok) {
        const data = await response.json();
        console.log('🪧 Fetched seller location:', data);

        const latitude = data.latitude || data.lat;
        const longitude = data.longitude || data.lng;

        if (latitude && longitude) {
          const sellerLoc = {
            lat: parseFloat(latitude),
            lng: parseFloat(longitude)
          };
          setSellerLocation(sellerLoc);
          console.log('✅ Seller location set:', sellerLoc);

          if (deliveryLocation) {
            const dist = calculateDistance(
              deliveryLocation.lat,
              deliveryLocation.lng,
              sellerLoc.lat,
              sellerLoc.lng
            );
            setDeliveryLocation(prev => ({
              ...prev,
              distance: dist
            }));
          }

          return sellerLoc;
        } else {
          console.warn('⚠️ No valid coordinates in response:', data);
        }
      } else {
        console.warn('⚠️ Failed to fetch seller location:', response.status);
      }
    } catch (error) {
      console.error('❌ Error fetching seller location:', error);
    }
    return null;
  };

  // Check if user is logged in and get location
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

    // Try to get user's current location automatically
    if (navigator.geolocation && !deliveryLocation) {
      const tryGetLocation = () => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const userLocation = {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude
            };
            setDeliveryLocation(userLocation);
            console.log('📍 Auto-detected location:', userLocation);
          },
          (error) => {
            console.warn('High accuracy failed, trying low accuracy...', error);
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                const userLocation = {
                  lat: pos.coords.latitude,
                  lng: pos.coords.longitude
                };
                setDeliveryLocation(userLocation);
                console.log('📍 Auto-detected location (low accuracy):', userLocation);
              },
              (finalError) => {
                console.log('Location unavailable:', finalError.message);
              },
              {
                enableHighAccuracy: false,
                timeout: 10000,
                maximumAge: 60000
              }
            );
          },
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0
          }
        );
      };

      setTimeout(tryGetLocation, 1000);
    }
  }, [CUSTOMER_ID, navigate]);

  // Fetch QR code when checkout modal opens and items are selected
  useEffect(() => {
    if (showCheckoutModal && selectedItems.length > 0 && cart.length > 0) {
      const selectedItem = cart.find(item => item.id === selectedItems[0]);
      if (selectedItem && selectedItem.seller_id) {
        fetchSellerQrCode(selectedItem.seller_id);
      }
    }
  }, [showCheckoutModal]);

  // Auto-calculate distance location or seller location changes
  const calculateAndSetDistance = useCallback(() => {
    if (deliveryLocation && sellerLocation && !deliveryLocation.distance) {
      const dist = calculateDistance(
        deliveryLocation.lat,
        deliveryLocation.lng,
        sellerLocation.lat,
        sellerLocation.lng
      );
      setDeliveryLocation(prev => ({
        ...prev,
        distance: dist
      }));
    }
  }, [deliveryLocation?.lat, deliveryLocation?.lng, deliveryLocation?.distance, sellerLocation?.lat, sellerLocation?.lng]);

  useEffect(() => {
    calculateAndSetDistance();
  }, [calculateAndSetDistance]);

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

  const isStoreOpen = (sellerId) => {
    if (!storeHours[sellerId]) return { isOpen: false, message: "Hours not set" };

    const now = new Date();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
    const currentTime = now.toTimeString().slice(0, 5);

    const todayHours = storeHours[sellerId].find(h => h.day_of_week === currentDay);

    if (!todayHours || !todayHours.is_open) {
      const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      const currentDayIndex = daysOfWeek.indexOf(currentDay);

      for (let i = 1; i <= 7; i++) {
        const nextDayIndex = (currentDayIndex + i) % 7;
        const nextDay = daysOfWeek[nextDayIndex];
        const nextDayHours = storeHours[sellerId].find(h => h.day_of_week === nextDay);

        if (nextDayHours && nextDayHours.is_open) {
          const openTime = nextDayHours.open_time.substring(0, 5);
          return {
            isOpen: false,
            message: `Closed - Opens ${i === 1 ? 'tomorrow' : nextDay} at ${formatTime(openTime)}`
          };
        }
      }

      return { isOpen: false, message: "Closed today" };
    }

    const openTime = todayHours.open_time.substring(0, 5);
    const closeTime = todayHours.close_time.substring(0, 5);

    let effectiveCloseTime = closeTime;
    if (closeTime === '00:00') {
      effectiveCloseTime = '24:00';
    }

    const isWithinHours = currentTime >= openTime && currentTime < effectiveCloseTime;

    if (isWithinHours) {
      const displayCloseTime = closeTime === '00:00' ? '12:00 AM' : formatTime(closeTime);
      return {
        isOpen: true,
        message: `Open until ${displayCloseTime}`
      };
    } else if (currentTime < openTime) {
      return {
        isOpen: false,
        message: `Opens today at ${formatTime(openTime)}`
      };
    } else {
      const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      const currentDayIndex = daysOfWeek.indexOf(currentDay);

      for (let i = 1; i <= 7; i++) {
        const nextDayIndex = (currentDayIndex + i) % 7;
        const nextDay = daysOfWeek[nextDayIndex];
        const nextDayHours = storeHours[sellerId].find(h => h.day_of_week === nextDay);

        if (nextDayHours && nextDayHours.is_open) {
          const openTime = nextDayHours.open_time.substring(0, 5);
          return {
            isOpen: false,
            message: `Closed - Opens ${i === 1 ? 'tomorrow' : nextDay} at ${formatTime(openTime)}`
          };
        }
      }

      return { isOpen: false, message: "Closed" };
    }
  };

  const formatTime = (time24) => {
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
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
      latitude: deliveryLocation?.lat || null,
      longitude: deliveryLocation?.lng || null,
      createdAt: new Date().toISOString()
    };

    console.log('💾 Saving address with location:', newAddress);

    const updatedAddresses = [...savedAddresses, newAddress];
    setSavedAddresses(updatedAddresses);
    localStorage.setItem(getAddressesKey(), JSON.stringify(updatedAddresses));

    Swal.fire({
      icon: 'success',
      title: 'Address Saved',
      text: 'Address and location saved successfully!',
      confirmButtonColor: '#3085d6'
    });
  };

  useEffect(() => {
    if (sellerLocation) {
      console.log('🪧 Pickup location loaded:', sellerLocation);
    }
  }, [sellerLocation]);

  useEffect(() => {
    if (deliveryLocation) {
      console.log('📍 Customer location updated:', deliveryLocation);
    }
  }, [deliveryLocation]);

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
    if (!address) return;

    console.log('📍 Selecting saved address:', address);

    // Update states without triggering cart reload
    setSelectedAddressId(addressId);
    setShowAddressForm(false);
    setOrderData(prev => ({
      ...prev,
      name: address.name,
      address: address.address,
      contact: address.contact
    }));

    // Restore location if saved
    if (address.latitude && address.longitude) {
      const savedLocation = {
        lat: parseFloat(address.latitude),
        lng: parseFloat(address.longitude)
      };

      console.log('🗺️ Restoring saved location:', savedLocation);

      if (sellerLocation) {
        const dist = calculateDistance(
          savedLocation.lat,
          savedLocation.lng,
          sellerLocation.lat,
          sellerLocation.lng
        );

        console.log('📏 Distance calculated:', dist, 'km');

        setDeliveryLocation({
          ...savedLocation,
          distance: dist
        });
      } else {
        setDeliveryLocation(savedLocation);
      }

      Swal.fire({
        icon: 'success',
        title: 'Location Restored',
        text: 'Saved location has been loaded on the map.',
        timer: 2000,
        showConfirmButton: false
      });
    } else {
      console.warn('⚠️ No location saved for this address');
    }
  };

  const loadCartWithProductDetails = async () => {
    if (!CUSTOMER_ID) {
      setLoading(false);
      return;
    }

    try {
      const savedCart = getCart();

      console.log("🛒 Loading cart for customer:", CUSTOMER_ID);
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

      await fetchStoreHoursForCart(updatedCart);

    } catch (err) {
      console.error("Error loading cart:", err);
      const savedCart = getCart();
      setCart(savedCart);
    } finally {
      setLoading(false);
    }
  };

  const fetchStoreHoursForCart = async (cartData) => {
    try {
      const sellerIds = [...new Set(cartData.map(item => item.seller_id))];

      const hoursData = {};

      for (const sellerId of sellerIds) {
        if (sellerId) {
          const response = await fetch(
            `${process.env.REACT_APP_SELLER_API_URL}/api/seller/store-hours/${sellerId}`
          );
          if (response.ok) {
            const hours = await response.json();
            hoursData[sellerId] = hours;
          }
        }
      }

      setStoreHours(hoursData);
    } catch (err) {
      console.error("Error fetching store hours:", err);
    }
  };

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

  const handleOpenCheckout = async () => {
    if (selectedCartItems.length === 0) {
      Swal.fire({
        icon: 'info',
        title: 'No Items Selected',
        text: 'Please select at least one item to checkout.',
        confirmButtonColor: '#3085d6'
      });
      return;
    }

    const closedStores = selectedCartItems.filter(item => !isStoreOpen(item.seller_id).isOpen);
    if (closedStores.length > 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Store Closed',
        text: 'Some selected items are from stores that are currently closed.',
        confirmButtonColor: '#3085d6'
      });
      return;
    }

    const sellers = getSellersFromSelectedItems();
    if (sellers.length > 1) {
      Swal.fire({
        icon: 'warning',
        title: 'Multiple Sellers',
        text: 'You can only checkout items from a single seller at a time.',
        confirmButtonColor: '#3085d6'
      });
      return;
    }

    setShowCheckoutModal(true);

    if (sellers[0]) {
      console.log('📍 Fetching seller location for:', sellers[0]);
      fetchSellerLocation(sellers[0]);
    }
  };

  const toggleSelectItem = (id) => {
    const itemToToggle = cart.find(item => item.id === id);
    const storeStatus = isStoreOpen(itemToToggle.seller_id);

    if (!storeStatus.isOpen) {
      Swal.fire({
        icon: 'warning',
        title: 'Store Closed',
        text: storeStatus.message,
        confirmButtonColor: '#3085d6'
      });
      return;
    }

    if (selectedItems.includes(id)) {
      setSelectedItems((prev) => prev.filter((i) => i !== id));
    } else {
      if (selectedItems.length === 0) {
        setSelectedItems([id]);
      } else {
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
      const openStoreItems = cart.filter(item => {
        const storeStatus = isStoreOpen(item.seller_id);
        return storeStatus.isOpen;
      });

      if (openStoreItems.length === 0) {
        Swal.fire({
          icon: 'warning',
          title: 'All Stores Closed',
          text: 'All stores are currently closed. Cannot select items.',
          confirmButtonColor: '#3085d6'
        });
        return;
      }

      const firstOpenSeller = openStoreItems[0].seller_id;
      const itemsFromFirstSeller = openStoreItems
        .filter(item => item.seller_id === firstOpenSeller)
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

  const selectedCartItems = useMemo(() => {
    return cart.filter((item) => selectedItems.includes(item.id));
  }, [cart, selectedItems]);

  const totalPrice = useMemo(() => {
    return selectedCartItems.reduce(
      (acc, item) => acc + item.price * item.quantity,
      0
    );
  }, [selectedCartItems]);

  const placeOrder = async () => {
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
        text: "Please fill in all required personal information.",
        confirmButtonColor: '#3085d6'
      });
      return;
    }

    if (!deliveryLocation) {
      if (navigator.geolocation) {
        try {
          await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                const userLocation = {
                  lat: pos.coords.latitude,
                  lng: pos.coords.longitude
                };
                setDeliveryLocation(userLocation);
                resolve();
              },
              (error) => {
                reject(error);
              }
            );
          });
        } catch (error) {
          Swal.fire({
            icon: 'warning',
            title: 'Location Required',
            text: 'Please enable location services or select your location on the map.',
            confirmButtonColor: '#3085d6'
          });
          return;
        }
      } else {
        Swal.fire({
          icon: 'warning',
          title: 'Location Required',
          text: 'Please select your location on the map.',
          confirmButtonColor: '#3085d6'
        });
        return;
      }
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
          customer: {
            ...orderData,
            delivery_latitude: deliveryLocation.lat,
            delivery_longitude: deliveryLocation.lng,
            distance_km: deliveryLocation.distance
          },
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
          {cart.map((item) => {
            const storeStatus = isStoreOpen(item.seller_id);

            return (
              <div
                key={item.id}
                className={`cart-item ${selectedItems.includes(item.id) ? 'selected' : ''} ${!storeStatus.isOpen ? 'store-closed' : ''}`}
              >
                <div className="item-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(item.id)}
                    onChange={() => toggleSelectItem(item.id)}
                    disabled={!storeStatus.isOpen}
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
                  {!storeStatus.isOpen && (
                    <div className="store-closed-overlay">
                      <FaTimesCircle />
                    </div>
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

                  <div className={`store-status-badge ${storeStatus.isOpen ? 'open' : 'closed'}`}>
                    {storeStatus.isOpen ? (
                      <>
                        <FaCheckCircle className="status-icon" />
                        <span>{storeStatus.message}</span>
                      </>
                    ) : (
                      <>
                        <FaClock className="status-icon" />
                        <span>{storeStatus.message}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="item-quantity">
                  <div className="quantity-controls">
                    <button
                      onClick={() => decrementQuantity(item.id)}
                      disabled={item.quantity <= 1 || !storeStatus.isOpen}
                      className="qty-btn"
                    >
                      −
                    </button>
                    <span className="quantity-display">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => incrementQuantity(item.id)}
                      disabled={item.quantity >= (item.stock || 999) || !storeStatus.isOpen}
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
            );
          })}
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
            onClick={handleOpenCheckout}
            className="btn-checkout"
            disabled={selectedCartItems.length === 0}
          >
            Proceed to Checkout
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
                {!showMapPicker ? (
                  <>
                    {navigator.geolocation && (
                      <div className="location-picker-section" style={{ marginBottom: '24px' }}>
                        <h3 style={{
                          fontSize: '1.1rem',
                          color: '#16135d',
                          marginBottom: '16px',
                          fontWeight: '600',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          📍 Customer Location
                        </h3>

                        <div style={{ marginBottom: '16px' }}>
                          <MapPicker
                            sellerLocation={sellerLocation}
                            onLocationSelect={(location) => {
                              const processedLocation = {
                                ...location,
                                distance: location.distance ? parseFloat(location.distance) : null
                              };
                              setDeliveryLocation(processedLocation);
                              setOrderData({
                                ...orderData,
                                address: `Lat: ${location.lat.toFixed(6)}, Lng: ${location.lng.toFixed(6)}`
                              });
                            }}
                            initialPosition={deliveryLocation}
                          />
                        </div>

                        {deliveryLocation && (
                          <div className="selected-location-display" style={{
                            background: '#f0f4ff',
                            padding: '16px',
                            borderRadius: '12px',
                            border: '2px solid #667eea',
                            marginTop: '16px'
                          }}>
                            <div className="location-info">
                              <p style={{ margin: '0 0 8px 0', fontWeight: '600', color: '#333' }}>
                                ✅ Location Selected
                              </p>
                              <p style={{ margin: '4px 0', fontSize: '13px', color: '#666' }}>
                                <strong>Latitude:</strong> {deliveryLocation.lat.toFixed(6)}
                              </p>
                              <p style={{ margin: '4px 0', fontSize: '13px', color: '#666' }}>
                                <strong>Longitude:</strong> {deliveryLocation.lng.toFixed(6)}
                              </p>
                              {deliveryLocation.distance && (
                                <div className="distance-badge" style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  padding: '8px 16px',
                                  background: 'linear-gradient(135deg, #3349a9ff 0%, #4b72a2ff 100%)',
                                  color: 'white',
                                  borderRadius: '20px',
                                  fontWeight: '700',
                                  fontSize: '14px',
                                  marginTop: '12px'
                                }}>
                                  <FaCar /> Distance to store: {typeof deliveryLocation.distance === 'number'
                                    ? deliveryLocation.distance.toFixed(2)
                                    : parseFloat(deliveryLocation.distance).toFixed(2)} km
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {savedAddresses.length > 0 && (
                      <div className="saved-addresses-section">
                        <h3>Saved Addresses</h3>
                        <div className="addresses-grid">
                          {savedAddresses.map((addr) => (
                            <div
                              key={addr.id}
                              className={`address-card ${selectedAddressId === addr.id ? 'selected' : ''}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                selectSavedAddress(addr.id);
                              }}
                              style={{ cursor: 'pointer' }}
                            >
                              <div className="address-content">
                                <h4>{addr.name}</h4>
                                <p>{addr.address}</p>
                                <p className="contact">{addr.contact}</p>

                                {addr.latitude && addr.longitude ? (
                                  <p style={{
                                    fontSize: '11px',
                                    color: '#10b981',
                                    marginTop: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    fontWeight: '600',
                                    background: '#f0fdf4',
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    border: '1px solid #86efac'
                                  }}>
                                    <FaMapMarkerAlt /> Location: {parseFloat(addr.latitude).toFixed(4)}, {parseFloat(addr.longitude).toFixed(4)}
                                  </p>
                                ) : (
                                  <p style={{
                                    fontSize: '11px',
                                    color: '#f59e0b',
                                    marginTop: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    background: '#fffbeb',
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    border: '1px solid #fcd34d'
                                  }}>
                                    <FaMapMarkerAlt /> No location saved
                                  </p>
                                )}
                              </div>
                              <button
                                className="delete-address-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  deleteAddress(addr.id);
                                }}
                                title="Delete address"
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
                        <h3>Personal Information</h3>

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
                          <label>Your Address *</label>
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

                        {deliveryLocation ? (
                          <div style={{
                            background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                            padding: '16px',
                            borderRadius: '12px',
                            marginBottom: '16px',
                            border: '2px solid #10b981'
                          }}>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              marginBottom: '8px',
                              color: '#065f46',
                              fontWeight: '600',
                              fontSize: '14px'
                            }}>
                              <FaCheckCircle style={{ color: '#10b981' }} /> Location Selected
                            </div>
                            <div style={{ fontSize: '13px', color: '#047857' }}>
                              <div>📍 Latitude: {deliveryLocation.lat.toFixed(6)}</div>
                              <div>📍 Longitude: {deliveryLocation.lng.toFixed(6)}</div>
                              {deliveryLocation.distance && (
                                <div style={{ marginTop: '4px', fontWeight: '600' }}>
                                  🚗 Distance to store: {deliveryLocation.distance.toFixed(2)} km
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div style={{
                            background: '#fef2f2',
                            padding: '16px',
                            borderRadius: '12px',
                            marginBottom: '16px',
                            border: '2px solid #fca5a5'
                          }}>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              color: '#dc2626',
                              fontWeight: '600',
                              fontSize: '14px'
                            }}>
                              <FaTimesCircle /> No Location Selected
                            </div>
                            <div style={{ fontSize: '13px', color: '#991b1b', marginTop: '4px' }}>
                              Please select your location on the map above before saving.
                            </div>
                          </div>
                        )}

                        <button
                          type="button"
                          className="btn-save-address"
                          onClick={saveNewAddress}
                          disabled={!deliveryLocation}
                          style={{
                            opacity: deliveryLocation ? 1 : 0.5,
                            cursor: deliveryLocation ? 'pointer' : 'not-allowed'
                          }}
                        >
                          💾 Save this address {deliveryLocation ? '(with location)' : ''}
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
                  </>
                ) : (
                  <div className="map-picker-section">
                    <h3 style={{
                      fontSize: '1.1rem',
                      color: '#16135d',
                      marginBottom: '16px',
                      fontWeight: '600'
                    }}>
                      📍 Select Your Location
                    </h3>
                    <MapPicker
                      sellerLocation={sellerLocation}
                      onLocationSelect={(location) => {
                        const processedLocation = {
                          ...location,
                          distance: location.distance ? parseFloat(location.distance) : null
                        };
                        setDeliveryLocation(processedLocation);
                        setOrderData({
                          ...orderData,
                          address: `Lat: ${location.lat.toFixed(6)}, Lng: ${location.lng.toFixed(6)}`
                        });
                      }}
                      initialPosition={deliveryLocation}
                    />
                    <button
                      className="btn-cancel"
                      onClick={() => setShowMapPicker(false)}
                      style={{
                        marginTop: '12px',
                        width: '100%'
                      }}
                    >
                      ← Back to Checkout
                    </button>
                  </div>
                )}
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
                    !deliveryLocation ||
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