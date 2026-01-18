import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "./BuyerLogin.css";
import Navbar from "./Navbar";

const BuyerForgotPassword = () => {
  const [step, setStep] = useState(1); // 1: email, 2: secret question, 3: new password
  const [email, setEmail] = useState("");
  const [secretQuestion, setSecretQuestion] = useState("");
  const [secretAnswer, setSecretAnswer] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // 'error' or 'success'
  const navigate = useNavigate();

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setMessage("Verifying email...");
    setMessageType("");

    try {
      const res = await axios.post(
        `${process.env.REACT_APP_BUYER_API_URL}/api/buyer/verify-email`,
        { email }
      );

      if (res.status === 200) {
        setSecretQuestion(res.data.secretQuestion);
        setStep(2);
        setMessage("");
      }
    } catch (err) {
      setMessageType("error");
      if (err.response) {
        setMessage(err.response.data?.message || "Email not found.");
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
        `${process.env.REACT_APP_BUYER_API_URL}/api/buyer/verify-secret`,
        { email, secretAnswer }
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
        `${process.env.REACT_APP_BUYER_API_URL}/api/buyer/reset-password`,
        { email, newPassword }
      );

      if (res.status === 200) {
        setMessage("Password reset successful! Redirecting to login...");
        setMessageType("success");
        setTimeout(() => {
          navigate("/buyer/login");
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
      <div className="buyer-container">
        <div className="buyer-card">
          <h2>Forgot Password</h2>

          {step === 1 && (
            <form onSubmit={handleEmailSubmit}>
              <label>Email Address</label>
              <input
                type="email"
                value={email}
                placeholder="Enter your registered email"
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button type="submit" className="buyer-btn">
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
              />
              <label>Your Answer</label>
              <input
                type="text"
                value={secretAnswer}
                placeholder="Enter your answer"
                onChange={(e) => setSecretAnswer(e.target.value)}
                required
              />
              <button type="submit" className="buyer-btn">
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
              <button type="submit" className="buyer-btn">
                Reset Password
              </button>
            </form>
          )}

          {message && (
            <p className={`buyer-message ${messageType}`}>
              {message}
            </p>
          )}

          <p style={{ marginTop: "20px" }}>
            Remember your password?{" "}
            <Link to="/buyer/login" className="buyer-link">
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default BuyerForgotPassword;