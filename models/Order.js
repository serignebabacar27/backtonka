import mongoose from "mongoose";
// Schéma de commande
const orderSchema = new mongoose.Schema({
  items: [
    {
      name: String,
      price: Number,
      quantity: Number
    }
  ],
  total: Number,
  user: String,
  createdAt: {
    type: Date,
    default: Date.now // ex: "2026-05-15T12:00:00Z"
  },
  status: {
  type: String,
  default: "validé"
},

archiveMonth: {
  type: String,
  default: null // ex: "2026-05"
},

isArchived: {
  type: Boolean,
  default: false
},

actions: [
  {
    action: String, // ex: "annulation"
    user: String,   // ex: "John Doe"
    timestamp: {
      type: Date,
      default: Date.now // ex: "2026-05-15T12:30:00Z"
    }
  }
]     
  
});



export default mongoose.model("Order", orderSchema);

