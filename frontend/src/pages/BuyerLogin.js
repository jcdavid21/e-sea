import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "./BuyerLogin.css";
import Navbar from "./Navbar";
import { checkSession } from "../utils/SessionManager";

const BuyerLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const session = checkSession();
    if (session?.type === 'buyer') {
      navigate('/buyer/dashboard');
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("Logging in...");

    try {
      const res = await axios.post(`${process.env.REACT_APP_BUYER_API_URL}/api/buyer/login`, {
        email,
        password,
      });

      if (res.status === 200) {
        const { buyer } = res.data;
        
        if (!buyer || !buyer.id) {
          setMessage("Login error: Invalid response from server.");
          return;
        }
        
        sessionStorage.setItem("customer_id", String(buyer.id));
        sessionStorage.setItem("buyerEmail", buyer.email);
        sessionStorage.setItem("buyerName", buyer.username || buyer.first_name || "Customer");
        sessionStorage.setItem("loginTime", Date.now().toString());
        
        localStorage.setItem("last_customer_id", String(buyer.id));
        
        setMessage("Login successful! Redirecting...");
        
        setTimeout(() => {
          navigate("/buyer/dashboard");
        }, 500);
      }
    } catch (err) {
      if (err.response) {
        setMessage(err.response.data?.message || "Invalid credentials.");
      } else {
        setMessage("Network error. Please check if the server is running.");
      }
    }
  };

  return (
    <div>
      <Navbar />
      <div className="buyer-container">
        <div className="buyer-card">
          <h2>Customer Login</h2>
          <form onSubmit={handleLogin}>
            <label>Email</label>
            <input
              type="email"
              value={email}
              placeholder="Enter your email"
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <label>Password</label>
            <input
              type="password"
              value={password}
              placeholder="Enter your password"
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="submit" className="buyer-btn">Login</button>
          </form>
          {message && <p className="buyer-message">{message}</p>}
          <p>
            Don't have an account?{" "}
            <Link to="/buyer/register" className="buyer-link">
              Register here.
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default BuyerLogin;