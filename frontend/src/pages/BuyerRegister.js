import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "./BuyerRegister.css";
import Navbar from "./Navbar";
import TermsModal from "./TermsModal";

const BuyerRegister = () => {
  const [formData, setFormData] = useState({
    email: "",
    contact: "",
    lastName: "",
    firstName: "",
    middleName: "",
    username: "",
    password: "",
  });

  const [message, setMessage] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const navigate = useNavigate();

  const validatePassword = (password) => {
    const regex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[~`!@#$%^&*()\-_+={}[\]|\\;:"<>,./?]).{10,}$/;
    return regex.test(password);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleTermsAccept = () => {
    setAcceptedTerms(true);
    setShowTermsModal(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!acceptedTerms) {
      setMessage("Please accept the Terms & Conditions to continue.");
      return;
    }

    if (!validatePassword(formData.password)) {
      setMessage(
        "Password must include: at least 1 lowercase, 1 uppercase, 1 number, 1 special character, and be 10+ characters long."
      );
      return;
    }

    try {
      const res = await axios.post(`${process.env.REACT_APP_BUYER_API_URL}/api/buyer/register`, formData);
      setMessage(res.data.message);
      if (res.status === 201) {
        setTimeout(() => navigate("/buyer/login"), 2000);
      }
    } catch (err) {
      setMessage(err.response?.data?.message || "Registration failed.");
    }
  };

  return (
    <div>
      <Navbar />
      <div className="buyer-register-container">
        <div className="buyer-register-card">
          <h2>Create Your Account</h2>
          <form onSubmit={handleSubmit}>
            <label>Email</label>
            <input
              type="email"
              name="email"
              onChange={handleChange}
              required
              placeholder="Enter your email"
            />

            <label>Contact Number</label>
            <input
              type="text"
              name="contact"
              onChange={handleChange}
              required
              placeholder="Enter your contact number"
            />

            <label>Last Name</label>
            <input
              type="text"
              name="lastName"
              onChange={handleChange}
              required
              placeholder="Enter your last name"
            />

            <label>First Name</label>
            <input
              type="text"
              name="firstName"
              onChange={handleChange}
              required
              placeholder="Enter your first name"
            />

            <label>Middle Name</label>
            <input
              type="text"
              name="middleName"
              onChange={handleChange}
              placeholder="Enter your middle name"
            />

            <label>Username</label>
            <input
              type="text"
              name="username"
              onChange={handleChange}
              required
              placeholder="Choose a username"
            />

            <label>Password</label>
            <input
              type="password"
              name="password"
              onChange={handleChange}
              required
              placeholder="Create a strong password"
            />

            <div className="terms-checkbox-container">
              <input
                type="checkbox"
                id="terms"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
              />
              <label htmlFor="terms">
                I accept the{" "}
                <button
                  type="button"
                  className="terms-link-btn"
                  onClick={() => setShowTermsModal(true)}
                >
                  Terms & Conditions
                </button>
              </label>
            </div>

            <button
              type="submit"
              className="buyer-register-btn"
              disabled={!acceptedTerms}
            >
              Register
            </button>
          </form>

          {message && <p className="buyer-register-message">{message}</p>}

          <p>
            Already have an account?{" "}
            <Link to="/buyer/login" className="buyer-register-link">
              Login here.
            </Link>
          </p>
        </div>
      </div>

      {showTermsModal && (
        <TermsModal
          onClose={() => setShowTermsModal(false)}
          onAccept={handleTermsAccept}
        />
      )}
    </div>
  );
};

export default BuyerRegister;