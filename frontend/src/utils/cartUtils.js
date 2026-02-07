/**
 * Cart Utilities - Database Version
 * Handles cart storage in MySQL database
 */

const API_URL = process.env.REACT_APP_BUYER_API_URL;

/**
 * Dispatch custom event to notify components of cart updates
 */
const dispatchCartUpdate = () => {
  window.dispatchEvent(new Event('cartUpdated'));
};

/**
 * Get the current logged-in customer ID from sessionStorage
 * @returns {string|null} Customer ID or null if not logged in
 */
export const getCustomerId = () => {
  const customerId = sessionStorage.getItem("customer_id");
  
  if (!customerId) {
    console.warn("⚠️ No customer_id found in sessionStorage");
    return null;
  }
  
  return customerId;
};

/**
 * Get cart items for the current user from database
 * @returns {Promise<Array>} Array of cart items
 */
export const getCart = async () => {
  const customerId = getCustomerId();
  
  if (!customerId) {
    console.warn("⚠️ User not logged in");
    return [];
  }

  try {
    const response = await fetch(`${API_URL}/api/cart/${customerId}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`📦 Loaded ${data.length} items from database cart`);
    return data;
  } catch (error) {
    console.error("❌ Error fetching cart:", error);
    return [];
  }
};

/**
 * Add item to cart in database
 * @param {Object} item - Product item to add
 * @param {number} quantity - Quantity to add (default: 1)
 * @returns {Promise<boolean>} Success status
 */
export const addToCart = async (item, quantity = 1) => {
  const customerId = getCustomerId();
  
  if (!customerId) {
    console.error("❌ Cannot add to cart: User not logged in");
    alert("Please login first to add items to cart");
    return false;
  }

  try {
    const response = await fetch(`${API_URL}/api/cart/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        buyer_id: customerId,
        product_id: item.id,
        quantity: quantity
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log(`✅ ${data.message}`);
    
    // Dispatch event to update cart count
    dispatchCartUpdate();
    
    return true;
  } catch (error) {
    console.error("❌ Error adding to cart:", error);
    alert("Failed to add item to cart");
    return false;
  }
};

/**
 * Update cart item quantity in database
 * @param {number} productId - ID of product to update
 * @param {number} quantity - New quantity
 * @returns {Promise<boolean>} Success status
 */
export const updateCartQuantity = async (productId, quantity) => {
  const customerId = getCustomerId();
  
  if (!customerId) {
    return false;
  }

  try {
    const response = await fetch(`${API_URL}/api/cart/update`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        buyer_id: customerId,
        product_id: productId,
        quantity: quantity
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    dispatchCartUpdate();
    return true;
  } catch (error) {
    console.error("❌ Error updating cart:", error);
    return false;
  }
};

/**
 * Remove item from cart
 * @param {number} productId - ID of product to remove
 * @returns {Promise<boolean>} Success status
 */
export const removeFromCart = async (productId) => {
  const customerId = getCustomerId();
  
  if (!customerId) {
    return false;
  }

  try {
    const response = await fetch(`${API_URL}/api/cart/remove/${customerId}/${productId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    console.log(`🗑️ Removed item ${productId} from cart`);
    dispatchCartUpdate();
    return true;
  } catch (error) {
    console.error("❌ Error removing from cart:", error);
    return false;
  }
};

/**
 * Clear entire cart for current user
 * @returns {Promise<boolean>} Success status
 */
export const clearCart = async () => {
  const customerId = getCustomerId();
  
  if (!customerId) {
    return false;
  }

  try {
    const response = await fetch(`${API_URL}/api/cart/clear/${customerId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    console.log(`🧹 Cleared cart for user ${customerId}`);
    dispatchCartUpdate();
    return true;
  } catch (error) {
    console.error("❌ Error clearing cart:", error);
    return false;
  }
};

/**
 * Get cart item count for current user
 * @returns {Promise<number>} Total number of items in cart
 */
export const getCartCount = async () => {
  const customerId = getCustomerId();
  
  if (!customerId) {
    return 0;
  }

  try {
    const response = await fetch(`${API_URL}/api/cart/count/${customerId}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data.count || 0;
  } catch (error) {
    console.error("❌ Error getting cart count:", error);
    return 0;
  }
};

/**
 * Save cart - This is now a no-op since cart is automatically saved to DB
 * Kept for backwards compatibility
 */
export const saveCart = () => {
  console.log("ℹ️ Cart is automatically saved to database");
};

/**
 * Migrate old localStorage cart to database
 * Call this after login
 */
export const migrateOldCart = async () => {
  const customerId = getCustomerId();
  
  if (!customerId) {
    return;
  }

  try {
    // Check for old cart in localStorage
    const oldCartKey = `cart_${customerId}`;
    const oldCart = localStorage.getItem(oldCartKey) || localStorage.getItem("cart");
    
    if (!oldCart) {
      return;
    }

    const oldItems = JSON.parse(oldCart);
    
    if (oldItems.length > 0) {
      console.log(`🔄 Migrating ${oldItems.length} items from localStorage to database`);
      
      // Add each item to database cart
      for (const item of oldItems) {
        await addToCart(item, item.quantity || 1);
      }
      
      // Clear old localStorage cart
      localStorage.removeItem(oldCartKey);
      localStorage.removeItem("cart");
      localStorage.removeItem("cart_guest");
      
      console.log("✅ Cart migration complete");
    }
  } catch (error) {
    console.error("❌ Error migrating cart:", error);
  }
};