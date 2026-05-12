const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const Product = require("../models/Product");

router.get("/", async (req, res) => {
  try {
    const orders = await Order.find();

    // 💰 chiffre total
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);

    // 📦 nombre commandes
    const totalOrders = orders.length;

    // 📅 ventes du jour
    const today = new Date();
    const todayOrders = orders.filter(order => {
      const date = new Date(order.createdAt);
      return date.toDateString() === today.toDateString();
    });

    const todayRevenue = todayOrders.reduce((sum, order) => sum + order.total, 0);

    // 🔥 TOP produits (avec quantités)
    const productMap = {};

    orders.forEach(order => {
      order.items.forEach(item => {
        const id = item.product.toString();

        if (!productMap[id]) {
          productMap[id] = 0;
        }

        productMap[id] += item.quantity;
      });
    });

    // 🔗 récupérer les infos produits
    const productIds = Object.keys(productMap);
    const products = await Product.find({ _id: { $in: productIds } });

    // 🧠 fusion data
    const topProducts = products.map(prod => ({
      name: prod.name,
      price: prod.price,
      qty: productMap[prod._id.toString()]
    }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

    // ✅ réponse finale
    res.json({
      totalRevenue,
      totalOrders,
      todayRevenue,
      todayOrders: todayOrders.length,
      topProducts
    });

  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;