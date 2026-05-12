const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const Product = require("../models/Product");

// ➕ Créer une vente
router.post("/", async (req, res) => {
  try {
    const { items, paymentMethod } = req.body;

    let total = 0;

    for (let item of items) {
      const product = await Product.findById(item.product);

      if (!product) {
        return res.status(404).json({ message: "Produit introuvable" });
      }

      // Vérifier stock
      if (product.stock < item.quantity) {
        return res.status(400).json({
          message: `Stock insuffisant pour ${product.name}`,
        });
      }

      // Calcul total
      total += product.price * item.quantity;

      // Déduire stock
      product.stock -= item.quantity;
      await product.save();

      // Remplacer prix réel
      item.price = product.price;
    }

    const order = new Order({
      items,
      total,
      paymentMethod,
    });

    const savedOrder = await order.save();

    res.json(savedOrder);
  } catch (err) {
    res.status(500).json(err);
  }
});

// 📥 Historique ventes
router.get("/", async (req, res) => {
  const orders = await Order.find().populate("items.product");
  res.json(orders);
});

module.exports = router;