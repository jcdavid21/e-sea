import React from "react";
import { FaFileContract, FaTimes, FaExclamationTriangle } from "react-icons/fa";
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
            <li>Inspect products thoroughly upon pick-up</li>
          </ul>

          <h3>3. Pick-Up Policy</h3>
          <div className="terms-highlight-box">
            <p><strong>Important:</strong> e-Sea-Merkado operates on a <strong>pick-up only</strong> basis.</p>
            <ul>
              <li>Orders must be collected at the designated pick-up location</li>
              <li>Pick-up times are subject to vendor availability</li>
              <li>Order ID may be required during pick-up</li>
              <li>Buyers must inspect products at the time of pick-up</li>
              <li>Products must be collected within the agreed timeframe</li>
            </ul>
          </div>

          <h3>4. Orders and Payments</h3>
          <ul>
            <li>All prices are in Philippine Peso (₱) and are subject to change without notice</li>
            <li>Payment must be completed before order confirmation</li>
            <li>We accept GCash as the primary payment method</li>
            <li><strong>All sales are final - No cancellations or refunds</strong></li>
            <li>Once an order is placed, it cannot be cancelled or modified</li>
          </ul>

          <h3>5. Privacy Policy</h3>
          <p>
            e-Sea-Merkado is committed to protecting your privacy. We collect and use your personal information to process orders, improve our services, and communicate with you about your transactions. Your data is handled securely and will not be shared with third parties without your consent.
          </p>

          <h3>6. No Refund & No Cancellation Policy</h3>
          <div className="terms-warning-box">
            <p><strong><FaExclamationTriangle /> IMPORTANT POLICY:</strong></p>
            <ul>
              <li><strong>NO CANCELLATIONS:</strong> Orders cannot be cancelled once placed under any circumstances</li>
              <li><strong>NO REFUNDS:</strong> All sales are final - no refunds will be issued for any reason</li>
              <li><strong>NO EXCHANGES:</strong> Products cannot be exchanged after purchase</li>
              <li><strong>NO MODIFICATIONS:</strong> Orders cannot be modified after confirmation</li>
            </ul>
          </div>

          <h3>7. Product Inspection</h3>
          <ul>
            <li>Buyers must thoroughly inspect products at the time of pick-up</li>
            <li>Any concerns about product quality must be raised immediately during pick-up</li>
            <li>Once products leave the pick-up location, they are the buyer's responsibility</li>
            <li>Vendors are available at pick-up to address any quality concerns</li>
          </ul>

          <h3>8. Why This Policy Exists</h3>
          <ul>
            <li>Seafood products are highly perishable and prepared specifically for each order</li>
            <li>Vendors commit resources immediately upon order confirmation</li>
            <li>This ensures fair business practices and prevents food waste</li>
            <li>Protects both buyers and vendors</li>
          </ul>

          <div className="terms-highlight-box">
            <p><strong>By accepting these terms, you acknowledge that:</strong></p>
            <ul>
              <li>You have read, understood, and agree to be bound by these Terms & Conditions</li>
              <li>You understand and accept the NO REFUND and NO CANCELLATION policy</li>
              <li>All sales are final once payment is confirmed</li>
              <li>You will inspect products carefully at the time of pick-up</li>
            </ul>
          </div>
        </div>

        <div className="terms-modal-footer">
          <button className="terms-accept-btn" onClick={onAccept}>
            I Accept These Terms
          </button>
        </div>
      </div>
    </div>
  );
};

export default TermsModal;