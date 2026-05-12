import mongoose from "mongoose";

const adminSchema = new mongoose.Schema({
  username: String,
  password: String,
  role: String
});

export default mongoose.model("Admin", adminSchema);





