// src/utils/SessionManager.js
import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const IDLE_TIMEOUT = 15 * 60 * 1000; // 15 minutes in milliseconds

export const useIdleTimeout = (userType) => {
  const navigate = useNavigate();
  const timeoutRef = useRef(null);

  const logout = () => {
    if (userType === 'buyer') {
      sessionStorage.removeItem('customer_id');
      sessionStorage.removeItem('buyerEmail');
      sessionStorage.removeItem('buyerName');
      sessionStorage.removeItem('loginTime');
      window.location.href = '/buyer/login';
    } else if (userType === 'seller') {
      localStorage.removeItem('seller_unique_id');
      localStorage.removeItem('sellerToken');
      localStorage.removeItem('uniqueId');
      localStorage.removeItem('loginTime');
      window.location.href = '/seller/login';
    } else if (userType === 'admin') {
      localStorage.removeItem('admin_session');
      localStorage.removeItem('loginTime');
      window.location.href = '/admin/login';
    }
  };

  const checkSession = () => {
    let isValid = false;
    
    if (userType === 'buyer') {
      isValid = !!sessionStorage.getItem('customer_id');
    } else if (userType === 'seller') {
      isValid = !!localStorage.getItem('seller_unique_id');
    } else if (userType === 'admin') {
      isValid = !!localStorage.getItem('admin_session');
    }

    if (!isValid) {
      logout();
    }
  };

  const resetTimer = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(logout, IDLE_TIMEOUT);
  };

  useEffect(() => {
    // Prevent browser caching
    window.history.pushState(null, '', window.location.href);
    
    const handlePopState = () => {
      window.history.pushState(null, '', window.location.href);
      checkSession();
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkSession();
      }
    };

    // Check session on mount
    checkSession();

    // Set up event listeners for user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, resetTimer);
    });

    // Listen for browser back/forward button
    window.addEventListener('popstate', handlePopState);
    
    // Listen for page visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Start the timer
    resetTimer();

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      events.forEach(event => {
        document.removeEventListener(event, resetTimer);
      });
      window.removeEventListener('popstate', handlePopState);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
};

export const checkSession = () => {
  const customerId = sessionStorage.getItem('customer_id');
  const sellerId = localStorage.getItem('seller_unique_id');
  const adminSession = localStorage.getItem('admin_session');

  if (customerId) {
    return { type: 'buyer', redirectTo: '/buyer/dashboard' };
  } else if (sellerId) {
    return { type: 'seller', redirectTo: '/seller/dashboard/home' };
  } else if (adminSession) {
    return { type: 'admin', redirectTo: '/admin/dashboard' };
  }
  
  return null;
};