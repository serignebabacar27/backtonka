import mongoose from "mongoose";

const weeklyMenuSchema = new mongoose.Schema({

  day: {
    type: String,
    required: true
  },

  breakfast: String,

  lunch: String,

  dinner: String,

  price: Number,

  image: String

});

export default mongoose.model(
  "WeeklyMenu",
  weeklyMenuSchema
);