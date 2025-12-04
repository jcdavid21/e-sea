// admin-service/index.js - FIXED PREFLIGHT HANDLING
const express = require("express");
const mysql = require("mysql2");
const bcrypt = require("bcrypt");
const cors = require("cors");
const axios = require("axios");

const app = express();

// =============================
//  CRITICAL: CORS MUST BE FIRST
// =============================

// Manual CORS middleware - MUST BE BEFORE express.json()
app.use((req, res, next) => {
  const origin = req.headers.origin || '*';
  
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  
  // Handle preflight OPTIONS request immediately
  if (req.method === 'OPTIONS') {
    console.log('✅ Preflight request handled for:', req.path);
    return res.status(200).end();
  }
  
  next();
});

// =============================
//  Body Parser Middleware
// =============================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path} from ${req.headers.origin || 'unknown'}`);
  next();
});

// =============================
//  Database Connections
// =============================
const adminDb = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "admin_db",
  port: 3306,
});

adminDb.connect((err) => {
  if (err) {
    console.error("❌ Admin DB connection error:", err);
    process.exit(1);
  } else {
    console.log("✅ Connected to admin_db");
  }
});

const sellerAuthDb = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "seller_auth_db",
  port: 3306,
});

sellerAuthDb.connect((err) => {
  if (err) {
    console.error("❌ Seller Auth DB connection error:", err);
  } else {
    console.log("✅ Connected to seller_auth_db");
  }
});

const buyerDb = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "buyer_db",
  port: 3306,
});

buyerDb.connect((err) => {
  if (err) {
    console.error("❌ Buyer DB connection error:", err);
  } else {
    console.log("✅ Connected to buyer_db");
  }
});

// =============================
//  Constants
// =============================
const SALT_ROUNDS = 10;

// =============================
//  TEST ENDPOINT
// =============================
app.get("/api/test", (req, res) => {
  console.log("✅ Test endpoint hit");
  res.json({ message: "Server is working!", cors: "enabled" });
});

// =============================
//  Admin Authentication Routes
// =============================
app.post("/api/admin/login", async (req, res) => {
  console.log("📥 Login request received");
  console.log("📥 Body:", req.body);
  console.log("📥 Origin:", req.headers.origin);
  
  const { username, admin_id, password } = req.body;
  
  if (!username || !admin_id || !password) {
    console.log("❌ Missing fields");
    return res.status(400).json({ 
      message: "All fields are required" 
    });
  }

  try {
    const [results] = await adminDb.promise().query(
      "SELECT * FROM admins WHERE username = ? AND admin_id = ?",
      [username, admin_id]
    );
    
    if (results.length === 0) {
      console.log("❌ No admin found");
      return res.status(401).json({ 
        message: "Invalid credentials" 
      });
    }

    const admin = results[0];
    const match = await bcrypt.compare(password, admin.password_hash);
    
    if (!match) {
      console.log("❌ Password mismatch");
      return res.status(401).json({ 
        message: "Invalid credentials" 
      });
    }

    console.log("✅ Login successful for:", admin.username);
    
    return res.status(200).json({
      message: "✅ Login successful",
      admin: { 
        username: admin.username, 
        admin_id: admin.admin_id 
      }
    });
  } catch (err) {
    console.error("❌ Database error:", err);
    return res.status(500).json({ 
      message: "Database error" 
    });
  }
});

// =============================
//  Sellers Management Routes
// =============================

app.get("/api/sellers", async (req, res) => {
  try {
    const sql = "SELECT * FROM sellers ORDER BY date_added DESC";
    const [results] = await adminDb.promise().query(sql);
    return res.status(200).json(results);
  } catch (err) {
    console.error("❌ Error fetching sellers:", err);
    return res.status(500).json({ message: "Database error" });
  }
});

app.post("/api/sellers", async (req, res) => {
  const {
    unique_id,
    last_name,
    first_name,
    middle_name,
    shop_name,
    street,
    barangay,
    municipality,
    province,
    requirements,
    status,
  } = req.body;

  if (!unique_id || !last_name || !first_name || !shop_name) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const query = `
      INSERT INTO sellers 
      (unique_id, last_name, first_name, middle_name, shop_name, street, barangay, municipality, province, requirements, status, date_added) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    await adminDb.promise().query(query, [
      unique_id,
      last_name,
      first_name,
      middle_name,
      shop_name,
      street,
      barangay,
      municipality,
      province,
      JSON.stringify(requirements),
      status || "pending",
    ]);
    
    return res.status(201).json({ message: "✅ Seller added successfully" });
  } catch (err) {
    console.error("❌ Error adding seller:", err);
    return res.status(500).json({ message: "Database insert error" });
  }
});

app.put("/api/sellers/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!["accepted", "rejected", "pending"].includes(status)) {
    return res.status(400).json({ message: "Invalid status value" });
  }

  try {
    const [result] = await adminDb.promise().query(
      "UPDATE sellers SET status = ? WHERE id = ?",
      [status, id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Seller not found" });
    }
    
    return res.status(200).json({ message: "✅ Status updated successfully" });
  } catch (err) {
    console.error("❌ Error updating seller status:", err);
    return res.status(500).json({ message: "Update error" });
  }
});

app.delete("/api/sellers/:id", async (req, res) => {
  const { id } = req.params;
  
  try {
    await adminDb.promise().query("DELETE FROM sellers WHERE id = ?", [id]);
    return res.status(200).json({ message: "🗑️ Seller deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting seller:", err);
    return res.status(500).json({ message: "Delete error" });
  }
});

// =============================
//  Manage Products Routes
// =============================

app.get("/api/admin/all-sellers", async (req, res) => {
  try {
    const sql = `
      SELECT 
        s.unique_id, 
        s.shop_name, 
        s.first_name, 
        s.middle_name, 
        s.last_name,
        sp.logo  
      FROM sellers s
      LEFT JOIN seller_auth_db.seller_profiles sp 
      ON s.unique_id = sp.seller_id
      WHERE s.status = 'accepted'
      ORDER BY s.date_added DESC
    `;

    const [results] = await adminDb.promise().query(sql);
    
    console.log(`📊 Total sellers found: ${results.length}`);
    return res.status(200).json(results);
  } catch (err) {
    console.error("❌ Error fetching all seller profiles:", err);
    return res.status(500).json({
      message: "Database error fetching seller data.",
      error: err.message,
    });
  }
});

app.get("/api/admin/seller-products", async (req, res) => {
  const { seller_id } = req.query;
  
  if (!seller_id) {
    return res.status(400).json({ message: "Seller ID is required" });
  }

  try {
    const productsResponse = await axios.get(
      `http://localhost:5001/api/seller/fish`,
      { params: { seller_id } }
    );

    const categoriesResponse = await axios.get(
      `http://localhost:5001/api/seller/categories`,
      { params: { seller_id } }
    );

    const [sellerInfo] = await adminDb.promise().query(
      "SELECT shop_name FROM sellers WHERE unique_id = ?",
      [seller_id]
    );

    const responseData = {
      products: productsResponse.data || [],
      categories: categoriesResponse.data || [],
      shop_name: sellerInfo.length > 0 ? sellerInfo[0].shop_name : null
    };

    return res.status(200).json(responseData);
  } catch (err) {
    console.error("❌ Error fetching seller products:", err.message);
    const status = err.response ? err.response.status : 500;
    const message = err.response 
      ? err.response.data.message 
      : "Could not connect to Seller Service.";
    return res.status(status).json({ message });
  }
});

// =============================
//  Multi-Database Routes
// =============================

app.get("/api/all-sellers", async (req, res) => {
  try {
    const sql = `
      SELECT id, unique_id, email, date_registered
      FROM seller_credentials
      ORDER BY date_registered DESC
    `;
    
    const [results] = await sellerAuthDb.promise().query(sql);
    return res.status(200).json(results);
  } catch (err) {
    console.error("❌ Error fetching sellers from seller_auth_db:", err);
    return res.status(500).json({ message: "Error fetching sellers" });
  }
});

app.get("/api/all-buyers", async (req, res) => {
  try {
    const sql = `
      SELECT id, email, contact, last_name, first_name, middle_name, username, created_at
      FROM buyer_authentication
      ORDER BY created_at DESC
    `;
    
    const [results] = await buyerDb.promise().query(sql);
    return res.status(200).json(results);
  } catch (err) {
    console.error("❌ Error fetching buyers from buyer_db:", err);
    return res.status(500).json({ message: "Error fetching buyers" });
  }
});

app.put("/api/sellers/:id/check-requirements", async (req, res) => {
  try {
    const sellerId = req.params.id;
    
    const [seller] = await adminDb.promise().query(
      "SELECT requirements, date_added, status FROM sellers WHERE id = ?",
      [sellerId]
    );
    
    if (seller.length === 0) {
      return res.status(404).json({ message: "Seller not found" });
    }
    
    // Don't update if already accepted or rejected
    if (seller[0].status === "accepted" || seller[0].status === "rejected") {
      return res.json({ message: "Status already finalized", status: seller[0].status });
    }
    
    const requirements = typeof seller[0].requirements === "string" 
      ? JSON.parse(seller[0].requirements) 
      : seller[0].requirements;
    
    const isCompliant = Object.values(requirements).every(Boolean);
    const daysSinceCreation = Math.round(
      Math.abs((new Date() - new Date(seller[0].date_added)) / (24 * 60 * 60 * 1000))
    );
    
    let newStatus = seller[0].status;
    
    if (!isCompliant && daysSinceCreation >= 3) {
      newStatus = "rejected";
      await adminDb.promise().query(
        "UPDATE sellers SET status = ? WHERE id = ?",
        ["rejected", sellerId]
      );
    }
    
    res.json({ 
      message: "Requirements checked", 
      status: newStatus,
      isCompliant,
      daysSinceCreation 
    });
  } catch (err) {
    console.error("❌ Check Requirements Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Update seller requirements
app.put("/api/sellers/:id/requirements", async (req, res) => {
  try {
    const sellerId = req.params.id;
    const { requirements } = req.body;
    
    if (!requirements) {
      return res.status(400).json({ message: "Requirements data required" });
    }
    
    await adminDb.promise().query(
      "UPDATE sellers SET requirements = ? WHERE id = ?",
      [JSON.stringify(requirements), sellerId]
    );
    
    res.json({ message: "Requirements updated successfully" });
  } catch (err) {
    console.error("❌ Update Requirements Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// =============================
//  Notifications Routes
// =============================

// Get user notifications (from seller_auth_db.buyer_notifications)
app.get("/api/users/notifications", async (req, res) => {
  try {
    const sql = `
      SELECT 
        id,
        customer_id as user_id,
        order_id,
        message,
        is_read as status,
        created_at as date_created,
        'order' as type
      FROM buyer_notifications
      ORDER BY created_at DESC
    `;
    
    const [results] = await sellerAuthDb.promise().query(sql);
    return res.status(200).json(results);
  } catch (err) {
    console.error("❌ Error fetching user notifications:", err);
    return res.status(500).json({ message: "Error fetching notifications" });
  }
});

// Get seller notifications (from seller_auth_db.seller_notifications)
app.get("/api/sellers/notifications", async (req, res) => {
  try {
    const sql = `
      SELECT 
        id,
        seller_id,
        message,
        type,
        is_read as status,
        created_at as date_created
      FROM seller_notifications
      ORDER BY created_at DESC
    `;
    
    const [results] = await sellerAuthDb.promise().query(sql);
    return res.status(200).json(results);
  } catch (err) {
    console.error("❌ Error fetching seller notifications:", err);
    return res.status(500).json({ message: "Error fetching notifications" });
  }
});

// Get completed orders for sales analytics (from seller_auth_db.orders)
app.get("/api/orders/completed", async (req, res) => {
  try {
    const sql = `
      SELECT 
        o.id as order_id,
        o.customer_name,
        o.total as total_amount,
        o.payment_mode as payment_method,
        o.order_date as date_completed,
        o.status
      FROM orders o
      WHERE o.status = 'Completed'
      ORDER BY o.order_date DESC
    `;
    
    const [results] = await sellerAuthDb.promise().query(sql);
    return res.status(200).json(results);
  } catch (err) {
    console.error("❌ Error fetching completed orders:", err);
    return res.status(500).json({ message: "Error fetching orders" });
  }
});

// =============================
//  Server Initialization
// =============================
const PORT = 5003; // Changed from 5000 due to macOS Control Center conflict

const server = app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║  🚀 Admin Service Started              ║
║  📡 Port: ${PORT}                         ║
║  ✅ CORS: Enabled                      ║
║  🔗 URL: http://localhost:${PORT}      ║
╚════════════════════════════════════════╝
  `);
});

// Handle server errors
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use!`);
    console.error('   Please kill the process using that port or choose a different port.');
    process.exit(1);
  } else {
    console.error('❌ Server error:', err);
  }
});