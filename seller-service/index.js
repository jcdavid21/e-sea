const express = require("express");
const mysql = require("mysql2/promise");
const bcrypt = require("bcrypt");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const app = express();
app.use(cors());

// =============================
//  CORS Configuration (Must be first)
// =============================
app.use((req, res, next) => {
  const origin = req.headers.origin || '*';
  
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  
  if (req.method === 'OPTIONS') {
    console.log('✅ Preflight request handled for:', req.path);
    return res.status(200).end();
  }
  
  next();
});

// =============================
//  Middleware Configuration
// =============================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path} from ${req.headers.origin || 'unknown'}`);
  next();
});

// =============================
//  File Upload Configuration
// =============================
const UPLOAD_DIR = path.join(__dirname, "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);

app.use("/uploads", express.static(UPLOAD_DIR));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) =>
    cb(null, Date.now() + "-" + file.originalname.replace(/\s+/g, "_")),
});
const upload = multer({ storage });


const db = mysql.createPool({
  host: process.env.DB_HOST_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DATABASE_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test database connection (updated for promise version)
db.getConnection()
  .then(connection => {
    console.log("✅ Connected to MySQL database: e_sea_db");
    connection.release();
  })
  .catch(err => {
    console.error("❌ Database connection failed:", err);
    process.exit(1);
  });

// =============================
//  Constants & Validators
// =============================
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[~`!@#$%^&*()_\-+={}[\]|\\:;"'<>,.?/]).{10,}$/;
const SALT_ROUNDS = 10;

const validatePasswordStrength = (password) => {
  return PASSWORD_REGEX.test(password);
};

const validateRequiredFields = (fields, requiredFields) => {
  const missing = requiredFields.filter(field => !fields[field]);
  return missing.length === 0 ? null : missing;
};

// =============================
//  Helper Functions
// =============================

// Initialize default categories for new seller
async function initializeDefaultCategories(seller_id) {
  const defaultCategories = [
    'Freshwater',
    'Saltwater',
    'Shellfish',
    'Crustaceans',
    'Premium Fish'
  ];

  try {
    for (const category of defaultCategories) {
      await db.query(
        "INSERT IGNORE INTO fish_categories (category_name, seller_id) VALUES (?, ?)",
        [category, seller_id]
      );
    }
  } catch (err) {
    console.error("Error initializing categories:", err);
  }
}

// Insert notification helper
async function insertNotification(seller_id, message, type = 'info') {
  try {
    await db.query(
      "INSERT INTO seller_notifications (seller_id, message, type) VALUES (?, ?, ?)",
      [seller_id, message, type]
    );
  } catch (err) {
    console.error(`Error inserting notification for seller ${seller_id}:`, err);
  }
}

// =============================
//  TEST ENDPOINT
// =============================
app.get("/api/test", (req, res) => {
  console.log("✅ Test endpoint hit");
  res.json({ message: "Server is working!", cors: "enabled", database: "e_sea_db" });
});

// =============================
//  ADMIN AUTHENTICATION ROUTES
// =============================

app.post("/api/admin/login", async (req, res) => {
  console.log("🔥 Admin login request received");
  
  const { username, admin_id, password } = req.body;
  
  if (!username || !admin_id || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const [results] = await db.query(
      "SELECT * FROM admins WHERE username = ? AND admin_id = ?",
      [username, admin_id]
    );
    
    if (results.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const admin = results[0];
    const match = await bcrypt.compare(password, admin.password_hash);
    
    if (!match) {
      return res.status(401).json({ message: "Invalid credentials" });
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
    return res.status(500).json({ message: "Database error" });
  }
});

// =============================
//  SELLER AUTHENTICATION ROUTES
// =============================

app.post("/api/seller/register", async (req, res) => {
  const { email, unique_id, password } = req.body;

  if (!email || !unique_id || !password)
    return res.status(400).json({ message: "All fields required" });

  try {
    // Check if ID exists in sellers table and is approved
    const [sellerCheck] = await db.query(
      "SELECT status FROM sellers WHERE unique_id = ?", 
      [unique_id]
    );

    if (sellerCheck.length === 0)
      return res.status(404).json({ message: "Generated ID not found." });

    if (sellerCheck[0].status !== "accepted")
      return res.status(403).json({ message: "Seller not approved." });

    // Check if already registered
    const [credCheck] = await db.query(
      "SELECT id FROM seller_credentials WHERE email = ? OR unique_id = ?", 
      [email, unique_id]
    );

    if (credCheck.length > 0)
      return res.status(409).json({ message: "Seller already registered." });

    // Hash password and insert
    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    await db.query(
      "INSERT INTO seller_credentials (unique_id, email, password_hash) VALUES (?, ?, ?)",
      [unique_id, email, hash]
    );

    // Auto-create default categories
    await initializeDefaultCategories(unique_id);

    res.json({ message: "Registration successful." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error." });
  }
});

app.post("/api/seller/login", async (req, res) => {
  const { unique_id, password } = req.body;

  if (!unique_id || !password)
    return res.status(400).json({ message: "Both fields required" });

  try {
    const [results] = await db.query(
      "SELECT password_hash FROM seller_credentials WHERE unique_id = ?", 
      [unique_id]
    );

    if (results.length === 0)
      return res.status(401).json({ message: "Invalid ID." });

    const match = await bcrypt.compare(password, results[0].password_hash);
    if (!match)
      return res.status(401).json({ message: "Invalid password." });

    res.json({ message: "Login successful", unique_id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error." });
  }
});

// =============================
//  BUYER AUTHENTICATION ROUTES
// =============================

app.post("/api/buyer/register", async (req, res) => {
  const { email, contact, lastName, firstName, middleName, username, password } = req.body;

  const missing = validateRequiredFields(
    { email, contact, lastName, firstName, username, password },
    ["email", "contact", "lastName", "firstName", "username", "password"]
  );

  if (missing) {
    return res.status(400).json({ 
      message: "Please fill in all required fields.",
      missing_fields: missing 
    });
  }

  if (!validatePasswordStrength(password)) {
    return res.status(400).json({
      message: "Password must contain at least 10 characters, including 1 lowercase, 1 uppercase, 1 number, and 1 special character."
    });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    
    const sql = `
      INSERT INTO buyer_authentication 
      (email, contact, last_name, first_name, middle_name, username, password_hash)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    await db.query(
      sql,
      [email, contact, lastName, firstName, middleName, username, hashedPassword]
    );
    
    return res.status(201).json({ message: "Registration successful!" });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ message: "Email or username already exists." });
    }
    console.error("Registration error:", error);
    return res.status(500).json({ message: "Database error during registration." });
  }
});

app.post("/api/buyer/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  try {
    const [results] = await db.query(
      "SELECT * FROM buyer_authentication WHERE email = ?", 
      [email]
    );

    if (results.length === 0) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const user = results[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const customerIdentifier = (user.first_name + user.last_name + user.contact)
      .replace(/\s/g, "");

    return res.status(200).json({
      message: "Login successful!",
      buyer: {
        id: user.id,
        email: user.email,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        notification_id: customerIdentifier
      }
    });
  } catch (err) {
    console.error("Password comparison error:", err);
    return res.status(500).json({ message: "Server error during login." });
  }
});

// =============================
//  SELLERS MANAGEMENT ROUTES
// =============================

app.get("/api/sellers", async (req, res) => {
  try {
    const [results] = await db.query(
      "SELECT * FROM sellers ORDER BY date_added DESC"
    );
    return res.status(200).json(results);
  } catch (err) {
    console.error("❌ Error fetching sellers:", err);
    return res.status(500).json({ message: "Database error" });
  }
});

app.post("/api/sellers", async (req, res) => {
  const {
    unique_id, last_name, first_name, middle_name, shop_name,
    street, barangay, municipality, province, requirements, status
  } = req.body;

  if (!unique_id || !last_name || !first_name || !shop_name) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const query = `
      INSERT INTO sellers 
      (unique_id, last_name, first_name, middle_name, shop_name, street, 
       barangay, municipality, province, requirements, status, date_added) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    await db.query(query, [
      unique_id, last_name, first_name, middle_name, shop_name,
      street, barangay, municipality, province,
      JSON.stringify(requirements), status || "pending"
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
    const [result] = await db.query(
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
    await db.query("DELETE FROM sellers WHERE id = ?", [id]);
    return res.status(200).json({ message: "🗑️ Seller deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting seller:", err);
    return res.status(500).json({ message: "Delete error" });
  }
});

app.put("/api/sellers/:id/check-requirements", async (req, res) => {
  try {
    const sellerId = req.params.id;
    
    const [seller] = await db.query(
      "SELECT requirements, date_added, status FROM sellers WHERE id = ?",
      [sellerId]
    );
    
    if (seller.length === 0) {
      return res.status(404).json({ message: "Seller not found" });
    }
    
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
      await db.query(
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

app.put("/api/sellers/:id/requirements", async (req, res) => {
  try {
    const sellerId = req.params.id;
    const { requirements } = req.body;
    
    if (!requirements) {
      return res.status(400).json({ message: "Requirements data required" });
    }
    
    await db.query(
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
//  CATEGORY MANAGEMENT ROUTES
// =============================

app.get("/api/seller/categories", async (req, res) => {
  try {
    const { seller_id } = req.query;
    
    if (!seller_id) {
      return res.status(400).json({ message: "Seller ID required" });
    }
    
    const [rows] = await db.query(
      "SELECT id, category_name, created_at FROM fish_categories WHERE seller_id = ? ORDER BY category_name ASC",
      [seller_id]
    );

    if (rows.length === 0) {
      await initializeDefaultCategories(seller_id);
      const [newRows] = await db.query(
        "SELECT id, category_name, created_at FROM fish_categories WHERE seller_id = ? ORDER BY category_name ASC",
        [seller_id]
      );
      return res.json(newRows);
    }
    
    res.json(rows);
  } catch (err) {
    console.error("❌ Fetch Categories Error:", err);
    res.status(500).json({ message: "Server error fetching categories" });
  }
});

app.post("/api/seller/categories", async (req, res) => {
  try {
    const { category_name, seller_id } = req.body;

    if (!category_name || !seller_id) {
      return res.status(400).json({ message: "Category name and seller ID required" });
    }

    const [existing] = await db.query(
      "SELECT id FROM fish_categories WHERE category_name = ? AND seller_id = ?",
      [category_name, seller_id]
    );

    if (existing.length > 0) {
      return res.status(409).json({ message: "You already have a category with this name" });
    }

    await db.query(
      "INSERT INTO fish_categories (category_name, seller_id) VALUES (?, ?)",
      [category_name, seller_id]
    );

    res.json({ message: "Category added successfully!" });
  } catch (err) {
    console.error("❌ Add Category Error:", err);
    res.status(500).json({ message: "Server error while adding category" });
  }
});

app.delete("/api/seller/categories/:id", async (req, res) => {
  try {
    const categoryId = req.params.id;
    const { seller_id } = req.query;

    if (!seller_id) {
      return res.status(400).json({ message: "Seller ID required" });
    }

    const [category] = await db.query(
      "SELECT category_name, seller_id FROM fish_categories WHERE id = ?",
      [categoryId]
    );

    if (category.length === 0) {
      return res.status(404).json({ message: "Category not found" });
    }

    if (category[0].seller_id !== seller_id) {
      return res.status(403).json({ message: "You can only delete your own categories" });
    }

    const [productsUsing] = await db.query(
      "SELECT COUNT(*) as count FROM fish_products WHERE category = ? AND seller_id = ?",
      [category[0].category_name, seller_id]
    );

    if (productsUsing[0].count > 0) {
      return res.status(400).json({ 
        message: `Cannot delete category. ${productsUsing[0].count} product(s) are using it.` 
      });
    }

    await db.query(
      "DELETE FROM fish_categories WHERE id = ? AND seller_id = ?",
      [categoryId, seller_id]
    );

    res.json({ message: "Category deleted successfully" });
  } catch (err) {
    console.error("❌ Delete Category Error:", err);
    res.status(500).json({ message: "Server error while deleting category" });
  }
});

// =============================
//  FISH PRODUCTS ROUTES
// =============================

app.get("/api/seller/fish", async (req, res) => {
  try {
    const { seller_id } = req.query;
    let sql = "SELECT * FROM fish_products";
    const params = [];
    
    if (seller_id) {
      sql += " WHERE seller_id = ?";
      params.push(seller_id);
    }
    sql += " ORDER BY created_at DESC";
    
    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error("❌ Fetch Fish Error:", err);
    res.status(500).json({ message: "Server error fetching fish" });
  }
});

app.post("/api/seller/add-fish", upload.single("image"), async (req, res) => {
  try {
    const { name, category, unit, price, stock, seller_id } = req.body;
    const image_url = req.file ? req.file.filename : null;

    if (!name || !price || !stock || !seller_id)
      return res.status(400).json({ message: "All required fields are missing." });

    await db.query(
      "INSERT INTO fish_products (name, category, unit, price, previous_price, stock, image_url, seller_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [name, category || "Freshwater", unit || "kg", price, null, stock, image_url, seller_id]
    );

    res.json({ message: "Fish product added successfully!" });
  } catch (err) {
    console.error("❌ Add Fish Error:", err);
    res.status(500).json({ message: "Server error while adding fish product" });
  }
});

app.put("/api/seller/fish/:id", upload.single("image"), async (req, res) => {
  try {
    const fishId = req.params.id;
    const { name, category, unit, price, stock, seller_id, freshness } = req.body;
    const newImage = req.file ? req.file.filename : null;

    const [existing] = await db.query(
      "SELECT price, image_url FROM fish_products WHERE id = ?", 
      [fishId]
    );
    
    if (existing.length === 0) 
      return res.status(404).json({ message: "Fish not found." });

    const oldPrice = existing[0].price;
    const oldImage = existing[0].image_url;

    await db.query("START TRANSACTION");

    if (price !== undefined && Number(price) !== Number(oldPrice)) {
      if (!seller_id) throw new Error("Seller ID required for price history logging.");
      
      await db.query(
        "INSERT INTO price_history (product_id, seller_id, old_price, new_price) VALUES (?, ?, ?, ?)",
        [fishId, seller_id, oldPrice, price]
      );

      await db.query(
        "UPDATE fish_products SET previous_price = ? WHERE id = ?",
        [oldPrice, fishId]
      );
    }

    const fields = [];
    const params = [];
    
    if (name !== undefined) { fields.push("name = ?"); params.push(name); }
    if (category !== undefined) { fields.push("category = ?"); params.push(category); }
    if (unit !== undefined) { fields.push("unit = ?"); params.push(unit); }
    if (freshness !== undefined) { fields.push("freshness = ?"); params.push(freshness); }
    if (price !== undefined) { fields.push("price = ?"); params.push(price); }
    if (stock !== undefined) { fields.push("stock = ?"); params.push(stock); }
    if (newImage) { fields.push("image_url = ?"); params.push(newImage); }

    if (fields.length === 0) {
      await db.query("ROLLBACK");
      return res.status(400).json({ message: "No fields to update." });
    }

    params.push(fishId);
    const sql = `UPDATE fish_products SET ${fields.join(", ")} WHERE id = ?`;
    await db.query(sql, params);

    await db.query("COMMIT");
    
    if (newImage && oldImage) {
      const oldPath = path.join(UPLOAD_DIR, oldImage);
      fs.unlink(oldPath, (err) => {
        if (err) console.warn("⚠️ Could not delete old image:", err.message);
      });
    }

    res.json({ message: "Fish product updated successfully." });
  } catch (err) {
    await db.query("ROLLBACK");
    console.error("❌ Update Fish Error:", err);
    res.status(500).json({ message: "Server error while updating fish product" });
  }
});

app.delete("/api/seller/fish/:id", async (req, res) => {
  try {
    const fishId = req.params.id;
    const [rows] = await db.query(
      "SELECT image_url FROM fish_products WHERE id = ?", 
      [fishId]
    );
    
    if (rows.length === 0) 
      return res.status(404).json({ message: "Fish not found." });

    const imageFilename = rows[0].image_url;
    await db.query("DELETE FROM fish_products WHERE id = ?", [fishId]);

    if (imageFilename) {
      const p = path.join(UPLOAD_DIR, imageFilename);
      fs.unlink(p, (err) => {
        if (err) console.warn("⚠️ Could not delete image file:", err.message);
      });
    }

    res.json({ message: "Fish product deleted successfully." });
  } catch (err) {
    console.error("❌ Delete Fish Error:", err);
    res.status(500).json({ message: "Server error while deleting fish product" });
  }
});



app.put("/api/seller/fish/:id/stock", async (req, res) => {
  try {
    const fishId = req.params.id;
    const { stock } = req.body;

    if (stock === undefined || isNaN(stock)) {
      return res.status(400).json({ message: "Valid stock value is required." });
    }

    const [rows] = await db.query(
      "SELECT stock FROM fish_products WHERE id = ?",
      [fishId]
    );
    
    if (rows.length === 0) 
      return res.status(404).json({ message: "Fish not found." });

    await db.query(
      "UPDATE fish_products SET stock = ? WHERE id = ?",
      [stock, fishId]
    );

    res.json({ message: "Stock updated successfully.", stock });
  } catch (err) {
    console.error("❌ Update Stock Error:", err);
    res.status(500).json({ message: "Server error while updating stock." });
  }
});

// =============================
//  PRICE ANALYSIS ROUTES
// =============================

app.get("/api/seller/price-analysis/:productId", async (req, res) => {
  try {
    const { productId } = req.params;
    const { seller_id } = req.query;
    
    if (!productId || !seller_id) {
      return res.status(400).json({ message: "Product ID and Seller ID required" });
    }

    const [product] = await db.query(
      "SELECT name, price FROM fish_products WHERE id = ? AND seller_id = ?",
      [productId, seller_id]
    );
    
    if (product.length === 0) {
      return res.status(404).json({ message: "Product not found or access denied." });
    }

    const currentPrice = Number(product[0].price);
    const productName = product[0].name;

    const [history] = await db.query(
      `SELECT id, old_price, new_price, change_date 
        FROM price_history 
        WHERE product_id = ? AND seller_id = ? 
        ORDER BY change_date DESC`,
      [productId, seller_id]
    );
    
    const totalUpdates = history.length + 1;
    let suggestions = [];
    const canGenerateSuggestions = totalUpdates >= 3;
    
    if (canGenerateSuggestions) {
      const allPrices = [currentPrice];
      history.forEach(h => allPrices.push(Number(h.new_price)));
      
      const floorPrice = history.length > 0 ? Number(history[0].old_price) : currentPrice;
      const sum = allPrices.reduce((acc, p) => acc + p, 0);
      const averagePrice = sum / allPrices.length;
      const basePrice = Math.max(averagePrice, floorPrice);
      
      suggestions.push({
        label: "Average Based Price (Balanced)",
        price: parseFloat(basePrice.toFixed(2)),
        margin: 0
      });
      
      const margins = [
        { rate: 0.03, label: "Conservative Margin (+3%)" },
        { rate: 0.05, label: "Standard Margin (+5%)" },
        { rate: 0.07, label: "Premium Margin (+7%)" }
      ];
      
      margins.forEach(m => {
        const suggestedPrice = basePrice * (1 + m.rate);
        suggestions.push({
          label: m.label,
          price: parseFloat(suggestedPrice.toFixed(2)),
          margin: m.rate * 100
        });
      });
    }

    res.json({
      productName,
      currentPrice,
      totalUpdates,
      canGenerateSuggestions,
      history: history.map(h => ({
        id: h.id,
        old_price: Number(h.old_price),
        new_price: Number(h.new_price),
        change_date: h.change_date
      })),
      suggestions
    });

  } catch (err) {
    console.error("❌ Fetch Price Analysis Error:", err);
    res.status(500).json({ message: "Server error fetching price analysis" });
  }
});

app.put("/api/seller/fish-price/:id/accept-suggestion", async (req, res) => {
  try {
    const fishId = req.params.id;
    const { new_price, seller_id } = req.body;

    if (!new_price || isNaN(new_price) || !seller_id) {
      return res.status(400).json({ message: "Valid new price and seller ID required." });
    }

    const [existing] = await db.query(
      "SELECT price FROM fish_products WHERE id = ? AND seller_id = ?", 
      [fishId, seller_id]
    );
    
    if (existing.length === 0) 
      return res.status(404).json({ message: "Fish not found or access denied." });

    const oldPrice = existing[0].price;
    const priceToSet = Number(new_price).toFixed(2);
    
    if (Number(priceToSet) !== Number(oldPrice)) {
      await db.query(
        "INSERT INTO price_history (product_id, seller_id, old_price, new_price) VALUES (?, ?, ?, ?)",
        [fishId, seller_id, oldPrice, priceToSet]
      );
      
      await db.query(
        "UPDATE fish_products SET previous_price = ?, price = ? WHERE id = ?",
        [oldPrice, priceToSet, fishId]
      );
    }

    res.json({ message: "Price updated successfully with suggested price.", new_price: priceToSet });
  } catch (err) {
    console.error("❌ Accept Suggestion Error:", err);
    res.status(500).json({ message: "Server error while accepting price suggestion." });
  }
});

// =============================
//  SELLER PROFILE ROUTES
// =============================

app.get("/api/seller/info/:seller_id", async (req, res) => {
  const { seller_id } = req.params;
  
  try {
    const [rows] = await db.query(
      "SELECT unique_id, first_name, middle_name, last_name, shop_name, street, barangay, municipality, province FROM sellers WHERE unique_id = ?",
      [seller_id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ message: "Seller not found" });
    }
    
    res.json(rows[0]);
  } catch (err) {
    console.error("Error fetching seller info:", err);
    res.status(500).json({ message: "Error fetching seller information" });
  }
});

app.get("/api/seller/profile/:seller_id", async (req, res) => {
  const { seller_id } = req.params;
  
  try {
    const [rows] = await db.query(
      "SELECT logo, qr FROM seller_profiles WHERE seller_id = ?",
      [seller_id]
    );
    
    if (rows.length === 0)
      return res.json({ logo: "", qr: "" });
    
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching profile" });
  }
});

app.post("/api/seller/upload-logo/:seller_id", upload.single("logo"), async (req, res) => {
  const { seller_id } = req.params;
  
  if (!req.file)
    return res.status(400).json({ message: "No logo uploaded" });

  const filePath = "/uploads/" + req.file.filename;

  try {
    await db.query(
      `INSERT INTO seller_profiles (seller_id, logo) 
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE logo = VALUES(logo)`,
      [seller_id, filePath]
    );
    
    res.json({ message: "Logo uploaded successfully", logo: filePath });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error uploading logo" });
  }
});

app.post("/api/seller/upload-qr/:seller_id", upload.single("qr"), async (req, res) => {
  const { seller_id } = req.params;
  
  if (!req.file)
    return res.status(400).json({ message: "No QR uploaded" });

  const filePath = "/uploads/" + req.file.filename;

  try {
    await db.query(
      `INSERT INTO seller_profiles (seller_id, qr) 
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE qr = VALUES(qr)`,
      [seller_id, filePath]
    );
    
    res.json({ message: "QR uploaded successfully", qr: filePath });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error uploading QR" });
  }
});

app.put("/api/seller/update-info/:seller_id", async (req, res) => {
  try {
    const { seller_id } = req.params;
    const { 
      first_name, middle_name, last_name, shop_name, 
      street, barangay, municipality, province 
    } = req.body;

    const [existing] = await db.query(
      "SELECT unique_id FROM sellers WHERE unique_id = ?",
      [seller_id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ message: "Seller not found." });
    }

    const fields = [];
    const params = [];

    if (first_name !== undefined) { fields.push("first_name = ?"); params.push(first_name); }
    if (middle_name !== undefined) { fields.push("middle_name = ?"); params.push(middle_name); }
    if (last_name !== undefined) { fields.push("last_name = ?"); params.push(last_name); }
    if (shop_name !== undefined) { fields.push("shop_name = ?"); params.push(shop_name); }
    if (street !== undefined) { fields.push("street = ?"); params.push(street); }
    if (barangay !== undefined) { fields.push("barangay = ?"); params.push(barangay); }
    if (municipality !== undefined) { fields.push("municipality = ?"); params.push(municipality); }
    if (province !== undefined) { fields.push("province = ?"); params.push(province); }

    if (fields.length === 0) {
      return res.status(400).json({ message: "No fields to update." });
    }

    params.push(seller_id);
    const sql = `UPDATE sellers SET ${fields.join(", ")} WHERE unique_id = ?`;
    
    const [result] = await db.query(sql, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Failed to update seller information." });
    }

    res.json({ 
      message: "Seller information updated successfully.",
      updated_fields: fields.length
    });
  } catch (err) {
    console.error("❌ Update Seller Info Error:", err);
    res.status(500).json({ message: "Server error while updating seller information." });
  }
});

// =============================
//  ORDERS ROUTES
// =============================

app.post("/api/upload-payment-proof", upload.single("proof"), async (req, res) => {
  try {
    const { customer_name, customer_contact } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ message: "No proof of payment uploaded" });
    }

    if (!customer_name || !customer_contact) {
      return res.status(400).json({ message: "Customer information required" });
    }

    const filePath = "/uploads/" + req.file.filename;

    console.log("✅ Proof of payment uploaded:", {
      customer: customer_name,
      contact: customer_contact,
      file: filePath
    });

    res.json({ 
      message: "Proof of payment uploaded successfully", 
      proof_path: filePath 
    });
  } catch (err) {
    console.error("❌ Upload Proof Error:", err);
    res.status(500).json({ message: "Error uploading proof of payment" });
  }
});

app.post("/api/orders", async (req, res) => {
  const { customer, cart, payment_mode, proof_of_payment, paid, buyer_id } = req.body;

  if (!customer || !cart || !Array.isArray(cart) || cart.length === 0) {
    return res.status(400).json({ message: "Invalid order data." });
  }

  if (!proof_of_payment) {
    return res.status(400).json({ message: "Proof of payment is required." });
  }

  if (!buyer_id) {
    return res.status(400).json({ message: "Buyer ID is required." });
  }

  try {
    const [buyerInfo] = await db.query(
      "SELECT first_name, last_name, contact FROM buyer_authentication WHERE id = ?",
      [buyer_id]
    );

    if (buyerInfo.length === 0) {
      return res.status(400).json({ message: "Invalid buyer ID." });
    }

    const notificationCustomerId = (
      buyerInfo[0].first_name + 
      buyerInfo[0].last_name + 
      buyerInfo[0].contact
    ).replace(/\s/g, "");

    console.log(`📦 Creating order for buyer_id: ${buyer_id}`);
    console.log(`📍 Notification ID: ${notificationCustomerId}`);
    
    // ✅ Extract delivery location from customer object
    const deliveryLat = customer.delivery_latitude || null;
    const deliveryLng = customer.delivery_longitude || null;
    const distanceKm = customer.distance_km || null;
    
    console.log(`📍 Location data:`, { deliveryLat, deliveryLng, distanceKm });

    const ordersBySeller = {};
    for (const item of cart) {
      const { id, quantity, price, seller_id, name } = item;
      
      if (!seller_id) {
        return res.status(400).json({ 
          message: `Item ${name} (ID: ${id}) is missing a seller_id.` 
        });
      }
      
      const itemTotal = parseFloat(price) * parseInt(quantity);

      if (!ordersBySeller[seller_id]) {
        ordersBySeller[seller_id] = {
          seller_id,
          items: [],
          subtotal: 0,
        };
      }
      ordersBySeller[seller_id].items.push(item);
      ordersBySeller[seller_id].subtotal += itemTotal;
    }
    
    const insertedOrderIds = [];

    await db.query("START TRANSACTION");

    for (const sellerOrder of Object.values(ordersBySeller)) {
      // ✅ Updated INSERT with location fields
      const [orderResult] = await db.query(
        `INSERT INTO orders 
        (seller_id, customer_name, address, contact, notes, total, payment_mode, paid, proof_of_payment, customer_id, delivery_latitude, delivery_longitude, distance_km)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          sellerOrder.seller_id,
          customer.name,
          customer.address,
          customer.contact,
          customer.notes || "",
          sellerOrder.subtotal,
          payment_mode || "Gcash QR",
          paid ? 1 : 0,
          proof_of_payment,
          notificationCustomerId,
          deliveryLat,      // ✅ Added
          deliveryLng,      // ✅ Added
          distanceKm        // ✅ Added
        ]
      );

      const orderId = orderResult.insertId;
      insertedOrderIds.push(orderId);

      for (const item of sellerOrder.items) {
        await db.query(
          "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)",
          [orderId, item.id, item.quantity, item.price]
        );

        const [prod] = await db.query(
          "SELECT stock FROM fish_products WHERE id = ?", 
          [item.id]
        );
        
        if (prod.length === 0) {
          throw new Error(`Product ID ${item.id} not found for stock check`);
        }

        const newStock = prod[0].stock - item.quantity;
        if (newStock < 0) {
          throw new Error(`Not enough stock for product ${item.id}`);
        }

        await db.query(
          "UPDATE fish_products SET stock = ? WHERE id = ?", 
          [newStock, item.id]
        );
      }
      
      const message = `You have a new order (#${orderId}) from ${customer.name}.`;
      await db.query(
        "INSERT INTO seller_notifications (seller_id, message, type) VALUES (?, ?, ?)",
        [sellerOrder.seller_id, message, 'order']
      );
      
      console.log(`✅ Order ${orderId} created for seller: ${sellerOrder.seller_id}`);
    }

    await db.query("COMMIT");

    return res.json({
      message: `${Object.keys(ordersBySeller).length} order(s) placed successfully! Your proof of payment has been received.`,
      orderIds: insertedOrderIds,
      date: new Date().toLocaleString()
    });

  } catch (err) {
    await db.query("ROLLBACK");
    console.error("❌ Place Order Error:", err.message);
    return res.status(500).json({ 
      message: err.message.startsWith("Not enough stock") ? err.message : "Server error while processing order." 
    });
  }
});

app.get("/api/orders", async (req, res) => {
  const sellerId = req.query.seller_id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  if (!sellerId) {
    return res.status(400).json({ error: "seller_id is required" });
  }

  const sql = `
    SELECT 
      o.id AS order_id,
      o.customer_name,
      o.address,
      o.contact,
      o.notes,
      o.total,
      o.payment_mode,
      o.paid,
      o.proof_of_payment,
      o.order_date,
      o.status,
      o.delivery_latitude,
      o.delivery_longitude,
      o.distance_km,
      oi.id AS item_id,
      oi.product_id,
      oi.quantity,
      oi.price,
      f.name AS product_name
    FROM orders o
    LEFT JOIN order_items oi ON o.id = oi.order_id
    LEFT JOIN fish_products f ON oi.product_id = f.id
    WHERE o.seller_id = ? 
    ORDER BY o.id DESC
    LIMIT ? OFFSET ?
  `;

  const countSql = `SELECT COUNT(DISTINCT o.id) as total FROM orders o WHERE o.seller_id = ?`;

  try {
    const [result] = await db.query(sql, [sellerId, limit, offset]);
    const [countResult] = await db.query(countSql, [sellerId]);
    
    const ordersMap = {};

    result.forEach(row => {
      if (!ordersMap[row.order_id]) {
        ordersMap[row.order_id] = {
          orderId: row.order_id,
          customerName: row.customer_name,
          address: row.address,
          contact: row.contact,
          notes: row.notes,
          total: row.total,
          paymentMode: row.payment_mode,
          paid: row.paid,
          proofOfPayment: row.proof_of_payment,
          orderDate: row.order_date,
          status: row.status,
          delivery_latitude: row.delivery_latitude,
          delivery_longitude: row.delivery_longitude,
          distance_km: row.distance_km,
          items: []
        };
      }

      if (row.item_id) {
        ordersMap[row.order_id].items.push({
          itemId: row.item_id,
          productId: row.product_id,
          productName: row.product_name || "Unknown Product",
          quantity: row.quantity,
          price: row.price
        });
      }
    });

    const orders = Object.values(ordersMap);
    const totalOrders = countResult[0].total;
    const totalPages = Math.ceil(totalOrders / limit);

    res.json({
      orders,
      pagination: {
        currentPage: page,
        totalPages,
        totalOrders,
        limit
      }
    });
  } catch (err) {
    console.error("❌ Fetch Orders Error:", err);
    res.status(500).json({ message: "Server error fetching orders" });
  }
});

app.put("/api/orders/:id/status", async (req, res) => {
  const orderId = req.params.id;
  const { status, seller_id } = req.body;

  if (!status || !seller_id) {
    return res.status(400).json({ message: "Status and seller_id are required" });
  }

  const allowedStatuses = ["Pending", "Preparing", "Ready for Pickup", "Completed", "Cancelled"];
  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ message: "Invalid status value" });
  }

  try {
    const [orderDetails] = await db.query(
      "SELECT customer_id FROM orders WHERE id = ? AND seller_id = ?",
      [orderId, seller_id]
    );

    if (orderDetails.length === 0) {
      return res.status(404).json({ message: "Order not found or access denied." });
    }

    const storedCustomerId = orderDetails[0].customer_id;

    const [result] = await db.query(
      "UPDATE orders SET status = ? WHERE id = ? AND seller_id = ?",
      [status, orderId, seller_id]
    );

    if (result.affectedRows === 0) {
      return res.status(403).json({ message: "Failed to update order status." });
    }
    
    if (storedCustomerId) {
      const notificationMessage = `Your order #${orderId} status has been updated to: ${status}`;
      
      await db.query(
        `INSERT INTO buyer_notifications (customer_id, order_id, seller_id, message) 
         VALUES (?, ?, ?, ?)`,
        [storedCustomerId, orderId, seller_id, notificationMessage]
      );
      
      console.log(`✅ Notification created for customer: ${storedCustomerId}, Order: ${orderId}`);
    }

    res.json({ 
      message: `Order ${orderId} status updated to ${status}.`,
      notification_sent: !!storedCustomerId
    });
  } catch (err) {
    console.error("❌ Update Order Status Error:", err);
    res.status(500).json({ message: "Server error while updating order status." });
  }
});

// =============================
//  NOTIFICATION ROUTES
// =============================

app.get("/api/seller/notifications", async (req, res) => {
  const { seller_id, is_read } = req.query;

  if (!seller_id) {
    return res.status(400).json({ message: "Seller ID is required." });
  }

  let sql = "SELECT * FROM seller_notifications WHERE seller_id = ?";
  const params = [seller_id];

  if (is_read !== undefined) {
    sql += " AND is_read = ?";
    params.push(is_read === 'true' || is_read === '1' ? 1 : 0);
  }
  
  sql += " ORDER BY created_at DESC";

  try {
    const [notifications] = await db.query(sql, params);
    res.json(notifications);
  } catch (err) {
    console.error("❌ Fetch Notifications Error:", err);
    res.status(500).json({ message: "Server error fetching notifications." });
  }
});

app.put("/api/seller/notifications/:id/read", async (req, res) => {
  const notificationId = req.params.id;
  const { seller_id } = req.body;

  if (!seller_id) {
    return res.status(400).json({ message: "Seller ID is required." });
  }

  try {
    const [result] = await db.query(
      "UPDATE seller_notifications SET is_read = 1 WHERE id = ? AND seller_id = ?",
      [notificationId, seller_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Notification not found or access denied." });
    }

    res.json({ message: "Notification marked as read." });
  } catch (err) {
    console.error("❌ Mark Notification Read Error:", err);
    res.status(500).json({ message: "Server error marking notification as read." });
  }
});

app.get("/api/buyer/:customerId/notifications", async (req, res) => {
  const { customerId: numericalCustomerId } = req.params;

  console.log(`📬 Fetching notifications for buyer_id: ${numericalCustomerId}`);

  try {
    const [buyer] = await db.query(
      "SELECT first_name, last_name, contact FROM buyer_authentication WHERE id = ?",
      [numericalCustomerId]
    );
    
    if (buyer.length === 0) {
      console.log(`❌ Buyer not found with ID: ${numericalCustomerId}`);
      return res.status(404).json({ 
        message: "Buyer not found.",
        count: 0,
        notifications: [] 
      });
    }

    const notificationIdString = (
      buyer[0].first_name + 
      buyer[0].last_name + 
      buyer[0].contact
    ).replace(/\s/g, "");

    console.log(`✅ Looking for notifications with customer_id: ${notificationIdString}`);

    const notifSql = `
      SELECT 
        bn.id, 
        bn.order_id, 
        bn.seller_id,
        bn.message, 
        bn.is_read, 
        bn.created_at,
        s.shop_name
      FROM buyer_notifications bn
      LEFT JOIN sellers s ON bn.seller_id = s.unique_id
      WHERE bn.customer_id = ? 
      ORDER BY bn.created_at DESC
      LIMIT 50
    `;

    const [notifications] = await db.query(notifSql, [notificationIdString]);

    console.log(`📊 Found ${notifications.length} notifications for: ${notificationIdString}`);

    let unreadCount = 0;
    const finalNotifications = notifications.map(n => {
      const isRead = n.is_read === 1; 
      
      if (!isRead) unreadCount++; 
      
      return {
        id: n.id,
        order_id: n.order_id,
        message: n.message || `Order #${n.order_id} update.`, 
        shop_name: n.shop_name || 'Unknown Shop',
        is_read: isRead,
        created_at: n.created_at
      };
    });

    console.log(`✅ Returning ${finalNotifications.length} notifications, ${unreadCount} unread`);

    res.json({
      count: unreadCount,
      notifications: finalNotifications
    });
  } catch (err) {
    console.error("❌ Fetch Notifications Error:", err);
    res.status(500).json({ 
      message: "Server error while fetching notifications.",
      error: err.message,
      count: 0,
      notifications: []
    });
  }
});

app.put("/api/buyer/notifications/:id/read", async (req, res) => {
  const notificationId = req.params.id;
  const { buyer_id } = req.body;

  console.log(`📌 Mark as read request - Notification ID: ${notificationId}, Buyer ID: ${buyer_id}`);
  console.log(`📌 Notification ID type: ${typeof notificationId}`);
  console.log(`📌 Buyer ID type: ${typeof buyer_id}`);

  if (!buyer_id) {
    return res.status(400).json({ message: "Buyer ID required for verification." });
  }

  try {
    // Get buyer info to construct notification ID
    const [buyer] = await db.query(
      "SELECT first_name, last_name, contact FROM buyer_authentication WHERE id = ?",
      [buyer_id]
    );
    
    console.log(`📌 Buyer query result:`, buyer);
    
    if (buyer.length === 0) {
      console.log(`❌ Invalid buyer ID: ${buyer_id}`);
      return res.status(404).json({ message: "Invalid buyer ID." });
    }

    const notificationIdString = (
      buyer[0].first_name + 
      buyer[0].last_name + 
      buyer[0].contact
    ).replace(/\s/g, "");

    console.log(`🔍 Constructed notification ID: ${notificationIdString}`);

    // First, let's check if the notification exists
    const [checkNotif] = await db.query(
      "SELECT * FROM buyer_notifications WHERE id = ?",
      [notificationId]
    );
    
    console.log(`🔍 Notification exists check:`, checkNotif);

    if (checkNotif.length === 0) {
      console.log(`❌ No notification found with ID ${notificationId}`);
      return res.status(404).json({ 
        message: `Notification with ID ${notificationId} does not exist.` 
      });
    }

    console.log(`🔍 Notification customer_id from DB: ${checkNotif[0].customer_id}`);
    console.log(`🔍 Expected customer_id: ${notificationIdString}`);
    console.log(`🔍 Do they match? ${checkNotif[0].customer_id === notificationIdString}`);

    // Update the notification
    const [result] = await db.query(
      "UPDATE buyer_notifications SET is_read = 1 WHERE id = ? AND customer_id = ?",
      [notificationId, notificationIdString]
    );

    console.log(`📊 Update result - affectedRows: ${result.affectedRows}`);

    if (result.affectedRows === 0) {
      console.log(`❌ No notification found with ID ${notificationId} for customer ${notificationIdString}`);
      return res.status(404).json({ 
        message: "Notification not found or does not belong to this customer.",
        debug: {
          notificationId,
          expectedCustomerId: notificationIdString,
          actualCustomerId: checkNotif[0].customer_id
        }
      });
    }

    console.log(`✅ Notification ${notificationId} marked as read successfully`);

    res.json({ 
      message: `Notification ${notificationId} marked as read.`,
      success: true
    });
  } catch (err) {
    console.error("❌ Mark Read Error:", err);
    res.status(500).json({ 
      message: "Server error while marking notification as read.",
      error: err.message
    });
  }
});

app.put("/api/buyer/:customerId/notifications/read-all", async (req, res) => {
  const { customerId: numericalCustomerId } = req.params;

  console.log(`📌 Mark all as read request for buyer ID: ${numericalCustomerId}`);

  try {
    const [buyer] = await db.query(
      "SELECT first_name, last_name, contact FROM buyer_authentication WHERE id = ?",
      [numericalCustomerId]
    );
    
    if (buyer.length === 0) {
      console.log(`❌ Invalid buyer ID: ${numericalCustomerId}`);
      return res.status(404).json({ message: "Invalid buyer ID." });
    }

    const notificationIdString = (
      buyer[0].first_name + 
      buyer[0].last_name + 
      buyer[0].contact
    ).replace(/\s/g, "");

    console.log(`🔍 Constructed notification ID: ${notificationIdString}`);

    const [result] = await db.query(
      "UPDATE buyer_notifications SET is_read = 1 WHERE customer_id = ? AND is_read = 0",
      [notificationIdString]
    );

    console.log(`✅ Marked ${result.affectedRows} notifications as read for: ${notificationIdString}`);

    res.json({ 
      message: "All notifications marked as read.",
      updated_count: result.affectedRows,
      success: true
    });
  } catch (err) {
    console.error("❌ Mark All Read Error:", err);
    res.status(500).json({ 
      message: "Server error while marking all notifications as read.",
      error: err.message
    });
  }
});

// =============================
//  STORE HOURS ROUTES
// =============================

app.get("/api/seller/store-hours/:seller_id", async (req, res) => {
  const { seller_id } = req.params;
  
  try {
    const [hours] = await db.query(
      `SELECT day_of_week, is_open, open_time, close_time 
       FROM store_hours 
       WHERE seller_id = ? 
       ORDER BY FIELD(day_of_week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')`,
      [seller_id]
    );
    
    // If no hours set, return default hours (closed all days)
    if (hours.length === 0) {
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      return res.json(days.map(day => ({
        day_of_week: day,
        is_open: false,
        open_time: '09:00:00',
        close_time: '17:00:00'
      })));
    }
    
    res.json(hours);
  } catch (err) {
    console.error("Error fetching store hours:", err);
    res.status(500).json({ message: "Error fetching store hours" });
  }
});

app.post("/api/seller/store-hours/:seller_id", async (req, res) => {
  const { seller_id } = req.params;
  const { hours } = req.body;
  
  if (!hours || !Array.isArray(hours)) {
    return res.status(400).json({ message: "Hours data is required" });
  }
  
  try {
    await db.query("START TRANSACTION");
    
    // Delete existing hours for this seller
    await db.query("DELETE FROM store_hours WHERE seller_id = ?", [seller_id]);
    
    // Insert new hours
    for (const hour of hours) {
      await db.query(
        `INSERT INTO store_hours (seller_id, day_of_week, is_open, open_time, close_time) 
         VALUES (?, ?, ?, ?, ?)`,
        [seller_id, hour.day_of_week, hour.is_open ? 1 : 0, hour.open_time, hour.close_time]
      );
    }
    
    await db.query("COMMIT");
    
    res.json({ message: "Store hours updated successfully" });
  } catch (err) {
    await db.query("ROLLBACK");
    console.error("Error updating store hours:", err);
    res.status(500).json({ message: "Error updating store hours" });
  }
});

// =============================
//  STORE HOURS ROUTES (Global)
// =============================

app.get("/api/store-hours/global", async (req, res) => {
  try {
    // Get any seller's hours (since it's global for all)
    const [hours] = await db.query(
      `SELECT day_of_week, is_open, open_time, close_time 
       FROM store_hours 
       LIMIT 7`
    );
    
    // If no hours set, return default hours (7 AM - 10 PM, all days open)
    if (hours.length === 0) {
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      return res.json(days.map(day => ({
        day_of_week: day,
        is_open: true,
        open_time: '07:00:00',
        close_time: '22:00:00'
      })));
    }
    
    res.json(hours);
  } catch (err) {
    console.error("Error fetching global store hours:", err);
    res.status(500).json({ message: "Error fetching store hours" });
  }
});

// =============================
//  BUYER PROFILE ROUTES
// =============================

app.get("/api/buyer/profile/:buyer_id", async (req, res) => {
  const { buyer_id } = req.params;
  
  if (!buyer_id) {
    return res.status(400).json({ message: "Buyer ID is required." });
  }

  try {
    console.log("🔍 Fetching profile for buyer_id:", buyer_id);
    
    const sql = `
      SELECT 
        id, email, contact, last_name, first_name, middle_name, username, created_at
      FROM buyer_authentication 
      WHERE id = ?
    `;
    
    const [results] = await db.query(sql, [buyer_id]);
    
    if (results.length === 0) {
      console.log("❌ Buyer not found with ID:", buyer_id);
      return res.status(404).json({ message: "Buyer not found." });
    }

    const buyer = results[0];
    console.log("✅ Profile found:", buyer.email);
    
    return res.status(200).json({
      id: buyer.id,
      email: buyer.email,
      contact: buyer.contact,
      last_name: buyer.last_name,
      first_name: buyer.first_name,
      middle_name: buyer.middle_name,
      username: buyer.username,
      created_at: buyer.created_at
    });
    
  } catch (err) {
    console.error("❌ Error fetching buyer profile:", err);
    return res.status(500).json({ 
      message: "Server error fetching profile.",
      error: err.message 
    });
  }
});

app.put("/api/buyer/profile/:buyer_id", async (req, res) => {
  const { buyer_id } = req.params;
  const { username, email, contact, first_name, middle_name, last_name } = req.body;
  
  if (!buyer_id) {
    return res.status(400).json({ message: "Buyer ID is required." });
  }

  const missing = validateRequiredFields(
    { username, email, contact, first_name, last_name },
    ["username", "email", "contact", "first_name", "last_name"]
  );

  if (missing) {
    return res.status(400).json({ 
      message: "Please fill in all required fields.",
      missing_fields: missing 
    });
  }

  try {
    console.log("🔍 Updating profile for buyer_id:", buyer_id);
    
    const checkSql = `
      SELECT id FROM buyer_authentication 
      WHERE (username = ? OR email = ?) AND id != ?
    `;
    
    const [existing] = await db.query(checkSql, [username, email, buyer_id]);
    
    if (existing.length > 0) {
      return res.status(400).json({ message: "Username or email already exists." });
    }

    const updateSql = `
      UPDATE buyer_authentication 
      SET username = ?, email = ?, contact = ?, first_name = ?, middle_name = ?, last_name = ?
      WHERE id = ?
    `;
    
    const [result] = await db.query(
      updateSql, 
      [username, email, contact, first_name, middle_name || null, last_name, buyer_id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Buyer not found." });
    }

    console.log("✅ Profile updated successfully");
    
    const selectSql = `
      SELECT id, email, contact, last_name, first_name, middle_name, username, created_at
      FROM buyer_authentication 
      WHERE id = ?
    `;
    
    const [updated] = await db.query(selectSql, [buyer_id]);
    
    return res.status(200).json({
      message: "Profile updated successfully!",
      buyer: updated[0]
    });
    
  } catch (err) {
    console.error("❌ Error updating buyer profile:", err);
    
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ message: "Username or email already exists." });
    }
    
    return res.status(500).json({ 
      message: "Server error updating profile.",
      error: err.message 
    });
  }
});

// =============================
//  BUYER PURCHASE HISTORY ROUTES
// =============================

app.get("/api/buyer/purchases", async (req, res) => {
  const { buyer_id } = req.query;

  if (!buyer_id) {
    return res.status(400).json({ message: "Buyer ID is required." });
  }

  try {
    const [buyer] = await db.query(
      "SELECT first_name, last_name, contact FROM buyer_authentication WHERE id = ?",
      [buyer_id]
    );

    if (buyer.length === 0) {
      return res.status(404).json({ message: "Buyer not found." });
    }

    const notificationCustomerId = (
      buyer[0].first_name + 
      buyer[0].last_name + 
      buyer[0].contact
    ).replace(/\s/g, "");

    console.log(`🔍 Searching for purchases using customer_id: ${notificationCustomerId}`);

    // ✅ Fixed query - removes duplicate joins and uses DISTINCT
    const sql = `
      SELECT DISTINCT
        oi.id AS purchase_id,
        oi.product_id,
        fp.name AS product_name,
        oi.price,
        oi.quantity,
        o.order_date AS created_at,
        o.id AS order_id,
        CONCAT('ORD-', LPAD(o.id, 6, '0')) AS order_number,
        o.status,
        fp.image_url,
        fp.freshness,
        fp.previous_price,
        0 AS rating
      FROM orders o
      INNER JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN fish_products fp ON oi.product_id = fp.id
      WHERE o.customer_id = ?
      ORDER BY o.order_date DESC, oi.id ASC
      LIMIT 10
    `;

    const [results] = await db.query(sql, [notificationCustomerId]);
    
    console.log(`✅ Found ${results.length} purchases`);
    
    return res.status(200).json(results);
  } catch (err) {
    console.error("❌ Error fetching purchases:", err);
    return res.status(500).json({ 
      message: "Server error fetching purchases.",
      error: err.message 
    });
  }
});

app.get("/api/buyer/orders", async (req, res) => {
  const { buyer_id } = req.query;

  if (!buyer_id) {
    return res.status(400).json({ message: "Buyer ID is required." });
  }

  try {
    const [buyer] = await db.query(
      "SELECT first_name, last_name, contact FROM buyer_authentication WHERE id = ?",
      [buyer_id]
    );

    if (buyer.length === 0) {
      return res.status(404).json({ message: "Buyer not found." });
    }

    const notificationCustomerId = (
      buyer[0].first_name + 
      buyer[0].last_name + 
      buyer[0].contact
    ).replace(/\s/g, "");

    console.log(`🔍 Searching for orders using customer_id: ${notificationCustomerId}`);

    const sql = `
      SELECT 
        o.id,
        CONCAT('ORD-', LPAD(o.id, 6, '0')) AS order_number,
        o.total AS total_amount,
        o.status,
        o.payment_mode AS payment_status,
        o.order_date AS created_at,
        s.shop_name,
        COUNT(oi.id) AS item_count
      FROM orders o
      LEFT JOIN sellers s ON o.seller_id = s.unique_id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.customer_id = ?
      GROUP BY o.id
      ORDER BY o.order_date DESC
    `;

    const [results] = await db.query(sql, [notificationCustomerId]);
    
    console.log(`✅ Found ${results.length} orders`);
    
    return res.status(200).json(results);
  } catch (err) {
    console.error("Error fetching orders:", err);
    return res.status(500).json({ 
      message: "Server error fetching orders.",
      error: err.message 
    });
  }
});

app.get("/api/buyer/orders/:orderId", async (req, res) => {
  const { orderId } = req.params;
  const { buyer_id } = req.query;

  if (!buyer_id) {
    return res.status(400).json({ message: "Buyer ID is required." });
  }

  try {
    const [buyer] = await db.query(
      "SELECT first_name, last_name, contact FROM buyer_authentication WHERE id = ?",
      [buyer_id]
    );

    if (buyer.length === 0) {
      return res.status(404).json({ message: "Buyer not found." });
    }

    const notificationCustomerId = (
      buyer[0].first_name + 
      buyer[0].last_name + 
      buyer[0].contact
    ).replace(/\s/g, "");

    const orderSql = `
      SELECT 
        o.*,
        s.shop_name
      FROM orders o
      LEFT JOIN sellers s ON o.seller_id = s.unique_id
      WHERE o.id = ? AND o.customer_id = ?
    `;

    const [orders] = await db.query(orderSql, [orderId, notificationCustomerId]);

    if (orders.length === 0) {
      return res.status(404).json({ message: "Order not found." });
    }

    const itemsSql = `
      SELECT 
        oi.*,
        fp.name AS product_name,
        fp.image_url
      FROM order_items oi
      LEFT JOIN fish_products fp ON oi.product_id = fp.id
      WHERE oi.order_id = ?
    `;

    const [items] = await db.query(itemsSql, [orderId]);

    return res.status(200).json({
      order: orders[0],
      items: items
    });
  } catch (err) {
    console.error("Error fetching order details:", err);
    return res.status(500).json({ 
      message: "Server error fetching order details.",
      error: err.message 
    });
  }
});

// =============================
//  BUYER CART ROUTES
// =============================

app.post("/api/buyer/cart", async (req, res) => {
  const { buyer_id, product_id, quantity } = req.body;
  
  if (!buyer_id || !product_id || !quantity) {
    return res.status(400).json({ 
      message: "buyer_id, product_id, and quantity are required." 
    });
  }

  try {
    const sql = `
      INSERT INTO buyer_cart (buyer_id, product_id, quantity)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)
    `;

    await db.query(sql, [buyer_id, product_id, quantity]);
    
    return res.status(200).json({ message: "Item added to cart successfully." });
  } catch (err) {
    console.error("Error adding to cart:", err);
    return res.status(500).json({ message: "Server error adding to cart." });
  }
});

app.get("/api/buyer/cart/:buyer_id", async (req, res) => {
  const { buyer_id } = req.params;

  try {
    const sql = `
      SELECT 
        c.id AS cart_id, 
        fp.id AS product_id,
        fp.name AS product_name, 
        fp.price, 
        c.quantity, 
        fp.image_url,
        fp.stock,
        fp.category,
        fp.unit,
        fp.seller_id
      FROM buyer_cart c
      JOIN fish_products fp ON c.product_id = fp.id
      WHERE c.buyer_id = ?
    `;

    const [results] = await db.query(sql, [buyer_id]);
    return res.status(200).json(results);
  } catch (err) {
    console.error("Error fetching cart:", err);
    return res.status(500).json({ message: "Server error fetching cart." });
  }
});

// =============================
//  SHOP & PRODUCT ROUTES
// =============================

app.get("/api/shop", async (req, res) => {
  try {
    const sellerSql = `
      SELECT s.unique_id, s.shop_name, sp.logo
      FROM sellers s
      LEFT JOIN seller_profiles sp ON s.unique_id = sp.seller_id
      WHERE s.status = 'accepted'
    `;
    
    const [sellers] = await db.query(sellerSql);

    if (!sellers || sellers.length === 0) {
      return res.json([]);
    }

    const [products] = await db.query("SELECT * FROM fish_products");

    const shopMap = {};
    
    sellers.forEach((seller) => {
      shopMap[seller.unique_id] = { 
        seller_id: seller.unique_id, 
        shop_name: seller.shop_name, 
        logo: seller.logo,
        products: [] 
      };
    });

    products.forEach((product) => {
      if (shopMap[product.seller_id]) {
        shopMap[product.seller_id].products.push(product);
      }
    });

    res.json(Object.values(shopMap));
  } catch (err) {
    console.error("Error fetching shops:", err);
    res.status(500).json({ message: "Server error while fetching shops." });
  }
});

app.get("/api/shop/:shopId/products", async (req, res) => {
  const { shopId } = req.params;

  try {
    const checkSql = `
      SELECT shop_name 
      FROM sellers 
      WHERE unique_id = ? AND status = 'accepted'
    `;
    
    const [sellers] = await db.query(checkSql, [shopId]);

    if (sellers.length === 0) {
      return res.status(404).json({ message: "Shop not found or not active." });
    }

    const productSql = "SELECT * FROM fish_products WHERE seller_id = ?";
    const [products] = await db.query(productSql, [shopId]);

    return res.status(200).json({ 
      shop_name: sellers[0].shop_name,
      products: products 
    });
  } catch (err) {
    console.error(`Error fetching products for shop ${shopId}:`, err);
    return res.status(500).json({ message: "Server error while fetching products." });
  }
});

app.get("/api/products/by-category", async (req, res) => {
  try {
    const { category } = req.query;
    
    if (!category) {
      return res.status(400).json({ message: "Category is required" });
    }

    const sql = `
      SELECT 
        fp.*,
        s.shop_name
      FROM fish_products fp
      LEFT JOIN sellers s ON fp.seller_id = s.unique_id
      WHERE fp.category = ? AND fp.stock > 0
      ORDER BY fp.created_at DESC
    `;
    
    const [rows] = await db.query(sql, [category]);
    res.json(rows);
  } catch (err) {
    console.error("❌ Fetch Products by Category Error:", err);
    res.status(500).json({ message: "Server error fetching products" });
  }
});

app.get("/api/products/best-sellers", async (req, res) => {
  try {
    const sql = `
      SELECT 
        fp.id,
        fp.name,
        fp.category,
        fp.price,
        fp.stock,
        fp.unit,
        fp.image_url,
        fp.seller_id,
        fp.freshness,
        s.shop_name,
        fp.previous_price,
        COALESCE(SUM(CASE WHEN o.status = 'Completed' THEN oi.quantity ELSE 0 END), 0) AS total_sold
      FROM fish_products fp
      LEFT JOIN sellers s ON fp.seller_id = s.unique_id
      LEFT JOIN order_items oi ON fp.id = oi.product_id
      LEFT JOIN orders o ON oi.order_id = o.id
      WHERE s.status = 'accepted' AND fp.stock > 0
      GROUP BY fp.id, fp.name, fp.category, fp.price, fp.stock, fp.unit, 
              fp.image_url, fp.seller_id, fp.freshness, s.shop_name, fp.previous_price
      HAVING total_sold > 0
      ORDER BY total_sold DESC
      LIMIT 4
    `;
    
    const [products] = await db.query(sql);
    
    // If no best sellers, get random recommended products
    if (products.length === 0) {
      const recommendedSql = `
        SELECT 
          fp.id,
          fp.name,
          fp.category,
          fp.price,
          fp.stock,
          fp.unit,
          fp.image_url,
          fp.seller_id,
          fp.freshness,
          s.shop_name,
          fp.previous_price,
          0 AS total_sold
        FROM fish_products fp
        LEFT JOIN sellers s ON fp.seller_id = s.unique_id
        WHERE s.status = 'accepted' AND fp.stock > 0
        ORDER BY RAND()
        LIMIT 4
      `;
      const [recommended] = await db.query(recommendedSql);
      return res.status(200).json(recommended || []);
    }
    
    return res.status(200).json(products);
  } catch (err) {
    console.error("Error fetching best sellers:", err);
    return res.status(500).json({ 
      message: "Server error fetching best sellers.",
      error: err.message 
    });
  }
});

app.post("/api/products/details", async (req, res) => {
  const { product_ids } = req.body;

  if (!product_ids || !Array.isArray(product_ids) || product_ids.length === 0) {
    return res.status(400).json({ message: "product_ids array is required." });
  }

  try {
    const placeholders = product_ids.map(() => '?').join(',');
    const sql = `
      SELECT id, name, category, price, stock, unit, seller_id, image_url
      FROM fish_products 
      WHERE id IN (${placeholders})
    `;
    
    const [products] = await db.query(sql, product_ids);

    return res.status(200).json(products);
  } catch (err) {
    console.error("Error fetching product details:", err);
    return res.status(500).json({ message: "Server error fetching product details." });
  }
});

app.post("/api/products/search-suggestions", async (req, res) => {
  const { searchTerm } = req.body;

  if (!searchTerm || searchTerm.trim().length < 2) {
    return res.json([]);
  }

  try {
    const sql = `
      SELECT 
        fp.id,
        fp.name,
        fp.category,
        fp.price,
        fp.stock,
        fp.image_url,
        fp.seller_id,
        s.shop_name
      FROM fish_products fp
      LEFT JOIN sellers s ON fp.seller_id = s.unique_id
      WHERE s.status = 'accepted' 
        AND fp.name LIKE ?
        AND fp.stock > 0
      ORDER BY fp.name ASC
      LIMIT 8
    `;
    
    const searchPattern = `%${searchTerm}%`;
    const [products] = await db.query(sql, [searchPattern]);
    
    return res.status(200).json(products);
  } catch (err) {
    console.error("Error fetching search suggestions:", err);
    return res.status(500).json({ message: "Server error fetching suggestions." });
  }
});

app.get("/api/seller/:sellerId/qr", async (req, res) => {
  const { sellerId } = req.params;

  if (!sellerId) {
    return res.status(400).json({ message: "Seller ID is required." });
  }

  try {
    const sql = "SELECT qr FROM seller_profiles WHERE seller_id = ?";
    const [results] = await db.query(sql, [sellerId]);

    if (results.length === 0 || !results[0].qr) {
      return res.status(404).json({ 
        message: "QR code not found for this seller.",
        qr: null
      });
    }

    return res.status(200).json({ qr: results[0].qr });
  } catch (err) {
    console.error("Error fetching seller QR code:", err);
    return res.status(500).json({ 
      message: "Server error fetching QR code.",
      error: err.message 
    });
  }
});

// =============================
//  ADMIN PRODUCT MANAGEMENT ROUTES
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
      LEFT JOIN seller_profiles sp ON s.unique_id = sp.seller_id
      WHERE s.status = 'accepted'
      ORDER BY s.date_added DESC
    `;

    const [results] = await db.query(sql);
    
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
    const [products] = await db.query(
      "SELECT * FROM fish_products WHERE seller_id = ? ORDER BY created_at DESC",
      [seller_id]
    );

    const [categories] = await db.query(
      "SELECT id, category_name, created_at FROM fish_categories WHERE seller_id = ? ORDER BY category_name ASC",
      [seller_id]
    );

    const [sellerInfo] = await db.query(
      "SELECT shop_name FROM sellers WHERE unique_id = ?",
      [seller_id]
    );

    const responseData = {
      products: products || [],
      categories: categories || [],
      shop_name: sellerInfo.length > 0 ? sellerInfo[0].shop_name : null
    };

    return res.status(200).json(responseData);
  } catch (err) {
    console.error("❌ Error fetching seller products:", err);
    return res.status(500).json({ 
      message: "Server error fetching seller products.",
      error: err.message 
    });
  }
});

app.get("/api/admin/analytics/orders", async (req, res) => {
  try {
    const { timeFilter, seller_id } = req.query;
    
    let dateCondition = "";
    if (timeFilter === "day") {
      dateCondition = "AND o.order_date >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
    } else if (timeFilter === "week") {
      dateCondition = "AND o.order_date >= DATE_SUB(NOW(), INTERVAL 28 DAY)";
    } else {
      dateCondition = "AND o.order_date >= DATE_SUB(NOW(), INTERVAL 6 MONTH)";
    }
    
    let sellerCondition = seller_id && seller_id !== "all" ? `AND o.seller_id = ?` : "";
    
    const sql = `
      SELECT 
        o.id, o.seller_id, o.total, o.status, o.order_date,
        oi.product_id, oi.quantity, oi.price,
        f.name as product_name, f.category
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN fish_products f ON oi.product_id = f.id
      WHERE 1=1 ${dateCondition} ${sellerCondition}
      ORDER BY o.order_date DESC
    `;
    
    const params = seller_id && seller_id !== "all" ? [seller_id] : [];
    const [orders] = await db.query(sql, params);
    
    const ordersMap = {};
    orders.forEach(row => {
      if (!ordersMap[row.id]) {
        ordersMap[row.id] = {
          id: row.id,
          seller_id: row.seller_id,
          total: row.total,
          status: row.status,
          order_date: row.order_date,
          items: []
        };
      }
      if (row.product_id) {
        ordersMap[row.id].items.push({
          product_id: row.product_id,
          product_name: row.product_name,
          category: row.category,
          quantity: row.quantity,
          price: row.price
        });
      }
    });
    
    res.json(Object.values(ordersMap));
  } catch (err) {
    console.error("Analytics error:", err);
    res.status(500).json({ message: "Error fetching analytics" });
  }
});

// =============================
//  ADMIN MULTI-DATABASE ROUTES
// =============================

app.get("/api/all-sellers", async (req, res) => {
  try {
    const sql = `
      SELECT id, unique_id, email, date_registered
      FROM seller_credentials
      ORDER BY date_registered DESC
    `;
    
    const [results] = await db.query(sql);
    return res.status(200).json(results);
  } catch (err) {
    console.error("❌ Error fetching sellers from seller_credentials:", err);
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
    
    const [results] = await db.query(sql);
    return res.status(200).json(results);
  } catch (err) {
    console.error("❌ Error fetching buyers:", err);
    return res.status(500).json({ message: "Error fetching buyers" });
  }
});

// =============================
//  ADMIN NOTIFICATION ROUTES
// =============================

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
    
    const [results] = await db.query(sql);
    return res.status(200).json(results);
  } catch (err) {
    console.error("❌ Error fetching user notifications:", err);
    return res.status(500).json({ message: "Error fetching notifications" });
  }
});

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
    
    const [results] = await db.query(sql);
    return res.status(200).json(results);
  } catch (err) {
    console.error("❌ Error fetching seller notifications:", err);
    return res.status(500).json({ message: "Error fetching notifications" });
  }
});

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
    
    const [results] = await db.query(sql);
    return res.status(200).json(results);
  } catch (err) {
    console.error("❌ Error fetching completed orders:", err);
    return res.status(500).json({ message: "Error fetching orders" });
  }
});

// =============================
//  DEBUG ROUTES
// =============================

app.get("/api/buyer/debug/notification-id/:buyer_id", async (req, res) => {
  const { buyer_id } = req.params;
  
  try {
    const [buyer] = await db.query(
      "SELECT id, first_name, last_name, contact FROM buyer_authentication WHERE id = ?",
      [buyer_id]
    );
    
    if (buyer.length === 0) {
      return res.json({ error: "Buyer not found", buyer_id });
    }
    
    const notificationId = (buyer[0].first_name + buyer[0].last_name + buyer[0].contact).replace(/\s/g, "");
    
    const [notifications] = await db.query(
      "SELECT COUNT(*) as count FROM buyer_notifications WHERE customer_id = ?",
      [notificationId]
    );
    
    const [allCustomerIds] = await db.query(
      "SELECT DISTINCT customer_id FROM buyer_notifications LIMIT 20"
    );
    
    return res.json({
      buyer_info: buyer[0],
      calculated_notification_id: notificationId,
      notifications_found: notifications[0].count,
      all_customer_ids_in_db: allCustomerIds.map(row => row.customer_id)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/buyer/debug/all-notifications", async (req, res) => {
  try {
    const [notifications] = await db.query(
      `SELECT 
        id, 
        customer_id, 
        order_id, 
        seller_id,
        message,
        is_read,
        created_at
      FROM buyer_notifications 
      ORDER BY created_at DESC 
      LIMIT 50`
    );
    
    res.json({
      total: notifications.length,
      notifications
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/buyer/debug/buyers", async (req, res) => {
  try {
    const [buyers] = await db.query(
      "SELECT id, first_name, last_name, contact, email FROM buyer_authentication LIMIT 20"
    );
    
    const buyersWithNotificationIds = buyers.map(buyer => ({
      ...buyer,
      notification_id: (buyer.first_name + buyer.last_name + buyer.contact).replace(/\s/g, "")
    }));
    
    res.json(buyersWithNotificationIds);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});


// Seller location routes
app.post('/api/seller/location/:seller_id', async (req, res) => {
  const { seller_id } = req.params;
  const { latitude, longitude } = req.body;

  try {
    const [result] = await db.query(
      `INSERT INTO seller_locations (seller_id, latitude, longitude) 
       VALUES (?, ?, ?) 
       ON DUPLICATE KEY UPDATE 
       latitude = VALUES(latitude), 
       longitude = VALUES(longitude), 
       updated_at = CURRENT_TIMESTAMP`,
      [seller_id, latitude, longitude]
    );
    
    console.log(`📍 Location saved for seller ${seller_id}`);
    res.json({ 
      success: true, 
      message: 'Location saved successfully',
      data: { latitude, longitude }
    });
  } catch (error) {
    console.error('Error saving location:', error);
    res.status(500).json({ 
      error: 'Failed to save location',
      details: error.message 
    });
  }
});

// Get seller location
app.get('/api/seller/location/:seller_id', async (req, res) => {
  const { seller_id } = req.params;

  try {
    const [rows] = await db.query(
      'SELECT latitude, longitude, updated_at FROM seller_locations WHERE seller_id = ?',
      [seller_id]
    );
    
    if (rows.length > 0) {
      console.log(`📍 Location retrieved for seller ${seller_id}`);
      res.json({
        lat: parseFloat(rows[0].latitude),
        lng: parseFloat(rows[0].longitude),
        updated_at: rows[0].updated_at
      });
    } else {
      res.status(404).json({ message: 'Location not found' });
    }
  } catch (error) {
    console.error('Error fetching location:', error);
    res.status(500).json({ 
      error: 'Failed to fetch location',
      details: error.message 
    });
  }
});

// Delete seller location
app.delete('/api/seller/location/:seller_id', async (req, res) => {
  const { seller_id } = req.params;

  try {
    const [result] = await db.query(
      'DELETE FROM seller_locations WHERE seller_id = ?', 
      [seller_id]
    );
    
    if (result.affectedRows > 0) {
      console.log(`🗑️ Location deleted for seller ${seller_id}`);
      res.json({ 
        success: true, 
        message: 'Location deleted successfully' 
      });
    } else {
      res.status(404).json({ 
        success: false, 
        message: 'Location not found' 
      });
    }
  } catch (error) {
    console.error('Error deleting location:', error);
    res.status(500).json({ 
      error: 'Failed to delete location',
      details: error.message 
    });
  }
});

// =============================
//  Server Initialization
// =============================
const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════╗
║  🚀 Combined E-SEA Service Started       ║
║  📡 Port: ${PORT}                            ║
║  ✅ CORS: Enabled                        ║
║  🔗 URL: http://localhost:${PORT}         ║
║  📦 Database: e_sea_db                   ║
║                                           ║
║  Services Combined:                       ║
║  • Admin Service                          ║
║  • Seller Service                         ║
║  • Buyer Service                          ║
╚═══════════════════════════════════════════╝
  `);
});




// Handle server errors
app.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use!`);
    console.error('   Please kill the process using that port or choose a different port.');
    process.exit(1);
  } else {
    console.error('❌ Server error:', err);
  }
});