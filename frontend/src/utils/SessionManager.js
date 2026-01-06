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
      // Clear cache and reload
      window.location.replace('/buyer/login');
    } else if (userType === 'seller') {
      localStorage.removeItem('seller_unique_id');
      localStorage.removeItem('sellerToken');
      localStorage.removeItem('uniqueId');
      localStorage.removeItem('loginTime');
      window.location.replace('/seller/login');
    } else if (userType === 'admin') {
      localStorage.removeItem('admin_session');
      localStorage.removeItem('loginTime');
      window.location.replace('/admin/login');
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
      return false;
    }
    return true;
  };

  const resetTimer = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(logout, IDLE_TIMEOUT);
  };

  useEffect(() => {
    // Immediate session check
    if (!checkSession()) {
      return;
    }

    // Disable browser cache for this page
    window.onpageshow = function(event) {
      if (event.persisted) {
        checkSession();
      }
    };

    // Check session every second (aggressive checking)
    const sessionCheckInterval = setInterval(() => {
      checkSession();
    }, 1000);

    const handlePopState = (e) => {
      e.preventDefault();
      if (!checkSession()) {
        window.history.go(-1);
      }
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkSession();
      }
    };

    const handleBeforeUnload = () => {
      // Mark that user is navigating away
      if (userType === 'buyer') {
        sessionStorage.setItem('navigating', 'true');
      }
    };

    // Set up event listeners for user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, resetTimer);
    });

    window.addEventListener('popstate', handlePopState);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pageshow', checkSession);
    window.addEventListener('focus', checkSession);

    // Start the timer
    resetTimer();

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      clearInterval(sessionCheckInterval);
      events.forEach(event => {
        document.removeEventListener(event, resetTimer);
      });
      window.removeEventListener('popstate', handlePopState);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pageshow', checkSession);
      window.removeEventListener('focus', checkSession);
    };
  }, [userType]);
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