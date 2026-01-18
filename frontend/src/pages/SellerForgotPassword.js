import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "./SellerLogin.css";
import Navbar from "./Navbar";
import { secretQuestions } from "./SecretQuestions";

const SellerForgotPassword = () => {
  const [step, setStep] = useState(1); // 1: unique_id, 2: secret question, 3: new password
  const [uniqueId, setUniqueId] = useState("");
  const [secretQuestion, setSecretQuestion] = useState("");
  const [secretAnswer, setSecretAnswer] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // 'error' or 'success'
  const navigate = useNavigate();

  const handleIdSubmit = async (e) => {
    e.preventDefault();
    setMessage("Verifying ID...");
    setMessageType("");

    try {
      const res = await axios.post(
        `${process.env.REACT_APP_SELLER_API_URL}/api/seller/verify-id`,
        { unique_id: uniqueId }
      );

      if (res.status === 200) {
        setSecretQuestion(res.data.secretQuestion);
        setStep(2);
        setMessage("");
      }
    } catch (err) {
      setMessageType("error");
      if (err.response) {
        setMessage(err.response.data?.message || "Seller ID not found.");
      } else {
        setMessage("Network error. Please try again.");
      }
    }
  };

  const handleSecretAnswerSubmit = async (e) => {
    e.preventDefault();
    setMessage("Verifying answer...");
    setMessageType("");

    try {
      const res = await axios.post(
        `${process.env.REACT_APP_SELLER_API_URL}/api/seller/verify-secret`,
        { unique_id: uniqueId, secretAnswer }
      );

      if (res.status === 200) {
        setStep(3);
        setMessage("");
      }
    } catch (err) {
      setMessageType("error");
      if (err.response) {
        setMessage(err.response.data?.message || "Incorrect answer.");
      } else {
        setMessage("Network error. Please try again.");
      }
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match.");
      setMessageType("error");
      return;
    }

    if (newPassword.length < 6) {
      setMessage("Password must be at least 6 characters.");
      setMessageType("error");
      return;
    }

    setMessage("Resetting password...");
    setMessageType("");

    try {
      const res = await axios.post(
        `${process.env.REACT_APP_SELLER_API_URL}/api/seller/reset-password`,
        { unique_id: uniqueId, newPassword }
      );

      if (res.status === 200) {
        setMessage("Password reset successful! Redirecting to login...");
        setMessageType("success");
        setTimeout(() => {
          navigate("/seller/login");
        }, 2000);
      }
    } catch (err) {
      setMessageType("error");
      if (err.response) {
        setMessage(err.response.data?.message || "Failed to reset password.");
      } else {
        setMessage("Network error. Please try again.");
      }
    }
  };

  return (
    <div>
      <Navbar />
      <div className="seller-container">
        <div className="seller-card">
          <h2>Forgot Password</h2>

          {step === 1 && (
            <form onSubmit={handleIdSubmit}>
              <label>Seller ID</label>
              <input
                type="text"
                value={uniqueId}
                placeholder="Enter your seller ID"
                onChange={(e) => setUniqueId(e.target.value)}
                required
              />
              <button type="submit" className="seller-btn">
                Continue
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleSecretAnswerSubmit}>
              <label>Secret Question</label>
              <input
                type="text"
                value={secretQuestion}
                disabled
                style={{ cursor: "not-allowed", opacity: 0.7 }}
              />
              <label>Your Answer</label>
              <input
                type="text"
                value={secretAnswer}
                placeholder="Enter your answer"
                onChange={(e) => setSecretAnswer(e.target.value)}
                required
              />
              <button type="submit" className="seller-btn">
                Verify
              </button>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handlePasswordReset}>
              <label>New Password</label>
              <input
                type="password"
                value={newPassword}
                placeholder="Enter new password"
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <label>Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                placeholder="Confirm new password"
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <button type="submit" className="seller-btn">
                Reset Password
              </button>
            </form>
          )}

          {message && (
            <p className={`seller-message ${messageType}`}>
              {message}
            </p>
          )}

          <p style={{ marginTop: "20px" }}>
            Remember your password?{" "}
            <Link to="/seller/login" className="seller-link">
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SellerForgotPassword;