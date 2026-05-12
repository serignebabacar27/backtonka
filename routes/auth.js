import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import Admin from "../models/Admin.js";

const router = express.Router();

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const user = await Admin.findOne({ username });

  if (!user) {
    return res.status(400).json({ message: "Utilisateur introuvable" });
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    return res.status(400).json({ message: "Mot de passe incorrect" });
  }

  const token = jwt.sign(
    {
      id: user._id,
      role: user.role
    },
    "SECRET_KEY",
    { expiresIn: "1d" }
  );

  res.json({
    token,
    role: user.role
  });
});

export default router;