import React from "react";
import { 
  FaFileContract, 
  FaShieldAlt, 
  FaUserShield,
  FaExclamationTriangle,
  FaHandshake,
  FaEnvelope,
  FaPhone
} from "react-icons/fa";
import Navbar from "./Navbar";
import "./Policies.css";

const Policies = () => {
  return (
    <div className="policies-wrapper">
      <Navbar />
      
      <div className="policies-container">
        <div className="policies-header">
          <h1 className="policies-title">Terms & Policies</h1>
          <p className="policies-subtitle">
            Please read these terms carefully before using e-Sea-Merkado
          </p>
        </div>

        <div className="policies-content">
          {/* Terms of Service */}
          <section className="policies-section">
            <h2 className="section-title">
              <FaFileContract className="section-icon" />
              Terms of Service
            </h2>
            <p>
              By accessing and using e-Sea-Merkado, you accept and agree to be bound by the terms and provisions of this agreement. If you do not agree to these terms, please do not use our platform.
            </p>
            
            <h3>1. Account Registration</h3>
            <ul>
              <li>You must provide accurate and complete information during registration</li>
              <li>You are responsible for maintaining the confidentiality of your account credentials</li>
              <li>You must be at least 18 years old to create an account</li>
              <li>One person or business entity may only maintain one account</li>
            </ul>

            <h3>2. User Responsibilities</h3>
            <ul>
              <li>Provide accurate adderss and contact information</li>
              <li>Comply with all applicable local, state, and national laws</li>
              <li>Not engage in fraudulent activities or misuse the platform</li>
              <li>Respect intellectual property rights</li>
            </ul>

            <h3>3. Pick-Up Policy</h3>
            <div className="highlight-box">
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
          </section>

          {/* Privacy Policy */}
          <section className="policies-section">
            <h2 className="section-title">
              <FaUserShield className="section-icon" />
              Privacy Policy
            </h2>
            <p>
              e-Sea-Merkado is committed to protecting your privacy. This policy explains how we collect, use, and safeguard your personal information.
            </p>

            <h3>Information We Collect</h3>
            <ul>
              <li><strong>Personal Information:</strong> Name, email address, phone number, and personal address</li>
              <li><strong>Payment Information:</strong> Processed securely through our payment partners</li>
              <li><strong>Usage Data:</strong> How you interact with our platform to improve user experience</li>
              <li><strong>Device Information:</strong> Browser type, IP address, and operating system</li>
            </ul>

            <h3>How We Use Your Information</h3>
            <ul>
              <li>Process and fulfill your orders</li>
              <li>Communicate order updates and important notices</li>
              <li>Improve our services and user experience</li>
              <li>Send promotional materials (with your consent)</li>
              <li>Prevent fraud and enhance security</li>
            </ul>

            <h3>Data Protection</h3>
            <p>
              We implement industry-standard security measures to protect your personal information. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.
            </p>

            <div className="highlight-box">
              <p><strong>Your Rights:</strong></p>
              <ul>
                <li>Access your personal data</li>
                <li>Request correction of inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Opt-out of marketing communications</li>
              </ul>
            </div>
          </section>

          {/* Product Quality & Freshness */}
          <section className="policies-section">
            <h2 className="section-title">
              <FaShieldAlt className="section-icon" />
              Product Quality & Freshness
            </h2>
            <p>
              We are committed to providing only the freshest and highest quality seafood products.
            </p>

            <h3>Quality Assurance</h3>
            <ul>
              <li>All products are sourced from verified and trusted vendors</li>
              <li>Seafood freshness is indicated on each product listing (Fresh, Chilled, Frozen)</li>
              <li>Products are inspected before being made available for pick-up</li>
              <li>We maintain strict hygiene and food safety standards</li>
            </ul>

            <h3>Product Availability</h3>
            <p>
              Product availability is subject to daily catch and stock levels. We reserve the right to:
            </p>
            <ul>
              <li>Limit quantities of products purchased</li>
              <li>Cancel orders if products become unavailable</li>
              <li>Suggest alternative products when your selection is out of stock</li>
            </ul>
          </section>

          {/* Refund & Cancellation Policy */}
          <section className="policies-section">
            <h2 className="section-title">
              <FaExclamationTriangle className="section-icon" />
              Refund & Cancellation Policy
            </h2>

            <h3>Order Cancellation</h3>
            <ul>
                <li><strong>No Cancellation:</strong> Orders cannot be cancelled once placed due to the perishable nature of seafood products
                </li>
                <li>If you encounter issues with your order, please contact our support team immediately</li>
            </ul>

            <h3>Refund Eligibility</h3>
            <p>Refunds may be issued in the following cases:</p>
            <ul>
              <li>Product received does have quality issues</li>
              <li>Product quality issues verified upon pick-up</li>
              <li>Order cancelled by vendor due to stock unavailability</li>
              <li>System errors resulting in duplicate charges</li>
            </ul>

            <div className="highlight-box">
              <p><strong>Important:</strong> Products must be inspected at the time of pick-up. Claims made after leaving the pick-up location may not be eligible for refund.</p>
            </div>

            <h3>Refund Process</h3>
            <ul>
              <li>Refund requests must be submitted within 24 hours of pick-up</li>
              <li>Approved refunds will be processed within 5-7 business days</li>
              <li>Refunds will be returned to the original payment method</li>
            </ul>
          </section>

          {/* Vendor Terms */}
          <section className="policies-section">
            <h2 className="section-title">
              <FaHandshake className="section-icon" />
              Vendor Terms
            </h2>
            <p>
              If you are a vendor on e-Sea-Merkado, you agree to the following:
            </p>

            <h3>Vendor Responsibilities</h3>
            <ul>
              <li>Provide accurate product descriptions, pricing, and images</li>
              <li>Maintain product quality and freshness standards</li>
              <li>Update stock availability in real-time</li>
              <li>Fulfill confirmed orders within agreed timeframes</li>
              <li>Comply with all food safety regulations and licensing requirements</li>
              <li>Respond promptly to customer inquiries and issues</li>
            </ul>

            <h3>Commission and Fees</h3>
            <ul>
              <li>Platform commission rates will be clearly communicated</li>
              <li>Payment processing fees may apply</li>
              <li>Vendors will receive payouts according to the agreed schedule</li>
            </ul>

            <h3>Account Suspension</h3>
            <p>
              e-Sea-Merkado reserves the right to suspend or terminate vendor accounts for:
            </p>
            <ul>
              <li>Violation of platform policies</li>
              <li>Repeated customer complaints</li>
              <li>Fraudulent activities</li>
              <li>Failure to maintain quality standards</li>
            </ul>
          </section>

          {/* Limitation of Liability */}
          <section className="policies-section">
            <h2 className="section-title">
              <FaShieldAlt className="section-icon" />
              Limitation of Liability
            </h2>
            <p>
              e-Sea-Merkado acts as a platform connecting buyers and sellers. While we strive to ensure quality and safety:
            </p>
            <ul>
              <li>We are not responsible for issues arising from vendor products beyond our control</li>
              <li>Users consume products at their own risk and should inspect items upon pick-up</li>
              <li>We are not liable for indirect, incidental, or consequential damages</li>
              <li>Our total liability shall not exceed the amount paid for the specific order</li>
            </ul>

            <div className="highlight-box">
              <p><strong>Health Advisory:</strong> If you have allergies or dietary restrictions, please verify product details with vendors before purchase. We cannot guarantee the absence of allergens or cross-contamination.</p>
            </div>
          </section>

          {/* Changes to Terms */}
          <section className="policies-section">
            <h2 className="section-title">
              <FaFileContract className="section-icon" />
              Changes to Terms
            </h2>
            <p>
              e-Sea-Merkado reserves the right to modify these terms at any time. We will notify users of significant changes via email or platform notification. Continued use of the platform after changes constitutes acceptance of the new terms.
            </p>
          </section>

          {/* Contact Information */}
          <div className="contact-box">
            <h3>
              <FaEnvelope />
              Questions or Concerns?
            </h3>
            <p>
              If you have any questions about these terms and policies, please contact us:
            </p>
            <p>
              <FaEnvelope style={{ marginRight: '6px' }} />
              Email: <a href="mailto:support@esemerkado.com" className="contact-link">support@esemerkado.com</a>
            </p>
            <p>
              <FaPhone style={{ marginRight: '6px' }} />
              Phone: <a href="tel:+639565535789" className="contact-link">+63 956 5535 789</a>
            </p>
          </div>

          <p className="last-updated">
            Last Updated: December 18, 2024
          </p>
        </div>
      </div>
    </div>
  );
};

export default Policies;