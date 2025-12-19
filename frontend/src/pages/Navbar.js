import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { 
  FaHome, 
  FaInfoCircle, 
  FaFileContract, 
  FaEnvelope,
  FaBars,
  FaTimes 
} from "react-icons/fa";
import "./Navbar.css";

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="home-navbar">
      <div className="navbar-container">
        <button 
          className="mobile-menu-btn" 
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
        </button>

        {/* Desktop Menu */}
        <ul className="navbar-links">
          <li>
            <NavLink to="/" className={({ isActive }) => isActive ? "active" : ""}>
              <FaHome className="navbar-icon" />
              Home
            </NavLink>
          </li>
          <li>
            <NavLink to="/about" className={({ isActive }) => isActive ? "active" : ""}>
              <FaInfoCircle className="navbar-icon" />
              About
            </NavLink>
          </li>
          <li>
            <NavLink to="/policies" className={({ isActive }) => isActive ? "active" : ""}>
              <FaFileContract className="navbar-icon" />
              Terms & Policies
            </NavLink>
          </li>
          <li>
            <NavLink to="/contact" className={({ isActive }) => isActive ? "active" : ""}>
              <FaEnvelope className="navbar-icon" />
              Contact
            </NavLink>
          </li>
        </ul>

        {/* Mobile Menu */}
        <ul className={`mobile-navbar-links ${isMobileMenuOpen ? 'open' : ''}`}>
          <li>
            <NavLink 
              to="/" 
              className={({ isActive }) => isActive ? "active" : ""}
              onClick={closeMobileMenu}
            >
              <FaHome className="navbar-icon" />
              Home
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/about" 
              className={({ isActive }) => isActive ? "active" : ""}
              onClick={closeMobileMenu}
            >
              <FaInfoCircle className="navbar-icon" />
              About
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/policies" 
              className={({ isActive }) => isActive ? "active" : ""}
              onClick={closeMobileMenu}
            >
              <FaFileContract className="navbar-icon" />
              Terms & Policies
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/contact" 
              className={({ isActive }) => isActive ? "active" : ""}
              onClick={closeMobileMenu}
            >
              <FaEnvelope className="navbar-icon" />
              Contact
            </NavLink>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;