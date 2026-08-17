console.log("server.js file loaded");

import "dotenv/config";
import express from "express";
import cors from "cors";
import crypto from "crypto";
import hre from "hardhat";
import multer from "multer";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import db from "./db.js";

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const upload = multer({ storage: multer.memoryStorage() });

const PORT = 3001;
let contract;
let adminAddress;

async function initBlockchain() {
  const { ethers } = await hre.network.connect("sepolia");
  const [admin] = await ethers.getSigners();
  adminAddress = admin.address;

  const DocumentVerification = await ethers.getContractFactory("DocumentVerification");
  contract = DocumentVerification.attach(process.env.CONTRACT_ADDRESS);

  console.log("Connected to existing contract at:", process.env.CONTRACT_ADDRESS);
  console.log("Admin/issuer address:", adminAddress);
}

function authenticate(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.status(401).json({ error: "No token provided" });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid or expired token" });
    req.user = user;
    next();
  });
}

function requireAdmin(req, res, next) {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin access only" });
  }
  next();
}

app.post("/signup", async (req, res) => {
  try {
    const { email, password, name, role, adminSecret } = req.body;

    if (!email || !password || !name || !role) {
      return res.status(400).json({ error: "All fields are required" });
    }
    if (!["admin", "user", "student", "company"].includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    if (role === "admin" && adminSecret !== process.env.ADMIN_SIGNUP_SECRET) {
      return res.status(403).json({ error: "Invalid admin secret" });
    }

    const existing = await db.execute({
      sql: "SELECT id FROM users WHERE email = ?",
      args: [email],
    });
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    await db.execute({
      sql: "INSERT INTO users (email, password, role, name) VALUES (?, ?, ?, ?)",
      args: [email, hashedPassword, role, name],
    });

    res.json({ success: true, message: "Account created. Please log in." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const result = await db.execute({
    sql: "SELECT * FROM users WHERE email = ?",
    args: [email],
  });
  const user = result.rows[0];

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const token = jwt.sign(
    { email: user.email, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: "8h" }
  );

  res.json({ token, role: user.role, name: user.name, email: user.email });
});

app.post("/register", authenticate, requireAdmin, upload.single("document"), async (req, res) => {
  try {
    let contentBuffer;
    let fileName = null;
    if (req.file) {
      contentBuffer = req.file.buffer;
      fileName = req.file.originalname;
    } else if (req.body.documentContent) {
      contentBuffer = Buffer.from(req.body.documentContent);
    } else {
      return res.status(400).json({ error: "Provide a file or documentContent" });
    }

    const docHash = "0x" + crypto.createHash("sha256").update(contentBuffer).digest("hex");
    const tx = await contract.registerDocument(docHash);
    await tx.wait();

    await db.execute({
      sql: "INSERT INTO audit_log (user_email, user_role, action, doc_hash, file_name, result, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)",
      args: [req.user.email, req.user.role, "register", docHash, fileName, "success", new Date().toISOString()],
    });

    res.json({
      success: true,
      docHash,
      issuedBy: adminAddress,
      fileName,
      message: "Document registered on blockchain",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/verify", authenticate, upload.single("document"), async (req, res) => {
  try {
    let contentBuffer;
    let fileName = null;
    if (req.file) {
      contentBuffer = req.file.buffer;
      fileName = req.file.originalname;
    } else if (req.body.documentContent) {
      contentBuffer = Buffer.from(req.body.documentContent);
    } else {
      return res.status(400).json({ error: "Provide a file or documentContent" });
    }

    const docHash = "0x" + crypto.createHash("sha256").update(contentBuffer).digest("hex");
    const [isValid, issuer, timestamp] = await contract.verifyDocument(docHash);

    await db.execute({
      sql: "INSERT INTO audit_log (user_email, user_role, action, doc_hash, file_name, result, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)",
      args: [req.user.email, req.user.role, "verify", docHash, fileName, isValid ? "genuine" : "not_found", new Date().toISOString()],
    });

    res.json({
      docHash,
      isValid,
      issuer: isValid ? issuer : null,
      timestamp: isValid ? new Date(Number(timestamp) * 1000).toISOString() : null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/admin/history", authenticate, requireAdmin, async (req, res) => {
  const result = await db.execute("SELECT * FROM audit_log ORDER BY timestamp DESC");
  res.json(result.rows);
});

console.log("Starting server...");

initBlockchain()
  .then(() => {
    console.log("Blockchain initialized successfully");
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("FAILED to initialize blockchain:", err);
    process.exit(1);
  });