const mongoose = require("mongoose");

const evidenceSchema = new mongoose.Schema(
  {
    brandName: {
      type: String,
      required: true,
      trim: true,
    },

    claim: {
      type: String,
      required: true,
      trim: true,
    },

    evidenceText: {
      type: String,
      required: true,
      trim: true,
    },

    source: {
      type: String,
      default: "",
      trim: true,
    },

    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },

    owner: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Evidence", evidenceSchema);
