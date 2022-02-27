const mongoose = require("mongoose");
const User = require("./User");

const SegmentSchema = new mongoose.Schema(
  {
    users: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  {
    timestamps: true,
  }
);

const Segment = mongoose.model("Segment", SegmentSchema);

module.exports = Segment;
