const mongoose = require("mongoose");

// Human review decisions ko database mein store karne ka model
const reviewSchema = new mongoose.Schema(
  {
    brandName: {
      type: String,
      required: true,
      trim: true,
    },
    draft: {
      type: String,
      required: true,
    },
    findingsCount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected", "Changes Requested"],
      default: "Pending",
    },
    reviewerNote: {
      type: String,
      default: "",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Review", reviewSchema);
