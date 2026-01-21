import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "./BuyerRegister.css";
import Navbar from "./Navbar";
import TermsModal from "./TermsModal";
import { secretQuestions } from "./SecretQuestions";

const BuyerRegister = () => {
  const [formData, setFormData] = useState({
    email: "",
    contact: "",
    lastName: "",
    firstName: "",
    middleName: "",
    username: "",
    password: "",
    secretQuestion: "",
    secretAnswer: "",
    confirmPassword: "",
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
    const [ name, value ] = [ e.target.name, e.target.value ];

    if (name === "contact") {
      const sanitizedValue = value.replace(/\D/g, "");
      setFormData({ ...formData, contact: sanitizedValue });
      return;
    }
    setFormData({ ...formData, [name]: value });
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

    if (formData.secretAnswer.trim() === "") {
      setMessage("Please provide an answer to the secret question.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    if (formData.secretQuestion === "") {
      setMessage("Please select a secret question.");
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
              value={formData.contact}
              maxLength={11}
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

            <label>Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              onChange={handleChange}
              required
              placeholder="Confirm your password"
            />

            <label>Secret Question</label>
            <select
              name="secretQuestion"
              onChange={handleChange}
              required
            >
              <option value="">Select a secret question</option>
              {secretQuestions.map((question, index) => (
                <option key={index} value={question}>
                  {question}
                </option>
              ))}
            </select>

            <label>Secret Answer</label>
            <input
              type="text"
              name="secretAnswer"
              onChange={handleChange}
              required
              placeholder="Enter your answer"
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