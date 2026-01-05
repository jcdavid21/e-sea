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
import { useNavigate } from "react-router-dom";
import { checkSession } from "../utils/SessionManager";

const Policies = () => {
  const navigate = useNavigate();

  React.useEffect(() => {
    const session = checkSession();
    if (session) {
      navigate(session.redirectTo);
    }
  }, [navigate]);

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
              <li>Provide accurate address and contact information</li>
              <li>Comply with all applicable local, state, and national laws</li>
              <li>Not engage in fraudulent activities or misuse the platform</li>
              <li>Respect intellectual property rights</li>
              <li>Inspect products thoroughly upon pick-up</li>
            </ul>

            <h3>3. Pick-Up Policy</h3>
            <div className="highlight-box">
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

            <div className="highlight-box warning">
              <p><strong><FaExclamationTriangle /> No Cancellation Policy:</strong></p>
              <p>
                Due to the perishable nature of seafood products and to ensure fair business practices for our vendors, 
                <strong> all orders are final and cannot be cancelled once placed</strong>. Please review your order carefully before confirming your purchase.
              </p>
            </div>
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

            <h3>Product Inspection</h3>
            <div className="highlight-box">
              <p><strong>Buyer Responsibility:</strong></p>
              <ul>
                <li>Buyers must thoroughly inspect products at the time of pick-up</li>
                <li>Any concerns about product quality must be raised immediately during pick-up</li>
                <li>Once products leave the pick-up location, they are the buyer's responsibility</li>
                <li>Vendors are available at pick-up to address any quality concerns</li>
              </ul>
            </div>

            <h3>Product Availability</h3>
            <p>
              Product availability is subject to daily catch and stock levels. We reserve the right to:
            </p>
            <ul>
              <li>Limit quantities of products purchased</li>
              <li>Update product availability in real-time</li>
              <li>Communicate with buyers if products become unavailable before pick-up</li>
            </ul>
          </section>

          {/* No Refund Policy */}
          <section className="policies-section">
            <h2 className="section-title">
              <FaExclamationTriangle className="section-icon" />
              No Refund & No Cancellation Policy
            </h2>

            <div className="highlight-box warning">
              <h3>⚠️ Important Notice</h3>
              <p>
                <strong>e-Sea-Merkado operates with a strict NO REFUND and NO CANCELLATION policy.</strong>
              </p>
            </div>

            <h3>Policy Details</h3>
            <ul>
              <li><strong>No Cancellations:</strong> Once an order is placed and payment is confirmed, it cannot be cancelled under any circumstances</li>
              <li><strong>No Refunds:</strong> All sales are final. No refunds will be issued for any reason</li>
              <li><strong>No Exchanges:</strong> Products cannot be exchanged after purchase</li>
              <li><strong>No Modifications:</strong> Orders cannot be modified after confirmation</li>
            </ul>

            <h3>Reasons for This Policy</h3>
            <ul>
              <li>Seafood products are highly perishable and prepared specifically for each order</li>
              <li>Vendors commit resources immediately upon order confirmation</li>
              <li>This ensures fair business practices and prevents food waste</li>
              <li>Protects both buyers and vendors from unfair practices</li>
            </ul>

            <div className="highlight-box">
              <p><strong>Before You Order:</strong></p>
              <ul>
                <li>Double-check your order details, quantities, and pick-up information</li>
                <li>Ensure you can pick up your order at the scheduled time</li>
                <li>Verify product descriptions and specifications</li>
                <li>Review vendor ratings and reviews</li>
                <li>Contact the vendor if you have questions before placing an order</li>
              </ul>
            </div>

            <h3>Buyer Protection</h3>
            <p>
              While we maintain a strict no refund policy, we encourage buyers to:
            </p>
            <ul>
              <li>Inspect products thoroughly at the time of pick-up</li>
              <li>Communicate immediately with the vendor if there are concerns</li>
              <li>Take photos or videos if quality issues are observed during pick-up</li>
              <li>Contact platform support for assistance in resolving disputes</li>
            </ul>

            <p className="policy-emphasis">
              By placing an order on e-Sea-Merkado, you acknowledge and accept this No Refund and No Cancellation policy.
            </p>
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
              <li>Be present during pick-up to address buyer concerns</li>
              <li>Respond promptly to customer inquiries</li>
              <li>Honor all confirmed orders</li>
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
              <li>Repeated customer complaints about quality</li>
              <li>Fraudulent activities</li>
              <li>Failure to maintain quality standards</li>
              <li>Not fulfilling confirmed orders</li>
              <li>Providing misleading product information</li>
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
              <li>We are not responsible for product quality issues that arise after pick-up</li>
              <li>Buyers are responsible for inspecting products at the time of pick-up</li>
              <li>We facilitate transactions but do not guarantee product quality beyond vendor commitments</li>
              <li>We are not liable for indirect, incidental, or consequential damages</li>
              <li>Disputes between buyers and vendors should be resolved at the point of pick-up</li>
              <li>We provide a platform for communication but are not party to individual transactions</li>
            </ul>

            <div className="highlight-box">
              <p><strong>Health Advisory:</strong> If you have allergies or dietary restrictions, please verify product details with vendors before purchase. We cannot guarantee the absence of allergens or cross-contamination.</p>
            </div>

            <div className="highlight-box warning">
              <p><strong>Food Safety:</strong> Buyers are responsible for proper handling and storage of seafood products after pick-up. Follow food safety guidelines to prevent spoilage or contamination.</p>
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
            Last Updated: December 27, 2024
          </p>
        </div>
      </div>
    </div>
  );
};

export default Policies;