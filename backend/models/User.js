import mongoose from "mongoose";
const { Schema } = mongoose;
const userSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },

  passwordHash: {
    type: String,
    required: true,
  },

  role: {
    type: String,
    required: true,
    enum: ["admin", "buyer", "seller"],
    default: "buyer",
  },
  avatarUrl: {
    type: String,
    required: true,
  },
});

export default mongoose.model("User", userSchema);
