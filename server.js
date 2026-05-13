import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";
import path from "path";

import Admin from "./models/Admin.js";
import Product from "./models/Product.js";
import Order from "./models/Order.js";
import WeeklyMenu from "./models/WeeklyMenu.js";


const app = express();

/* =========================
   🔧 MIDDLEWARES
========================= */

app.use(cors());
app.use(express.json());

/* =========================
   🔌 MONGODB
========================= */
import fs from "fs";

if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

app.use("/uploads", express.static("uploads"));
dotenv.config();

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Atlas connecté ✅"))
  .catch(err => console.log("Erreur MongoDB ❌", err));

/* =========================
   🧪 TEST API
========================= */

app.get("/", (req, res) => {
  res.send("API Restaurant OK 🚀");
});

/* =========================
   👥 UTILISATEURS
========================= */

// ➕ Créer utilisateur
app.post("/api/users", async (req, res) => {
  try {

    const { username, password, role } = req.body;

    if (!username || !password || !role) {
      return res.status(400).json({
        message: "Champs manquants"
      });
    }

    const exist = await Admin.findOne({ username });

    if (exist) {
      return res.status(400).json({
        message: "Utilisateur déjà existant"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new Admin({
      username,
      password: hashedPassword,
      role
    });

    await user.save();

    res.json({
      message: "Utilisateur créé ✅"
    });

  } catch (err) {

    console.log(err);

    res.status(500).json({
      message: "Erreur serveur ❌"
    });
  }
});

// 📄 Liste utilisateurs
app.get("/api/users", async (req, res) => {
  try {

    const users = await Admin.find().select("-password");

    res.json(users);

  } catch (err) {

    res.status(500).json({
      message: "Erreur utilisateurs ❌"
    });
  }
});

// ❌ Supprimer utilisateur
app.delete("/api/users/:id", async (req, res) => {
  try {

    await Admin.findByIdAndDelete(req.params.id);

    res.json({
      message: "Utilisateur supprimé ✅"
    });

  } catch (err) {

    res.status(500).json({
      message: "Erreur suppression utilisateur ❌"
    });
  }
});

/* =========================
   🔐 LOGIN
========================= */

app.post("/api/auth/login", async (req, res) => {

  try {

    const { username, password } = req.body;

    const user = await Admin.findOne({ username });

    if (!user) {
      return res.status(400).json({
        message: "Utilisateur introuvable"
      });
    }

    const isMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!isMatch) {
      return res.status(400).json({
        message: "Mot de passe incorrect"
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role
      },
      "SECRET_KEY",
      {
        expiresIn: "1d"
      }
    );

    res.json({
      token,
      role: user.role,
      username: user.username
    });

  } catch (err) {

    console.log(err);

    res.status(500).json({
      message: "Erreur serveur ❌"
    });
  }
});

/* =========================
   📁 UPLOAD IMAGE
========================= */

const storage = multer.diskStorage({

  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },

  filename: (req, file, cb) => {
    cb(
      null,
      Date.now() + path.extname(file.originalname)
    );
  }

});

const upload = multer({ storage });

app.use("/uploads", express.static("uploads"));

/* =========================
   📦 PRODUITS
========================= */

// 📄 Tous les produits
app.get("/api/products", async (req, res) => {

  try {

    const products = await Product.find();

    res.json(products);

  } catch (err) {

    res.status(500).json({
      message: "Erreur produits ❌"
    });
  }
});

// ➕ Ajouter produit
app.post(
  "/api/products",
  upload.single("image"),
  async (req, res) => {

    try {

      const {
        name,
        price,
        stock,
        category,
        description
      } = req.body;

      const imageUrl = req.file
        ? req.file.filename
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

      res.json({
        message: "Produit ajouté ✅"
      });

    } catch (err) {

      console.log(err);

      res.status(500).json({
        message: "Erreur ajout produit ❌"
      });
    }
  }
);

// ✏️ Modifier produit
app.put("/api/products/:id", async (req, res) => {

  try {

    const {
      name,
      price,
      stock,
      category,
      description
    } = req.body;

    await Product.findByIdAndUpdate(
      req.params.id,
      {
        name,
        price: Number(price),
        stock: Number(stock),
        category,
        description
      }
    );

    res.json({
      message: "Produit modifié ✅"
    });

  } catch (err) {

    res.status(500).json({
      message: "Erreur modification ❌"
    });
  }
});

// ❌ Supprimer produit
app.delete("/api/products/:id", async (req, res) => {

  try {

    await Product.findByIdAndDelete(req.params.id);

    res.json({
      message: "Produit supprimé ✅"
    });

  } catch (err) {

    res.status(500).json({
      message: "Erreur suppression ❌"
    });
  }
});

//MENU HEBDOMADAIRE
app.get("/api/weekly-menu", async (req, res) => {

  try {

    const menus = await WeeklyMenu.find();

    res.json(menus);

  } catch (err) {

    res.status(500).json({
      message: "Erreur menu"
    });
  }
});

app.post("/api/weekly-menu", async (req, res) => {

  try {

    const menu = new WeeklyMenu(req.body);

    await menu.save();

    res.json({
      message: "Menu ajouté ✅"
    });

  } catch (err) {

    res.status(500).json({
      message: "Erreur ajout menu"
    });
  }
});


/* =========================
   💰 COMMANDES
========================= */

// ➕ Créer commande
app.post("/api/orders", async (req, res) => {

  try {

    const { items, total, user } = req.body;

    if (
      !items ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return res.status(400).json({
        message: "Panier vide ❌"
      });
    }

    // 🔥 Vérifier stock
    for (let item of items) {

      const product = await Product.findById(item._id);

      if (!product) {
        return res.status(404).json({
          message: "Produit introuvable"
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          message: `Stock insuffisant pour ${product.name}`
        });
      }
    }

    // 🔥 Décrémenter stock
    for (let item of items) {

      await Product.findByIdAndUpdate(
        item._id,
        {
          $inc: {
            stock: -item.quantity
          }
        }
      );
    }

    // 🔥 Créer commande
    const order = new Order({

      items: items.map(item => ({
        name: item.name,
        price: Number(item.price),
        quantity: Number(item.quantity)
      })),

      total: Number(total),

      user,

      status: "validé",

      actions: [
        {
          action: "création",
          user
        }
      ]
    });

    await order.save();

    res.json({
      message: "Commande enregistrée ✅"
    });

  } catch (err) {

    console.log(err);

    res.status(500).json({
      message: "Erreur commande ❌"
    });
  }
});

/* =========================
   📜 HISTORIQUE
========================= */

// 📄 Historique global
app.get("/api/orders/history", async (req, res) => {

  try {

    const { date } = req.query;

    let filter = {};

    if (date) {

      const start = new Date(date);
      start.setHours(0, 0, 0, 0);

      const end = new Date(date);
      end.setHours(23, 59, 59, 999);

      filter.createdAt = {
        $gte: start,
        $lte: end
      };
    }

    const orders = await Order.find(filter)
      .sort({ createdAt: -1 });

    res.json(orders);

  } catch (err) {

    console.log(err);

    res.status(500).json({
      message: "Erreur historique ❌"
    });
  }
});

// 📄 Historique serveur
app.get("/api/orders/my-history/:username", async (req, res) => {

  try {

    const orders = await Order.find({
      user: req.params.username
    }).sort({
      createdAt: -1
    });

    res.json(orders);

  } catch (err) {

    console.log(err);

    res.status(500).json({
      message: "Erreur historique serveur ❌"
    });
  }
});

/* =========================
   ❌ ANNULER COMMANDE
========================= */

app.put("/api/orders/cancel/:id", async (req, res) => {

  try {

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        message: "Commande introuvable ❌"
      });
    }

    if (
      order.status === "annulé" ||
      order.status === "annule"
    ) {
      return res.status(400).json({
        message: "Commande déjà annulée ❌"
      });
    }

    // 🔄 Remettre stock
    for (let item of order.items) {

      const product = await Product.findOne({
        name: item.name
      });

      if (product) {

        await Product.findByIdAndUpdate(
          product._id,
          {
            $inc: {
              stock: item.quantity
            }
          }
        );
      }
    }

    // 🔥 Action annulation
    order.actions.push({
      action: "annulation",
      user: req.body.user || "admin"
    });

    order.status = "annulé";

    await order.save();

    res.json({
      message: "Commande annulée ✅"
    });

  } catch (err) {

    console.log(err);

    res.status(500).json({
      message: "Erreur annulation ❌"
    });
  }
});

/* =========================
   📊 DASHBOARD
========================= */

app.get("/api/dashboard", async (req, res) => {

  try {

    const orders = await Order.find()
      .sort({ createdAt: -1 });

    const totalSales = orders.reduce(
      (sum, o) => sum + o.total,
      0
    );

    const totalOrders = orders.length;

    const today = new Date();

    const todayOrders = orders.filter(o => {

      const d = new Date(o.createdAt);

      return (
        d.toDateString() ===
        today.toDateString()
      );
    });

    const todaySales = todayOrders.reduce(
      (sum, o) => sum + o.total,
      0
    );

    res.json({
      totalSales,
      totalOrders,
      todaySales,
      lastOrders: orders.slice(0, 5)
    });

  } catch (err) {

    console.log(err);

    res.status(500).json({
      message: "Erreur dashboard ❌"
    });
  }
});

/* =========================
   📊 STATS
========================= */

app.get("/api/stats", async (req, res) => {

  try {

    const orders = await Order.find({
      status: {
        $ne: "annulé"
      }
    });

    const revenue = orders.reduce(
      (sum, o) => sum + o.total,
      0
    );

    const totalProducts = orders.reduce(
      (sum, o) => sum + o.items.length,
      0
    );

    res.json({
      revenue,
      orders: orders.length,
      products: totalProducts
    });

  } catch (err) {

    res.status(500).json({
      message: "Erreur stats ❌"
    });
  }
});

// 📈 Graphique ventes
app.get("/api/stats/chart", async (req, res) => {

  try {

    const today = new Date();

    today.setHours(0, 0, 0, 0);

    const orders = await Order.find({
      createdAt: { $gte: today },
      status: { $ne: "annulé" }
    });

    let data = [
      { name: "Matin", ventes: 0 },
      { name: "Midi", ventes: 0 },
      { name: "Soir", ventes: 0 }
    ];

    orders.forEach(order => {

      const hour = new Date(
        order.createdAt
      ).getHours();

      if (hour >= 6 && hour < 12) {
        data[0].ventes += order.total;
      }

      else if (hour >= 12 && hour < 18) {
        data[1].ventes += order.total;
      }

      else {
        data[2].ventes += order.total;
      }
    });

    res.json(data);

  } catch (err) {

    console.log(err);

    res.status(500).json({
      message: "Erreur graphique ❌"
    });
  }
});

// 📊 Stats serveur
app.get("/api/stats/servers", async (req, res) => {

  try {

    const stats = await Order.aggregate([

      {
        $match: {
          status: { $ne: "annulé" }
        }
      },

      {
        $group: {
          _id: "$user",
          total: { $sum: "$total" },
          commandes: { $sum: 1 }
        }
      },

      {
        $sort: {
          total: -1
        }
      }

    ]);

    res.json(stats);

  } catch (err) {

    console.log(err);

    res.status(500).json({
      message: "Erreur stats serveur ❌"
    });
  }
});

/* =========================
   📁 ARCHIVES
========================= */

// 📦 Archiver mois
app.put("/api/orders/archive-month", async (req, res) => {

  try {

    const { month } = req.body;

    const role = req.headers.role;

    if (role !== "admin") {
      return res.status(403).json({
        message: "Accès refusé ❌"
      });
    }

    const start = new Date(month + "-01");

    const end = new Date(start);

    end.setMonth(end.getMonth() + 1);

    await Order.updateMany(
      {
        createdAt: {
          $gte: start,
          $lt: end
        },
        isArchived: false
      },
      {
        isArchived: true,
        archiveMonth: month
      }
    );

    res.json({
      message: `Archive ${month} créée ✅`
    });

  } catch (err) {

    console.log(err);

    res.status(500).json({
      message: "Erreur archive ❌"
    });
  }
});

// 📄 Liste archives
app.get("/api/orders/archives", async (req, res) => {

  try {

    const archives = await Order.aggregate([

      {
        $match: {
          isArchived: true
        }
      },

      {
        $group: {
          _id: "$archiveMonth",
          total: { $sum: "$total" },
          count: { $sum: 1 }
        }
      },

      {
        $sort: {
          _id: -1
        }
      }

    ]);

    res.json(archives);

  } catch (err) {

    res.status(500).json({
      message: "Erreur archives ❌"
    });
  }
});

// 📄 Détail archive
app.get("/api/orders/archive/:month", async (req, res) => {

  try {

    const orders = await Order.find({
      archiveMonth: req.params.month
    });

    res.json(orders);

  } catch (err) {

    res.status(500).json({
      message: "Erreur détail archive ❌"
    });
  }
});

/* =========================
   ❌ SUPPRIMER HISTORIQUE
========================= */

app.delete("/api/orders/clear-all", async (req, res) => {

  try {

    const role = req.headers.role;

    if (role !== "admin") {
      return res.status(403).json({
        message: "Accès refusé ❌"
      });
    }

    await Order.deleteMany({});

    res.json({
      message: "Historique supprimé ✅"
    });

  } catch (err) {

    console.log(err);

    res.status(500).json({
      message: "Erreur suppression ❌"
    });
  }
});

/* =========================
   🚀 START SERVER
========================= */

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Serveur lancé sur port ${PORT} 🚀`);
});