// src/pages/AdminLogin.js
import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./AdminLogin.css";

const AdminLogin = () => {
  const [username, setUsername] = useState("");
  const [adminID, setAdminID] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      // Use environment variable for API URL
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/admin/login`,
        {
          username,
          admin_id: adminID,
          password,
        }
      );
      alert(res.data.message);
      navigate("/admin/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="admin-container">
      <div className="admin-card">
        <h2>Admin Login</h2>
        <form onSubmit={handleLogin}>
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />

          <label htmlFor="adminID">Admin ID</label>
          <input
            type="text"
            id="adminID"
            placeholder="Enter your Admin ID"
            value={adminID}
            onChange={(e) => setAdminID(e.target.value)}
            required
          />

          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit" className="admin-btn">
            Login
          </button>
        </form>

        {error && <p className="admin-message">{error}</p>}
      </div>
    </div>
  );
};

export default AdminLogin;