import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";
import path from "path";
import fs from "fs";


import Product from "./models/Product.js";
import Order from "./models/Order.js";
import WeeklyMenu from "./models/WeeklyMenu.js";
import Admin from "./models/Admin.js";
dotenv.config();

const app = express();
console.log("SERVER STARTING...");
console.log("MONGO:", process.env.MONGO_URI ? "OK" : "MISSING");
console.log("JWT:", process.env.JWT_SECRET ? "OK" : "MISSING");
/* =========================
   MIDDLEWARES
========================= */

app.use(cors());
app.use(express.json());

app.use("/uploads", express.static("uploads"));

/* =========================
   UPLOAD CONFIG
========================= */

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

/* =========================
   ROUTE TEST
========================= */

app.get("/", (req, res) => {
  res.send("API Restaurant OK 🚀");
});

/* =========================
   MANIFEST SAFE
========================= */

app.get("/manifest.json", (req, res) => {
  const file = path.join(process.cwd(), "public", "manifest.json");

  if (fs.existsSync(file)) {
    res.sendFile(file);
  } else {
    res.status(404).json({ message: "manifest introuvable" });
  }
});

/* =========================
   MONGODB CONNECTION
========================= */

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Atlas connecté ✅");
  })
  .catch(err => {
    console.log("Erreur MongoDB ❌", err);
    process.exit(1);
  });

/* =========================
   USERS
========================= */

app.post("/api/users", async (req, res) => {
  try {
    const { username, password, role } = req.body;

    if (!username || !password || !role) {
      return res.status(400).json({ message: "Champs manquants" });
    }

    const exist = await Admin.findOne({ username });

    if (exist) {
      return res.status(400).json({ message: "Utilisateur existe déjà" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new Admin({
      username,
      password: hashedPassword,
      role
    });

    await user.save();

    res.json({ message: "Utilisateur créé ✅" });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Erreur serveur ❌" });
  }
});

app.get("/api/users", async (req, res) => {
  try {
    const users = await Admin.find().select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Erreur ❌" });
  }
});

app.delete("/api/users/:id", async (req, res) => {
  try {
    await Admin.findByIdAndDelete(req.params.id);
    res.json({ message: "Utilisateur supprimé ✅" });
  } catch (err) {
    res.status(500).json({ message: "Erreur ❌" });
  }
});

/* =========================
   LOGIN
========================= */

app.post("/api/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await Admin.findOne({ username });

    if (!user) {
      return res.status(400).json({ message: "Utilisateur introuvable" });
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(400).json({ message: "Mot de passe incorrect" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      token,
      role: user.role,
      username: user.username
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Erreur serveur ❌" });
  }
});

/* =========================
   PRODUCTS
========================= */

app.get("/api/products", async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: "Erreur produits ❌" });
  }
});

app.post("/api/products", upload.single("image"), async (req, res) => {
  try {
    const { name, price, stock, category, description } = req.body;

    const imageUrl = req.file
      ? `${req.protocol}://${req.headers.host}/uploads/${req.file.filename}`
      : "";

    const product = new Product({
      name,
      price: Number(price),
      stock: Number(stock),
      category,
      description,
      image: imageUrl
    });

    await product.save();

    res.json({ message: "Produit ajouté ✅" });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Erreur produit ❌" });
  }
});

app.put("/api/products/:id", async (req, res) => {
  try {
    await Product.findByIdAndUpdate(req.params.id, req.body);
    res.json({ message: "Produit modifié ✅" });
  } catch (err) {
    res.status(500).json({ message: "Erreur ❌" });
  }
});

app.delete("/api/products/:id", async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "Produit supprimé ✅" });
  } catch (err) {
    res.status(500).json({ message: "Erreur ❌" });
  }
});

/* =========================
   MENU
========================= */

app.get("/api/weekly-menu", async (req, res) => {
  const menus = await WeeklyMenu.find();
  res.json(menus);
});

app.post("/api/weekly-menu", async (req, res) => {
  const menu = new WeeklyMenu(req.body);
  await menu.save();
  res.json({ message: "Menu ajouté ✅" });
});

/* =========================
   SERVER START (IMPORTANT RENDER)
========================= */

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Serveur lancé sur port ${PORT} 🚀`);
});