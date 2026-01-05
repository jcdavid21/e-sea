import React, { useState } from 'react';
import { FaEnvelope, FaPhone, FaMapMarkerAlt, FaClock, FaChevronDown } from 'react-icons/fa';
import Navbar from './Navbar';
import './Contact.css';
import { useNavigate } from "react-router-dom";
import { checkSession } from "../utils/SessionManager";

const Contact = () => {
  const navigate = useNavigate();

  React.useEffect(() => {
    const session = checkSession();
    if (session) {
      navigate(session.redirectTo);
    }
  }, [navigate]);
  
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqs = [
    {
      question: "How long does it take to get a response?",
      answer: "We typically respond to all inquiries within 24-48 business hours. Urgent matters may be addressed sooner."
    },
    {
      question: "Can I become a vendor?",
      answer: "Absolutely! We're always looking for quality seafood suppliers. Contact us with \"Vendor Partnership\" in the subject line."
    },
    {
      question: "What if I need to cancel my order?",
      answer: "Due to the perishable nature of seafood, orders cannot be cancelled once placed. Please refer to our Terms & Policies."
    },
    {
      question: "How does the pick-up process work?",
      answer: "Once your order is confirmed, you'll receive a notification with pick-up details. Simply bring your order ID to complete the process."
    },
    {
      question: "Do you deliver outside Quezon City?",
      answer: "Currently, e-Sea-Merkado operates on a pick-up only basis in Quezon City. We're exploring delivery options in the future."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We currently accept Gcash as our primary payment method. We may add more options soon."
    }
  ];

  return (
    <div className="contact-wrapper">
      <Navbar />

      <div className="contact-container">
        <div className="contact-header">
          <h1 className="contact-title">Have questions about e-Sea-Merkado? We'd love to hear from you.</h1>
          <p className="contact-subtitle">
            Reach out to our team anytime.
          </p>
        </div>

        <div className="contact-content">
          {/* Contact Information */}
          <div className="info-section-full">
            <div className="info-card">
              <div className="info-icon">
                <FaEnvelope />
              </div>
              <h3>Email</h3>
              <p>For general inquiries and support</p>
              <a href="mailto:support@esemerkado.com">
                support@esemerkado.com
              </a>
            </div>

            <div className="info-card">
              <div className="info-icon">
                <FaPhone />
              </div>
              <h3>Phone</h3>
              <p>Call us during business hours</p>
              <a href="tel:+639565535789">
                +63 956 5535 789
              </a>
            </div>

            <div className="info-card">
              <div className="info-icon">
                <FaMapMarkerAlt />
              </div>
              <h3>Location</h3>
              <p>Visit us at our office</p>
              <div className="info-text">
                e-Sea-Merkado<br />
                Philippines
              </div>
            </div>

            <div className="info-card">
              <div className="info-icon">
                <FaClock />
              </div>
              <h3>Business Hours</h3>
              <p>
                Mon-Fri: 9:00 AM - 6:00 PM<br />
                Sat: 10:00 AM - 4:00 PM<br />
                Sun: Closed
              </p>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="faq-section">
            <h2 className="section-heading">Frequently Asked Questions</h2>
            
            <div className="faq-accordion">
              {faqs.map((faq, index) => (
                <div 
                  key={index} 
                  className={`faq-item ${openFaq === index ? 'active' : ''}`}
                >
                  <button 
                    className="faq-question"
                    onClick={() => toggleFaq(index)}
                  >
                    <h3>{faq.question}</h3>
                    <FaChevronDown className={`faq-icon ${openFaq === index ? 'rotate' : ''}`} />
                  </button>
                  <div className={`faq-answer ${openFaq === index ? 'open' : ''}`}>
                    <p>{faq.answer}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;