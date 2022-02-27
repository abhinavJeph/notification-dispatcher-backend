const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    number: { type: Number, required: true },
    email: { type: String },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", UserSchema, "User");
module.exports = User;
