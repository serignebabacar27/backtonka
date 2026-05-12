const express = require("express");
const router = express.Router();
const Product = require("../models/Product");

// ➕ Ajouter produit
router.post("/", async (req, res) => {
  try {
    const product = new Product(req.body);
    const saved = await product.save();
    res.json(saved);
  } catch (err) {
    res.status(500).json(err);
  }
});

// 📥 Tous les produits
router.get("/", async (req, res) => {
  const products = await Product.find();
  res.json(products);
});

// ✏️ Modifier produit
router.put("/:id", async (req, res) => {
  const updated = await Product.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );
  res.json(updated);
});

// ❌ Supprimer produit
router.delete("/:id", async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  res.json({ message: "Produit supprimé" });
});

module.exports = router;