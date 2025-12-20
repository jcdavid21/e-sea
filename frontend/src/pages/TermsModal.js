import React from "react";
import { FaFileContract, FaTimes } from "react-icons/fa";
import "./TermsModal.css";

const TermsModal = ({ onClose, onAccept }) => {
  return (
    <div className="terms-modal-overlay" onClick={onClose}>
      <div className="terms-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="terms-modal-header">
          <h2>
            <FaFileContract />
            Terms & Conditions
          </h2>
          <button className="terms-modal-close" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="terms-modal-body">
          <h3>1. Account Registration</h3>
          <ul>
            <li>You must provide accurate and complete information during registration</li>
            <li>You are responsible for maintaining the confidentiality of your account credentials</li>
            <li>You must be at least 18 years old to create an account</li>
            <li>One person or business entity may only maintain one account</li>
          </ul>

          <h3>2. User Responsibilities</h3>
          <ul>
            <li>Provide accurate address and contact information</li>
            <li>Comply with all applicable local, state, and national laws</li>
            <li>Not engage in fraudulent activities or misuse the platform</li>
            <li>Respect intellectual property rights</li>
          </ul>

          <h3>3. Pick-Up Policy</h3>
          <div className="terms-highlight-box">
            <p><strong>Important:</strong> e-Sea-Merkado operates on a <strong>pick-up only</strong> basis.</p>
            <ul>
              <li>Orders must be collected at the designated pick-up location</li>
              <li>Pick-up times are subject to vendor availability</li>
              <li>Order ID may be required during pick-up</li>
              <li>Unclaimed orders may be subject to cancellation fees</li>
            </ul>
          </div>

          <h3>4. Orders and Payments</h3>
          <ul>
            <li>All prices are in Philippine Peso (₱) and are subject to change without notice</li>
            <li>Payment must be completed before order confirmation</li>
            <li>We accept Gcash as the primary payment method</li>
            <li>All sales are final unless otherwise stated in our refund policy</li>
          </ul>

          <h3>5. Privacy Policy</h3>
          <p>
            e-Sea-Merkado is committed to protecting your privacy. We collect and use your personal information to process orders, improve our services, and communicate with you about your transactions.
          </p>

          <h3>6. Refund & Cancellation Policy</h3>
          <ul>
            <li><strong>No Cancellation:</strong> Orders cannot be cancelled once placed due to the perishable nature of seafood products</li>
            <li>Refunds may be issued for product quality issues verified upon pick-up</li>
            <li>Claims must be made at the time of pick-up</li>
          </ul>

          <div className="terms-highlight-box">
            <p><strong>By accepting these terms, you acknowledge that you have read, understood, and agree to be bound by these Terms & Conditions.</strong></p>
          </div>
        </div>

        <div className="terms-modal-footer">
          <button className="terms-accept-btn" onClick={onAccept}>
            I Accept
          </button>
        </div>
      </div>
    </div>
  );
};

export default TermsModal;